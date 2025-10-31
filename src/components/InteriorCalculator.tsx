// src/components/InteriorCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "./Chart";

// --- ADD 'hasPaid' to the component's props ---
interface InteriorCalculatorProps {
  hasPaid: boolean;
}

const qualityRates = {
  basic: {
    name: "Basic",
    rate: 800,
    description: "Essential furniture, basic finishes, and standard lighting.",
  },
  standard: {
    name: "Standard",
    rate: 1500,
    description:
      "Good quality materials, modular kitchen, wardrobes, and improved finishes.",
  },
  premium: {
    name: "Premium",
    rate: 2500,
    description:
      "High-end materials, custom furniture, advanced lighting, and luxury finishes.",
  },
};

const interiorBreakdown = {
  "Modular Kitchen": 30,
  Wardrobes: 25,
  Furniture: 20,
  "False Ceiling & Lighting": 15,
  "Painting & Finishes": 10,
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594", "#A99A86"];

// --- Accept 'hasPaid' prop ---
const InteriorCalculator: React.FC<InteriorCalculatorProps> = ({ hasPaid }) => {
  const [area, setArea] = useState("1200");
  const [quality, setQuality] = useState<keyof typeof qualityRates>("standard");
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
          pdf.save("interior-cost-estimate.pdf");
          setIsDownloading(false);
        }
      );
    }
  };
  // --- END OF ADDITIONS ---

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    const cost = parsedArea * qualityRates[quality].rate;
    setTotalCost(cost);
  };

  return (
    <section id="interior-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Interior Design Budget Calculator</h2>
        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Total Built-up Area (sq.
              ft.)
            </label>
            <input
              type="number"
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-gem"></i> Quality of Finish
            </label>
            <div className="quality-selector">
              {Object.entries(qualityRates).map(([key, { name }]) => (
                <React.Fragment key={key}>
                  <input
                    type="radio"
                    id={`interior-${key}`}
                    name="quality"
                    value={key}
                    checked={quality === key}
                    onChange={() =>
                      setQuality(key as keyof typeof qualityRates)
                    }
                  />
                  <label htmlFor={`interior-${key}`}>{name}</label>
                </React.Fragment>
              ))}
            </div>
            <div className="quality-description">
              <p>
                <strong>{qualityRates[quality].name}:</strong>{" "}
                {qualityRates[quality].description}
              </p>
            </div>
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Budget
          </button>
        </form>

        {totalCost > 0 && (
          // --- ATTACH REF HERE ---
          <div id="resultsSection" className="visible" ref={resultsRef}>
            <div className="total-summary">
              <p>Total Estimated Interior Budget</p>
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
                <h3>Budget Breakdown</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Allocation</th>
                      <th className="text-right">Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(interiorBreakdown).map(
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
                <Chart data={interiorBreakdown} colors={chartColors} />
              </div>
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

export default InteriorCalculator;
