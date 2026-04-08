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

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Pass the token explicitly here!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // NEW: Added planId to the destructured JSON payload
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();
    
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = await generateHmacSha256(secret, body);

    if (expectedSignature === razorpay_signature) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // NEW: Determine which tier string to save to the database
      let plan_tier = 'free';
      if (planId === 'basic') plan_tier = 'basic';
      else if (planId === 'standard') plan_tier = 'standard';
      else if (planId === 'pro') plan_tier = 'pro';

      // NEW: Included plan_tier in the upsert
      const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: user.id, 
          has_paid: true, // Kept for backward compatibility
          plan_tier: plan_tier, 
          updated_at: new Date().toISOString() 
        });

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ status: "success", message: "Payment verified." }), {
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