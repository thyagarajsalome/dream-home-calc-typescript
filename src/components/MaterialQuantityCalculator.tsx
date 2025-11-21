// src/components/MaterialQuantityCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useUser } from "../context/UserContext";

// --- Constants & Thumb Rules ---

const wallMaterialTypes = {
  redBrick: {
    name: "Red Bricks (Standard)",
    cementFactor: 1.0,
    sandFactor: 1.0,
    unit: "Nos",
    countPerSqFt: 12,
  },
  flyAsh: {
    name: "Fly Ash Bricks",
    cementFactor: 0.9,
    sandFactor: 0.9,
    unit: "Nos",
    countPerSqFt: 11,
  },
  aac: {
    name: "AAC Blocks (Lightweight)",
    cementFactor: 0.5,
    sandFactor: 0.4,
    unit: "Nos",
    countPerSqFt: 8,
  }, // Uses significantly less mortar
};

const concreteGrades = {
  M20: { name: "M20 (1:1.5:3) - Standard", cementMultiplier: 1.0 },
  M25: { name: "M25 (1:1:2) - Stronger", cementMultiplier: 1.15 }, // Uses more cement
};

const qualityThumbRules = {
  basic: { cement: 0.4, steel: 3.5 },
  standard: { cement: 0.45, steel: 4.0 },
  premium: { cement: 0.5, steel: 4.5 },
};

interface CalculationResult {
  cement: number; // Bags
  sand: number; // CFT
  aggregate: number; // CFT
  steel: number; // kg
  wallMaterialName: string;
  wallMaterialCount: number; // Bricks/Blocks
  paint: number; // Liters (Approx)
  tiles: number; // Boxes (Approx)
}

const MaterialQuantityCalculator: React.FC = () => {
  const { hasPaid } = useUser(); // Use Context
  const [area, setArea] = useState("");

  // New Inputs
  const [wallType, setWallType] =
    useState<keyof typeof wallMaterialTypes>("redBrick");
  const [grade, setGrade] = useState<keyof typeof concreteGrades>("M20");
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "standard"
  );

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

    const qRule = qualityThumbRules[quality];
    const wRule = wallMaterialTypes[wallType];
    const cRule = concreteGrades[grade];

    // 1. Cement Calculation
    // Base cement * Grade Multiplier * Wall Type reduction (for mortar savings)
    const cement =
      parsedArea *
      qRule.cement *
      cRule.cementMultiplier *
      ((wRule.cementFactor + 1) / 2);

    // 2. Sand & Aggregate
    const sand = parsedArea * 1.8 * wRule.sandFactor; // Wall type affects sand usage in masonry
    const aggregate = parsedArea * 1.35;

    // 3. Steel
    const steel = parsedArea * qRule.steel;

    // 4. Wall Material (Bricks/Blocks)
    const wallCount = parsedArea * wRule.countPerSqFt;

    // 5. Paint (Interior + Exterior approx)
    const paintLiters = parsedArea * 0.18;

    // 6. Tiles (Flooring Area ~ 70% of Built-up, 1 Box ~ 15 sq.ft)
    const tileBoxes = (parsedArea * 0.7) / 15;

    setResults({
      cement,
      sand,
      aggregate,
      steel,
      wallMaterialName: wRule.name,
      wallMaterialCount: wallCount,
      paint: paintLiters,
      tiles: tileBoxes,
    });
  };

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-IN");
  const isLocked = !hasPaid;

  return (
    <section id="material-quantity-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Material BOQ Calculator</h2>
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
              placeholder="e.g., 1500"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
              disabled={isLocked}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                <i className="fas fa-cubes"></i> Wall Material
              </label>
              <select
                value={wallType}
                onChange={(e) => setWallType(e.target.value as any)}
                disabled={isLocked}
              >
                {Object.entries(wallMaterialTypes).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-flask"></i> Concrete Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as any)}
                disabled={isLocked}
              >
                {Object.entries(concreteGrades).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>
              <i className="fas fa-gem"></i> Finish Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              disabled={isLocked}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate Quantities
          </button>
        </form>

        {results && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              <div
                className="total-summary"
                style={{ marginTop: "2rem", background: "var(--accent-color)" }}
              >
                <p>Primary Materials Required</p>
                <span>{formatNumber(results.cement)} Bags Cement</span>
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
                      <td>Cement ({grade})</td>
                      <td>{formatNumber(results.cement)}</td>
                      <td className="text-right">Bags (50kg)</td>
                    </tr>
                    <tr>
                      <td>Steel (Rebar)</td>
                      <td>{formatNumber(results.steel)}</td>
                      <td className="text-right">kg</td>
                    </tr>
                    <tr>
                      <td>River Sand / M-Sand</td>
                      <td>{formatNumber(results.sand)}</td>
                      <td className="text-right">Cubic Feet (CFT)</td>
                    </tr>
                    <tr>
                      <td>Aggregate (Jelly)</td>
                      <td>{formatNumber(results.aggregate)}</td>
                      <td className="text-right">Cubic Feet (CFT)</td>
                    </tr>
                    <tr>
                      <td>{results.wallMaterialName}</td>
                      <td>{formatNumber(results.wallMaterialCount)}</td>
                      <td className="text-right">Nos</td>
                    </tr>
                    <tr style={{ background: "#f9f9f9" }}>
                      <td>
                        <strong>Finish Materials</strong>
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Paint (Int + Ext)</td>
                      <td>{formatNumber(results.paint)}</td>
                      <td className="text-right">Liters</td>
                    </tr>
                    <tr>
                      <td>Flooring Tiles</td>
                      <td>{formatNumber(results.tiles)}</td>
                      <td className="text-right">Boxes</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="disclaimer-box" style={{ marginTop: "2rem" }}>
                <strong>Note:</strong> AAC Blocks reduce structural dead load
                and save approx 15-20% on cement mortar compared to Red Bricks.
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
