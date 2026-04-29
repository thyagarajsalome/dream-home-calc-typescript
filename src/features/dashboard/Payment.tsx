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

  // Define the plan being purchased here (matches your create-order/index.ts)
  const SELECTED_PLAN = "pro"; 
  const DISPLAY_PRICE = "999";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("User not authenticated.");

      // 1. Create Order - passing the correct 'pro' planId
      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { planId: SELECTED_PLAN } 
      });

      if (orderError || !order || order.error) {
        throw new Error(order?.error || "Failed to create payment order.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "HDE Premium",
        description: "Full Access Unlock",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // 2. Verify Payment - Now including planId so backend knows which tier to grant
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: SELECTED_PLAN // Essential for credit allocation
              }
            });

            if (verifyError || result?.status !== "success") {
              throw new Error("Payment verification failed.");
            }
            
            alert("Payment Successful! All Pro features are now unlocked.");
            setHasPaid(true);
            window.location.reload(); // Refresh to update UI/Context
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: user?.email },
        theme: { color: "#d9a443" },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message || "Error creating payment order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
      <div className="pro-badge" style={{ marginBottom: '1rem' }}>PREMIUM ACCESS</div>
      <h2>Unlock All Professional Tools</h2>
      <p style={{ margin: "1rem 0", color: "#666" }}>
        Get unlimited access to specialized calculators, Material BOQ, and professional PDF reports.
      </p>
      <div style={{ margin: "1.5rem 0" }}>
        <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--secondary-color)" }}>
          ₹{DISPLAY_PRICE}
        </span>
        <span style={{ color: "#888", marginLeft: "5px" }}>/ monthly</span>
      </div>
      <button 
        onClick={handlePayment} 
        className="btn" 
        disabled={loading}
        style={{ fontSize: "1.1rem", padding: "12px 30px", width: '100%' }}
      >
        {loading ? "Processing..." : `Upgrade to Pro Now`}
      </button>
      {error && (
        <div style={{ color: "#e74c3c", marginTop: "1rem", fontSize: "0.9rem", fontWeight: "600" }}>
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}
    </div>
  );
};

export default Payment;