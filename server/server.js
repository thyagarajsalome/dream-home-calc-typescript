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
  "https://dream-home-calc-typescript.onrender.com",
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
app.use(express.json());

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
// --- (Keep all code above this line the same) ---

// --- API Endpoints ---
app.post("/create-order", async (req, res) => {
  // FIX: Explicitly parse and validate the amount
  const amount = parseInt(req.body.amount, 10);

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid amount specified.");
  }

  const options = {
    amount, // Use the validated amount
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

// --- (Keep all code below this line the same) ---
// --- Server Initialization ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
