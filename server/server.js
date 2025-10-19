require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// --- Environment Variable Check ---
if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_KEY ||
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET
) {
  console.error("FATAL ERROR: Missing required environment variables.");
  process.exit(1);
}

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  "https://homedesignenglish.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// --- Middleware ---
app.use(express.json()); // This must come before your routes

// --- Health Check Endpoint ---
app.get("/", (req, res) => {
  res.send("Dream Home Calc server is running!");
});

// --- Razorpay Configuration ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- API Endpoints ---
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
    console.error("Error creating Razorpay order:", error.message);
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
      console.error("Error updating user in Supabase:", error.message);
      res
        .status(500)
        .json({ status: "failure", message: "Could not update user status." });
    }
  } else {
    res.status(400).json({ status: "failure", message: "Invalid signature." });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
