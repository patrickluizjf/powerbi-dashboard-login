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

      // Validate required parameters
      if (!requestData.groupId || !requestData.reportId) {
        throw new Error('Missing required parameters: groupId and reportId are required');
      }

      const { groupId, reportId } = requestData;
      const accessToken = req.headers.get('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        throw new Error('No access token provided');
      }

      console.log('Generating embed token for report:', reportId);

      // Use the access token to generate an embed token
      const embedTokenResponse = await fetch(
        `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            accessLevel: 'View',
            allowSaveAs: false
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
          accessToken: accessToken,
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