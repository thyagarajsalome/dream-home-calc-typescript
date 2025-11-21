// src/components/MaterialQuantityCalculator.tsx
// (Previous implementation + Edit Logic + Save to Dashboard)

import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";

const wallMaterialTypes = {
  redBrick: {
    name: "Red Bricks",
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
    name: "AAC Blocks",
    cementFactor: 0.5,
    sandFactor: 0.4,
    unit: "Nos",
    countPerSqFt: 8,
  },
};
const concreteGrades = {
  M20: { name: "M20", cementMultiplier: 1.0 },
  M25: { name: "M25", cementMultiplier: 1.15 },
};
const qualityThumbRules = {
  basic: { cement: 0.4, steel: 3.5 },
  standard: { cement: 0.45, steel: 4.0 },
  premium: { cement: 0.5, steel: 4.5 },
};
const defaultPrices = {
  cement: 400,
  steel: 65,
  sand: 60,
  aggregate: 40,
  paint: 350,
  tiles: 600,
  bricks: 10,
};

const MaterialQuantityCalculator: React.FC = () => {
  const { hasPaid, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [area, setArea] = useState("");
  const [wallType, setWallType] =
    useState<keyof typeof wallMaterialTypes>("redBrick");
  const [grade, setGrade] = useState<keyof typeof concreteGrades>("M20");
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "standard"
  );
  const [prices, setPrices] = useState(defaultPrices);
  const [showPrices, setShowPrices] = useState(false);
  const [results, setResults] = useState<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.wallType && data.grade) {
        setArea(data.area);
        setWallType(data.wallType);
        setGrade(data.grade);
        setQuality(data.quality);
        if (data.prices) {
          setPrices(data.prices);
          setShowPrices(true);
        }
      }
    }
  }, [location]);

  const handleSave = async () => {
    if (!user || !results) return;
    const name = prompt("Project Name:");
    if (!name) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name,
        type: "materials",
        data: {
          ...results,
          area,
          wallType,
          grade,
          quality,
          prices,
          totalCost: results.totalMaterialCost,
        },
      });
      if (error) throw error;
      alert("Saved!");
      navigate("/dashboard");
    } catch (e) {
      alert("Error saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // ... calculateQuantities function (same as before) ...
  // ... formatNumber functions ...

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
  const downloadPDF = () => {
    /* ... */
  };

  return (
    <section id="material-quantity-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Material Cost Estimator (BOQ)</h2>
        {!hasPaid && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> This is a Pro Feature.
            </p>
          </div>
        )}
        <form onSubmit={calculateQuantities}>
          {/* Form Inputs ... */}
          <div className="form-group">
            <label>Area</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              disabled={!hasPaid}
            />
          </div>
          {/* ... Other inputs ... */}
          <button type="submit" className="btn full-width" disabled={!hasPaid}>
            <i className="fas fa-calculator"></i> Calculate
          </button>
        </form>
        {results && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              {/* Results Display */}
              <div className="total-summary">
                <p>Est. Cost</p>
                <span>{formatCurrency(results.totalMaterialCost)}</span>
              </div>
              {/* Details ... */}
              {hasPaid && (
                <div className="action-buttons">
                  <button className="btn" onClick={downloadPDF}>
                    <i className="fas fa-download"></i> Download PDF
                  </button>
                  <button
                    className="btn"
                    style={{
                      backgroundColor: "var(--accent-color)",
                      marginLeft: "10px",
                    }}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <i className="fas fa-save"></i>{" "}
                    {isSaving ? "Saving..." : "Save to Dashboard"}
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
