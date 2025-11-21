// src/components/ElectricalCalculator.tsx

import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Chart from "./Chart";
import { useUser } from "../context/UserContext";

// Point Rates (Wiring + Switch + Labor) - NO FANCY FITTINGS INCLUDED
const pointRates = {
  light: 650, // Per point
  fan: 750, // Per point
  power: 1200, // Per point (AC/Geyser/Fridge - 15A/20A)
  mcb: 25000, // Lump sum for Distribution Board + MCBs/ELCB
};

const qualityMultipliers = {
  basic: { name: "Basic (Anchor/Roma)", factor: 1.0 },
  premium: { name: "Premium (Legrand/Schneider)", factor: 1.5 },
  smart: { name: "Smart Home Ready (WiFi Switches)", factor: 3.5 },
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const ElectricalCalculator: React.FC = () => {
  const { hasPaid, user } = useUser(); // Use Context
  const navigate = useNavigate();
  const location = useLocation();

  // Inputs
  const [lightPoints, setLightPoints] = useState("20");
  const [fanPoints, setFanPoints] = useState("5");
  const [powerPoints, setPowerPoints] = useState("4");
  const [quality, setQuality] =
    useState<keyof typeof qualityMultipliers>("basic");

  // Results
  const [totalCost, setTotalCost] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);

  // PDF & Save Logic
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Load Data on Edit ---
  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.lightPoints && data.fanPoints) {
        setLightPoints(data.lightPoints);
        setFanPoints(data.fanPoints);
        setPowerPoints(data.powerPoints);
        setQuality(data.quality);
      }
    }
  }, [location]);
  // ------------------------

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

  const handleSave = async () => {
    if (!user) {
      alert("Please Sign In to save.");
      navigate("/signin");
      return;
    }
    if (totalCost === 0) return;
    const name = prompt("Project Name:");
    if (!name) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name,
        type: "electrical",
        data: {
          lightPoints,
          fanPoints,
          powerPoints,
          quality,
          totalCost,
          breakdown,
          date: new Date().toISOString(),
        },
      });
      if (error) throw error;
      alert("Project saved successfully!");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Error saving project.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const lCount = parseInt(lightPoints) || 0;
    const fCount = parseInt(fanPoints) || 0;
    const pCount = parseInt(powerPoints) || 0;
    const factor = qualityMultipliers[quality].factor;

    // Material + Wiring + Labor cost per point
    const lightCost = lCount * pointRates.light * factor;
    const fanCost = fCount * pointRates.fan * factor;
    const powerCost = pCount * pointRates.power * factor;

    // Main Board is mostly standard but varies slightly with premium brands
    const boardCost = pointRates.mcb * (factor > 1.5 ? 1.5 : factor);

    const total = lightCost + fanCost + powerCost + boardCost;

    setBreakdown({
      light: lightCost,
      fan: fanCost,
      power: powerCost,
      board: boardCost,
      counts: { lCount, fCount, pCount },
    });
    setTotalCost(total);
  };

  const isLocked = !hasPaid;

  return (
    <section id="electrical-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Electrical Point Estimator</h2>

        {isLocked && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> Upgrade to Pro for Points-based
              calculation.
            </p>
          </div>
        )}

        <form onSubmit={calculateCost}>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <i className="far fa-lightbulb"></i> Light/Plug Points (6A)
              </label>
              <input
                type="number"
                value={lightPoints}
                onChange={(e) => setLightPoints(e.target.value)}
                min="0"
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-fan"></i> Fan Points
              </label>
              <input
                type="number"
                value={fanPoints}
                onChange={(e) => setFanPoints(e.target.value)}
                min="0"
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-plug"></i> Power Points (15A - AC/Geyser)
              </label>
              <input
                type="number"
                value={powerPoints}
                onChange={(e) => setPowerPoints(e.target.value)}
                min="0"
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-toggle-on"></i> Switch/Wire Quality
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                disabled={isLocked}
              >
                {Object.entries(qualityMultipliers).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate Estimate
          </button>
        </form>

        {totalCost > 0 && breakdown && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              <div className="total-summary" style={{ marginTop: "2rem" }}>
                <p>Total Electrical Estimate</p>
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
                        <th>Count</th>
                        <th className="text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Lights & Plugs (6A)</td>
                        <td>{breakdown.counts.lCount} pts</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.light).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td>Fan Points</td>
                        <td>{breakdown.counts.fCount} pts</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.fan).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td>Power Sockets (AC/Geyser)</td>
                        <td>{breakdown.counts.pCount} pts</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.power).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td>Dist. Board & MCBs</td>
                        <td>Lump sum</td>
                        <td className="text-right">
                          ₹{Math.round(breakdown.board).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div
                    className="disclaimer-box"
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    *Includes Wiring, Switches, Plates, Metal Boxes, and Labor.
                    Does not include fancy light fixtures or fans themselves.
                  </div>
                </div>
                <div className="chart-container">
                  <Chart
                    data={{
                      "Wiring Material": totalCost * 0.4,
                      "Switches & Plates": totalCost * 0.3,
                      Labor: totalCost * 0.2,
                      "MCB/DB": totalCost * 0.1,
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

export default ElectricalCalculator;
