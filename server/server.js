require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");

// --- Initialize Firebase Admin (For Token Verification Only) ---
// You must set FIREBASE_SERVICE_ACCOUNT as an environment variable in production (Render/RailWay)
// containing the raw JSON string of your service account file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- Initialize Supabase Admin (For Database Updates) ---
// Use the SERVICE_ROLE_KEY here, not the Anon key, to bypass RLS policies on the backend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();

const allowedOrigins = [
  "https://homedesignenglish.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- API Endpoints ---

app.get("/", (req, res) => {
  res.send("Dream Home Calc Backend is running!");
});

app.post("/create-order", authenticateUser, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount <= 0) return res.status(400).send("Invalid amount");

  const options = {
    amount,
    currency: "INR",
    receipt: `rcpt_${req.user.uid.slice(0, 10)}_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", authenticateUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.uid; 
    const userEmail = req.user.email;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // FIX: Update SUPABASE 'profiles' table instead of Firestore
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: userId, // Assuming your profiles table uses the Auth UID as primary key
          email: userEmail,
          has_paid: true, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;

      res.json({ status: "success", message: "Payment verified and Supabase updated." });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature." });
    }
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});