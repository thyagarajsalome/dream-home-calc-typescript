// src/features/construction/PlumbingCalculator.tsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useProjectActions } from "../../hooks/useProjectActions";
import Chart from "../../components/ui/Chart";
import { useUser } from "../../context/UserContext";

const unitRates = {
  kitchen: { name: "Kitchen (Sink + Taps)", rate: 12000 },
  commonBath: { name: "Common Bathroom (Basic)", rate: 25000 },
  masterBath: { name: "Master Bathroom (Premium)", rate: 45000 },
  motor: { name: "Motor & Pump Installation", rate: 15000 },
};

const qualityMultipliers = {
  basic: { name: "Basic (PVC/Chrome Plated)", factor: 0.8 },
  standard: { name: "Standard (Jaguar/Parryware)", factor: 1.0 },
  premium: { name: "Premium (Grohe/Kohler)", factor: 1.8 },
};

const chartColors = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const PlumbingCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const location = useLocation();
  const { saveProject, downloadPDF, isSaving, isDownloading } = useProjectActions("plumbing");

  const [kitchens, setKitchens] = useState("1");
  const [commonBaths, setCommonBaths] = useState("1");
  const [masterBaths, setMasterBaths] = useState("1");
  const [includeMotor, setIncludeMotor] = useState(true);
  const [quality, setQuality] = useState<keyof typeof qualityMultipliers>("standard");
  const [totalCost, setTotalCost] = useState(0);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.kitchens && data.commonBaths) {
        setKitchens(data.kitchens);
        setCommonBaths(data.commonBaths);
        setMasterBaths(data.masterBaths);
        setIncludeMotor(data.includeMotor);
        setQuality(data.quality);
      }
    }
  }, [location]);

  const handleSave = () => {
    saveProject({ kitchens, commonBaths, masterBaths, includeMotor, quality, breakdown: costBreakdown }, totalCost);
  };

  const calculateCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const kCount = parseInt(kitchens) || 0;
    const cCount = parseInt(commonBaths) || 0;
    const mCount = parseInt(masterBaths) || 0;
    const factor = qualityMultipliers[quality].factor;

    const kitchenCost = kCount * unitRates.kitchen.rate * factor;
    const commonBathCost = cCount * unitRates.commonBath.rate * factor;
    const masterBathCost = mCount * unitRates.masterBath.rate * factor;
    const motorCost = includeMotor ? unitRates.motor.rate : 0;

    const total = kitchenCost + commonBathCost + masterBathCost + motorCost;

    const piping = total * 0.35;
    const fixtures = total * 0.4;
    const labor = total * 0.25;

    setCostBreakdown({
      kitchen: kitchenCost,
      common: commonBathCost,
      master: masterBathCost,
      motor: motorCost,
      piping,
      fixtures,
      labor,
    });
    setTotalCost(total);
  };

  const isLocked = !hasPaid;

  return (
    <section id="plumbing-calculator" className="container">
      <div className="card">
        <h2 className="section-title">Plumbing Cost Calculator</h2>
        {isLocked && (
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ color: "var(--danger-color)", fontWeight: "600" }}>
              <i className="fas fa-lock"></i> Upgrade to Pro to use the Room-wise estimator.
            </p>
          </div>
        )}
        <form onSubmit={calculateCost}>
          <div className="form-grid">
            <div className="form-group">
              <label><i className="fas fa-utensils"></i> Kitchens / Utility</label>
              <input type="number" value={kitchens} onChange={(e) => setKitchens(e.target.value)} min="0" disabled={isLocked} />
            </div>
            <div className="form-group">
              <label><i className="fas fa-bath"></i> Master Bathrooms</label>
              <input type="number" value={masterBaths} onChange={(e) => setMasterBaths(e.target.value)} min="0" disabled={isLocked} />
            </div>
            <div className="form-group">
              <label><i className="fas fa-toilet"></i> Common Bathrooms</label>
              <input type="number" value={commonBaths} onChange={(e) => setCommonBaths(e.target.value)} min="0" disabled={isLocked} />
            </div>
            <div className="form-group">
              <label><i className="fas fa-gem"></i> Fixture Quality</label>
              <select value={quality} onChange={(e) => setQuality(e.target.value as any)} disabled={isLocked}>
                {Object.entries(qualityMultipliers).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="checkbox-wrapper">
              <input type="checkbox" checked={includeMotor} onChange={(e) => setIncludeMotor(e.target.checked)} disabled={isLocked} style={{ width: "auto", marginRight: "10px" }} />
              <label style={{ display: "inline" }}>Include Overhead Tank & Motor Pump</label>
            </div>
          </div>
          <button type="submit" className="btn full-width" disabled={isLocked}>
            <i className="fas fa-calculator"></i> Calculate Estimate
          </button>
        </form>

        {totalCost > 0 && costBreakdown && (
          <div id="resultsSection" className="visible">
            <div className="card" ref={resultsRef}>
              <div className="total-summary" style={{ marginTop: "2rem" }}>
                <p>Total Plumbing Estimate</p>
                <span>{totalCost.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</span>
              </div>
              <div className="results-grid">
                <div className="result-details">
                  <h3>Cost Allocation</h3>
                  <table>
                    <thead><tr><th>Item</th><th>Est. Cost</th></tr></thead>
                    <tbody>
                      <tr><td>Master Bathrooms ({masterBaths})</td><td className="text-right">₹{Math.round(costBreakdown.master).toLocaleString()}</td></tr>
                      <tr><td>Common Bathrooms ({commonBaths})</td><td className="text-right">₹{Math.round(costBreakdown.common).toLocaleString()}</td></tr>
                      <tr><td>Kitchens ({kitchens})</td><td className="text-right">₹{Math.round(costBreakdown.kitchen).toLocaleString()}</td></tr>
                      {costBreakdown.motor > 0 && (<tr><td>Motor & Tank</td><td className="text-right">₹{Math.round(costBreakdown.motor).toLocaleString()}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="chart-container">
                  <Chart
                    data={{
                      "Fixtures (Taps/Sanitary)": costBreakdown.fixtures,
                      "Pipes & Fittings (CPVC)": costBreakdown.piping,
                      "Labor Charges": costBreakdown.labor,
                    }}
                    colors={chartColors}
                  />
                </div>
              </div>
              {hasPaid && (
                <div className="action-buttons">
                  <button 
                    className="btn" 
                    onClick={() => downloadPDF(resultsRef, "plumbing-estimate")} 
                    disabled={isDownloading}
                  >
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

export default PlumbingCalculator;