import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

interface LoanCalculatorProps {
  hasPaid: boolean;
}

const LoanCalculator: React.FC<LoanCalculatorProps> = ({ hasPaid }) => {
  const [principal, setPrincipal] = useState("2500000");
  const [rate, setRate] = useState("8.5");
  const [years, setYears] = useState("20");

  const [emi, setEmi] = useState("");
  const [totalInterest, setTotalInterest] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    if (resultsRef.current) {
      setIsDownloading(true);
      try {
        const canvas = await html2canvas(resultsRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("loan-emi-estimate.pdf");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const calculateEMI = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 12 / 100;
    const n = parseFloat(years) * 12;

    if (p > 0 && r > 0 && n > 0) {
      const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalAmountValue = emiValue * n;
      const totalInterestValue = totalAmountValue - p;

      setEmi(emiValue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }));
      setTotalAmount(totalAmountValue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }));
      setTotalInterest(totalInterestValue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <section>
        <Card title="Loan Details">
          <form onSubmit={calculateEMI} className="space-y-6">
            <Input label="Loan Amount (INR)" type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} icon="fas fa-rupee-sign" />
            <Input label="Annual Interest Rate (%)" type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} icon="fas fa-percentage" />
            <Input label="Loan Tenure (Years)" type="number" value={years} onChange={(e) => setYears(e.target.value)} icon="fas fa-calendar-alt" />
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-md">
              Calculate EMI
            </button>
          </form>
        </Card>
      </section>

      {emi && (
        <section ref={resultsRef}>
          <Card title="Repayment Schedule" className="border-primary/20">
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Monthly EMI</p>
                <p className="text-3xl font-extrabold text-primary">{emi}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Interest</p>
                  <p className="text-lg font-bold text-secondary">{totalInterest}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-secondary">{totalAmount}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
              Figures are estimates based on standard amortization. Actual rates vary by bank.
            </div>

            {hasPaid && (
              <button onClick={downloadPDF} disabled={isDownloading} className="w-full py-3 bg-secondary text-white rounded-xl font-bold hover:bg-gray-800 flex items-center justify-center gap-2">
                <i className="fas fa-download"></i> {isDownloading ? "Downloading..." : "Download PDF"}
              </button>
            )}
          </Card>
        </section>
      )}
    </div>
  );
};

export default LoanCalculator;