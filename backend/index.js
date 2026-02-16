// backend/index.js
require('dotenv').config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase Admin Client (Service Role)
// We need the SERVICE_ROLE_KEY to update the user's profile securely on the backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const port = process.env.PORT || 3000;

// 2. Middleware
app.use(cors());
app.use(express.json());

// 3. Auth Middleware: Verify Supabase Token
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error("Invalid Token");
    }

    // Attach user info to request
    req.user = user; 
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid Token" });
  }
};

// 4. Routes

// Health Check
app.get("/status", (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString() });
});

// Create Razorpay Order
app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid amount specified.");
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount, // amount in paise
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

// Verify Payment & Update Supabase
app.post("/verify-payment", authenticateUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;
    
    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment Successful: Update Supabase 'profiles' table
      // We use upsert to create the row if it doesn't exist
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          has_paid: true,
          updated_at: new Date().toISOString()
        });

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

// 5. Start Server (Required for Render)
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});