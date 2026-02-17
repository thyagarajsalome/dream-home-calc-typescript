// src/components/LoanEligibilityCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useUser } from "../context/UserContext";

const LoanEligibilityCalculator: React.FC = () => {
  const { hasPaid } = useUser(); // Use Context

  // Income & Profile
  const [age, setAge] = useState("30");
  const [monthlyIncome, setMonthlyIncome] = useState("75000");
  const [coApplicantIncome, setCoApplicantIncome] = useState("0");

  // Expenses
  const [existingEMIs, setExistingEMIs] = useState("5000");
  const [otherExpenses, setOtherExpenses] = useState("25000"); // Rent + Food + etc

  // Loan Details
  const [interestRate, setInterestRate] = useState("8.5");
  const [desiredTenure, setDesiredTenure] = useState("20");

  // Results
  const [eligibility, setEligibility] = useState<any>(null);

  // PDF Logic
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = () => {
    if (resultsRef.current) {
      setIsDownloading(true);
      html2canvas(resultsRef.current, { scale: 2, useCORS: true }).then(
        (canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("loan-eligibility-report.pdf");
          setIsDownloading(false);
        }
      );
    }
  };

  const calculateEligibility = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Calculate Total Income
    const totalIncome =
      parseFloat(monthlyIncome) + parseFloat(coApplicantIncome);

    // 2. Calculate Net Available Income (FOIR - Fixed Obligation to Income Ratio)
    // Banks typically allow 50% to 60% of net income to go towards EMIs
    const foirLimit = totalIncome > 100000 ? 0.6 : 0.5; // Higher income gets higher ratio
    const maxAllowedEMI = totalIncome * foirLimit - parseFloat(existingEMIs);

    // 3. Calculate Tenure Constraint based on Age
    // Max retirement age usually 60 or 65. Let's assume 60.
    const currentAge = parseInt(age);
    const maxTenureByAge = 60 - currentAge;
    const actualTenure = Math.min(parseInt(desiredTenure), maxTenureByAge);

    // 4. Reverse Calculate Max Loan Amount from Max EMI
    // Formula: Loan = (EMI * ( (1+r)^n - 1 )) / ( r * (1+r)^n )
    const r = parseFloat(interestRate) / 12 / 100;
    const n = actualTenure * 12;

    let maxLoanAmount = 0;
    if (maxAllowedEMI > 0 && n > 0) {
      maxLoanAmount =
        (maxAllowedEMI * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
    }

    // 5. Risk Assessment
    const totalObligations =
      parseFloat(existingEMIs) + parseFloat(otherExpenses);
    const obligationRatio = (totalObligations / totalIncome) * 100;

    let risk = "Low";
    let riskColor = "var(--success-color)";

    if (obligationRatio > 50) {
      risk = "Medium";
      riskColor = "var(--warning-color)";
    }
    if (obligationRatio > 70) {
      risk = "High";
      riskColor = "var(--danger-color)";
    }

    setEligibility({
      maxLoan: Math.round(maxLoanAmount),
      maxEMI: Math.round(maxAllowedEMI),
      actualTenure,
      risk,
      riskColor,
      totalIncome,
    });
  };

  return (
    <section id="eligibility-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Max Home Loan Eligibility</h2>
        <form onSubmit={calculateEligibility}>
          <fieldset className="form-fieldset">
            <legend>Applicant Profile</legend>
            <div className="form-grid">
              <div className="form-group">
                <label>Age (Years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Net Monthly Income</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Co-Applicant Income</label>
                <input
                  type="number"
                  value={coApplicantIncome}
                  onChange={(e) => setCoApplicantIncome(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Financial Status</legend>
            <div className="form-grid">
              <div className="form-group">
                <label>Existing EMIs</label>
                <input
                  type="number"
                  value={existingEMIs}
                  onChange={(e) => setExistingEMIs(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Other Monthly Expenses</label>
                <input
                  type="number"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <div className="form-group">
            <label>Desired Tenure (Years)</label>
            <input
              type="number"
              value={desiredTenure}
              onChange={(e) => setDesiredTenure(e.target.value)}
            />
          </div>

          <button type="submit" className="btn full-width">
            Check Eligibility
          </button>
        </form>

        {eligibility && (
          <div id="resultsSection" className="visible">
            <div
              className="card"
              ref={resultsRef}
              style={{ background: "#fdfdfd" }}
            >
              <div
                className="total-summary"
                style={{ background: eligibility.riskColor }}
              >
                <p style={{ color: "#fff" }}>Maximum Loan Eligibility</p>
                <span style={{ color: "#fff" }}>
                  {eligibility.maxLoan > 0
                    ? `₹${eligibility.maxLoan.toLocaleString("en-IN")}`
                    : "Not Eligible"}
                </span>
              </div>

              <div className="loan-results-summary">
                <div className="loan-result-item">
                  <p>Max Affordable EMI</p>
                  <span>₹{eligibility.maxEMI.toLocaleString()}</span>
                </div>
                <div className="loan-result-item">
                  <p>Max Tenure (Age Limit)</p>
                  <span>{eligibility.actualTenure} Years</span>
                </div>
                <div className="loan-result-item">
                  <p>Financial Health</p>
                  <span style={{ color: eligibility.riskColor }}>
                    {eligibility.risk} Risk
                  </span>
                </div>
              </div>

              <div className="disclaimer-box" style={{ marginTop: "2rem" }}>
                <strong>Insight:</strong>
                {eligibility.actualTenure < parseInt(desiredTenure)
                  ? ` Your tenure was reduced to ${eligibility.actualTenure} years because loans usually must be repaid before retirement age (60).`
                  : ` You have a healthy tenure of ${eligibility.actualTenure} years.`}
                {parseFloat(coApplicantIncome) > 0 &&
                  ` Adding a co-applicant increased your eligibility by approx ₹${Math.round(
                    parseFloat(coApplicantIncome) * 50
                  ).toLocaleString()}.`}
              </div>

              {hasPaid && (
                <div className="action-buttons">
                  <button
                    className="btn"
                    onClick={downloadPDF}
                    disabled={isDownloading}
                  >
                    <i className="fas fa-download"></i>{" "}
                    {isDownloading ? "Downloading..." : "Download PDF"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LoanEligibilityCalculator;
