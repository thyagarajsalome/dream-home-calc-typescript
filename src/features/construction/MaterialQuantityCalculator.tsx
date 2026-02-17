import React, { useState, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatCurrency } from "../../utils/currency";

const WALL_TYPES = {
  redBrick: { name: "Red Bricks", cementFactor: 1.0, countPerSqFt: 12 },
  flyAsh: { name: "Fly Ash Bricks", cementFactor: 0.9, countPerSqFt: 11 },
  aac: { name: "AAC Blocks", cementFactor: 0.5, countPerSqFt: 8 },
};

const DEFAULT_PRICES = { cement: 400, steel: 65, sand: 60, aggregate: 40, paint: 350, tiles: 600, bricks: 10 };

const MaterialQuantityCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const { saveProject, downloadPDF, isSaving, isDownloading } = useProjectActions("materials");
  const resultsRef = useRef<HTMLDivElement>(null);

  const [area, setArea] = useState("");
  const [wallType, setWallType] = useState<keyof typeof WALL_TYPES>("redBrick");
  const [results, setResults] = useState<any>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(area) || 0;
    if (a === 0) return;

    const w = WALL_TYPES[wallType];
    const cement = a * 0.45;
    const steel = a * 4;
    const sand = a * 1.8;
    const walls = a * w.countPerSqFt;
    
    const cost = (cement * DEFAULT_PRICES.cement) + (steel * DEFAULT_PRICES.steel) + (sand * DEFAULT_PRICES.sand) + (walls * DEFAULT_PRICES.bricks);

    setResults({ cement, steel, sand, walls, wallTypeName: w.name, totalCost: cost });
  };

  const handleSave = () => {
    if (results) saveProject({ area, wallType, ...results }, results.totalCost);
  };

  const isLocked = !hasPaid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <section>
        <Card title="Material BOQ Estimator">
          {isLocked && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-bold">Pro Feature Locked</div>}
          <form onSubmit={calculate} className="space-y-6">
            <Input label="Built-up Area (sq.ft)" type="number" value={area} onChange={e => setArea(e.target.value)} disabled={isLocked} />
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Wall Material</label>
              <select value={wallType} onChange={e => setWallType(e.target.value as any)} disabled={isLocked} className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white">
                {Object.entries(WALL_TYPES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={isLocked} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-yellow-600 transition-all">Calculate Quantities</button>
          </form>
        </Card>
      </section>

      {results && (
        <section ref={resultsRef}>
          <Card title="Material Quantities" className="border-primary/20">
            <div className="text-center py-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase">Approx Material Cost</p>
                <h2 className="text-3xl font-extrabold text-secondary">{formatCurrency(results.totalCost)}</h2>
            </div>
            <table className="w-full text-sm text-left mb-6">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                <tr><th className="px-4 py-2">Item</th><th className="px-4 py-2 text-right">Quantity</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2">Cement (Bags)</td><td className="px-4 py-2 text-right">{Math.round(results.cement)}</td></tr>
                <tr><td className="px-4 py-2">Steel (kg)</td><td className="px-4 py-2 text-right">{Math.round(results.steel)}</td></tr>
                <tr><td className="px-4 py-2">Sand (cft)</td><td className="px-4 py-2 text-right">{Math.round(results.sand)}</td></tr>
                <tr><td className="px-4 py-2">{results.wallTypeName}</td><td className="px-4 py-2 text-right">{Math.round(results.walls)}</td></tr>
              </tbody>
            </table>
            {hasPaid && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => downloadPDF(resultsRef, "boq-estimate")} disabled={isDownloading} className="py-3 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white">PDF</button>
                <button onClick={handleSave} disabled={isSaving} className="py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600">Save</button>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
};

export default MaterialQuantityCalculator;