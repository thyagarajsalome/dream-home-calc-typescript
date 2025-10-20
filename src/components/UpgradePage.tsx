import React, { useState, useEffect } from "react";
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
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  // Preload the Razorpay script for faster checkout
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
      const response = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 29900 }), // Corrected amount: ₹299.00
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
        description: "2 Years Access",
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
              setPaymentSuccess(true);
              setHasPaid(true);
              setTimeout(() => {
                navigate("/");
              }, 2000); // Redirect after 2 seconds
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
          color: "#d9a443",
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

  return (
    <div className="auth-container">
      <div className="card upgrade-card">
        {paymentSuccess ? (
          <div className="payment-success-message">
            <h3>Payment Successful!</h3>
            <p>You now have Pro access. Redirecting...</p>
          </div>
        ) : (
          <>
            <div className="upgrade-header">
              <span className="pro-badge">LIMITED TIME OFFER</span>
              <h2>Unlock Your Dream Home's Full Potential</h2>
              <p className="price">
                <span
                  className="amount"
                  style={{
                    color: "var(--primary-color)",
                    fontWeight: "bold",
                    fontSize: "2.8rem",
                  }}
                >
                  ₹299
                </span>
                <span
                  style={{
                    textDecoration: "line-through",
                    marginLeft: "1rem",
                    fontSize: "1.5rem",
                    opacity: 0.6,
                  }}
                >
                  ₹1000
                </span>
                <span
                  style={{
                    marginLeft: "1rem",
                    fontSize: "1.2rem",
                    color: "var(--accent-color)",
                    fontWeight: "bold",
                  }}
                >
                  (70% OFF)
                </span>
              </p>
              <p>One-time payment for 2 Years Access — inclusive of 18% GST</p>
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
                <i className="fas fa-check-circle"></i> Get detailed cost
                breakdowns for every aspect of your project.
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Save, download, and
                share PDF reports.
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Enjoy 2 years of full
                access with all future updates included.
              </li>
            </ul>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--background-color)",
                borderRadius: "var(--border-radius)",
                margin: "2rem 0",
                border: "1px solid var(--border-color)",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: "0.9rem" }}>
                The Pro Plan will keep getting better.
              </p>
            </div>
            <button
              onClick={handlePayment}
              className="btn upgrade-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Upgrade Now & Build Smarter"}
            </button>
            {error && (
              <p
                style={{ color: "red", marginTop: "1rem", textAlign: "center" }}
              >
                {error}
              </p>
            )}
            <button onClick={() => navigate("/")} className="back-link">
              Maybe Later
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;
