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
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting credit reset check...');

    // Call the database function to reset credits for users whose reset date has passed
    // This handles both daily (free) and monthly (paid) resets
    const { error } = await supabase.rpc('reset_all_credits');

    if (error) {
      console.error('Error resetting credits:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get count of users that were reset for logging
    const { count } = await supabase
      .from('credit_action_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action_type', 'reset')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    console.log(`Credit reset completed. Users reset: ${count || 0}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credit reset check completed',
        users_reset: count || 0,
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
