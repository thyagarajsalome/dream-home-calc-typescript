require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
// These variables are loaded from the .env file in the /server directory
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const options = {
    amount,
    currency: "INR",
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } =
    req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ status: "failure", message: "User ID is missing." });
  }

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest === razorpay_signature) {
    try {
      // Use the 'profiles' table and 'has_paid' column as created by the SQL script
      const { error } = await supabase
        .from("profiles")
        .update({ has_paid: true })
        .eq("id", userId);

      if (error) throw error;

      res.json({
        status: "success",
        message: "Payment verified successfully.",
      });
    } catch (error) {
      console.error("Error updating user in Supabase:", error);
      res
        .status(500)
        .json({ status: "failure", message: "Could not update user status." });
    }
  } else {
    res.status(400).json({ status: "failure", message: "Invalid signature." });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
