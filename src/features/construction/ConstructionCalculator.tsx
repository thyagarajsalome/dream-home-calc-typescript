// src/features/construction/ConstructionCalculator.tsx
import React, { useState, useEffect, useRef } from "react";
import { useProjectActions } from "../../hooks/useProjectActions";
import { useUser } from "../../context/UserContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Chart from "../../components/ui/Chart"; 
import { formatCurrency } from "../../utils/currency";

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

  const [area, setArea] = useState("");
  const [parkingArea, setParkingArea] = useState("");
  const [compoundWallLength, setCompoundWallLength] = useState("");
  const [includeSump, setIncludeSump] = useState(false);
  const [quality, setQuality] = useState<"basic" | "standard" | "premium">("basic");
  
  const [customRate, setCustomRate] = useState<number>(QUALITY_RATES.basic);
  const [isEditingRate, setIsEditingRate] = useState(false);

  useEffect(() => {
    if (!isEditingRate) {
      setCustomRate(QUALITY_RATES[quality]);
    }
  }, [quality, isEditingRate]);

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
    // FIX: Using items-start prevents columns from forcing equal height which causes gaps
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
      
      {/* --- Left Column: Inputs (Span 7/12) --- */}
      <section className="lg:col-span-7 space-y-6">
        <Card title="Project Details" className="shadow-soft">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Living Area (sq. ft.)"
                type="number"
                icon="fas fa-home"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                autoFocus
                className="text-lg"
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
                      py-3 rounded-xl border-2 font-medium capitalize transition-all flex flex-col items-center justify-center gap-1
                      ${quality === q
                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}
                      ${q === "premium" && !hasPaid ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}
                    `}
                  >
                    <span>{q}</span>
                    {q === "premium" && !hasPaid && <i className="fas fa-lock text-xs opacity-70" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSump}
                    onChange={(e) => setIncludeSump(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary accent-primary"
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
                    className={`w-full p-2 text-right font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isEditingRate ? 'border-primary bg-white' : 'border-transparent bg-transparent'}`}
                  />
                  <span className="absolute right-8 top-2 text-xs text-gray-400 pointer-events-none">₹/sq.ft</span>
                </div>
              </div>
            </div>
          </form>
        </Card>
      </section>

      {/* --- Right Column: Results (Span 5/12) --- */}
      {/* FIX: Sticky positioning ensures it stays visible while scrolling but doesn't overlap */}
      <section ref={resultsRef} className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        {totalCost > 0 ? (
          <>
            <Card className="border-primary/30 shadow-float relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i className="fas fa-coins text-9xl text-primary transform rotate-12"></i>
                </div>
                <div className="text-center py-6 relative z-10">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Estimated Total Cost</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-secondary tracking-tight">{formatCurrency(totalCost)}</h2>
                </div>
            </Card>

            <Card title="Breakdown" className="shadow-soft">
                <div className="overflow-hidden rounded-xl border border-gray-100 mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3 text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-3">Construction <span className="text-xs text-gray-400 block">({area} sq.ft)</span></td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(costs.main)}</td>
                            </tr>
                            {costs.parking > 0 && (
                                <tr>
                                    <td className="px-4 py-3">Parking <span className="text-xs text-gray-400 block">({parkingArea} sq.ft)</span></td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.parking)}</td>
                                </tr>
                            )}
                            {costs.wall > 0 && (
                                <tr>
                                    <td className="px-4 py-3">Compound Wall <span className="text-xs text-gray-400 block">({compoundWallLength} ft)</span></td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.wall)}</td>
                                </tr>
                            )}
                             {costs.sump > 0 && (
                                <tr>
                                    <td className="px-4 py-3">Sump & Septic</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.sump)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="h-64">
                    <Chart data={breakdownData} colors={CHART_COLORS} />
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {hasPaid && (
                <button
                  onClick={() => downloadPDF(resultsRef, `Estimate-${area}sqft`)}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300 shadow-sm"
                >
                  <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                  <span>PDF</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all duration-300 shadow-float transform active:scale-95 ${!hasPaid ? 'col-span-2' : ''}`}
              >
                <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                <span>{isSaving ? "Saving..." : "Save Project"}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <i className="fas fa-hard-hat text-3xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-400">Ready to Estimate</h3>
            <p className="text-gray-400 mt-2 text-sm max-w-[200px]">Enter your plot details to see the cost breakdown.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ConstructionCalculator;