import React, { useState } from "react";
import { User } from "firebase/auth";

interface PaymentProps {
  user: User | null;
  setHasPaid: (status: boolean) => void;
}

const Payment: React.FC<PaymentProps> = ({ user, setHasPaid }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onerror = () => {
      setError("Razorpay SDK failed to load. Are you online?");
      setLoading(false);
    };
    script.onload = async () => {
      try {
        const response = await fetch("http://localhost:3001/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: 9900 }), // Amount in paise (99 INR)
        });

        if (!response.ok) {
          throw new Error("Failed to create payment order.");
        }

        const order = await response.json();

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Using environment variables
          amount: order.amount,
          currency: order.currency,
          name: "DreamHomeCalc Pro",
          description: "Lifetime Access",
          order_id: order.id,
          handler: async (response: any) => {
            try {
              const verificationResponse = await fetch(
                "http://localhost:3001/verify-payment",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    userId: user?.uid,
                  }),
                }
              );

              const result = await verificationResponse.json();
              if (result.status === "success") {
                alert("Payment Successful! You now have Pro access.");
                setHasPaid(true); // Update state in App.tsx
              } else {
                throw new Error("Payment verification failed.");
              }
            } catch (err) {
              setError("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            email: user?.email,
          },
          theme: {
            color: "#D9A443",
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      } catch (err) {
        setError("Error creating payment order. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    document.body.appendChild(script);
  };

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <h2>Unlock All Calculators</h2>
      <p>
        Get lifetime access to all premium features and calculators for just
        ₹99.
      </p>
      <button onClick={handlePayment} className="btn" disabled={loading}>
        {loading ? "Processing..." : "Pay ₹99 Now"}
      </button>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
};

export default Payment;
