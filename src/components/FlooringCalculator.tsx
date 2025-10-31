import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "./Chart";

// --- ADD 'hasPaid' to the component's props ---
interface FlooringCalculatorProps {
  hasPaid: boolean;
}

const flooringTypes = {
  vitrified: { name: "Vitrified Tiles", rate: 150 },
  marble: { name: "Marble", rate: 250 },
  granite: { name: "Granite", rate: 450 },
  wood: { name: "Wooden Flooring", rate: 600 },
};

const flooringBreakdown = {
  Material: 60,
  Labor: 30,
  "Subfloor Preparation": 5,
  "Wastage and Other": 5,
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

// --- Accept 'hasPaid' prop ---
const FlooringCalculator: React.FC<FlooringCalculatorProps> = ({ hasPaid }) => {
  const [area, setArea] = useState("");
  const [flooringType, setFlooringType] =
    useState<keyof typeof flooringTypes>("vitrified");
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
          pdf.save("flooring-cost-estimate.pdf");
          setIsDownloading(false);
        }
      );
    }
  };
  // --- END OF ADDITIONS ---

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    const cost = parsedArea * flooringTypes[flooringType].rate;
    setTotalCost(cost);
  };

  return (
    <section id="flooring-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Flooring Cost Calculator</h2>
        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Area (sq. ft.)
            </label>
            <input
              type="number"
              id="area"
              name="area"
              placeholder="e.g., 1200"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-layer-group"></i> Flooring Type
            </label>
            <select
              value={flooringType}
              onChange={(e) =>
                setFlooringType(e.target.value as keyof typeof flooringTypes)
              }
            >
              {Object.entries(flooringTypes).map(([key, { name }]) => (
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
            {/* ATTACH THE REF HERE */}
            <div className="card" ref={resultsRef}>
              <div className="total-summary" style={{ marginTop: "2rem" }}>
                <p>Total Estimated Flooring Cost</p>
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
                      {Object.entries(flooringBreakdown).map(
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
                  <Chart data={flooringBreakdown} colors={chartColors} />
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

export default FlooringCalculator;
