// src/components/LoanCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- ADD 'hasPaid' to the component's props ---
interface LoanCalculatorProps {
  hasPaid: boolean;
}

// --- Accept 'hasPaid' prop ---
const LoanCalculator: React.FC<LoanCalculatorProps> = ({ hasPaid }) => {
  const [principal, setPrincipal] = useState("2500000"); // Default: 25 Lakhs
  const [rate, setRate] = useState("8.5"); // Default: 8.5%
  const [years, setYears] = useState("20"); // Default: 20 years

  const [emi, setEmi] = useState("");
  const [totalInterest, setTotalInterest] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

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
          pdf.save("loan-emi-estimate.pdf");
          setIsDownloading(false);
        }
      );
    }
  };
  // --- END OF ADDITIONS ---

  const calculateEMI = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const p = parseFloat(principal);
    const r = parseFloat(rate) / 12 / 100; // Monthly interest rate
    const n = parseFloat(years) * 12; // Loan tenure in months

    if (p > 0 && r > 0 && n > 0) {
      const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalAmountValue = emiValue * n;
      const totalInterestValue = totalAmountValue - p;

      setEmi(
        emiValue.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })
      );
      setTotalAmount(
        totalAmountValue.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })
      );
      setTotalInterest(
        totalInterestValue.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })
      );
    }
  };

  return (
    <section id="loan-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Loan & EMI Calculator</h2>
        <form onSubmit={calculateEMI}>
          <div className="form-group">
            <label htmlFor="principal">
              <i className="fas fa-rupee-sign"></i> Loan Amount (INR)
            </label>
            <input
              type="number"
              id="principal"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g., 2500000"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="rate">
              <i className="fas fa-percentage"></i> Annual Interest Rate (%)
            </label>
            <input
              type="number"
              id="rate"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g., 8.5"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="years">
              <i className="fas fa-calendar-alt"></i> Loan Tenure (Years)
            </label>
            <input
              type="number"
              id="years"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="e.g., 20"
              required
            />
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate EMI
          </button>
        </form>

        {emi && (
          // --- ATTACH REF HERE ---
          <div id="resultsSection" className="visible" ref={resultsRef}>
            <div className="loan-results-summary">
              <div className="loan-result-item">
                <p>Monthly EMI</p>
                <span>{emi}</span>
              </div>
              <div className="loan-result-item">
                <p>Total Interest Payable</p>
                <span>{totalInterest}</span>
              </div>
              <div className="loan-result-item">
                <p>Total Amount Payable</p>
                <span>{totalAmount}</span>
              </div>
            </div>
            <div className="disclaimer-box">
              <p>
                <strong>For Educational Purposes Only:</strong> The figures
                provided are estimates based on the inputs you provide and a
                standard amortization formula. They are intended to give you a
                general trend and for educational purposes only.
              </p>
              <p>
                Interest rates are indicative and based on publicly available
                market data. Actual EMI amounts, interest rates, and eligibility
                will vary from bank to bank and are subject to each financial
                institution's terms, conditions, and credit assessment.
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

export default LoanCalculator;
