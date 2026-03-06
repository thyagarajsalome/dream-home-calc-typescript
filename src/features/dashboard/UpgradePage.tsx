const handlePayment = async (planId: PlanID) => {
    const selectedPlan = plans[planId];
    setLoadingPlan(planId);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in to upgrade.");

      // Use invoke to call the function
      const { data, error: invokeError } = await supabase.functions.invoke('create-order', {
        body: { planId: planId }
      });

      // If Supabase returns an error, show the message from the function body
      if (invokeError) {
        const errorMsg = invokeError.context?.error || invokeError.message || "Failed to create order";
        throw new Error(errorMsg);
      }

      if (!data || !data.id) throw new Error("Invalid order data received.");

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error("Razorpay Client Key is missing in environment variables.");

      const options = {
        key: String(razorpayKey),
        amount: data.amount,
        currency: data.currency,
        name: "DreamHomeCalc Pro",
        description: selectedPlan.description,
        order_id: data.id,
        handler: async (response: any) => {
          try {
            const { data: result, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError || result?.status !== "success") {
              throw new Error("Payment verification failed on server.");
            }
            
            setPaymentSuccess(true);
            setTimeout(() => { window.location.href = "/"; }, 2000);
            
          } catch (err: any) {
            setError(err.message || "Payment verification failed.");
          }
        },
        prefill: { email: user?.email },
        theme: { color: "#D9A443" },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Payment Process Error:", err);
      setError(err.message || "Error creating payment order.");
    } finally {
      setLoadingPlan(null);
    }
  };