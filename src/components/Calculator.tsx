import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Type definition for the detailed breakdown
type DetailedBreakdown = {
  [key: string]: {
    [key: string]: number;
  };
};

// Correctly defined data constants
const mainBreakdownData = {
  Civil: 40,
  Finishing: 30,
  Services: 20,
  Other: 10,
};

const detailedBreakdownData: DetailedBreakdown = {
  Civil: { Foundation: 20, Structure: 50, Masonry: 30 },
  Finishing: {
    Flooring: 25,
    Painting: 25,
    Windows: 20,
    Doors: 15,
    Exterior: 15,
  },
  Services: { Electrical: 40, Plumbing: 40, HVAC: 20 },
  Other: { Landscaping: 50, Permits: 50 },
};

const Calculator = () => {
  const [totalCost, setTotalCost] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  // No changes needed in these functions
  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const area = Number(formData.get("area"));
    const quality = formData.get("quality") as string;
    const rates: { [key: string]: number } = {
      basic: 1500,
      standard: 1800,
      premium: 2200,
    };
    const cost = area * rates[quality];
    setTotalCost(cost);
  };

  const downloadPdf = () => {
    const input = document.getElementById("resultsSection");
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
        pdf.save("dream-home-budget.pdf");
      });
    }
  };

  const shareBudget = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Dream Home Budget",
          text: `My estimated home construction cost is ${totalCost.toLocaleString(
            "en-IN",
            { style: "currency", currency: "INR", maximumFractionDigits: 0 }
          )}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    }
  };

  const resetAll = () => {
    setTotalCost(0);
  };

  useEffect(() => {
    if (canvasRef.current && totalCost > 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: Object.keys(mainBreakdownData),
            datasets: [
              {
                data: Object.values(mainBreakdownData),
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
              },
            ],
          },
        });
      }
    }
  }, [totalCost]);

  return (
    <section id="tools" className="container">
      {/* The form section is correct */}
      <div className="card">
        <h2 className="section-title">Construction Cost Calculator</h2>
        <form onSubmit={calculateCost}>
          <div className="form-group">
            <label htmlFor="area">
              <i className="fas fa-ruler-combined"></i> Plot Area (sq. ft.)
            </label>
            <input
              type="number"
              id="area"
              name="area"
              placeholder="e.g., 1200"
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
                defaultChecked
              />
              <label htmlFor="basic">Basic</label>
              <input
                type="radio"
                id="standard"
                name="quality"
                value="standard"
              />
              <label htmlFor="standard">Standard</label>
              <input type="radio" id="premium" name="quality" value="premium" />
              <label htmlFor="premium">Premium</label>
            </div>
          </div>
          <button type="submit" className="btn full-width">
            <i className="fas fa-calculator"></i> Calculate Estimate
          </button>
        </form>
      </div>

      {/* This is the results section that has been fixed */}
      {totalCost > 0 && (
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
                    {/* FIXED: Now iterates over the mainBreakdownData constant */}
                    {Object.entries(mainBreakdownData).map(
                      ([component, pct]) => {
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
                      }
                    )}
                  </tbody>
                </table>
              </div>
              <div className="chart-container">
                <canvas id="budgetChart" ref={canvasRef}></canvas>
              </div>
            </div>
            <div id="detailedBreakdownSection">
              <h3 style={{ margin: "3rem 0 1rem", textAlign: "center" }}>
                Detailed Component Breakdown
              </h3>
              <div id="detailedComponents" className="detailed-breakdown-grid">
                {/* FIXED: Now iterates over the mainBreakdownData constant */}
                {Object.entries(mainBreakdownData).map(([component, pct]) => {
                  const componentCost = (totalCost * pct) / 100;
                  // FIXED: Correctly references the detailedBreakdownData constant
                  const details = detailedBreakdownData[component];
                  return (
                    <div key={component} className="component-card">
                      <h3>{component} Details</h3>
                      <table>
                        <tbody>
                          {Object.entries(details).map(([sub, subPct]) => {
                            const subCost = (componentCost * subPct) / 100;
                            return (
                              <tr key={sub}>
                                <td>{sub}</td>
                                <td className="text-right">
                                  {subCost.toLocaleString("en-IN", {
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
                  );
                })}
              </div>
            </div>
            <div className="action-buttons" id="actionButtons">
              <button id="downloadPdfBtn" className="btn" onClick={downloadPdf}>
                <i className="fas fa-file-pdf"></i> Download PDF
              </button>
              <button
                id="shareBudget"
                className="btn btn-secondary"
                onClick={shareBudget}
              >
                <i className="fas fa-share-alt"></i> Share Budget
              </button>
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
