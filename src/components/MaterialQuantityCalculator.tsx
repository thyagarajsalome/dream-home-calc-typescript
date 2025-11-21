// src/components/MaterialQuantityCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";

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
  },
};

const concreteGrades = {
  M20: { name: "M20 (Standard)", cementMultiplier: 1.0 },
  M25: { name: "M25 (Stronger)", cementMultiplier: 1.15 },
};

const qualityThumbRules = {
  basic: { cement: 0.4, steel: 3.5 },
  standard: { cement: 0.45, steel: 4.0 },
  premium: { cement: 0.5, steel: 4.5 },
};

// Default Market Prices (India)
const defaultPrices = {
  cement: 400, // Per Bag
  steel: 65, // Per Kg
  sand: 60, // Per CFT
  aggregate: 40, // Per CFT
  paint: 350, // Per Liter
  tiles: 600, // Per Box
  bricks: 10, // Per Piece (Red Brick avg)
};

interface CalculationResult {
  cement: number;
  sand: number;
  aggregate: number;
  steel: number;
  wallMaterialName: string;
  wallMaterialCount: number;
  paint: number;
  tiles: number;
  costCement: number;
  costSteel: number;
  costSand: number;
  costAggregate: number;
  costWall: number;
  costPaint: number;
  costTiles: number;
  totalMaterialCost: number;
}

