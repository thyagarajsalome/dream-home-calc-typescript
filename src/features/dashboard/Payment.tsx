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

      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { planId: "monthly" } 
      });

      if (orderError || !order) throw new Error("Failed to create payment order.");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Dream Home Calculator",
        description: "Premium Access",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError || result?.status !== "success") {
              throw new Error("Payment verification failed.");
            }
            
            alert("Payment Successful! Access Unlocked.");
            setHasPaid(true);
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
      <h2>Unlock All Calculators</h2>
      <p style={{ margin: "1rem 0" }}>Get lifetime access to all premium features and detailed reports for just ₹99.</p>
      <button 
        onClick={handlePayment} 
        className="btn" 
        disabled={loading}
        style={{ fontSize: "1.1rem", padding: "10px 20px" }}
      >
        {loading ? "Processing..." : "Pay ₹99 Now"}
      </button>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
};

export default Payment;