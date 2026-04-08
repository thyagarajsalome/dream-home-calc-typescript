import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";

export type PlanID = "basic" | "standard" | "pro";

const plans = {
  basic: {
    id: "basic" as PlanID,
    name: "Homeowner Basic",
    priceString: "₹99",
    term: "one-time",
    description: "Perfect for single room or minor renovations.",
    features: ["Interiors Calculator", "Flooring Calculator", "Painting Calculator", "Save up to 3 projects"],
    color: "border-blue-200",
    btnColor: "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
  },
  standard: {
    id: "standard" as PlanID,
    name: "Self-Builder Standard",
    priceString: "₹299",
    term: "one-time",
    description: "Ideal for building a full house from scratch.",
    badge: "Most Popular",
    features: ["Everything in Basic", "Plumbing & Electrical", "Doors & Windows", "Detailed PDF Exports"],
    color: "border-primary",
    btnColor: "bg-primary text-white hover:bg-yellow-500 shadow-float"
  },
  pro: {
    id: "pro" as PlanID,
    name: "Builder Pro",
    priceString: "₹999",
    term: "/ month",
    description: "Professional tools for contractors & builders.",
    features: ["Everything in Standard", "Materials BOQ Estimator", "Hidden Profit Margin Tool", "Unlimited Projects"],
    color: "border-gray-800",
    btnColor: "bg-secondary text-white hover:bg-gray-800 shadow-float"
  },
};

const UpgradePage = () => {
  const { user, refreshProfile } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<PlanID | null>(null);
  const [error, setError] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const handlePayment = async (planId: PlanID) => {
    const selectedPlan = plans[planId];
    setLoadingPlan(planId);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in to upgrade.");

      const { data, error: invokeError } = await supabase.functions.invoke('create-order', {
        body: { planId: planId }
      });

      if (invokeError) throw new Error(invokeError.message);
      if (data && data.error) throw new Error(data.error); 

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      const options = {
        key: razorpayKey as string,
        amount: data.amount,
        currency: data.currency,
        name: "Home Design English",
        description: selectedPlan.name,
        order_id: data.id,
        handler: async (response: any) => {
          try {
            const { data: result, error: vError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: planId // Passing planId to backend!
              }
            });

            if (vError) throw new Error(vError.message);
            if (result?.error) throw new Error(result.error);
            if (result?.status !== "success") throw new Error("Verification failed.");
            
            await refreshProfile(); // Refresh tier in UI
            setPaymentSuccess(true);
            setTimeout(() => { window.location.href = "/"; }, 2000);
          } catch (err: any) {
            setError(err.message || "Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: user?.email || "" },
        theme: { color: "#D9A443" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setError(String(err.message || "Error creating payment order. Please try again."));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-fade-in">
      {paymentSuccess ? (
        <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"><i className="fas fa-check"></i></div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">Your new tools are unlocked. Redirecting...</p>
        </div>
      ) : (
        <>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-lg text-gray-600">Pick the perfect toolkit for your construction needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(Object.keys(plans) as PlanID[]).map((key) => {
              const plan = plans[key];
              return (
                <div key={key} className={`bg-white rounded-2xl shadow-lg border-2 ${plan.color} p-6 flex flex-col relative`}>
                  {plan.badge && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</div>}
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 h-10">{plan.description}</p>
                  
                  <div className="flex items-baseline mb-6 border-b border-gray-100 pb-6">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.priceString}</span>
                    <span className="text-gray-500 ml-1 text-sm">{plan.term}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <i className="fas fa-check-circle text-green-500 mt-1"></i> {feature}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handlePayment(key)} 
                    disabled={loadingPlan !== null} 
                    className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${plan.btnColor}`}
                  >
                    {loadingPlan === key ? "Processing..." : `Choose ${plan.name.split(" ")[0]}`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12 space-y-4">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg inline-block border border-red-100">{error}</div>}
            <div>
               <button onClick={() => navigate("/")} className="text-gray-500 hover:text-gray-800 font-medium transition-colors border-b border-transparent hover:border-gray-800">
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