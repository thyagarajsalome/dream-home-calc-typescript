const functions = require("firebase-functions");
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const app = express();

// Allow all CORS since Firebase Hosting serves this from the same domain
app.use(cors({ origin: true }));
app.use(express.json());

// --- Authenticated Middleware ---
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

// --- API Endpoints ---
app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid amount specified.");
  }

  // 💡 FIX: Initialize Razorpay INSIDE the request so it runs at runtime, not deploy time!
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount,
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

app.post("/verify-payment", authenticateUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.uid; 
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    // 💡 FIX: Access the secret directly from process.env here
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
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

// Expose the Express app as a single Cloud Function named 'api'
exports.api = functions.https.onRequest(app);