// src/components/LoanEligibilityCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- ADD 'hasPaid' to the component's props ---
interface LoanEligibilityCalculatorProps {
  hasPaid: boolean;
}

// --- Accept 'hasPaid' prop ---
const LoanEligibilityCalculator: React.FC<LoanEligibilityCalculatorProps> = ({
  hasPaid,
}) => {
  // Input states
  const [monthlyIncome, setMonthlyIncome] = useState("75000");
  const [hasRegularIncome, setHasRegularIncome] = useState(true);
  const [houseRent, setHouseRent] = useState("15000");
  const [otherLoan, setOtherLoan] = useState("5000");
  const [foodGrocery, setFoodGrocery] = useState("10000");
  const [childrenFees, setChildrenFees] = useState("5000");
  const [utilities, setUtilities] = useState("3000");
  const [transportation, setTransportation] = useState("2000");
  const [desiredLoan, setDesiredLoan] = useState("3000000");

  // Output states
  const [riskFactor, setRiskFactor] = useState<
    "Low" | "Medium" | "High" | null
  >(null);
  const [oir, setOir] = useState<number | null>(null);

  // --- ADDITIONS FOR PDF ---
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
  // --- END OF ADDITIONS ---

  const calculateEligibility = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Calculate Total Monthly Expenses
    const totalExpenses =
      parseFloat(houseRent) +
      parseFloat(otherLoan) +
      parseFloat(foodGrocery) +
      parseFloat(childrenFees) +
      parseFloat(utilities) +
      parseFloat(transportation);

    // 2. Estimate EMI for the desired loan (assuming 8.5% for 20 years)
    const p = parseFloat(desiredLoan);
    const r = 8.5 / 12 / 100;
    const n = 20 * 12;
    const estimatedEmi =
      (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // 3. Calculate Total Monthly Obligations
    const totalObligations = totalExpenses + estimatedEmi;

    // 4. Calculate Obligation-to-Income Ratio (OIR)
    const income = parseFloat(monthlyIncome);
    const calculatedOir = (totalObligations / income) * 100;
    setOir(calculatedOir);

    // 5. Determine Risk Factor
    let lowRiskThreshold = 50;
    let mediumRiskThreshold = 65;

    // If income is not regular, be more conservative
    if (!hasRegularIncome) {
      lowRiskThreshold = 40;
      mediumRiskThreshold = 55;
    }

    if (calculatedOir <= lowRiskThreshold) {
      setRiskFactor("Low");
    } else if (calculatedOir <= mediumRiskThreshold) {
      setRiskFactor("Medium");
    } else {
      setRiskFactor("High");
    }
  };

  const getRiskColor = () => {
    if (riskFactor === "Low") return "var(--success-color)";
    if (riskFactor === "Medium") return "var(--warning-color)";
    if (riskFactor === "High") return "var(--danger-color)";
    return "var(--border-color)";
  };

  return (
    <section id="eligibility-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Loan Eligibility Calculator</h2>
        <form onSubmit={calculateEligibility}>
          {/* ... (form fields remain the same) ... */}
          <fieldset className="form-fieldset">
            <legend>Income Details</legend>
            <div className="form-group">
              <label htmlFor="monthlyIncome">
                <i className="fas fa-wallet"></i> Gross Monthly Income (INR)
              </label>
              <input
                type="number"
                id="monthlyIncome"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-briefcase"></i> Do you have a regular
                income source?
              </label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="regularIncome"
                    checked={hasRegularIncome}
                    onChange={() => setHasRegularIncome(true)}
                  />{" "}
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="regularIncome"
                    checked={!hasRegularIncome}
                    onChange={() => setHasRegularIncome(false)}
                  />{" "}
                  No
                </label>
              </div>
            </div>
          </fieldset>

          {/* Expenses Section */}
          <fieldset className="form-fieldset">
            <legend>Monthly Expenses (INR)</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="houseRent">House Rent</label>
                <input
                  type="number"
                  id="houseRent"
                  value={houseRent}
                  onChange={(e) => setHouseRent(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="otherLoan">Other Loan EMIs</label>
                <input
                  type="number"
                  id="otherLoan"
                  value={otherLoan}
                  onChange={(e) => setOtherLoan(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="foodGrocery">Food & Grocery</label>
                <input
                  type="number"
                  id="foodGrocery"
                  value={foodGrocery}
                  onChange={(e) => setFoodGrocery(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="childrenFees">Children's Fees</label>
                <input
                  type="number"
                  id="childrenFees"
                  value={childrenFees}
                  onChange={(e) => setChildrenFees(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="utilities">Utilities</label>
                <input
                  type="number"
                  id="utilities"
                  value={utilities}
                  onChange={(e) => setUtilities(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="transportation">Transportation</label>
                <input
                  type="number"
                  id="transportation"
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Desired Loan */}
          <fieldset className="form-fieldset">
            <legend>Desired Loan</legend>
            <div className="form-group">
              <label htmlFor="desiredLoan">
                <i className="fas fa-home"></i> Total House Loan Amount (INR)
              </label>
              <input
                type="number"
                id="desiredLoan"
                value={desiredLoan}
                onChange={(e) => setDesiredLoan(e.target.value)}
                required
              />
            </div>
          </fieldset>
          <button type="submit" className="btn full-width">
            Check Eligibility
          </button>
        </form>

        {riskFactor && oir !== null && (
          // --- ATTACH REF HERE ---
          <div id="resultsSection" className="visible" ref={resultsRef}>
            <h3 className="results-title">Your Eligibility Report</h3>
            <div className="eligibility-dashboard">
              <div className="risk-gauge">
                <div className="gauge-body">
                  <div
                    className="gauge-fill"
                    style={{
                      transform: `rotate(${oir / 100 / 2}turn)`,
                      backgroundColor: getRiskColor(),
                    }}
                  ></div>
                  <div className="gauge-cover">
                    <span>{riskFactor}</span>
                    <p>Risk Factor</p>
                  </div>
                </div>
              </div>
              <div className="risk-details">
                <p>
                  Based on your income and expenses, your{" "}
                  <strong>Obligation-to-Income Ratio (OIR)</strong> is
                  approximately <strong>{oir.toFixed(2)}%</strong>.
                </p>
                {riskFactor === "Low" && (
                  <p>
                    This is a healthy ratio. Lenders are likely to view your
                    application favorably.
                  </p>
                )}
                {riskFactor === "Medium" && (
                  <p>
                    Your application might require additional review. Lenders
                    may offer a lower loan amount or a higher interest rate.
                  </p>
                )}
                {riskFactor === "High" && (
                  <p>
                    It may be challenging to get a loan with this ratio.
                    Consider reducing expenses, clearing existing loans, or
                    applying for a smaller loan amount.
                  </p>
                )}
              </div>
            </div>
            <div className="disclaimer-box">
              <p>
                <strong>For Educational Purposes Only:</strong> The eligibility
                assessment is a simulation based on common financial industry
                guidelines and is not a guarantee of loan approval. It is
                intended to give you a general trend and for educational
                purposes only.
              </p>
              <p>
                Final loan eligibility and approval are at the sole discretion
                of the lending institution and depend on a full credit
                assessment, income verification, and other criteria as per their
                policies.
              </p>
            </div>
            {/* --- ADD CONDITIONAL PDF BUTTON --- */}
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
            {/* --- END OF ADDITION --- */}
          </div>
        )}
      </div>
    </section>
  );
};

export default LoanEligibilityCalculator;
