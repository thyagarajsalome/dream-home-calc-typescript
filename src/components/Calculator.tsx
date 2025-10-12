import React, { useState } from "react";

// Data for the cost breakdown percentages
const mainBreakdownData = {
  "Civil Work": 40,
  "Finishing Work": 30,
  "Basic Services": 20,
  "Other Expenses": 10,
};

const Calculator = () => {
  // State to hold the final calculated cost
  const [totalCost, setTotalCost] = useState(0);
  const [area, setArea] = useState("");
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "basic"
  );

  // Function to handle the form submission and calculate the cost
  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Per square foot rates for different quality levels
    const rates: { [key in "basic" | "standard" | "premium"]: number } = {
      basic: 1500,
      standard: 1800,
      premium: 2200,
    };

    const parsedArea = parseFloat(area) || 0;
    const cost = parsedArea * rates[quality];
    setTotalCost(cost);
  };

  // Function to reset the calculator
  const resetAll = () => {
    setTotalCost(0);
    setArea("");
    setQuality("basic");
  };

  return (
    <section id="tools" className="container">
      <div className="card">
        <h2 className="section-title">Construction Cost Calculator</h2>
        <form id="calc-form" onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Plot Area (sq. ft.)
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
                onChange={(e) => setQuality(e.target.value as "basic")}
              />
              <label htmlFor="basic">Basic</label>
              <input
                type="radio"
                id="standard"
                name="quality"
                value="standard"
                checked={quality === "standard"}
                onChange={(e) => setQuality(e.target.value as "standard")}
              />
              <label htmlFor="standard">Standard</label>
              <input
                type="radio"
                id="premium"
                name="quality"
                value="premium"
                checked={quality === "premium"}
                onChange={(e) => setQuality(e.target.value as "premium")}
              />
              <label htmlFor="premium">Premium</label>
            </div>
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Estimate
          </button>
        </form>
      </div>

      {/* This section will only appear after a calculation is made */}
      {totalCost !== 0 && (
        <div id="resultsSection" style={{ display: "block" }}>
          <div className="card">
            <div id="totalSummary" className="total-summary">
              <p>Total Estimated Cost</p>
              <span id="finalTotalCost">
                {totalCost.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="result-details">
              <h3>Cost Breakdown</h3>
              <table>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Allocation</th>
                    <th className="text-right">Cost (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mainBreakdownData).map(([component, pct]) => {
                    const cost = (totalCost * pct) / 100;
                    return (
                      <tr key={component}>
                        <td>{component}</td>
                        <td>{pct}%</td>
                        <td className="text-right">
                          {cost.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="action-buttons" id="actionButtons">
              <button
                id="resetBudget"
                className="btn btn-secondary"
                onClick={resetAll}
              >
                <i className="fas fa-sync-alt"></i> Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Calculator;
