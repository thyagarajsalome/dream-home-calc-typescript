require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

// IMPORTANT: Create this file in your /server directory
// It's a JSON file you can download from your Firebase project settings.
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const options = {
    amount,
    currency: "INR",
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } =
    req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ status: "failure", message: "User ID is missing." });
  }

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest === razorpay_signature) {
    // Payment is legitimate
    try {
      const userRef = db.collection("users").doc(userId);
      await userRef.update({ hasPaid: true });
      res.json({
        status: "success",
        message: "Payment verified successfully.",
      });
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
      res
        .status(500)
        .json({ status: "failure", message: "Could not update user status." });
    }
  } else {
    res.status(400).json({ status: "failure", message: "Invalid signature." });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
