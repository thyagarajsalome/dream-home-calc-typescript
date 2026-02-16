// src/components/Calculator.tsx
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
// FIX 1: Remove Supabase import
// import { supabase } from "../supabaseClient"; 
// FIX 2: Import Firebase DB and functions
import { db } from "../firebaseConfig"; 
import { collection, addDoc } from "firebase/firestore"; 

import Chart from "./Chart";
import { useUser } from "../context/UserContext";

const mainBreakdown = {
  Foundation: 15,
  Structure: 35,
  Roofing: 10,
  Finishing: 25,
  "Services (Elec/Plumb)": 15,
};
const defaultQualityRates = { basic: 1500, standard: 2000, premium: 2800 };
const PARKING_RATE_FACTOR = 0.7;
const COMPOUND_WALL_RATE = 800;
const SUMP_TANK_COST = { basic: 150000, standard: 200000, premium: 250000 };
const mainChartColors = ["#D9A443", "#59483B", "#8C6A4E", "#D9A443", "#C4B594"];

const Calculator: React.FC = () => {
  const { hasPaid, user } = useUser();
  const navigate = useNavigate();

  const [totalCost, setTotalCost] = useState(0);
  const [area, setArea] = useState("");
  const [parkingArea, setParkingArea] = useState("");
  const [compoundWallLength, setCompoundWallLength] = useState("");
  const [includeSump, setIncludeSump] = useState(false);
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "basic"
  );
  const [customRate, setCustomRate] = useState<number>(
    defaultQualityRates.basic
  );
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFinished, setDownloadFinished] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [costDetails, setCostDetails] = useState({
    construction: 0,
    parking: 0,
    wall: 0,
    sump: 0,
  });

  useEffect(() => {
    if (!isEditingRate) {
      setCustomRate(defaultQualityRates[quality]);
    }
  }, [quality, isEditingRate]);

  const handleQualityChange = (
    newQuality: "basic" | "standard" | "premium"
  ) => {
    setQuality(newQuality);
    setIsEditingRate(false);
  };

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    const parsedParking = parseFloat(parkingArea) || 0;
    const parsedWall = parseFloat(compoundWallLength) || 0;
    const mainConstructionCost = parsedArea * customRate;
    const parkingCost = parsedParking * (customRate * PARKING_RATE_FACTOR);
    const wallCost = parsedWall * COMPOUND_WALL_RATE;
    const sumpCost = includeSump ? SUMP_TANK_COST[quality] : 0;
    const finalTotal = mainConstructionCost + parkingCost + wallCost + sumpCost;
    setCostDetails({
      construction: mainConstructionCost,
      parking: parkingCost,
      wall: wallCost,
      sump: sumpCost,
    });
    setTotalCost(finalTotal);
  };

  const handleSaveProject = async () => {
    if (!user) {
      alert("Please Sign In to save.");
      navigate("/signin");
      return;
    }
    const projectName = prompt("Enter a name for this project:");
    if (!projectName) return;
    setIsSaving(true);
    
    // FIX 3: Updated Save Logic for Firestore
    try {
      await addDoc(collection(db, "projects"), {
        user_id: user.uid, // Use .uid for Firebase User object
        name: projectName,
        type: "construction",
        data: {
          area,
          parkingArea,
          compoundWallLength,
          includeSump,
          quality,
          rate: customRate,
          totalCost,
          breakdown: costDetails,
          date: new Date().toISOString(),
        },
        date: new Date().toISOString() // Helper top-level date
      });
      
      alert("Saved!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error saving project:", err);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    setTotalCost(0);
    setArea("");
    setParkingArea("");
    setCompoundWallLength("");
    setIncludeSump(false);
    setQuality("basic");
    setIsEditingRate(false);
    setCustomRate(defaultQualityRates.basic);
    setDownloadFinished(false);
  };

  const downloadPDF = () => {
    if (resultsRef.current) {
      setIsDownloading(true);
      setDownloadFinished(false);
      html2canvas(resultsRef.current, { scale: 2, useCORS: true }).then(
        (canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("detailed-construction-estimate.pdf");
          setIsDownloading(false);
          setDownloadFinished(true);
        }
      );
    }
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  return (
    <section id="tools" className="container">
      <div className="card">
        <h2 className="section-title">Detailed Construction Estimator</h2>
        <form id="calc-form" onSubmit={calculateCost}>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-paint-roller"></i> Finish Quality
            </label>
            <div className="quality-selector">
              <input
                type="radio"
                id="basic"
                name="quality"
                value="basic"
                checked={quality === "basic"}
                onChange={() => handleQualityChange("basic")}
              />
              <label htmlFor="basic">Basic</label>
              <input
                type="radio"
                id="standard"
                name="quality"
                value="standard"
                checked={quality === "standard"}
                onChange={() => handleQualityChange("standard")}
              />
              <label htmlFor="standard">Standard</label>
              <input
                type="radio"
                id="premium"
                name="quality"
                value="premium"
                checked={quality === "premium"}
                onChange={() => handleQualityChange("premium")}
                disabled={!hasPaid}
              />
              <label
                htmlFor="premium"
                className={!hasPaid ? "premium-locked" : ""}
              >
                Premium {!hasPaid && <i className="fas fa-lock"></i>}
              </label>
            </div>
            {!hasPaid && quality === "premium" && (
              <p style={{ textAlign: "center", marginTop: "1rem" }}>
                Upgrade to Pro to unlock Premium quality estimates.
              </p>
            )}
            <div
              className="rate-selector"
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <label htmlFor="rate" style={{ margin: 0 }}>
                  Construction Rate (₹/sq.ft)
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditingRate(!isEditingRate)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "0.9rem",
                  }}
                >
                  {isEditingRate ? "Reset to Default" : "Customize Rate"}
                </button>
              </div>
              <input
                type="number"
                id="rate"
                value={customRate}
                onChange={(e) => {
                  setCustomRate(Number(e.target.value));
                  setIsEditingRate(true);
                }}
                disabled={!isEditingRate}
                style={{
                  background: isEditingRate ? "#fff" : "#eee",
                  fontWeight: "bold",
                  color: "var(--secondary-color)",
                }}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-home"></i> Living Area (sq. ft.)
            </label>
            <input
              type="number"
              id="area"
              placeholder="e.g., 1200"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="parking">
              <i className="fas fa-car"></i> Parking / Utility Area (sq. ft.)
            </label>
            <input
              type="number"
              id="parking"
              placeholder="e.g., 200"
              value={parkingArea}
              onChange={(e) => setParkingArea(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="wall">
              <i className="fas fa-border-all"></i> Compound Wall Length (ft)
            </label>
            <input
              type="number"
              id="wall"
              placeholder="e.g., 150"
              value={compoundWallLength}
              onChange={(e) => setCompoundWallLength(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div className="checkbox-wrapper" style={{ marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                id="sump"
                checked={includeSump}
                onChange={(e) => setIncludeSump(e.target.checked)}
                style={{ width: "auto", marginRight: "10px" }}
              />
              <label htmlFor="sump" style={{ display: "inline" }}>
                Include Water Sump & Septic Tank (+ ₹
                {SUMP_TANK_COST[quality].toLocaleString()})
              </label>
            </div>
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Detailed Estimate
          </button>
        </form>
      </div>
      {totalCost > 0 && (
        <div id="resultsSection" className="visible">
          <div className="card" ref={resultsRef}>
            <div className="total-summary">
              <p>Total Estimated Project Cost</p>
              <span>{formatCurrency(totalCost)}</span>
            </div>
            <div className="result-details" style={{ marginBottom: "2rem" }}>
              <h3>Project Cost Breakdown</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Details</th>
                    <th className="text-right">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Main Construction</strong>
                    </td>
                    <td>
                      {area} sq.ft @ ₹{customRate}/sq.ft
                    </td>
                    <td className="text-right">
                      {formatCurrency(costDetails.construction)}
                    </td>
                  </tr>
                  {costDetails.parking > 0 && (
                    <tr>
                      <td>
                        <strong>Parking / Utility</strong>
                      </td>
                      <td>{parkingArea} sq.ft @ 70% Rate</td>
                      <td className="text-right">
                        {formatCurrency(costDetails.parking)}
                      </td>
                    </tr>
                  )}
                  {costDetails.wall > 0 && (
                    <tr>
                      <td>
                        <strong>Compound Wall</strong>
                      </td>
                      <td>
                        {compoundWallLength} R.ft @ ₹{COMPOUND_WALL_RATE}/ft
                      </td>
                      <td className="text-right">
                        {formatCurrency(costDetails.wall)}
                      </td>
                    </tr>
                  )}
                  {costDetails.sump > 0 && (
                    <tr>
                      <td>
                        <strong>Sump & Septic Tank</strong>
                      </td>
                      <td>Lump Sum Estimate</td>
                      <td className="text-right">
                        {formatCurrency(costDetails.sump)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="results-grid">
              <div className="result-details">
                <h3>Material & Labor Allocation</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Allocation</th>
                      <th className="text-right">Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(mainBreakdown).map(
                      ([component, percentage]) => (
                        <tr key={component}>
                          <td>{component}</td>
                          <td>{percentage}%</td>
                          <td className="text-right">
                            {formatCurrency(
                              (costDetails.construction * percentage) / 100
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <div className="chart-container">
                <Chart data={mainBreakdown} colors={mainChartColors} />
              </div>
            </div>
            <div className="action-buttons">
              {hasPaid && (
                <button
                  className="btn"
                  onClick={downloadPDF}
                  disabled={isDownloading}
                >
                  <i className="fas fa-download"></i>{" "}
                  {isDownloading ? "Downloading..." : "Download PDF"}
                </button>
              )}
              <button
                className="btn"
                style={{
                  backgroundColor: "var(--secondary-color)",
                  marginLeft: "10px",
                }}
                onClick={handleSaveProject}
                disabled={isSaving}
              >
                <i className="fas fa-save"></i>{" "}
                {isSaving ? "Saving..." : "Save to Dashboard"}
              </button>
              <button className="btn btn-secondary" onClick={resetAll}>
                <i className="fas fa-sync-alt"></i> Reset
              </button>
            </div>
            {downloadFinished && (
              <div className="notification">
                <p>Download finished!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
export default Calculator;