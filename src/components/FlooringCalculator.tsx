// src/components/FlooringCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Chart from "./Chart";
import { useUser } from "../context/UserContext";

const flooringTypes = {
  vitrified: { name: "Vitrified Tiles (Standard)", rate: 120, wastage: 0.1 },
  gvt: { name: "GVT / PGVT (High Gloss)", rate: 180, wastage: 0.1 },
  marble: { name: "Indian Marble", rate: 250, wastage: 0.15 },
  granite: { name: "Granite", rate: 350, wastage: 0.1 },
  wood: { name: "Wooden Laminate", rate: 150, wastage: 0.05 },
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const FlooringCalculator: React.FC = () => {
  const { hasPaid, user } = useUser();
  const navigate = useNavigate();

  // Inputs
  const [area, setArea] = useState("");
  const [flooringType, setFlooringType] =
    useState<keyof typeof flooringTypes>("vitrified");
  const [includeSkirting, setIncludeSkirting] = useState(true);

  // Results
  const [totalCost, setTotalCost] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);

  // PDF Logic
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!user) {
      alert("Please Sign In to save.");
      navigate("/signin");
      return;
    }
    if (!breakdown) return;
    const name = prompt("Project Name:");
    if (!name) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name,
        type: "flooring",
        data: {
          area,
          flooringType,
          includeSkirting,
          totalCost,
          breakdown,
          date: new Date().toISOString(),
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

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    if (parsedArea === 0) return;

    const selectedType = flooringTypes[flooringType];

    // 1. Material Cost (including wastage)
    const materialArea = parsedArea * (1 + selectedType.wastage);
    const materialCost = materialArea * selectedType.rate;

    // 2. Labor Cost
    const laborRate =
      flooringType === "marble" || flooringType === "granite" ? 60 : 35;
    const laborCost = parsedArea * laborRate;

    // 3. Skirting Cost
    let skirtingCost = 0;
    let skirtingLen = 0;

    if (includeSkirting) {
      skirtingLen = Math.sqrt(parsedArea) * 4;
      skirtingCost = skirtingLen * (selectedType.rate * 0.8 + 20);
    }

    // 4. Supplies
    const suppliesCost = parsedArea * 25;

    const total = materialCost + laborCost + skirtingCost + suppliesCost;

    setBreakdown({
      material: materialCost,
      labor: laborCost,
      skirting: skirtingCost,
      supplies: suppliesCost,
      skirtingLen: Math.round(skirtingLen),
      wastageArea: Math.round(materialArea - parsedArea),
    });
    setTotalCost(total);
  };

  const isLocked = !hasPaid;

  return (
    <section id="flooring-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Flooring Cost Calculator</h2>

        {isLocked && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> Upgrade to Pro for detailed
              Flooring estimates.
            </p>
          </div>
        )}

        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Carpet Area (sq. ft.)
            </label>
            <input
              type="number"
              id="area"
              placeholder="e.g., 800"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
              disabled={isLocked}
            />
          </div>

          <div className="form-group full-width">
            <label>
              <i className="fas fa-layer-group"></i> Material Type
            </label>
            <select
              value={flooringType}
              onChange={(e) => setFlooringType(e.target.value as any)}
              disabled={isLocked}
            >
              {Object.entries(flooringTypes).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={includeSkirting}
                onChange={(e) => setIncludeSkirting(e.target.checked)}
                disabled={isLocked}
                style={{ width: "auto", marginRight: "10px" }}
              />
              <label style={{ display: "inline" }}>
                Include Skirting (4" Wall Borders)
              </label>
            </div>
          </div>

          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate Cost
          </button>
        </form>

        {totalCost > 0 && breakdown && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              <div className="total-summary" style={{ marginTop: "2rem" }}>
                <p>Total Flooring Estimate</p>
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
                        <th>Details</th>
                        <th className="text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Material</td>
                        <td>Incl. {breakdown.wastageArea} sq.ft wastage</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.material).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td>Labor</td>
                        <td>Installation</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.labor).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td>Supplies</td>
                        <td>Cement, Sand, Grout</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.supplies).toLocaleString()}
                        </td>
                      </tr>
                      {breakdown.skirting > 0 && (
                        <tr>
                          <td>Skirting</td>
                          <td>Approx {breakdown.skirtingLen} R.ft</td>
                          <td className="text-right">
                            ₹{Math.round(breakdown.skirting).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="chart-container">
                  <Chart
                    data={{
                      Material: breakdown.material,
                      Labor: breakdown.labor,
                      Supplies: breakdown.supplies,
                      Skirting: breakdown.skirting,
                    }}
                    colors={chartColors}
                  />
                </div>
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

export default FlooringCalculator;
