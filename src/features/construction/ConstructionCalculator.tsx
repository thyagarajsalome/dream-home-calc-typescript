import React, { useState, useEffect, useRef } from "react";
import { useProjectActions } from "../../hooks/useProjectActions";
import { useUser } from "../../context/UserContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Chart from "../../components/ui/Chart"; // Ensure Chart is moved to components/ui
import { formatCurrency } from "src/utils/currency.ts";

// Constants (Business Logic)
const PARKING_RATE_FACTOR = 0.7;
const COMPOUND_WALL_RATE = 800;
const SUMP_TANK_COST = { basic: 150000, standard: 200000, premium: 250000 };
const QUALITY_RATES = { basic: 1500, standard: 2000, premium: 2800 };
const BREAKDOWN_PERCENTAGES = {
  Foundation: 15,
  Structure: 35,
  Roofing: 10,
  Finishing: 25,
  "Services (Elec/Plumb)": 15,
};
const CHART_COLORS = ["#D9A443", "#59483B", "#8C6A4E", "#D9A443", "#C4B594"];

export const ConstructionCalculator = () => {
  const { hasPaid } = useUser();
  const { saveProject, downloadPDF, isSaving, isDownloading } = useProjectActions("construction");
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- State Management ---
  const [area, setArea] = useState("");
  const [parkingArea, setParkingArea] = useState("");
  const [compoundWallLength, setCompoundWallLength] = useState("");
  const [includeSump, setIncludeSump] = useState(false);
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">("basic");
  
  // Custom Rate Logic
  const [customRate, setCustomRate] = useState<number>(QUALITY_RATES.basic);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Update rate when quality changes, unless user is manually editing
  useEffect(() => {
    if (!isEditingRate) {
      setCustomRate(QUALITY_RATES[quality]);
    }
  }, [quality, isEditingRate]);

  // --- Business Logic / Calculations (Reactive) ---
  const parsedArea = parseFloat(area) || 0;
  const parsedParking = parseFloat(parkingArea) || 0;
  const parsedWall = parseFloat(compoundWallLength) || 0;

  const costs = {
    main: parsedArea * customRate,
    parking: parsedParking * (customRate * PARKING_RATE_FACTOR),
    wall: parsedWall * COMPOUND_WALL_RATE,
    sump: includeSump ? SUMP_TANK_COST[quality] : 0,
  };

  const totalCost = costs.main + costs.parking + costs.wall + costs.sump;

  // Prepare Breakdown Data for Chart/Table
  const breakdownData = Object.fromEntries(
    Object.entries(BREAKDOWN_PERCENTAGES).map(([key, percent]) => [
      key,
      (costs.main * percent) / 100,
    ])
  );

  const handleSave = () => {
    saveProject({
      area,
      parkingArea,
      compoundWallLength,
      includeSump,
      quality,
      rate: customRate,
      breakdown: costs
    }, totalCost);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* --- Left Column: Inputs --- */}
      <section className="space-y-6">
        <Card title="Project Details">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* Area Inputs */}
            <div className="space-y-4">
              <Input
                label="Living Area (sq. ft.)"
                type="number"
                icon="fas fa-home"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                autoFocus
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Parking Area (sq. ft.)"
                  type="number"
                  icon="fas fa-car"
                  value={parkingArea}
                  onChange={(e) => setParkingArea(e.target.value)}
                />
                <Input
                  label="Compound Wall (ft)"
                  type="number"
                  icon="fas fa-border-all"
                  value={compoundWallLength}
                  onChange={(e) => setCompoundWallLength(e.target.value)}
                />
              </div>
            </div>

            {/* Quality Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Construction Quality</label>
              <div className="grid grid-cols-3 gap-3">
                {(["basic", "standard", "premium"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                        setQuality(q);
                        setIsEditingRate(false);
                    }}
                    disabled={q === "premium" && !hasPaid}
                    className={`
                      py-3 rounded-xl border-2 font-medium capitalize transition-all flex items-center justify-center
                      ${quality === q
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}
                      ${q === "premium" && !hasPaid ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {q} {q === "premium" && !hasPaid && <i className="fas fa-lock ml-2 text-xs" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSump}
                    onChange={(e) => setIncludeSump(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Include Sump & Septic Tank</span>
                </label>
                {includeSump && <span className="text-sm font-bold text-primary">+{formatCurrency(SUMP_TANK_COST[quality])}</span>}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-600">Construction Rate</span>
                  <button 
                    type="button"
                    onClick={() => setIsEditingRate(!isEditingRate)}
                    className="text-xs text-primary hover:underline text-left"
                  >
                    {isEditingRate ? "Reset Default" : "Edit Rate"}
                  </button>
                </div>
                <div className="relative w-32">
                   <input
                    type="number"
                    value={customRate}
                    onChange={(e) => {
                      setCustomRate(parseFloat(e.target.value));
                      setIsEditingRate(true);
                    }}
                    disabled={!isEditingRate}
                    className={`w-full p-2 text-right font-bold border rounded-lg ${isEditingRate ? 'border-primary bg-white' : 'border-transparent bg-transparent'}`}
                  />
                  <span className="absolute right-8 top-2 text-xs text-gray-400 pointer-events-none">₹/sq.ft</span>
                </div>
              </div>
            </div>

          </form>
        </Card>
      </section>

      {/* --- Right Column: Results --- */}
      <section ref={resultsRef} className="space-y-6">
        {totalCost > 0 ? (
          <>
            {/* Total Cost Card */}
            <Card className="border-primary/30 shadow-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <i className="fas fa-coins text-8xl text-primary transform rotate-12"></i>
                </div>
                <div className="text-center py-4 relative z-10">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Estimated Project Cost</p>
                    <h2 className="text-5xl font-extrabold text-secondary tracking-tight">{formatCurrency(totalCost)}</h2>
                </div>
            </Card>

            {/* Breakdown Table */}
            <Card title="Cost Breakdown">
                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-3">Main Construction</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(costs.main)}</td>
                            </tr>
                            {costs.parking > 0 && (
                                <tr>
                                    <td className="px-4 py-3 text-gray-600">Parking / Utility</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.parking)}</td>
                                </tr>
                            )}
                            {costs.wall > 0 && (
                                <tr>
                                    <td className="px-4 py-3 text-gray-600">Compound Wall</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.wall)}</td>
                                </tr>
                            )}
                             {costs.sump > 0 && (
                                <tr>
                                    <td className="px-4 py-3 text-gray-600">Sump & Septic</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.sump)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Chart Section */}
                <div className="mt-8 h-64">
                    <Chart data={breakdownData} colors={CHART_COLORS} />
                </div>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              {hasPaid && (
                <button
                  onClick={() => downloadPDF(resultsRef, `Estimate-${area}sqft`)}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300 shadow-sm"
                >
                  <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                  <span>{isDownloading ? "Processing..." : "Download PDF"}</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all duration-300 shadow-float transform active:scale-95"
              >
                <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                <span>{isSaving ? "Saving..." : "Save Project"}</span>
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-hard-hat text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-400">Ready to Estimate</h3>
            <p className="text-gray-400 mt-2 max-w-xs">Enter your plot details on the left to generate a comprehensive cost report.</p>
          </div>
        )}
      </section>
    </div>
  );
};