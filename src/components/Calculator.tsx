import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Chart from "./Chart";

// Data for the cost breakdown percentages
const mainBreakdown = {
  Foundation: 15,
  Structure: 35,
  Roofing: 10,
  Finishing: 25,
  "Services (Elec/Plumb)": 15,
};

const detailedBreakdown = {
  Foundation: { Excavation: 40, Concrete: 40, Reinforcement: 20 },
  Structure: { Brickwork: 50, Cement: 30, "Labor & Scaffolding": 20 },
  Roofing: { "Roofing Material": 70, "Waterproofing & Labor": 30 },
  Finishing: { Flooring: 40, Painting: 30, "Doors & Windows": 30 },
  "Services (Elec/Plumb)": {
    "Electrical & Lighting": 50,
    Plumbing: 30,
    Fixtures: 20,
  },
};

const qualityRates = {
  basic: [1200, 1500, 1800],
  standard: [1900, 2000, 2400],
  premium: [2500, 2800, 3200],
};

const Calculator = () => {
  const [totalCost, setTotalCost] = useState(0);
  const [area, setArea] = useState("");
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">(
    "basic"
  );
  const [rate, setRate] = useState<number>(qualityRates.basic[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFinished, setDownloadFinished] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleQualityChange = (
    newQuality: "basic" | "standard" | "premium"
  ) => {
    setQuality(newQuality);
    setRate(qualityRates[newQuality][0]);
  };

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedArea = parseFloat(area) || 0;
    const cost = parsedArea * rate;
    setTotalCost(cost);
  };

  const resetAll = () => {
    setTotalCost(0);
    setArea("");
    setQuality("basic");
    setRate(qualityRates.basic[0]);
    setDownloadFinished(false);
  };

  const downloadPDF = () => {
    if (resultsRef.current) {
      setIsDownloading(true);
      setDownloadFinished(false);
      html2canvas(resultsRef.current).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("dream-home-cost-estimate.pdf");
        setIsDownloading(false);
        setDownloadFinished(true);
      });
    }
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
              />
              <label htmlFor="premium">Premium</label>
            </div>
            <div className="rate-selector">
              <label htmlFor="rate">Select Rate (per sq. ft.)</label>
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
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Estimate
          </button>
        </form>
      </div>

      {totalCost > 0 && (
        <div id="resultsSection" className={totalCost > 0 ? "visible" : ""}>
          <div className="card" ref={resultsRef}>
            <div className="total-summary">
              <p>Total Estimated Cost</p>
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
                    {Object.entries(mainBreakdown).map(
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
                <Chart data={mainBreakdown} />
              </div>
            </div>
            <div id="detailedBreakdownSection">
              <h3 style={{ margin: "3rem 0 1rem", textAlign: "center" }}>
                Detailed Component Breakdown
              </h3>
              <div className="detailed-breakdown-grid">
                {Object.entries(detailedBreakdown).map(
                  ([component, details]) => {
                    const componentCost =
                      (totalCost *
                        (mainBreakdown as { [key: string]: number })[
                          component
                        ]) /
                      100;
                    return (
                      <div className="component-card" key={component}>
                        <h3>{component} Details</h3>
                        <div className="component-card-content">
                          <table>
                            <tbody>
                              {Object.entries(details).map(
                                ([subComponent, percentage]) => {
                                  const subCost =
                                    (componentCost * percentage) / 100;
                                  return (
                                    <tr key={subComponent}>
                                      <td>{subComponent}</td>
                                      <td className="text-right">
                                        {subCost.toLocaleString("en-IN", {
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
                          <div className="chart-container">
                            <Chart data={details} />
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
            <div className="action-buttons">
              <button
                className="btn"
                onClick={downloadPDF}
                disabled={isDownloading}
              >
                <i className="fas fa-download"></i> Download PDF
              </button>
              <button className="btn btn-secondary" onClick={resetAll}>
                <i className="fas fa-sync-alt"></i> Reset
              </button>
            </div>
            {isDownloading && (
              <div className="progress-bar">
                <div className="progress"></div>
              </div>
            )}
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
