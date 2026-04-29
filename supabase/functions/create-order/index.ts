import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Updated PLANS dictionary to match frontend IDs and amounts exactly
const PLANS: Record<string, number> = {
  "5_credits": 19900,   // ₹199
  "10_credits": 34900,  // ₹349
  "pro": 99900          // ₹999 (Changed from "pro_monthly" to "pro" to match frontend)
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header found');

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Session expired. Please log out and log back in.');

    const body = await req.json().catch(() => ({}));
    const planId = body.planId;
    
    // Get the amount. If ID is invalid, we now throw an error instead of defaulting to ₹99.
    const amount = PLANS[planId as string];

    if (!amount) {
      throw new Error(`Invalid Plan ID: ${planId}. Please check your configuration.`);
    }

    const key_id = Deno.env.get('RAZORPAY_KEY_ID');
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys are missing in Supabase Secrets!");
    }

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${key_id}:${key_secret}`)
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `rcpt_${user.id.slice(0, 10)}`
      })
    });

    const responseData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay API failure:", responseData);
      throw new Error(`Razorpay API Error: ${responseData.error?.description || JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Create Order Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Error status
    });
  }
});