// src/pages/TermsOfService.tsx

import React from "react";

const TermsOfService = () => {
  return (
    <div className="info-page-container">
      <h1>Terms of Service</h1>
      <p>
        <strong>Last Updated: October 20, 2025</strong>
      </p>

      <h2>1. Agreement to Terms</h2>
      <p>
        By accessing and using the DreamHomeCalc website and its associated
        tools (the "Service"), you agree to be bound by these Terms of Service
        and all applicable laws and regulations. If you do not agree with any
        part of these terms, you are prohibited from using the Service.
      </p>

      <h2>2. Use of the Service</h2>
      <p>
        The Service provides cost estimation tools for construction and related
        projects for informational purposes only. These estimates are not a
        substitute for professional advice from qualified contractors,
        architects, or financial advisors. You are solely responsible for your
        use of the Service and for any decisions made based on the information
        provided.
      </p>

      {/* --- UPDATED SECTION --- */}
      <h2>3. Pro Accounts & Credits</h2>
      <p>
        Certain features, calculators, and functionalities of the Service are
        only available through the purchase of "Project Credits" or upgrading to a "Pro Account."
      </p>
      <ul>
        <li>
          <strong>Credits & Access:</strong> Upgrading or purchasing a credit package gives you a set number of project credits (e.g., 5, 10, or 100 credits). 1 Credit allows you to design, calculate, and save 1 unique project plan.
        </li>
        <li>
          <strong>Payments and Fees:</strong> Fees for credit packages and Pro access are billed as one-time payments. All prices are inclusive of applicable taxes, including GST. Since these are one-time purchases, there are no automatic recurring subscriptions.
        </li>
        <li>
          <strong>No Refund Policy:</strong> All payments for credits or Pro account upgrades are final and non-refundable. Once a purchase is made, you will immediately receive the project credits, and no partial or full refunds will be issued for unused credits.
        </li>
      </ul>
      {/* --- END OF UPDATE --- */}

      <h2>4. Intellectual Property</h2>
      <p>
        The Service and its original content, features, and functionality are
        and will remain the exclusive property of DreamHomeCalc and its
        licensors.
      </p>

      <h2>5. Limitation of Liability and Disclaimer of Warranties</h2>
      <p>
        The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
        DreamHomeCalc makes no warranties, expressed or implied, and hereby
        disclaims and negates all other warranties including, without
        limitation, implied warranties or conditions of merchantability, or
        non-infringement of intellectual property. Under no circumstance shall
        we have any liability to you for any loss or damage of any kind incurred
        as a result of the use of the site or reliance on any information
        provided. Your use of the site is solely at your own risk.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at:{" "}
        <a href="mailto:thyagaraja1983@gmail.com">thyagaraja1983@gmail.com</a>
      </p>
    </div>
  );
};

export default TermsOfService;
