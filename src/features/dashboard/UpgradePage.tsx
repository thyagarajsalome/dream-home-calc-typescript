import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../config/supabaseClient";

// Use VITE_API_BASE_URL if you set that up earlier, or fallback to VITE_API_URL
const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

interface UpgradePageProps {
  user?: User | null;
  setHasPaid?: (status: boolean) => void;
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

const UpgradePage: React.FC<UpgradePageProps> = ({ user }) => {
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Please sign in to upgrade.");

      const response = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
       body: JSON.stringify({ planId: planId }),
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
              setTimeout(() => {
                window.location.href = "/"; 
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
          color: "#D9A443",
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
    // FIX: Main Container with proper spacing
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl animate-fade-in">
      
      {paymentSuccess ? (
        <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="fas fa-check"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">You now have Pro access. Redirecting you to the dashboard...</p>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider mb-4 inline-block">
              Premium Access
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Upgrade to <span className="text-primary">DreamHomeCalc Pro</span>
            </h2>
            <p className="text-xl text-gray-600">
              Unlock detailed construction reports, material breakdowns, and save unlimited projects.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            
            {/* Monthly Plan */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col hover:shadow-2xl transition-all duration-300 relative z-0">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{plans.monthly.name}</h3>
              <p className="text-gray-500 mb-6">Perfect for a single project evaluation.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-gray-900">{plans.monthly.priceString}</span>
                <span className="text-gray-500 ml-2">{plans.monthly.term}</span>
              </div>

              <button
                onClick={() => handlePayment("monthly")}
                disabled={loadingPlan !== null}
                className="w-full py-4 rounded-xl font-bold border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors disabled:opacity-50"
              >
                {loadingPlan === "monthly" ? "Processing..." : "Choose Monthly"}
              </button>
            </div>

            {/* Annual Plan (Highlighted) */}
            <div className="bg-secondary rounded-2xl shadow-2xl p-8 flex flex-col transform md:scale-105 relative z-10 border-4 border-primary/20">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-lg shadow-sm">
                {plans.annual.badge}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{plans.annual.name}</h3>
              <p className="text-gray-300 mb-6">Best for ongoing projects & contractors.</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-extrabold text-primary">{plans.annual.priceString}</span>
                <span className="text-gray-300 ml-2">{plans.annual.term}</span>
              </div>
              <p className="text-green-400 font-semibold text-sm mb-6 flex items-center gap-2">
                <i className="fas fa-tag"></i> {plans.annual.savings}
              </p>

              <button
                onClick={() => handlePayment("annual")}
                disabled={loadingPlan !== null}
                className="w-full py-4 rounded-xl font-bold bg-primary text-white hover:bg-yellow-500 shadow-float transition-all disabled:opacity-50"
              >
                {loadingPlan === "annual" ? "Processing..." : "Choose Annual Plan"}
              </button>
            </div>
          </div>

          {/* Features List */}
          <div className="max-w-4xl mx-auto mt-20">
             <div className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-100">
                <h4 className="text-xl font-bold text-center text-gray-800 mb-8">Everything included in Pro:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                         <i className="fas fa-calculator"></i>
                      </div>
                      <span className="font-medium text-gray-700">Access all 10 specialized calculators</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                         <i className="fas fa-file-pdf"></i>
                      </div>
                      <span className="font-medium text-gray-700">Download detailed PDF Cost Reports</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                         <i className="fas fa-cubes"></i>
                      </div>
                      <span className="font-medium text-gray-700">Get Material BOQ (Cement, Steel, etc.)</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                         <i className="fas fa-save"></i>
                      </div>
                      <span className="font-medium text-gray-700">Save unlimited projects to dashboard</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Error & Back Link */}
          <div className="text-center mt-12 space-y-4">
            {error && (
               <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg inline-block">
                  {error}
               </div>
            )}
            <div>
               <button 
                  onClick={() => navigate("/")} 
                  className="text-gray-500 hover:text-gray-800 font-medium transition-colors border-b border-transparent hover:border-gray-800"
               >
                  No thanks, I'll stick to the free version
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UpgradePage;