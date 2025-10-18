import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

interface UpgradePageProps {
  user: User | null;
  setHasPaid: (status: boolean) => void;
}

const UpgradePage: React.FC<UpgradePageProps> = ({ user, setHasPaid }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
        const response = await fetch(`${API_URL}/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 9900 }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment order.");
        }

        const order = await response.json();

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "DreamHomeCalc Pro",
          description: "Lifetime Access",
          order_id: order.id,
          handler: async (response: any) => {
            try {
              const verificationResponse = await fetch(
                `${API_URL}/verify-payment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    userId: user?.id,
                  }),
                }
              );

              const result = await verificationResponse.json();
              if (result.status === "success") {
                alert("Payment Successful! You now have Pro access.");
                setHasPaid(true);
                navigate("/");
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
            color: "#d9a443", // This line is updated
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
    <div className="auth-container">
      <div className="card upgrade-card">
        <div className="upgrade-header">
          <span className="pro-badge">PRO</span>
          <h2>Unlock Your Dream Home's Full Potential</h2>
          <p className="price">
            Just <span className="amount">₹99</span> for Lifetime Access
          </p>
        </div>
        <ul className="features-list">
          <li>
            <i className="fas fa-check-circle"></i> Access all specialized
            calculators: Flooring, Painting, Plumbing, and Electrical.
          </li>
          <li>
            <i className="fas fa-check-circle"></i> Use Standard & Premium
            quality estimates in the Construction calculator.
          </li>
          <li>
            <i className="fas fa-check-circle"></i> Get detailed cost breakdowns
            for every aspect of your project.
          </li>
          <li>
            <i className="fas fa-check-circle"></i> Save, download, and share
            unlimited PDF reports.
          </li>
          <li>
            <i className="fas fa-check-circle"></i> One-time payment, lifetime
            access to all future updates.
          </li>
        </ul>
        <button
          onClick={handlePayment}
          className="btn upgrade-btn"
          disabled={loading}
        >
          {loading ? "Processing..." : "Upgrade Now & Build Smarter"}
        </button>
        {error && (
          <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>
            {error}
          </p>
        )}
        <button onClick={() => navigate("/")} className="back-link">
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default UpgradePage;
