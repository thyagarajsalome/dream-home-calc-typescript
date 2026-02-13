require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin"); // Added for Firebase Auth
const { createClient } = require("@supabase/supabase-js");

// --- Environment Variable Check ---
const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "FIREBASE_SERVICE_ACCOUNT_PATH" // Path to your Firebase JSON key
];

requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`FATAL ERROR: Missing ${env}`);
    process.exit(1);
  }
});

// --- Initialize Firebase Admin (Auth) ---
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- Initialize Supabase (Database) ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();

// --- Scalable CORS Configuration ---
const allowedOrigins = [
  "https://homedesignenglish.com",
  "http://localhost:5173",
  "https://dream-home-calc-typescript.onrender.com",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));

app.use(express.json());

// --- Scalable Middleware: Firebase Token Verification ---
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    // Verify the token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// --- Razorpay Configuration ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- API Endpoints ---

app.get("/", (req, res) => res.send("Dream Home Calc server is active."));

// Create Order (Requires Auth for scalability/security)
app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount <= 0) return res.status(400).send("Invalid amount.");

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${req.user.uid.slice(0, 10)}_${Date.now()}`,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Order creation failed" });
  }
});

// Verify Payment (Now uses req.user.uid from Firebase)
app.post("/verify-payment", authenticateUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.uid; // Secured via Firebase token verification

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Update Supabase profiles table using Firebase UID
      const { error } = await supabase
        .from("profiles")
        .update({ has_paid: true })
        .eq("id", userId);

      if (error) console.error("Database update failed:", error);

      res.json({ status: "success", message: "Pro access granted." });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend scalable for millions running on port ${PORT}`));