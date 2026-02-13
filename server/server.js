require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

// --- Initialize Firebase Admin (Auth & Firestore) ---
// Ensure firebase-service-account.json is in your /server folder
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Firestore instance for Google stack
const app = express();

// --- Scalable CORS Configuration ---
const allowedOrigins = [
  "https://homedesignenglish.com",
  "http://localhost:5173",
  "https://dream-home-calc-typescript.onrender.com", // Old Render URL (Keep if still testing)
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
// Verifies the Firebase ID Token sent from React Web or React Native
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
  res.send("Dream Home Calc Google-stack server is running!");
});

// Create Order (Protected)
app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid amount specified.");
  }

  const options = {
    amount,
    currency: "INR",
    receipt: `rcpt_${req.user.uid.slice(0, 10)}_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error.message);
    res.status(500).send("Error creating order");
  }
});

// Verify Payment and Update Firestore (Protected)
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
      // GOOGLE STACK: Update Cloud Firestore instead of Supabase
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
    console.error("Error verifying payment or updating Firestore:", error);
    res.status(500).send("Internal Server Error during payment verification.");
  }
});

// --- Server Initialization ---
// PORT 8080 is standard for Google Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend scalable for millions running on port ${PORT}`);
});