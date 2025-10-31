// src/components/DoorsWindowsCalculator.tsx

import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- ADD 'hasPaid' to the component's props ---
interface DoorsWindowsCalculatorProps {
  hasPaid: boolean;
}

const doorTypes = {
  flush: { name: "Flush Door (Laminate)", rate: 7000 },
  panel: { name: "Panel Door (Moulded)", rate: 10000 },
  teak: { name: "Teak Wood (Main Door)", rate: 40000 },
};

const windowTypes = {
  aluminum: { name: "Aluminum Frame", rate: 450 },
  upvc: { name: "UPVC Frame", rate: 600 },
  wood: { name: "Wooden Frame", rate: 1200 },
};

// --- Accept 'hasPaid' prop ---
const DoorsWindowsCalculator: React.FC<DoorsWindowsCalculatorProps> = ({
  hasPaid,
}) => {
  // Door States
  const [doorCount, setDoorCount] = useState("5");
  const [doorType, setDoorType] = useState<keyof typeof doorTypes>("flush");

  // Window States
  const [windowCount, setWindowCount] = useState("4");
  const [windowWidth, setWindowWidth] = useState("5");
  const [windowHeight, setWindowHeight] = useState("4");
  const [windowType, setWindowType] =
    useState<keyof typeof windowTypes>("upvc");

  // Cost States
  const [totalCost, setTotalCost] = useState(0);
  const [doorCost, setDoorCost] = useState(0);
  const [windowCost, setWindowCost] = useState(0);

  // --- ADDITIONS FOR PDF ---
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
          pdf.save("doors-windows-cost-estimate.pdf");
          setIsDownloading(false);
        }
      );
    }
  };
  // --- END OF ADDITIONS ---

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numDoors = parseInt(doorCount) || 0;
    const dCost = numDoors * doorTypes[doorType].rate;
    setDoorCost(dCost);

    const numWindows = parseInt(windowCount) || 0;
    const width = parseFloat(windowWidth) || 0;
    const height = parseFloat(windowHeight) || 0;
    const totalArea = numWindows * width * height;
    const wCost = totalArea * windowTypes[windowType].rate;
    setWindowCost(wCost);

    setTotalCost(dCost + wCost);
  };

  return (
    <section id="doors-windows-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Doors & Windows Calculator</h2>
        <form onSubmit={calculateCost}>
          {/* Doors Section */}
          <fieldset className="form-fieldset">
            <legend>Doors</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="doorCount">Number of Doors</label>
                <input
                  type="number"
                  id="doorCount"
                  value={doorCount}
                  onChange={(e) => setDoorCount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="doorType">Door Material & Type</label>
                <select
                  id="doorType"
                  value={doorType}
                  onChange={(e) =>
                    setDoorType(e.target.value as keyof typeof doorTypes)
                  }
                >
                  {Object.entries(doorTypes).map(([key, { name }]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Windows Section */}
          <fieldset className="form-fieldset">
            <legend>Windows</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="windowCount">Number of Windows</label>
                <input
                  type="number"
                  id="windowCount"
                  value={windowCount}
                  onChange={(e) => setWindowCount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="windowWidth">Average Width (ft)</label>
                <input
                  type="number"
                  id="windowWidth"
                  value={windowWidth}
                  onChange={(e) => setWindowWidth(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="windowHeight">Average Height (ft)</label>
                <input
                  type="number"
                  id="windowHeight"
                  value={windowHeight}
                  onChange={(e) => setWindowHeight(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="windowType">Window Material</label>
                <select
                  id="windowType"
                  value={windowType}
                  onChange={(e) =>
                    setWindowType(e.target.value as keyof typeof windowTypes)
                  }
                >
                  {Object.entries(windowTypes).map(([key, { name }]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <button type="submit" className="btn full-width">
            Calculate Cost
          </button>
        </form>

        {totalCost > 0 && (
          // --- ATTACH REF HERE ---
          <div id="resultsSection" className="visible" ref={resultsRef}>
            <div className="total-summary">
              <p>Total Estimated Doors & Windows Cost</p>
              <span>
                {totalCost.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="loan-results-summary">
              <div className="loan-result-item">
                <p>Total Door Cost</p>
                <span>
                  {doorCost.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="loan-result-item">
                <p>Total Window Cost</p>
                <span>
                  {windowCost.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
            {/* --- ADD CONDITIONAL PDF BUTTON --- */}
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
              </div>
            )}
            {/* --- END OF ADDITION --- */}
          </div>
        )}
      </div>
    </section>
  );
};

export default DoorsWindowsCalculator;
