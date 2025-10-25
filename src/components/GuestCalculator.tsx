// src/components/GuestCalculator.tsx

import React, { useState, useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import type { Chart as ChartType } from "chart.js/auto";
import { Link } from "react-router-dom"; // Import Link
import "../styles/GuestCalculator.css";

// Define chart instances at the module level
let pieChartInstance: ChartType | null = null;
let barChartInstance: ChartType | null = null;

const GuestCalculator: React.FC = () => {
  // Form input states
  const [builtupArea, setBuiltupArea] = useState("");
  const [city, setCity] = useState("");
  const [quality, setQuality] = useState("");
  const [floors, setFloors] = useState("1");
  const [foundation, setFoundation] = useState("normal");
  const [features, setFeatures] = useState({
    parking: false,
    elevation: false,
    modular: false,
    solar: false,
    automation: false,
  });

  // Result states
  const [results, setResults] = useState<{
    totalCost: number;
    constructionCost: number;
    foundationCost: number;
    professionalFees: number;
    approvalCost: number;
    additionalCost: number;
    baseRate: number;
    floorMultiplier: number;
  } | null>(null);

  // Chart refs
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);

  const formatIndianCurrency = (num: number) => {
    const numStr = Math.round(num).toString();
    let lastThree = numStr.substring(numStr.length - 3);
    let otherNumbers = numStr.substring(0, numStr.length - 3);
    if (otherNumbers !== "") {
      lastThree = "," + lastThree;
    }
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  };

  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFeatures((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const area = parseFloat(builtupArea);

    if (!area || !city || !quality) {
      alert("Please fill all required fields");
      return;
    }

    const qualityRates: { [key: string]: number } = {
      basic: 1350,
      standard: 1750,
      premium: 2250,
      luxury: 2750,
    };

    const cityMultipliers: { [key: string]: number } = {
      metro: 1.2,
      tier1: 1.0,
      tier2: 0.85,
      tier3: 0.7,
    };

    const foundationCosts: { [key: string]: number } = {
      normal: 0,
      rocky: 80000,
      weak: 150000,
    };

    let baseRate = qualityRates[quality] * cityMultipliers[city];
    let constructionCost = area * baseRate;

    const numFloors = parseInt(floors);
    let floorMultiplier = 1 + (numFloors - 1) * 0.08;
    constructionCost *= floorMultiplier;

    let foundationCost = foundationCosts[foundation];

    let additionalCost = 0;
    if (features.parking) additionalCost += 150000;
    if (features.elevation) additionalCost += 100000;
    if (features.modular) additionalCost += 200000;
    if (features.solar) additionalCost += 120000;
    if (features.automation) additionalCost += 180000;

    let professionalFees = constructionCost * 0.1;
    let approvalCost = 50000 + area * 5;

    let totalCost =
      constructionCost +
      foundationCost +
      additionalCost +
      professionalFees +
      approvalCost;

    setResults({
      totalCost,
      constructionCost,
      foundationCost,
      professionalFees,
      approvalCost,
      additionalCost,
      baseRate,
      floorMultiplier,
    });
  };

  const renderHouseVisual = () => {
    const numFloors = parseInt(floors);
    const floorNames = [
      "Ground Floor",
      "First Floor",
      "Second Floor",
      "Third Floor",
    ];
    const foundationText: { [key: string]: string } = {
      normal: "Standard Foundation (Normal Soil) 🪨",
      rocky: "Reinforced Foundation (Rocky Terrain) ⛰️",
      weak: "Deep Pile Foundation (Weak Soil) 🏗️",
    };

    const floorVisuals = [];
    for (let i = numFloors - 1; i >= 0; i--) {
      floorVisuals.push(
        <div
          key={i}
          className="floor-visual"
          style={{ animationDelay: `${(numFloors - 1 - i) * 0.2}s` }}
        >
          {floorNames[i]} 🏠
        </div>
      );
    }

    return (
      <div className="house-visual">
        {floorVisuals}
        <div className="foundation-visual">{foundationText[foundation]}</div>
      </div>
    );
  };

  const renderBreakdown = () => {
    if (!results) return null;
    const {
      totalCost,
      constructionCost,
      foundationCost,
      professionalFees,
      approvalCost,
      additionalCost,
      baseRate,
      floorMultiplier,
    } = results;

    return (
      <div id="breakdown">
        <div className="cost-item">
          <div className="cost-item-label">
            <span>🏗️</span>
            <span>
              Basic Construction ({builtupArea} sq ft @ ₹
              {Math.round(baseRate * floorMultiplier)}/sq ft)
            </span>
          </div>
          <span>₹{formatIndianCurrency(constructionCost)}</span>
        </div>
        <div className="cost-item">
          <div className="cost-item-label">
            <span>🏔️</span>
            <span>Foundation Work ({foundation})</span>
          </div>
          <span>₹{formatIndianCurrency(foundationCost)}</span>
        </div>
        <div className="cost-item">
          <div className="cost-item-label">
            <span>👷</span>
            <span>Professional Fees (Architect, Engineer)</span>
          </div>
          <span>₹{formatIndianCurrency(professionalFees)}</span>
        </div>
        <div className="cost-item">
          <div className="cost-item-label">
            <span>📋</span>
            <span>Approvals & Permits</span>
          </div>
          <span>₹{formatIndianCurrency(approvalCost)}</span>
        </div>
        {additionalCost > 0 && (
          <div className="cost-item">
            <div className="cost-item-label">
              <span>✨</span>
              <span>Additional Features</span>
            </div>
            <span>₹{formatIndianCurrency(additionalCost)}</span>
          </div>
        )}
        <div className="cost-item">
          <div className="cost-item-label">
            <span>💰</span>
            <span>TOTAL ESTIMATED COST</span>
          </div>
          <span>₹{formatIndianCurrency(totalCost)}</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // This effect handles chart creation/updates
    if (results && pieChartRef.current && barChartRef.current) {
      const {
        constructionCost,
        foundationCost,
        professionalFees,
        approvalCost,
        additionalCost,
      } = results;

      const labels = [
        "Construction",
        "Foundation",
        "Professional Fees",
        "Approvals",
        "Additional Features",
      ];
      const values = [
        constructionCost,
        foundationCost,
        professionalFees,
        approvalCost,
        additionalCost,
      ];

      const filteredLabels = labels.filter((_, i) => values[i] > 0);
      const filteredValues = values.filter((v) => v > 0);
      const chartColors = [
        "#D9A443", // primary-color
        "#59483B", // secondary-color
        "#8C6A4E", // accent-color
        "#C4B594", // Lighter brown
        "#A99A86", // Another light shade
      ];

      // Destroy existing charts before creating new ones
      if (pieChartInstance) pieChartInstance.destroy();
      if (barChartInstance) barChartInstance.destroy();

      // Pie Chart Configuration
      const pieCtx = pieChartRef.current.getContext("2d");
      if (pieCtx) {
        pieChartInstance = new Chart(pieCtx, {
          type: "pie",
          data: {
            labels: filteredLabels,
            datasets: [
              {
                data: filteredValues,
                backgroundColor: chartColors.slice(0, filteredValues.length),
                borderWidth: 2,
                borderColor: "#fff", // card-background
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: "bottom",
                labels: { padding: 15, font: { size: 12 } },
              },
              tooltip: {
                callbacks: {
                  label: (context) =>
                    `${context.label || ""}: ₹${formatIndianCurrency(
                      context.parsed || 0
                    )}`,
                },
              },
            },
          },
        });
      }

      // Bar Chart Configuration
      const barCtx = barChartRef.current.getContext("2d");
      if (barCtx) {
        barChartInstance = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: filteredLabels,
            datasets: [
              {
                label: "Cost (₹)",
                data: filteredValues,
                backgroundColor: chartColors
                  .slice(0, filteredValues.length)
                  .map((c) => c + "CC"), // Add alpha transparency
                borderColor: chartColors.slice(0, filteredValues.length),
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) =>
                    `₹${formatIndianCurrency(context.parsed.y)}`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  // Format Y-axis ticks in Lakhs
                  callback: (value) =>
                    `₹${(Number(value) / 100000).toFixed(1)}L`,
                },
              },
            },
          },
        });
      }

      // Scroll smoothly to results section after calculation
      const resultsEl = document.getElementById("guest-results");
      if (resultsEl) {
        setTimeout(() => {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100); // Small delay to ensure rendering
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]); // Dependency array: run effect when results change

  // --- COMPONENT RENDER ---
  return (
    <div className="guest-calculator-page">
      {" "}
      {/* Outer wrapper */}
      <div className="guest-container">
        {" "}
        {/* White card container */}
        <div className="guest-header">
          {" "}
          {/* Dark blue header */}
          <h1>🏗️ House Construction Cost Calculator</h1>
          <p>
            Estimate your construction costs accurately for Indian homes with
            detailed visualizations
          </p>
          <div className="hero-icons">
            {" "}
            {/* Icons below header text */}
            <div className="hero-icon">
              <div>🏠</div>
              <span>Smart Planning</span>
            </div>
            <div className="hero-icon">
              <div>💰</div>
              <span>Cost Analysis</span>
            </div>
            <div className="hero-icon">
              <div>📊</div>
              <span>Visual Reports</span>
            </div>
          </div>
        </div>
        <div className="guest-content">
          {" "}
          {/* Main content area below header */}
          <form onSubmit={calculateCost}>
            {/* Built-up Area Input */}
            <div className="form-section">
              <label htmlFor="builtupArea">Built-up Area (sq ft) *</label>
              <input
                type="number"
                id="builtupArea"
                placeholder="e.g., 1500"
                min="100"
                value={builtupArea}
                onChange={(e) => setBuiltupArea(e.target.value)}
                required
              />
            </div>

            {/* City & Quality Row */}
            <div className="form-row">
              <div className="form-section">
                <label htmlFor="city">City/Location *</label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                >
                  <option value="">Select City</option>
                  <option value="metro">
                    Metro Cities (Mumbai, Delhi, Bangalore)
                  </option>
                  <option value="tier1">
                    Tier-1 Cities (Pune, Hyderabad, Chennai)
                  </option>
                  <option value="tier2">
                    Tier-2 Cities (Lucknow, Jaipur, Kochi)
                  </option>
                  <option value="tier3">Tier-3 Cities & Towns</option>
                </select>
              </div>
              <div className="form-section">
                <label htmlFor="quality">Construction Quality *</label>
                <select
                  id="quality"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  required
                >
                  <option value="">Select Quality</option>
                  <option value="basic">Basic (₹1200-1500/sq ft)</option>
                  <option value="standard">Standard (₹1500-2000/sq ft)</option>
                  <option value="premium">Premium (₹2000-2500/sq ft)</option>
                  <option value="luxury">Luxury (₹2500+/sq ft)</option>
                </select>
              </div>
            </div>

            {/* Floors & Foundation Row */}
            <div className="form-row">
              <div className="form-section">
                <label htmlFor="floors">Number of Floors *</label>
                <select
                  id="floors"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  required
                >
                  <option value="1">Ground Floor (G)</option>
                  <option value="2">Ground + 1 Floor (G+1)</option>
                  <option value="3">Ground + 2 Floors (G+2)</option>
                  <option value="4">Ground + 3 Floors (G+3)</option>
                </select>
              </div>
              <div className="form-section">
                <label htmlFor="foundation">Foundation Type *</label>
                <select
                  id="foundation"
                  value={foundation}
                  onChange={(e) => setFoundation(e.target.value)}
                  required
                >
                  <option value="normal">Normal Soil</option>
                  <option value="rocky">Rocky Terrain</option>
                  <option value="weak">Weak Soil (Requires Piling)</option>
                </select>
              </div>
            </div>

            {/* Additional Features Checkboxes */}
            <div className="checkbox-group">
              <h3>✨ Additional Features (Optional)</h3>
              {/* Individual checkbox items */}
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="parking"
                  checked={features.parking}
                  onChange={handleFeatureChange}
                />
                <label htmlFor="parking">
                  🚗 Basement/Underground Parking (+₹1.5L)
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="elevation"
                  checked={features.elevation}
                  onChange={handleFeatureChange}
                />
                <label htmlFor="elevation">
                  🎨 Premium Elevation Design (+₹1L)
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="modular"
                  checked={features.modular}
                  onChange={handleFeatureChange}
                />
                <label htmlFor="modular">
                  🍳 Modular Kitchen & Wardrobes (+₹2L)
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="solar"
                  checked={features.solar}
                  onChange={handleFeatureChange}
                />
                <label htmlFor="solar">
                  ☀️ Solar Panel Installation (+₹1.2L)
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="automation"
                  checked={features.automation}
                  onChange={handleFeatureChange}
                />
                <label htmlFor="automation">
                  🤖 Home Automation System (+₹1.8L)
                </label>
              </div>
            </div>

            {/* Calculate Button */}
            <button className="calculate-btn" type="submit">
              <span>📊 Calculate Construction Cost</span>
            </button>
          </form>
          {/* Results Section (conditionally rendered) */}
          {results && (
            <div className="results show" id="guest-results">
              {/* Total Amount Header */}
              <div className="results-header">
                <h2>💰 Your Construction Cost Estimate</h2>
                <div className="total-amount">
                  ₹{formatIndianCurrency(results.totalCost)}
                </div>
                <p>Detailed breakdown with visualizations below</p>
              </div>

              {/* Building Structure Visualization */}
              <div className="construction-diagram">
                <h3>🏗️ Your Building Structure</h3>
                {renderHouseVisual()} {/* Renders floors and foundation */}
              </div>

              {/* Charts Grid */}
              <div className="visualization-grid">
                <div className="chart-container">
                  <h3>📊 Cost Distribution</h3>
                  <canvas ref={pieChartRef}></canvas> {/* Pie chart canvas */}
                </div>
                <div className="chart-container">
                  <h3>📈 Component-wise Breakdown</h3>
                  <canvas ref={barChartRef}></canvas> {/* Bar chart canvas */}
                </div>
              </div>

              {/* Detailed Cost Breakdown Table */}
              <div className="cost-breakdown">
                <h3>💵 Detailed Cost Breakdown</h3>
                {renderBreakdown()} {/* Renders the cost items */}
              </div>

              {/* --- NEW SECTION: Pro Features Promo --- */}
              <div
                className="pro-features-promo card"
                style={{
                  marginTop: "2rem",
                  background: "var(--background-color)", // Use light background
                }}
              >
                <h3>Want More Detailed Calculations? 🤔</h3>
                <p>Sign up for a free account to:</p>
                <ul>
                  <li>
                    <i className="fas fa-calculator"></i> Access Loan EMI &
                    Eligibility Calculators
                  </li>
                  <li>
                    <i className="fas fa-save"></i> Option to Save Basic Reports
                    (Coming Soon!)
                  </li>
                </ul>
                <ul>
                  <li>
                    <i className="fas fa-couch"></i> Interior Calculator
                  </li>
                  <li>
                    <i className="fas fa-door-open"></i> Doors & Windows
                    Calculator
                  </li>
                  <li>
                    <i className="fas fa-layer-group"></i> Flooring Calculator
                  </li>
                  <li>
                    <i className="fas fa-paint-roller"></i> Painting Calculator
                  </li>
                  <li>
                    <i className="fas fa-bath"></i> Plumbing Calculator
                  </li>
                  <li>
                    <i className="fas fa-bolt"></i> Electrical Calculator
                  </li>
                  <li>
                    <i className="fas fa-star"></i> Standard & Premium quality
                    options in main calculator
                  </li>
                  <li>
                    <i className="fas fa-file-pdf"></i> Download detailed PDF
                    reports for all calculators
                  </li>
                </ul>
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <Link to="/signup" className="btn" style={{ color: "white" }}>
                    {" "}
                    {/* */}
                    Sign Up for Free Now!
                  </Link>
                </div>
              </div>
              {/* --- END NEW SECTION --- */}

              {/* Disclaimer Box */}
              <div className="disclaimer-box" style={{ marginTop: "2rem" }}>
                {" "}
                {/* */}
                <strong>⚠️ Important Note:</strong>
                This is an approximate estimate based on current market rates in
                India. Actual costs may vary by ±15-20% based on material
                prices, labor charges, location specifics, and contractor rates.
                We recommend getting at least 3 quotations from local
                contractors and consulting with a registered architect for
                accurate planning.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestCalculator;
