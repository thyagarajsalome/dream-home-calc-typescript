import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Chart from "../../components/ui/Chart";
import { formatCurrency } from "../../utils/currency";

interface InteriorCalculatorProps {
  hasPaid: boolean;
}

const QUALITY_RATES = {
  basic: {
    name: "Basic",
    rate: 800,
    description: "Essential furniture, basic finishes, and standard lighting.",
  },
  standard: {
    name: "Standard",
    rate: 1500,
    description: "Good quality materials, modular kitchen, wardrobes, and improved finishes.",
  },
  premium: {
    name: "Premium",
    rate: 2500,
    description: "High-end materials, custom furniture, advanced lighting, and luxury finishes.",
  },
};

const INTERIOR_BREAKDOWN = {
  "Modular Kitchen": 30,
  Wardrobes: 25,
  Furniture: 20,
  "False Ceiling & Lighting": 15,
  "Painting & Finishes": 10,
};

const CHART_COLORS = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594", "#A99A86"];

const InteriorCalculator: React.FC<InteriorCalculatorProps> = ({ hasPaid }) => {
  const { user } = useUser(); // Kept for safety, though hook handles check
  const { saveProject, downloadPDF, isSaving, isDownloading } = useProjectActions("interior");
  const location = useLocation();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [area, setArea] = useState("1200");
  const [quality, setQuality] = useState<keyof typeof QUALITY_RATES>("standard");

  // Load from nav state
  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.area && data.quality && !data.doorCount) {
        setArea(data.area);
        setQuality(data.quality);
      }
    }
  }, [location]);

  // Reactive Logic
  const parsedArea = parseFloat(area) || 0;
  const totalCost = parsedArea * QUALITY_RATES[quality].rate;

  const handleSave = () => {
    saveProject({
      area,
      quality,
      breakdown: INTERIOR_BREAKDOWN // Saving the breakdown % logic reference
    }, totalCost);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <section>
        <Card title="Interior Requirements">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <Input
              label="Total Built-up Area (sq. ft.)"
              icon="fas fa-ruler-combined"
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Quality of Finish</label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(QUALITY_RATES).map(([key, { name, description }]) => (
                  <label 
                    key={key} 
                    className={`
                      relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${quality === key ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <input
                      type="radio"
                      name="quality"
                      value={key}
                      checked={quality === key}
                      onChange={() => setQuality(key as keyof typeof QUALITY_RATES)}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="ml-3">
                      <span className={`block text-sm font-bold ${quality === key ? 'text-primary' : 'text-gray-900'}`}>
                        {name}
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">{description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Card>
      </section>

      <section ref={resultsRef}>
        {totalCost > 0 ? (
          <Card title="Interior Budget Estimate" className="border-primary/20 shadow-glow relative">
            <div className="text-center py-6">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Estimated Budget</p>
                <h2 className="text-4xl font-extrabold text-secondary tracking-tight">{formatCurrency(totalCost)}</h2>
            </div>

            <div className="space-y-6">
              {/* Breakdown Table */}
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Component</th>
                      <th className="px-4 py-3">Allocation</th>
                      <th className="px-4 py-3 text-right">Approx Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(INTERIOR_BREAKDOWN).map(([component, percentage]) => {
                      const cost = (totalCost * percentage) / 100;
                      return (
                        <tr key={component}>
                          <td className="px-4 py-3 font-medium">{component}</td>
                          <td className="px-4 py-3 text-gray-500">{percentage}%</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(cost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Chart */}
              <div className="h-64">
                <Chart data={INTERIOR_BREAKDOWN} colors={CHART_COLORS} />
              </div>

              {/* Actions */}
              {hasPaid && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => downloadPDF(resultsRef, `interior-estimate-${area}sqft`)}
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
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
            <i className="fas fa-couch text-4xl mb-4 text-gray-300"></i>
            <p>Enter details to view estimate</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default InteriorCalculator;