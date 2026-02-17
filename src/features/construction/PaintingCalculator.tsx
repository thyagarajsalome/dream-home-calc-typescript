// src/components/PaintingCalculator.tsx
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate, useLocation } from "react-router-dom";
// FIX: Import Supabase instead of Firebase
import { supabase } from "../supabaseClient";
import Chart from "./Chart";
import { useUser } from "../context/UserContext";

const paintTypes = {
  distemper: { name: "Distemper (Economy)", rate: 22 },
  emulsion: { name: "Tractor Emulsion (Std)", rate: 38 },
  royal: { name: "Royal/Premium Emulsion", rate: 55 },
  texture: { name: "Texture Paint (Highlight)", rate: 120 },
};

const processTypes = {
  repaint: { name: "Repainting (Touchup + 2 Coats)", factor: 1.0 },
  fresh: { name: "Fresh Painting (Putty + Primer + 2 Coats)", factor: 1.6 },
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const PaintingCalculator: React.FC = () => {
  const { hasPaid, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [carpetArea, setCarpetArea] = useState("");
  const [wallArea, setWallArea] = useState("");
  const [includeCeiling, setIncludeCeiling] = useState(true);
  const [paintType, setPaintType] = useState<keyof typeof paintTypes>("emulsion");
  const [process, setProcess] = useState<keyof typeof processTypes>("repaint");
  const [totalCost, setTotalCost] = useState(0);

  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const area = parseFloat(carpetArea);
    if (!isNaN(area)) {
      const walls = area * 3;
      const ceiling = includeCeiling ? area : 0;
      setWallArea(Math.round(walls + ceiling).toString());
    }
  }, [carpetArea, includeCeiling]);

  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.paintType && data.process) {
        setCarpetArea(data.carpetArea);
        setWallArea(data.wallArea);
        setPaintType(data.paintType);
        setProcess(data.process);
        setIncludeCeiling(data.includeCeiling);
      }
    }
  }, [location]);

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
      // FIX: Use Supabase insert
      const { error } = await supabase.from('projects').insert({
        user_id: user.id, // Supabase uses .id, not .uid
        name,
        type: "painting",
        data: {
          carpetArea,
          wallArea,
          paintType,
          process,
          includeCeiling,
          totalCost,
          date: new Date().toISOString(),
        },
        date: new Date().toISOString(),
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
    const parsedArea = parseFloat(wallArea) || 0;
    const baseRate = paintTypes[paintType].rate;
    const processFactor = processTypes[process].factor;

    const cost = parsedArea * baseRate * processFactor;
    setTotalCost(cost);
  };

  const isLocked = !hasPaid;

  return (
    <section id="painting-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Painting Cost Estimator</h2>
        {isLocked && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> Upgrade to Pro to use this calculator.
            </p>
          </div>
        )}
        <form onSubmit={calculateCost}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="carpetArea">
                <i className="fas fa-ruler-combined"></i> Carpet/Floor Area (sq.ft)
              </label>
              <input
                type="number"
                id="carpetArea"
                placeholder="e.g., 1000"
                value={carpetArea}
                onChange={(e) => setCarpetArea(e.target.value)}
                disabled={isLocked}
              />
              <small style={{ color: "#666", marginTop: "5px" }}>
                Auto-calculates wall area (~3x)
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="wallArea">
                <i className="fas fa-paint-roller"></i> Total Paintable Area
              </label>
              <input
                type="number"
                id="wallArea"
                value={wallArea}
                onChange={(e) => setWallArea(e.target.value)}
                required
                disabled={isLocked}
              />
            </div>
          </div>
          <div className="form-group">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={includeCeiling}
                onChange={(e) => setIncludeCeiling(e.target.checked)}
                disabled={isLocked}
                style={{ width: "auto", marginRight: "10px" }}
              />
              <label style={{ display: "inline" }}>
                Include Ceiling Painting (usually White Distemper)
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label><i className="fas fa-brush"></i> Paint Type</label>
              <select
                value={paintType}
                onChange={(e) => setPaintType(e.target.value as any)}
                disabled={isLocked}
              >
                {Object.entries(paintTypes).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label><i className="fas fa-layer-group"></i> Process Type</label>
              <select
                value={process}
                onChange={(e) => setProcess(e.target.value as any)}
                disabled={isLocked}
              >
                {Object.entries(processTypes).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate Estimate
          </button>
        </form>

        {totalCost > 0 && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              <div className="total-summary" style={{ marginTop: "2rem" }}>
                <p>Total Painting Cost</p>
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
                  <ul>
                    <li style={{ marginBottom: "10px" }}>
                      <strong>Area:</strong> {wallArea} sq.ft
                    </li>
                    <li style={{ marginBottom: "10px" }}>
                      <strong>Paint:</strong> {paintTypes[paintType].name}
                    </li>
                    <li style={{ marginBottom: "10px" }}>
                      <strong>Process:</strong> {processTypes[process].name}
                    </li>
                  </ul>
                  <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
                    *Includes Material (Paint, Putty, Primer) + Labor charges.
                  </div>
                </div>
                <div className="chart-container">
                  <Chart
                    data={{
                      "Paint Material": 45,
                      "Putty & Primer": process === "fresh" ? 25 : 10,
                      Labor: process === "fresh" ? 30 : 45,
                    }}
                    colors={chartColors}
                  />
                </div>
              </div>
              {hasPaid && (
                <div className="action-buttons">
                  <button className="btn" onClick={downloadPDF} disabled={isDownloading}>
                    <i className="fas fa-download"></i> {isDownloading ? "Downloading..." : "Download PDF"}
                  </button>
                  <button
                    className="btn"
                    style={{ backgroundColor: "var(--secondary-color)", marginLeft: "10px" }}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <i className="fas fa-save"></i> {isSaving ? "Saving..." : "Save to Dashboard"}
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

export default PaintingCalculator;