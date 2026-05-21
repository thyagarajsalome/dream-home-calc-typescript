// src/features/dashboard/UpgradePage.tsx
import React, { useState, useEffect } from "react";
// removed useNavigate
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

// 1. Define the strict TypeScript interface for your plans
type PlanType = {
  id: string;
  name: string;
  tier: string;
  price: number;
  originalPrice: number;
  description: string;
  credits: string;
  useCase: string;
  features: string[];
  color: string;
  icon: string;
  badge?: string; // Optional property prevents the TS error!
};

// 2. Apply the interface to the plans object
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
    badge: undefined, // Add this line
    features: [
      "Unlock Interiors, Flooring & Painting",
      "House Plan Access",
      "Save up to 5 unique projects",
      "Standard PDF Cost Reports"
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
      "Detailed Technical PDF Exports"
    ],
    color: "amber",
    icon: "fa-drafting-compass"
  },
  pro: {
    id: "pro",
    name: "Pro",
    tier: "pro",
    price: 999,
    originalPrice: 1427,
    description: "Built for professional contractors and builders who need high-volume access.",
    credits: "High-Volume Usage",
    useCase: "Limits: 100 projects/month and 10 saves per day.",
    badge: undefined, // Add this line
    features: [
      "100 Monthly Project Saves",
      "10 Daily Save Limit (Anti-Bot Protection)",
      "Everything in Standard",
      "Material BOQ (Bill of Quantities)",
      "Priority Support"
    ],
    color: "gray",
    icon: "fa-hard-hat"
  },
};

const UpgradePage = () => {
  const { user, refreshProfile, planTier } = useUser();
  const { showToast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      if (!session) {
        window.location.assign("/signin");
        return;
      }

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
            window.location.assign("/dashboard");
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
      showToast(err.message, "error");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-12 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-zinc-100 mb-4 uppercase tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            Get the precision tools you need to build with confidence and save on material costs.
          </p>
          
          <div className="mt-8 inline-flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
            <div className="bg-primary/10 p-3 rounded-xl">
              <i className="fas fa-info-circle text-primary text-xl"></i>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800 dark:text-zinc-200">What is a credit?</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">1 Credit = 1 Unique Project. Use it to design, calculate, and save a full building plan.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-8 text-center font-medium">
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
                className={`relative bg-white dark:bg-zinc-900 rounded-3xl p-8 transition-all hover:shadow-2xl border-2 flex flex-col min-h-[600px] ${
                  isBestValue ? 'border-primary dark:border-zinc-100 shadow-xl scale-105' : 'border-transparent dark:border-zinc-800 shadow-md'
                }`}
              >
                {isBestValue && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white dark:text-zinc-950 text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    {plan.badge}
                  </span>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="pr-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{plan.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl shrink-0 bg-${plan.color}-50 dark:bg-zinc-800 text-${plan.color}-600 dark:text-zinc-300`}>
                    <i className={`fas ${plan.icon} text-xl`}></i>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-zinc-500 line-through text-lg">₹{plan.originalPrice}</span>
                    <span className="bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded">Save 30%</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gray-900 dark:text-zinc-100">₹{plan.price}</span>
                    <span className="text-gray-500 dark:text-zinc-400 font-medium">/{key === 'pro' ? 'mo' : 'once'}</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-2xl mb-6">
                  <p className="text-primary font-bold text-lg mb-1">{plan.credits}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{plan.useCase}</p>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-zinc-300 font-medium">
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
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 cursor-default border border-green-100 dark:border-green-900/30'
                    : isBestValue 
                      ? 'bg-primary text-white dark:text-zinc-950 hover:bg-primary-hover shadow-lg' 
                      : 'bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-black dark:hover:bg-zinc-700'
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

export default UpgradePage;


