import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../config/supabaseClient";

interface PaymentProps {
  user: User | null;
  setHasPaid: (status: boolean) => void;
}

const Payment: React.FC<PaymentProps> = ({ user, setHasPaid }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // These must match the keys in your supabase/functions/create-order/index.ts
  const SELECTED_PLAN = "pro"; 
  const DISPLAY_PRICE = "999";

  useEffect(() => {
    // Load Razorpay script only once
    const scriptId = "razorpay-checkout-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Get the current session to ensure headers are fresh
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in to continue.");

      // 2. Create Order - this is where the 400 error usually happens
      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { planId: SELECTED_PLAN } 
      });

      // If the function returned an error in the JSON body
      if (order?.error) throw new Error(order.error);
      // If the invocation itself failed (like a 400 or 500 error)
      if (orderError || !order) throw new Error("Backend Error: Check Supabase function logs.");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "HDE Premium",
        description: "Full Professional Access",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: SELECTED_PLAN 
              }
            });

            if (verifyError || result?.status !== "success") {
              throw new Error(result?.error || "Payment verification failed.");
            }
            
            alert("Payment Successful! Your Pro features are now active.");
            setHasPaid(true);
            window.location.reload(); 
          } catch (err: any) {
            setError(err.message || "Verification failed. Contact support with your Payment ID.");
          }
        },
        prefill: { 
          email: user?.email,
          contact: "" // You can add phone here if collected
        },
        theme: { color: "#d9a443" },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Payment Flow Error:", err);
      setError(err.message || "Payment service temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ textAlign: "center", padding: "2rem", maxWidth: '400px', margin: '0 auto' }}>
      <div className="pro-badge" style={{ 
        display: 'inline-block',
        backgroundColor: '#d9a443', 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: '20px', 
        fontSize: '0.75rem', 
        fontWeight: 'bold',
        marginBottom: '1rem' 
      }}>PREMIUM</div>
      
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Upgrade to Pro</h2>
      <p style={{ margin: "1rem 0", color: "#666", fontSize: '0.9rem' }}>
        Unlock unlimited calculators, professional BOQ reports, and builder-mode margins.
      </p>
      
      <div style={{ margin: "1.5rem 0" }}>
        <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "#1a1a1a" }}>
          ₹{DISPLAY_PRICE}
        </span>
        <span style={{ color: "#888", marginLeft: "5px" }}>/ monthly</span>
      </div>

      <button 
        onClick={handlePayment} 
        className="btn" 
        disabled={loading}
        style={{ 
          fontSize: "1.1rem", 
          padding: "14px 30px", 
          width: '100%', 
          backgroundColor: '#1a1a1a', 
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? "Initializing..." : `Pay ₹${DISPLAY_PRICE} Now`}
      </button>

      {error && (
        <div style={{ 
          backgroundColor: '#fdf0f0', 
          border: '1px solid #f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          marginTop: '1.5rem', 
          borderRadius: '6px',
          fontSize: '0.85rem' 
        }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default Payment;