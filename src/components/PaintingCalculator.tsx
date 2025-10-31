import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "./Chart";

// --- ADD 'hasPaid' to the component's props ---
interface PaintingCalculatorProps {
  hasPaid: boolean;
}

const paintTypes = {
  distemper: { name: "Distemper", rate: 20 },
  emulsion: { name: "Emulsion", rate: 35 },
  enamel: { name: "Enamel", rate: 50 },
  polyurethane: { name: "Polyurethane", rate: 70 },
};

const paintingBreakdown = {
  "Paint Material": 40,
  "Primer & Putty": 15,
  Labor: 35,
  "Tools & Supplies": 10,
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

// --- Accept 'hasPaid' prop ---
const PaintingCalculator: React.FC<PaintingCalculatorProps> = ({ hasPaid }) => {
  const [wallArea, setWallArea] = useState("");
  const [paintType, setPaintType] =
    useState<keyof typeof paintTypes>("distemper");
  const [coats, setCoats] = useState("2");
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
          pdf.save("painting-cost-estimate.pdf");
          setIsDownloading(false);
        }
      );
    }
  };
  // --- END OF ADDITIONS ---

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedWallArea = parseFloat(wallArea) || 0;
    const parsedCoats = parseInt(coats) || 0;
    const cost = parsedWallArea * paintTypes[paintType].rate * parsedCoats;
    setTotalCost(cost);
  };

  return (
    <section id="painting-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Painting Cost Calculator</h2>
        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="wallArea">
              <i className="fas fa-ruler-combined"></i> Wall Area (sq. ft.)
            </label>
            <input
              type="number"
              id="wallArea"
              name="wallArea"
              placeholder="e.g., 800"
              value={wallArea}
              onChange={(e) => setWallArea(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="coats">
              <i className="fas fa-brush"></i> Number of Coats
            </label>
            <input
              type="number"
              id="coats"
              name="coats"
              placeholder="e.g., 2"
              value={coats}
              onChange={(e) => setCoats(e.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-paint-roller"></i> Paint Type
            </label>
            <select
              value={paintType}
              onChange={(e) =>
                setPaintType(e.target.value as keyof typeof paintTypes)
              }
            >
              {Object.entries(paintTypes).map(([key, { name }]) => (
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
                <p>Total Estimated Painting Cost</p>
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
                      {Object.entries(paintingBreakdown).map(
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
                  <Chart data={paintingBreakdown} colors={chartColors} />
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

export default PaintingCalculator;
