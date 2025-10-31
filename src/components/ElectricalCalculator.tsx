import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "./Chart";

// --- ADD 'hasPaid' to the component's props ---
interface ElectricalCalculatorProps {
  hasPaid: boolean;
}

const electricalQualities = {
  basic: { name: "Basic", ratePerSqFt: 100 },
  standard: { name: "Standard (Concealed)", ratePerSqFt: 180 },
  premium: { name: "Premium (Smart Features)", ratePerSqFt: 300 },
};

const electricalBreakdown = {
  Wiring: 40,
  "Switches & Sockets": 25,
  "Main Board & Breakers": 15,
  Labor: 20,
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

// --- Accept 'hasPaid' prop ---
const ElectricalCalculator: React.FC<ElectricalCalculatorProps> = ({
  hasPaid,
}) => {
  const [area, setArea] = useState("");
  const [quality, setQuality] =
    useState<keyof typeof electricalQualities>("basic");
  const [totalCost, setTotalCost] = useState(0);

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
          pdf.save("electrical-cost-estimate.pdf");
          setIsDownloading(false);
        }
      );
    }
  };
  // --- END OF ADDITIONS ---

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    const cost = parsedArea * electricalQualities[quality].ratePerSqFt;
    setTotalCost(cost);
  };

  return (
    <section id="electrical-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Electrical Cost Calculator</h2>
        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Built-up Area (sq. ft.)
            </label>
            <input
              type="number"
              id="area"
              name="area"
              placeholder="e.g., 1500"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-bolt"></i> Wiring & Fixture Quality
            </label>
            <select
              value={quality}
              onChange={(e) =>
                setQuality(e.target.value as keyof typeof electricalQualities)
              }
            >
              {Object.entries(electricalQualities).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Cost
          </button>
        </form>
        {totalCost > 0 && (
          <div id="resultsSection" className={totalCost > 0 ? "visible" : ""}>
            <div className="card" ref={resultsRef}>
              <div className="total-summary" style={{ marginTop: "2rem" }}>
                <p>Total Estimated Electrical Cost</p>
                <span>
                  {totalCost.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="results-grid">
                <div className="result-details">
                  <h3>Cost Breakdown</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Allocation</th>
                        <th className="text-right">Cost (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(electricalBreakdown).map(
                        ([component, percentage]) => {
                          const cost = (totalCost * percentage) / 100;
                          return (
                            <tr key={component}>
                              <td>{component}</td>
                              <td>{percentage}%</td>
                              <td className="text-right">
                                {cost.toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="chart-container">
                  <Chart data={electricalBreakdown} colors={chartColors} />
                </div>
              </div>
              {/* --- UPDATE: PDF BUTTON IS NOW CONDITIONAL --- */}
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
              {/* --- END OF UPDATE --- */}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ElectricalCalculator;
