// src/components/UpgradePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// FIX: Import Supabase types and client
import { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

// Use VITE_API_BASE_URL if you set that up earlier, or fallback to VITE_API_URL
const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

interface UpgradePageProps {
  user: User | null;
  setHasPaid: (status: boolean) => void;
}

// Define plan details
const plans = {
  monthly: {
    id: "monthly",
    name: "Pro Monthly",
    amount: 9900, // ₹99 in paise
    priceString: "₹99",
    term: "/ month",
    description: "Pro Monthly Plan",
  },
  annual: {
    id: "annual",
    name: "Pro Annual",
    amount: 49900, // ₹499 in paise
    priceString: "₹499",
    term: "/ year",
    description: "Pro Annual Plan",
    badge: "Best Value",
    savings: "Save 58% vs. Monthly",
  },
};

type PlanID = "monthly" | "annual";

const UpgradePage: React.FC<UpgradePageProps> = ({ user, setHasPaid }) => {
  const [loadingPlan, setLoadingPlan] = useState<PlanID | null>(null);
  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (API_URL) {
      fetch(`${API_URL}/status`).catch((err) =>
        console.error("Server warm-up failed:", err)
      );
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script only if body contains it to avoid errors
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async (planId: PlanID) => {
    const selectedPlan = plans[planId];
    setLoadingPlan(planId);
    setError("");

    try {
      // FIX 1: Get Supabase Token instead of Firebase ID Token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Please sign in to upgrade.");

      const response = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Send Supabase Token
        },
        body: JSON.stringify({ amount: selectedPlan.amount }),
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
        description: selectedPlan.description,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // FIX 2: Get fresh token for verification (optional, but safe)
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            const verifyToken = verifySession?.access_token;

            const verificationResponse = await fetch(
              `${API_URL}/verify-payment`,
              {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${verifyToken}` 
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const result = await verificationResponse.json();
            if (result.status === "success") {
              setPaymentSuccess(true);
              setHasPaid(true);
              setTimeout(() => {
                navigate("/");
              }, 2000);
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error creating payment order. Please try again.");
    } finally {
      setLoadingPlan(null);
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
              <h2>Upgrade to DreamHomeCalc Pro</h2>
              <p>Choose the plan that works best for you.</p>
            </div>

            <div className="pricing-grid">
              {/* Monthly Plan */}
              <div className="pricing-card">
                <h3>{plans.monthly.name}</h3>
                <div className="price-amount">{plans.monthly.priceString}</div>
                <div className="price-term">{plans.monthly.term}</div>
                <p>Perfect for a single project.</p>
                <button
                  onClick={() => handlePayment("monthly")}
                  className="btn btn-secondary"
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === "monthly"
                    ? "Processing..."
                    : "Choose Monthly"}
                </button>
              </div>

              {/* Annual Plan */}
              <div className="pricing-card popular">
                <div className="popular-badge">{plans.annual.badge}</div>
                <h3>{plans.annual.name}</h3>
                <div className="price-amount">{plans.annual.priceString}</div>
                <div className="price-term">{plans.annual.term}</div>
                <p style={{ color: "var(--accent-color)", fontWeight: 600 }}>
                  {plans.annual.savings}
                </p>
                <button
                  onClick={() => handlePayment("annual")}
                  className="btn"
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === "annual" ? "Processing..." : "Choose Annual"}
                </button>
              </div>
            </div>

            <ul className="features-list" style={{ marginTop: "2.5rem" }}>
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
                <i className="fas fa-check-circle"></i> Full access with all
                future updates included during your subscription.
              </li>
            </ul>

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