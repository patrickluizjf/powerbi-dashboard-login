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
      const { groupId, reportId } = await req.json();

      // First get the access token
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: Deno.env.get('POWERBI_CLIENT_ID') || '',
          client_secret: Deno.env.get('POWERBI_CLIENT_SECRET') || '',
          scope: 'https://analysis.windows.net/powerbi/api/.default'
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Access token obtained');

      // Then use the access token to generate an embed token
      const embedTokenResponse = await fetch(
        `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
          body: new URLSearchParams({
            'accessLevel': 'view'
          }),
        }
      );

      const embedTokenData = await embedTokenResponse.json();
      console.log('Embed token generated');

      return new Response(
        JSON.stringify({
          accessToken: tokenData.access_token,
          embedToken: embedTokenData.token,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});