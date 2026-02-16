const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Allow all CORS for development and same-domain production
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * Middleware: Verify Firebase Auth Token
 */
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth Token Verification Error:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid Token" });
  }
};

/**
 * Health Check Endpoint
 * Useful for checking if the backend is alive: yoursite.com/api/status
 */
app.get("/status", (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString() });
});

/**
 * Create Razorpay Order
 */
app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid amount specified.");
  }

  // Initialize Razorpay with Cloud Environment Variables
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount, // amount in the smallest currency unit (paise for INR)
    currency: "INR",
    receipt: `rcpt_${req.user.uid.slice(0, 10)}_${Date.now()}`,
  };
  
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send("Error creating order");
  }
});

/**
 * Verify Razorpay Payment Signature
 */
app.post("/verify-payment", authenticateUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.uid; 
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Update User Profile in Firestore
      await db.collection("profiles").doc(userId).set({
        has_paid: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      res.json({ status: "success", message: "Payment verified." });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send("Internal Server Error.");
  }
});

/**
 * Expose the Express app as a single Cloud Function named 'api'
 * This MUST match the name in your firebase.json rewrites
 */
exports.api = onRequest({ region: "asia-south1" }, app);