import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization (use service role for cron jobs)
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('CRON_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // For cron jobs, we can use a simple secret or service role key
    if (!authHeader || !authHeader.includes(expectedKey?.slice(0, 20) || '')) {
      // If no valid auth, check if it's from Supabase internal cron
      const isInternalCron = req.headers.get('x-supabase-cron') === 'true';
      if (!isInternalCron && !authHeader?.includes('Bearer')) {
        console.log('Unauthorized request to reset-monthly-credits');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting monthly credit reset...');

    // Call the database function to reset credits
    const { error } = await supabase.rpc('reset_monthly_credits');

    if (error) {
      console.error('Error resetting credits:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get count of users that were reset for logging
    const { data: resetCount } = await supabase
      .from('credit_action_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action_type', 'reset')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    console.log(`Monthly credit reset completed. Users reset: ${resetCount || 'unknown'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monthly credits reset completed',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in reset-monthly-credits:', err);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
