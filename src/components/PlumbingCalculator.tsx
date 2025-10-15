import React, { useState } from "react";
import Chart from "./Chart";

const fixtureQualities = {
  basic: { name: "Basic", ratePerWetArea: 15000 },
  standard: { name: "Standard", ratePerWetArea: 25000 },
  premium: { name: "Premium", ratePerWetArea: 45000 },
};

const plumbingBreakdown = {
  "Pipes & Fittings": 30,
  "Sanitary Ware": 25,
  "Fixtures (Taps, etc.)": 20,
  Labor: 25,
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const PlumbingCalculator = () => {
  const [wetAreas, setWetAreas] = useState("");
  const [quality, setQuality] =
    useState<keyof typeof fixtureQualities>("basic");
  const [totalCost, setTotalCost] = useState(0);

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedWetAreas = parseInt(wetAreas) || 0;
    const cost = parsedWetAreas * fixtureQualities[quality].ratePerWetArea;
    setTotalCost(cost);
  };

  return (
    <section id="plumbing-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Plumbing Cost Calculator</h2>
        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="wetAreas">
              <i className="fas fa-bath"></i> Number of Wet Areas (Bathrooms +
              Kitchen)
            </label>
            <input
              type="number"
              id="wetAreas"
              name="wetAreas"
              placeholder="e.g., 3"
              value={wetAreas}
              onChange={(e) => setWetAreas(e.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>
              <i className="fas fa-gem"></i> Fixture Quality
            </label>
            <select
              value={quality}
              onChange={(e) =>
                setQuality(e.target.value as keyof typeof fixtureQualities)
              }
            >
              {Object.entries(fixtureQualities).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Cost
          </button>
        </form>
        {totalCost > 0 && (
          <div id="resultsSection" className={totalCost > 0 ? "visible" : ""}>
            <div className="total-summary" style={{ marginTop: "2rem" }}>
              <p>Total Estimated Plumbing Cost</p>
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
                      <th>Allocation</th>
                      <th className="text-right">Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(plumbingBreakdown).map(
                      ([component, percentage]) => {
                        const cost = (totalCost * percentage) / 100;
                        return (
                          <tr key={component}>
                            <td>{component}</td>
                            <td>{percentage}%</td>
                            <td className="text-right">
                              {cost.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
              <div className="chart-container">
                <Chart data={plumbingBreakdown} colors={chartColors} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlumbingCalculator;
