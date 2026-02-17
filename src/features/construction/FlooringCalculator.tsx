import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input"; // Assuming Input can handle numbers
import Chart from "../../components/ui/Chart";
import { formatCurrency } from "../../utils/currency";

// --- Constants & Business Logic ---
const FLOORING_TYPES = {
  vitrified: { name: "Vitrified Tiles (Standard)", rate: 120, wastage: 0.1 },
  gvt: { name: "GVT / PGVT (High Gloss)", rate: 180, wastage: 0.1 },
  marble: { name: "Indian Marble", rate: 250, wastage: 0.15 },
  granite: { name: "Granite", rate: 350, wastage: 0.1 },
  wood: { name: "Wooden Laminate", rate: 150, wastage: 0.05 },
};

const CHART_COLORS = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const FlooringCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const { saveProject, downloadPDF, isSaving, isDownloading } = useProjectActions("flooring");
  const location = useLocation();
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [area, setArea] = useState("");
  const [flooringType, setFlooringType] = useState<keyof typeof FLOORING_TYPES>("vitrified");
  const [includeSkirting, setIncludeSkirting] = useState(true);
  
  // --- Derived State (Reactive Calculation) ---
  const parsedArea = parseFloat(area) || 0;
  
  // Calculate breakdown only if area exists
  const breakdown = React.useMemo(() => {
    if (parsedArea === 0) return null;

    const selectedType = FLOORING_TYPES[flooringType];
    const materialArea = parsedArea * (1 + selectedType.wastage);
    const materialCost = materialArea * selectedType.rate;
    const laborRate = flooringType === "marble" || flooringType === "granite" ? 60 : 35;
    const laborCost = parsedArea * laborRate;

    let skirtingCost = 0;
    let skirtingLen = 0;

    if (includeSkirting) {
      skirtingLen = Math.sqrt(parsedArea) * 4;
      skirtingCost = skirtingLen * (selectedType.rate * 0.8 + 20);
    }

    const suppliesCost = parsedArea * 25;
    const total = materialCost + laborCost + skirtingCost + suppliesCost;

    return {
      material: materialCost,
      labor: laborCost,
      skirting: skirtingCost,
      supplies: suppliesCost,
      skirtingLen: Math.round(skirtingLen),
      wastageArea: Math.round(materialArea - parsedArea),
      totalCost: total
    };
  }, [parsedArea, flooringType, includeSkirting]);

  // Load data from navigation state if available
  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.flooringType) {
        setArea(data.area);
        setFlooringType(data.flooringType);
        setIncludeSkirting(data.includeSkirting);
      }
    }
  }, [location]);

  const handleSave = () => {
    if (breakdown) {
      saveProject({
        area,
        flooringType,
        includeSkirting,
        breakdown
      }, breakdown.totalCost);
    }
  };

  const isLocked = !hasPaid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* --- Left Column: Inputs --- */}
      <section>
        <Card title="Flooring Details">
          {isLocked && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold text-center">
              <i className="fas fa-lock mr-2"></i> Upgrade to Pro for detailed Flooring estimates.
            </div>
          )}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <Input
              label="Carpet Area (sq. ft.)"
              icon="fas fa-ruler-combined"
              type="number"
              placeholder="e.g., 800"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              disabled={isLocked}
            />

            {/* Custom Select for Material Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Material Type</label>
              <div className="relative">
                <i className="fas fa-layer-group absolute left-3 top-3.5 text-gray-400"></i>
                <select
                  value={flooringType}
                  onChange={(e) => setFlooringType(e.target.value as any)}
                  disabled={isLocked}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors appearance-none"
                >
                  {Object.entries(FLOORING_TYPES).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-4 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Skirting Checkbox */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSkirting}
                  onChange={(e) => setIncludeSkirting(e.target.checked)}
                  disabled={isLocked}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="ml-3 text-gray-700 font-medium">Include Skirting (4" Wall Borders)</span>
              </label>
            </div>
          </form>
        </Card>
      </section>

      {/* --- Right Column: Results --- */}
      <section ref={resultsRef}>
        {breakdown && breakdown.totalCost > 0 ? (
          <Card title="Flooring Cost Estimate" className="border-primary/20 shadow-glow relative">
             <div className="text-center py-6">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Estimate</p>
                <h2 className="text-4xl font-extrabold text-secondary tracking-tight">{formatCurrency(breakdown.totalCost)}</h2>
            </div>

            <div className="space-y-6">
              {/* Breakdown Table */}
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Component</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Details</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 font-medium">Material</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">Incl. {breakdown.wastageArea} sq.ft wastage</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(breakdown.material)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Labor</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">Installation charges</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(breakdown.labor)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Supplies</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">Cement, Sand, Grout</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(breakdown.supplies)}</td>
                    </tr>
                    {breakdown.skirting > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-medium">Skirting</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">Approx {breakdown.skirtingLen} R.ft</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(breakdown.skirting)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Chart */}
              <div className="h-64">
                <Chart
                  data={{
                    Material: breakdown.material,
                    Labor: breakdown.labor,
                    Supplies: breakdown.supplies,
                    Skirting: breakdown.skirting,
                  }}
                  colors={CHART_COLORS}
                />
              </div>

              {/* Actions */}
              {hasPaid && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => downloadPDF(resultsRef, `flooring-estimate-${area}sqft`)}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300"
                  >
                    <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                    <span>{isDownloading ? "Processing..." : "Download PDF"}</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all duration-300 shadow-float transform active:scale-95"
                  >
                    <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                    <span>{isSaving ? "Save" : "Save Project"}</span>
                  </button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
            <i className="fas fa-layer-group text-4xl mb-4 text-gray-300"></i>
            <p>Enter carpet area to view estimate</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default FlooringCalculator;