require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

// --- Initialize Firebase Admin (Auth & Firestore) ---
const serviceAccount = require("./firebase-service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Firestore instance
const app = express();

// ... (CORS and middleware remain the same)

// --- Authenticated Middleware ---
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid Token" });
  }
};

// --- API Endpoints ---

// Verify Payment and Update Firestore
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
      // Logic Shift: Update Google Firestore instead of Supabase
      await db.collection("profiles").doc(userId).set({
        has_paid: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      res.json({ status: "success" });
    } else {
      res.status(400).json({ status: "failure" });
    }
  } catch (error) {
    res.status(500).json({ error: "Firestore update failed" });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend scalable for millions running on port ${PORT}`));