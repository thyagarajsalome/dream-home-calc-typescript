const handlePayment = async (planId: PlanID) => {
    const selectedPlan = plans[planId];
    setLoadingPlan(planId);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in to upgrade.");

      // 1. REPLACED FETCH WITH SUPABASE SDK
      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { planId: planId }
      });

      if (orderError || !order) {
        console.error("Order Error:", orderError);
        throw new Error("Failed to create payment order.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "DreamHomeCalc Pro",
        description: selectedPlan.description,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // 2. REPLACED FETCH WITH SUPABASE SDK
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError || result?.status !== "success") {
              console.error("Verify Error:", verifyError);
              throw new Error("Payment verification failed.");
            }
            
            setPaymentSuccess(true);
            setTimeout(() => {
              window.location.href = "/"; 
            }, 2000);
            
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