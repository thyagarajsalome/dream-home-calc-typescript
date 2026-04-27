// src/features/dashboard/UpgradePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";

const plans = {
  credits5: {
    id: "5_credits",
    name: "Starter Bundle",
    discountPrice: 199, // Matches 19900 in create-order/index.ts
    actualPrice: 249, 
    description: "Ideal for individual room planning.",
    features: [
      "5 Project Credits",
      "Unlock Interiors, Flooring & Painting",
      "Save up to 5 projects to dashboard"
    ],
    color: "border-blue-200",
    btnColor: "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
  },
  credits10: {
    id: "10_credits",
    name: "Architect Bundle",
    discountPrice: 349, // Matches 34900 in create-order/index.ts
    actualPrice: 499,
    description: "Best for complete home construction planning.",
    badge: "Best Value",
    features: [
      "10 Project Credits",
      "Unlock Plumbing, Electrical & Doors",
      "Detailed PDF Exports enabled"
    ],
    color: "border-primary",
    btnColor: "bg-primary text-white hover:bg-yellow-500 shadow-float"
  },
  pro: {
    id: "pro_monthly",
    name: "Builder Pro",
    discountPrice: 999, // Matches 99900 in create-order/index.ts
    actualPrice: 1427,
    description: "Unlimited professional toolkit for builders.",
    features: [
      "Unlimited Monthly Credits",
      "Materials BOQ & Profit Margin Tool",
      "Bonus: All House Plans Unlocked",
      "Priority Email Support"
    ],
    color: "border-gray-800",
    btnColor: "bg-secondary text-white hover:bg-gray-800 shadow-float"
  },
};

const UpgradePage = () => {
  const { user, refreshProfile } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async (planId: string) => {
    setLoadingPlan(planId);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("User not authenticated.");

      // Create Razorpay order via edge function
      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { planId } 
      });

      if (orderError || !order || order.error) {
        throw new Error(order?.error || "Failed to create payment order.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "HDE Premium",
        description: "Purchase " + planId.replace('_', ' '),
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment signature in the backend
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId // Pass planId to backend to determine credit count
              }
            });

            if (verifyError || result?.status !== "success") {
              throw new Error("Payment verification failed.");
            }
            
            alert("Payment Successful! Your credits have been added.");
            await refreshProfile(); // Refresh context to show new credits
            navigate("/dashboard");
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
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-fade-in">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Project Credits & Plans</h2>
        <p className="text-lg text-gray-600">Choose a bundle or subscribe for unlimited professional tools.</p>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 font-bold">{error}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {Object.entries(plans).map(([key, plan]) => (
          <div key={key} className={`bg-white rounded-2xl shadow-lg border-2 ${plan.color} p-6 flex flex-col relative`}>
            {plan.badge && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</div>}
            <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
            
            <div className="mb-4">
              <span className="text-gray-400 line-through text-sm">₹{plan.actualPrice}</span>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">₹{plan.discountPrice}</span>
                {key === 'pro' && <span className="text-gray-500 ml-1 text-sm">/ month</span>}
              </div>
              {key === 'pro' && <p className="text-xs text-primary font-bold">Billed annually</p>}
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i> {feature}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handlePayment(plan.id)} 
              disabled={loadingPlan !== null} 
              className={`w-full py-3 rounded-xl font-bold transition-all ${plan.btnColor} disabled:opacity-50`}
            >
              {loadingPlan === plan.id ? "Processing..." : key === 'pro' ? "Subscribe" : "Buy Bundle"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpgradePage;