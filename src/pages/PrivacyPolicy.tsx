// src/pages/PrivacyPolicy.tsx
import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="info-page-container">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Last Updated: October 20, 2025</strong>
      </p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to DreamHomeCalc. We are committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our application.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        We may collect the following types of information:
        <ul>
          <li>
            <strong>Personal Data:</strong> When you register for an account, we
            collect your email address. If you upgrade to a Pro account, our
            payment processor (Razorpay) will collect payment information. We do
            not store your full payment card details.
          </li>
          <li>
            <strong>Usage Data:</strong> We do not collect personal usage data.
            All calculations are performed on your device or anonymously.
          </li>
        </ul>
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and manage your account.</li>
        <li>Process transactions and manage your Pro subscription status.</li>
        <li>Communicate with you regarding your account.</li>
      </ul>

      <h2>4. Sharing Your Information</h2>
      <p>
        We do not sell, trade, or otherwise transfer your personally
        identifiable information to outside parties. This does not include
        trusted third parties who assist us in operating our application (like
        Supabase for authentication and Razorpay for payments), so long as those
        parties agree to keep this information confidential.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We implement a variety of security measures to maintain the safety of
        your personal information. Your account is protected by a password, and
        we encourage you to use a strong password.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at: <a href="mailto:contact@toolwebsite.in">contact@toolwebsite.in</a>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
