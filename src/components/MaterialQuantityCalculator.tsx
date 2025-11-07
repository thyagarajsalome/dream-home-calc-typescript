// src/components/MaterialQuantityCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- ADD 'hasPaid' to the component's props ---
interface MaterialQuantityCalculatorProps {
  hasPaid: boolean;
}

// Industry thumb rules (Indian context, approximate quantity per sq. ft. of built-up area)
const materialRatios = {
  basic: {
    name: "Basic Quality",
    cement: 0.45, // Bags (50kg) / sq. ft.
    sand: 1.4, // Cubic Feet (CFT) / sq. ft.
    aggregate: 0.9, // Cubic Feet (CFT) / sq. ft.
    steel: 3.5, // kg / sq. ft.
    bricks: 10, // Number / sq. ft. (using fly-ash blocks/small bricks equivalent)
  },
  standard: {
    name: "Standard Quality",
    cement: 0.5,
    sand: 1.6,
    aggregate: 1.0,
    steel: 4.0,
    bricks: 12,
  },
  premium: {
    name: "Premium Quality",
    cement: 0.55,
    sand: 1.8,
    aggregate: 1.1,
    steel: 4.5,
    bricks: 14,
  },
};

type QualityType = keyof typeof materialRatios;

interface CalculationResult {
  cement: number; // Bags
  sand: number; // CFT
  aggregate: number; // CFT
  steel: number; // kg
  bricks: number; // Nos
}

const MaterialQuantityCalculator: React.FC<MaterialQuantityCalculatorProps> = ({
  hasPaid,
}) => {
  const [area, setArea] = useState("");
  const [quality, setQuality] = useState<QualityType>("standard");
  const [results, setResults] = useState<CalculationResult | null>(null);
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
          pdf.save("material-quantity-report.pdf");
          setIsDownloading(false);
        }
      );
    }
  };

  const calculateQuantities = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    if (parsedArea === 0) {
      setResults(null);
      return;
    }

    const ratios = materialRatios[quality];

    const calculatedResults: CalculationResult = {
      cement: parsedArea * ratios.cement,
      sand: parsedArea * ratios.sand,
      aggregate: parsedArea * ratios.aggregate,
      steel: parsedArea * ratios.steel,
      bricks: parsedArea * ratios.bricks,
    };

    setResults(calculatedResults);
  };

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-IN");
  const isLocked = !hasPaid;

  return (
    <section id="material-quantity-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Material Quantity Calculator</h2>
        {isLocked && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> This is a Pro Feature. Upgrade to
              calculate raw material quantities.
            </p>
          </div>
        )}
        <form onSubmit={calculateQuantities}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Total Built-up Area (sq.
              ft.)
            </label>
            <input
              type="number"
              id="area"
              name="area"
              placeholder="e.g., 1500"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
              disabled={isLocked}
            />
          </div>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-gem"></i> Construction Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityType)}
              disabled={isLocked}
            >
              {Object.entries(materialRatios).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate Quantities
          </button>
        </form>

        {results && (
          <div id="resultsSection" className={results ? "visible" : ""}>
            <div className="card" ref={resultsRef}>
              <div
                className="total-summary"
                style={{ marginTop: "2rem", background: "var(--accent-color)" }}
              >
                <p>Estimated Raw Material Quantity</p>
                <span>
                  {formatNumber(results.cement) +
                    " Bags & " +
                    formatNumber(results.steel) +
                    " Kg Steel"}
                </span>
              </div>
              <div className="result-details">
                <h3 style={{ textAlign: "center", marginTop: "2rem" }}>
                  Detailed Material List
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Quantity (Approx)</th>
                      <th className="text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cement</td>
                      <td>{formatNumber(results.cement)}</td>
                      <td className="text-right">Bags (50kg)</td>
                    </tr>
                    <tr>
                      <td>Steel (Rebar)</td>
                      <td>{formatNumber(results.steel)}</td>
                      <td className="text-right">kg</td>
                    </tr>
                    <tr>
                      <td>Sand</td>
                      <td>{formatNumber(results.sand)}</td>
                      <td className="text-right">Cubic Feet (CFT)</td>
                    </tr>
                    <tr>
                      <td>Aggregate (Gravel)</td>
                      <td>{formatNumber(results.aggregate)}</td>
                      <td className="text-right">Cubic Feet (CFT)</td>
                    </tr>
                    <tr>
                      <td>Bricks / Blocks</td>
                      <td>{formatNumber(results.bricks)}</td>
                      <td className="text-right">Number</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="disclaimer-box" style={{ marginTop: "2rem" }}>
                <strong>Disclaimer:</strong> These are approximate quantities
                based on industry thumb rules for a standard residential
                structure (G+1) in India. Actual requirements will vary based on
                structural design, wall thickness, and wastage. Always consult
                your structural engineer for precise BOQ (Bill of Quantities).
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

export default MaterialQuantityCalculator;
