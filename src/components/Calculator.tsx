import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "./Chart";
import { useUser } from "../context/UserContext";

// Data for the cost breakdown percentages
const mainBreakdown = {
  Foundation: 15,
  Structure: 35,
  Roofing: 10,
  Finishing: 25,
  "Services (Elec/Plumb)": 15,
};

const qualityRates = {
  basic: [1200, 1500, 1800],
  standard: [1900, 2000, 2400],
  premium: [2500, 2800, 3200],
};

// New Add-on Costs
const PARKING_RATE_FACTOR = 0.7; // Parking is 70% of main rate
const COMPOUND_WALL_RATE = 800; // Rs per running foot
const SUMP_TANK_COST = {
  basic: 150000,
  standard: 200000,
  premium: 250000,
};

const mainChartColors = ["#D9A443", "#59483B", "#8C6A4E", "#D9A443", "#C4B594"];

const Calculator: React.FC = () => {
  const { hasPaid } = useUser(); // Use Context

  const [totalCost, setTotalCost] = useState(0);
  const [area, setArea] = useState("");

  // New State Inputs
  const [parkingArea, setParkingArea] = useState("");
  const [compoundWallLength, setCompoundWallLength] = useState("");
  const [includeSump, setIncludeSump] = useState(false);

  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "basic"
  );
  const [rate, setRate] = useState<number>(qualityRates.basic[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFinished, setDownloadFinished] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Detailed cost states for display
  const [costDetails, setCostDetails] = useState({
    construction: 0,
    parking: 0,
    wall: 0,
    sump: 0,
  });

  const handleQualityChange = (
    newQuality: "basic" | "standard" | "premium"
  ) => {
    setQuality(newQuality);
    setRate(qualityRates[newQuality][0]);
  };

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    const parsedParking = parseFloat(parkingArea) || 0;
    const parsedWall = parseFloat(compoundWallLength) || 0;

    // 1. Main Construction Cost
    const mainConstructionCost = parsedArea * rate;

    // 2. Parking Cost
    const parkingCost = parsedParking * (rate * PARKING_RATE_FACTOR);

    // 3. Compound Wall Cost
    const wallCost = parsedWall * COMPOUND_WALL_RATE;

    // 4. Sump & Septic Tank Cost
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

  const resetAll = () => {
    setTotalCost(0);
    setArea("");
    setParkingArea("");
    setCompoundWallLength("");
    setIncludeSump(false);
    setQuality("basic");
    setRate(qualityRates.basic[0]);
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <section id="tools" className="container">
      <div className="card">
        <h2 className="section-title">Detailed Construction Estimator</h2>
        <form id="calc-form" onSubmit={calculateCost}>
          {/* Quality Selection (Top Priority) */}
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
            <div className="rate-selector">
              <label htmlFor="rate">Base Rate (per sq. ft.)</label>
              <select
                id="rate"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              >
                {qualityRates[quality].map((r) => (
                  <option key={r} value={r}>
                    {r} Rs
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Area Input */}
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-home"></i> Living Area (sq. ft.)
              <i
                className="fas fa-info-circle"
                title="Enclosed area of the house (ground + upper floors)"
              ></i>
            </label>
            <input
              type="number"
              id="area"
              name="area"
              placeholder="e.g., 1200"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>

          {/* Parking Area Input */}
          <div className="form-group">
            <label htmlFor="parking">
              <i className="fas fa-car"></i> Parking / Utility Area (sq. ft.)
              <i
                className="fas fa-info-circle"
                title="Semi-covered areas cost approx 70% of main rate"
              ></i>
            </label>
            <input
              type="number"
              id="parking"
              placeholder="e.g., 200"
              value={parkingArea}
              onChange={(e) => setParkingArea(e.target.value)}
            />
          </div>

          {/* Compound Wall Input */}
          <div className="form-group">
            <label htmlFor="wall">
              <i className="fas fa-border-all"></i> Compound Wall Length (ft)
              <i
                className="fas fa-info-circle"
                title="Total running feet of boundary wall"
              ></i>
            </label>
            <input
              type="number"
              id="wall"
              placeholder="e.g., 150"
              value={compoundWallLength}
              onChange={(e) => setCompoundWallLength(e.target.value)}
            />
          </div>

          {/* Sump/Tank Checkbox */}
          <div className="form-group">
            <label style={{ marginBottom: 0 }}>
              <i className="fas fa-water"></i> Water Sump & Septic Tank
            </label>
            <div className="checkbox-wrapper" style={{ marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                id="sump"
                checked={includeSump}
                onChange={(e) => setIncludeSump(e.target.checked)}
                style={{ width: "auto", marginRight: "10px" }}
              />
              <label htmlFor="sump" style={{ display: "inline" }}>
                Include in Estimate (+ ₹
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
        <div id="resultsSection" className={totalCost > 0 ? "visible" : ""}>
          <div className="card" ref={resultsRef}>
            {/* Total Summary */}
            <div className="total-summary">
              <p>Total Estimated Project Cost</p>
              <span>{formatCurrency(totalCost)}</span>
            </div>

            {/* Detailed Breakdown Table */}
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
                      {area} sq.ft @ ₹{rate}/sq.ft
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
                <h3>Material & Labor Allocation (Main Building)</h3>
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
                      ([component, percentage]) => {
                        // Only apply breakdown to main construction cost
                        const cost =
                          (costDetails.construction * percentage) / 100;
                        return (
                          <tr key={component}>
                            <td>{component}</td>
                            <td>{percentage}%</td>
                            <td className="text-right">
                              {formatCurrency(cost)}
                            </td>
                          </tr>
                        );
                      }
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
