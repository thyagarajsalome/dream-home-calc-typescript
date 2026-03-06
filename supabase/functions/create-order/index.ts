import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLANS: Record<string, number> = {
  monthly: 9900,
  annual: 49900
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header found');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Session expired. Please log out and log back in.');

    const body = await req.json().catch(() => ({}));
    const planId = body.planId || "monthly";
    const amount = PLANS[planId as string] || 9900;

    const key_id = Deno.env.get('RAZORPAY_KEY_ID');
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys are missing in Supabase Secrets! You must set them.");
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
    
    // DEBUGGING FIX: We return 200 here so the frontend doesn't crash and can read the error message!
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    });
  }
});