import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";

const plans = {
  basic: {
    id: "basic",
    name: "Homeowner Basic",
    discountPrice: 99,
    actualPrice: 142, 
    description: "Essential toolkit for minor home improvements.",
    features: [
      "Interiors, Flooring & Painting",
      "Bonus: 1 House Plan download / day",
      "Save up to 3 projects"
    ],
    color: "border-blue-200",
    btnColor: "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
  },
  standard: {
    id: "standard",
    name: "Self-Builder Standard",
    discountPrice: 299,
    actualPrice: 427,
    description: "Complete set for building your dream home.",
    badge: "Best Value",
    features: [
      "Everything in Basic",
      "Plumbing, Electrical & Doors",
      "Bonus: 2 House Plan downloads / day",
      "Detailed PDF Exports"
    ],
    color: "border-primary",
    btnColor: "bg-primary text-white hover:bg-yellow-500 shadow-float"
  },
  pro: {
    id: "pro",
    name: "Builder Pro",
    discountPrice: 999,
    actualPrice: 1427,
    description: "Professional tools for contractors & engineers.",
    features: [
      "Everything in Standard",
      "Materials BOQ & Profit Margin Tool",
      "Bonus: 3 House Plan downloads / day",
      "Unlimited Projects"
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

      if (orderError || !order) throw new Error("Failed to create payment order.");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Dream Home Calculator",
        description: plans[planId as keyof typeof plans].name + " Access",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment signature
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId
              }
            });

            if (verifyError || result?.status !== "success") {
              throw new Error("Payment verification failed.");
            }
            
            alert("Payment Successful! Access Unlocked.");
            await refreshProfile(); // Refresh context to apply new tier
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
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Pricing Plans</h2>
        <p className="text-lg text-gray-600">Save 30% today on all monthly subscriptions.</p>
        {error && <p className="text-red-500 font-bold mt-4">{error}</p>}
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
                <span className="text-gray-500 ml-1 text-sm">/ month</span>
              </div>
              <p className="text-xs text-primary font-bold">₹{plan.discountPrice * 12} billed annually</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i> {feature}
                </li>
              ))}
              <li className="bg-amber-50 p-2 rounded-lg text-[10px] font-bold text-amber-800 border border-amber-100">
                <i className="fas fa-gift mr-1"></i> BONUS HOUSE PLANS DOWNLOAD OPTION ENABLED
              </li>
            </ul>

            <button 
              onClick={() => handlePayment(key)} 
              disabled={loadingPlan !== null} 
              className={`w-full py-3 rounded-xl font-bold transition-all ${plan.btnColor} disabled:opacity-50`}
            >
              {loadingPlan === key ? "Processing..." : "Subscribe Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpgradePage;