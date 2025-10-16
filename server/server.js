require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");

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
    amount, // amount in the smallest currency unit
    currency: "INR",
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// A webhook endpoint to verify payment after completion
// This is a crucial step for production
app.post("/verify-payment", (req, res) => {
  // See Razorpay docs for signature verification logic
  // ...
  // If signature is verified:
  // 1. Get user ID from the request (you'd pass this when creating the order)
  // 2. Update user's hasPaid status to true in Firestore
  res.json({ status: "ok" });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
