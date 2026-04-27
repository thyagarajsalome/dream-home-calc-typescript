import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function generateHmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();
    
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = await generateHmacSha256(secret, body);

    if (expectedSignature === razorpay_signature) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // --- NEW CREDIT & TIER LOGIC ---
      let creditsToAdd = 0;
      let plan_tier = 'free';

      // Assign credits based on the bundle purchased
      if (planId === '5_credits') {
        creditsToAdd = 5;
        plan_tier = 'basic';
      } else if (planId === '10_credits') {
        creditsToAdd = 10;
        plan_tier = 'standard';
      } else if (planId === 'pro_monthly' || planId === 'pro') {
        plan_tier = 'pro';
        // For Pro, you could optionally grant a large starting balance (e.g., 100) 
        // or handle it as unlimited in the frontend logic.
      } else if (planId === 'basic') {
        plan_tier = 'basic';
      } else if (planId === 'standard') {
        plan_tier = 'standard';
      }

      // Fetch current profile to get existing credits for accurate increment
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      const currentCredits = profile?.credits || 0;

      // Update the profile with new total credits and plan tier
      const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          has_paid: true, 
          plan_tier: plan_tier, 
          credits: currentCredits + creditsToAdd,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
      // -------------------------------

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ status: "success", message: "Payment verified and credits added." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ status: "failure", message: "Invalid signature." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error: any) {
    console.error("Error in verify-payment:", error);
    return new Response(JSON.stringify({ error: String(error.message) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});