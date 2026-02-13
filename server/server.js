require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

// --- Initialize Firebase Admin ---
// Check if running in production with ENV variable, otherwise look for local file
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Parse the JSON string from the environment variable (Production)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local development fallback (looks for file in server folder)
  serviceAccount = require("./firebase-service-account.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

// --- Scalable CORS Configuration ---
const allowedOrigins = [
  "https://homedesignenglish.com",
  "http://localhost:5173", // Vite local dev URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or local testing)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

// --- Authenticated Middleware ---
// Verifies the Firebase ID Token sent from Frontend
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Auth Token Verification Error:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid Token" });
  }
};

// --- Razorpay Configuration ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- API Endpoints ---

// Health Check
app.get("/", (req, res) => {
  res.send("Dream Home Calc (Firebase) Backend is running!");
});

// Create Order (Protected)
app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid amount specified.");
  }

  const options = {
    amount, // Amount in paise
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

// Verify Payment and Update Firestore (Protected)
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
      // GOOGLE STACK: Update Cloud Firestore
      await db.collection("profiles").doc(userId).set({
        has_paid: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      res.json({
        status: "success",
        message: "Payment verified and Firestore profile updated.",
      });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send("Internal Server Error during payment verification.");
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});