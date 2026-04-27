// src/features/dashboard/UpgradePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";

const plans = {
  basic: {
    id: "5_credits",
    name: "Basic",
    tier: "basic",
    price: 199,
    originalPrice: 249,
    description: "Ideal for individuals starting a single home renovation or a small DIY project.",
    credits: "5 Project Credits",
    useCase: "Best for: Quick room makeovers and interior planning.",
    features: [
      "Unlock Interiors, Flooring & Painting",
        "Save up to 5 unique projects",
      "Standard PDF Cost Reports",
      "Download House plans",
      "Find local suppliers and contractors",
      "Register as Provider to get hired for projects"
    ],
    color: "blue",
    icon: "fa-paint-roller"
  },
  standard: {
    id: "10_credits",
    name: "Standard",
    tier: "standard",
    price: 349,
    originalPrice: 499,
    description: "Perfect for homeowners or independent designers managing multiple layouts simultaneously.",
    credits: "10 Project Credits",
    useCase: "Best for: Self-builders planning a full home construction.",
    badge: "Most Popular",
    features: [
      "Everything in Basic",
      "Unlock Plumbing & Electrical Layouts",
      "Doors & Windows Schedule Tools",
      "Save up to 10 unique projects",
      "Detailed Technical PDF Exports",
      "Download House plans",
      "Find local suppliers and contractors",
      "Register as Provider to get hired for projects"
    ],
    color: "amber",
    icon: "fa-drafting-compass"
  },
  // Inside the plans object in UpgradePage.tsx
pro: {
  id: "pro",
  name: "Pro",
  tier: "pro",
  price: 999,
  originalPrice: 1427,
  description: "Built for professional contractors and builders who need high-volume access.",
  credits: "High-Volume Usage", // Changed from "Unlimited"
  useCase: "Limits: 100 projects/month and 10 saves per day.", // Explicit limit info
  features: [
    "100 Monthly Project Saves",
    "10 Daily Save Limit (Anti-Bot Protection)",
    "Everything in Standard",
    "Material BOQ (Bill of Quantities)",
    "Priority Support",
    "Download House plans",
      "Find local suppliers and contractors",
      "Register as Provider to get hired for projects"
  ],
  color: "gray",
  icon: "fa-hard-hat"
},

const UpgradePage = () => {
  const { user, refreshProfile, planTier } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      if (!session) throw new Error("Please sign in to continue.");

      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { planId } 
      });

      if (orderError || !order || order.error) throw new Error(order?.error || "Failed to create order.");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "HDE Premium",
        description: `Unlocking ${planId.replace('_', ' ')}`,
        order_id: order.id,
        handler: async (response: any) => {
          const { data: result } = await supabase.functions.invoke('verify-payment', {
            body: { ...response, planId }
          });
          if (result?.status === "success") {
            await refreshProfile();
            navigate("/dashboard");
          } else {
            setError("Verification failed. Please contact support.");
          }
        },
        prefill: { email: user?.email },
        theme: { color: "#d9a443" },
      };
      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get the precision tools you need to build with confidence and save on material costs.
          </p>
          
          <div className="mt-8 inline-flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-primary/10 p-3 rounded-xl">
              <i className="fas fa-info-circle text-primary text-xl"></i>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800">What is a credit?</p>
              <p className="text-sm text-gray-500">1 Credit = 1 Unique Project. Use it to design, calculate, and save a full building plan.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-8 text-center font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {Object.entries(plans).map(([key, plan]) => {
            const isBestValue = plan.badge;
            const isCurrentPlan = planTier === plan.tier;

            return (
              <div 
                key={key} 
                className={`relative bg-white rounded-3xl p-8 transition-all hover:shadow-2xl border-2 flex flex-col min-h-[600px] ${
                  isBestValue ? 'border-primary shadow-xl scale-105' : 'border-transparent shadow-md'
                }`}
              >
                {isBestValue && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    {plan.badge}
                  </span>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="pr-2">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl shrink-0 bg-${plan.color}-50 text-${plan.color}-600`}>
                    <i className={`fas ${plan.icon} text-xl`}></i>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-lg">₹{plan.originalPrice}</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">Save 30%</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 font-medium">/{key === 'pro' ? 'mo' : 'once'}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                  <p className="text-primary font-bold text-lg mb-1">{plan.credits}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{plan.useCase}</p>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                      <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan.id)}
                  disabled={loadingPlan !== null || isCurrentPlan}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 disabled:opacity-50 ${
                    isCurrentPlan 
                    ? 'bg-green-50 text-green-600 cursor-default border border-green-100'
                    : isBestValue 
                      ? 'bg-primary text-white hover:bg-amber-500 shadow-lg' 
                      : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i> Processing
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : key === 'pro' ? (
                    'Start Subscription'
                  ) : (
                    'Buy Credits Now'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
}
export default UpgradePage;