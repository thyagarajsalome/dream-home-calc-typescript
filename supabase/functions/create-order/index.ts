import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Explicitly allow POST
};

const PLANS: Record<string, number> = {
  monthly: 9900,
  annual: 49900
};

Deno.serve(async (req) => {
  // 1. Handle CORS preflight immediately
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized or Session Expired');

    // 3. Parse and validate Plan ID
    const body = await req.json().catch(() => ({}));
    const planId = body.planId || "monthly";
    const amount = PLANS[planId as string] || 9900;

    // 4. Validate Razorpay Keys
    const key_id = Deno.env.get('RAZORPAY_KEY_ID');
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials are not set in Supabase Secrets.");
    }

    // 5. Call Razorpay API
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${key_id}:${key_secret}`)
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `rcpt_${user.id.slice(0, 10)}_${Date.now()}`
      })
    });

    const responseData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay Error Body:", responseData);
      throw new Error(`Razorpay Error: ${responseData.error?.description || 'Failed to create order'}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check Supabase Function Logs for more info" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});