const MaterialQuantityCalculator: React.FC = () => {
  const { hasPaid, user } = useUser();
  const navigate = useNavigate();
  const [area, setArea] = useState("");

  const [wallType, setWallType] =
    useState<keyof typeof wallMaterialTypes>("redBrick");
  const [grade, setGrade] = useState<keyof typeof concreteGrades>("M20");
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "standard"
  );

  const [prices, setPrices] = useState(defaultPrices);
  const [showPrices, setShowPrices] = useState(false);

  const [results, setResults] = useState<CalculationResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePriceChange = (
    key: keyof typeof defaultPrices,
    value: string
  ) => {
    setPrices((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

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
          pdf.save("material-boq-report.pdf");
          setIsDownloading(false);
        }
      );
    }
  };

  // --- Save Functionality ---
  const handleSave = async () => {
    if (!user) {
      alert("Please Sign In to save your project.");
      navigate("/signin");
      return;
    }
    if (!results) return;

    const projectName = prompt(
      "Enter a name for this project (e.g., 'Material Estimate 1'):"
    );
    if (!projectName) return;

    setIsSaving(true);

    try {
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name: projectName,
        type: "materials",
        data: {
          area,
          wallType,
          grade,
          quality,
          prices, // Save custom prices too
          results,
          totalCost: results.totalMaterialCost, // For dashboard summary
          date: new Date().toISOString(),
        },
      });

      if (error) throw error;
      alert("Project saved successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error saving project:", err);
      alert("Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };
  // --------------------------

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

    // Quantities
    const cement =
      parsedArea *
      qRule.cement *
      cRule.cementMultiplier *
      ((wRule.cementFactor + 1) / 2);
    const sand = parsedArea * 1.8 * wRule.sandFactor;
    const aggregate = parsedArea * 1.35;
    const steel = parsedArea * qRule.steel;
    const wallCount = parsedArea * wRule.countPerSqFt;
    const paintLiters = parsedArea * 0.18;
    const tileBoxes = (parsedArea * 0.7) / 15;

    // Costs
    const costCement = cement * prices.cement;
    const costSteel = steel * prices.steel;
    const costSand = sand * prices.sand;
    const costAggregate = aggregate * prices.aggregate;

    let brickPrice = prices.bricks;
    if (wallType === "aac") brickPrice = prices.bricks * 5;
    if (wallType === "flyAsh") brickPrice = prices.bricks * 0.8;

    const costWall = wallCount * brickPrice;
    const costPaint = paintLiters * prices.paint;
    const costTiles = tileBoxes * prices.tiles;

    const totalMaterialCost =
      costCement +
      costSteel +
      costSand +
      costAggregate +
      costWall +
      costPaint +
      costTiles;

    setResults({
      cement,
      sand,
      aggregate,
      steel,
      wallMaterialName: wRule.name,
      wallMaterialCount: wallCount,
      paint: paintLiters,
      tiles: tileBoxes,
      costCement,
      costSteel,
      costSand,
      costAggregate,
      costWall,
      costPaint,
      costTiles,
      totalMaterialCost,
    });
  };

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-IN");
  const formatCurrency = (num: number) =>
    "₹" + Math.round(num).toLocaleString("en-IN");

  const isLocked = !hasPaid;

  return (
    <section id="material-quantity-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Material Cost Estimator (BOQ)</h2>

        {isLocked && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> This is a Pro Feature. Upgrade to
              unlock.
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

          {/* Price Editor Toggle */}
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
                disabled={isLocked}
                style={{ width: "auto", marginRight: "10px" }}
              />
              <label
                style={{
                  display: "inline",
                  fontWeight: "600",
                  color: "var(--primary-color)",
                }}
              >
                Edit Material Market Prices (Optional)
              </label>
            </div>
          </div>

          {showPrices && (
            <div
              className="form-grid"
              style={{
                background: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
            >
              <div className="form-group">
                <label>Cement Price / Bag</label>
                <input
                  type="number"
                  value={prices.cement}
                  onChange={(e) => handlePriceChange("cement", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Steel Price / Kg</label>
                <input
                  type="number"
                  value={prices.steel}
                  onChange={(e) => handlePriceChange("steel", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Sand Price / CFT</label>
                <input
                  type="number"
                  value={prices.sand}
                  onChange={(e) => handlePriceChange("sand", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Paint Price / Liter</label>
                <input
                  type="number"
                  value={prices.paint}
                  onChange={(e) => handlePriceChange("paint", e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate BOQ & Cost
          </button>
        </form>

        {results && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              <div
                className="total-summary"
                style={{ marginTop: "2rem", background: "var(--accent-color)" }}
              >
                <p>Est. Material Cost</p>
                <span>{formatCurrency(results.totalMaterialCost)}</span>
              </div>

              <div className="result-details">
                <h3 style={{ textAlign: "center", marginTop: "2rem" }}>
                  Detailed Bill of Quantities (BOQ)
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th className="text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cement ({grade})</td>
                      <td>{formatNumber(results.cement)} Bags</td>
                      <td className="text-right">
                        {formatCurrency(results.costCement)}
                      </td>
                    </tr>
                    <tr>
                      <td>Steel (Rebar)</td>
                      <td>{formatNumber(results.steel)} kg</td>
                      <td className="text-right">
                        {formatCurrency(results.costSteel)}
                      </td>
                    </tr>
                    <tr>
                      <td>Sand</td>
                      <td>{formatNumber(results.sand)} CFT</td>
                      <td className="text-right">
                        {formatCurrency(results.costSand)}
                      </td>
                    </tr>
                    <tr>
                      <td>Aggregate</td>
                      <td>{formatNumber(results.aggregate)} CFT</td>
                      <td className="text-right">
                        {formatCurrency(results.costAggregate)}
                      </td>
                    </tr>
                    <tr>
                      <td>{results.wallMaterialName}</td>
                      <td>{formatNumber(results.wallMaterialCount)} Nos</td>
                      <td className="text-right">
                        {formatCurrency(results.costWall)}
                      </td>
                    </tr>
                    <tr>
                      <td>Paint</td>
                      <td>{formatNumber(results.paint)} Liters</td>
                      <td className="text-right">
                        {formatCurrency(results.costPaint)}
                      </td>
                    </tr>
                    <tr>
                      <td>Tiles</td>
                      <td>{formatNumber(results.tiles)} Boxes</td>
                      <td className="text-right">
                        {formatCurrency(results.costTiles)}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                  <button
                    className="btn"
                    style={{
                      backgroundColor: "var(--secondary-color)",
                      marginLeft: "10px",
                    }}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <i className="fas fa-save"></i>{" "}
                    {isSaving ? "Saving..." : "Save"}
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
