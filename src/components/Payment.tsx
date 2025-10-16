import React from "react";

const Payment = ({ user }: { user: any }) => {
  const handlePayment = async () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onerror = () => {
      alert("Razorpay SDK failed to load. Are you online?");
    };
    script.onload = async () => {
      try {
        const response = await fetch("http://localhost:3001/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: 9900 }), // Amount in paise (99 INR)
        });
        const order = await response.json();

        const options = {
          key: "YOUR_RAZORPAY_KEY_ID", // Get this from your Razorpay dashboard
          amount: order.amount,
          currency: order.currency,
          name: "DreamHomeCalc Pro",
          description: "Lifetime Access",
          order_id: order.id,
          handler: async (response: any) => {
            // Here you would verify the payment on your backend
            // and then update the user's status in Firestore
            alert("Payment Successful!");
            // You would call a backend endpoint to verify signature and update DB
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: "#D9A443",
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      } catch (err) {
        console.error(err);
        alert("Error creating payment order.");
      }
    };
    document.body.appendChild(script);
  };

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <h2>Unlock All Calculators</h2>
      <p>
        Get lifetime access to all premium features and calculators for just
        ₹99.
      </p>
      <button onClick={handlePayment} className="btn">
        Pay ₹99 Now
      </button>
    </div>
  );
};

export default Payment;
