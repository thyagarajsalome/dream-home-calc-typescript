// backend/index.js
require('dotenv').config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require('@supabase/supabase-js');

// ... (Supabase config remains the same) ...
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const port = process.env.PORT || 3000;

// FIX: Update CORS to explicitly allow your domains
const allowedOrigins = [
  "http://localhost:5173",                  // Local Development
  "https://homedesignenglish.com",          // Production Domain
  "https://www.homedesignenglish.com",      // www version
  "https://thyagarajsalome.github.io"       // GitHub Pages fallback
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// ... (Rest of your routes: authenticateUser, /create-order, /verify-payment, etc.) ...
// Ensure the rest of the file matches your previous upload
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error("Invalid Token");
    req.user = user; 
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid Token" });
  }
};

app.get("/status", (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString() });
});

app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount <= 0) return res.status(400).send("Invalid amount.");
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const options = {
      amount,
      currency: "INR",
      receipt: `rcpt_${req.user.id.slice(0, 10)}_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", authenticateUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, has_paid: true, updated_at: new Date().toISOString() });
      if (error) {
        console.error("Database Update Error:", error);
        return res.status(500).json({ status: "failure", message: "Payment verified but DB update failed." });
      }
      res.json({ status: "success", message: "Payment verified and profile updated." });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send("Internal Server Error.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});