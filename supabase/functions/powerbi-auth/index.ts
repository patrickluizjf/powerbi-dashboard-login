const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const requestData = await req.json();
      console.log('Request data:', requestData);

      // Validate required parameters for initial auth
      if (requestData.clientId && requestData.clientSecret && requestData.tenantId) {
        console.log('Authenticating with client credentials...');
        const tokenResponse = await fetch(
          `https://login.microsoftonline.com/${requestData.tenantId}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: requestData.clientId,
              client_secret: requestData.clientSecret,
              scope: 'https://analysis.windows.net/powerbi/api/.default'
            }),
          }
        );

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token response error:', errorText);
          throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Access token obtained successfully');

        return new Response(
          JSON.stringify({
            access_token: tokenData.access_token,
            workspace_id: requestData.workspaceId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate required parameters for embed token
      if (!requestData.groupId || !requestData.reportId) {
        throw new Error('Missing required parameters: groupId and reportId are required');
      }

      const { groupId, reportId } = requestData;
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader) {
        throw new Error('No authorization header provided');
      }

      // Then use the access token to generate an embed token
      const embedTokenResponse = await fetch(
        `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            accessLevel: 'view'
          }),
        }
      );

      if (!embedTokenResponse.ok) {
        const errorText = await embedTokenResponse.text();
        console.error('Embed token response error:', errorText);
        throw new Error(`Failed to generate embed token: ${embedTokenResponse.status} ${errorText}`);
      }

      const embedTokenData = await embedTokenResponse.json();
      console.log('Embed token generated successfully');

      return new Response(
        JSON.stringify({
          accessToken: authHeader.split(' ')[1],
          embedToken: embedTokenData.token,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error(`Method ${req.method} not allowed`);
  } catch (error) {
    console.error('Error in powerbi-auth function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});