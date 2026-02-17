import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Chart from "../../components/ui/Chart";
import { formatCurrency } from "../../utils/currency";


const PAINT_TYPES = {
  distemper: { name: "Distemper (Economy)", rate: 22 },
  emulsion: { name: "Tractor Emulsion (Std)", rate: 38 },
  royal: { name: "Royal/Premium Emulsion", rate: 55 },
  texture: { name: "Texture Paint (Highlight)", rate: 120 },
};

const PROCESS_TYPES = {
  repaint: { name: "Repainting (Touchup + 2 Coats)", factor: 1.0 },
  fresh: { name: "Fresh Painting (Putty + Primer + 2 Coats)", factor: 1.6 },
};

const CHART_COLORS = ["#D9A443", "#59483B", "#8C6A4E", "#C4B594"];

const PaintingCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const { saveProject, downloadPDF, isSaving, isDownloading } = useProjectActions("painting");
  const location = useLocation();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [carpetArea, setCarpetArea] = useState("");
  const [wallArea, setWallArea] = useState("");
  const [includeCeiling, setIncludeCeiling] = useState(true);
  const [paintType, setPaintType] = useState<keyof typeof PAINT_TYPES>("emulsion");
  const [process, setProcess] = useState<keyof typeof PROCESS_TYPES>("repaint");
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const area = parseFloat(carpetArea);
    if (!isNaN(area)) {
      const walls = area * 3;
      const ceiling = includeCeiling ? area : 0;
      setWallArea(Math.round(walls + ceiling).toString());
    }
  }, [carpetArea, includeCeiling]);

  // Load nav state
  useEffect(() => {
    if (location.state && (location.state as any).projectData) {
      const data = (location.state as any).projectData;
      if (data.paintType) {
        setCarpetArea(data.carpetArea);
        setPaintType(data.paintType);
      }
    }
  }, [location]);

  const calculateCost = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedArea = parseFloat(wallArea) || 0;
    const cost = parsedArea * PAINT_TYPES[paintType].rate * PROCESS_TYPES[process].factor;
    setTotalCost(cost);
  };

  const handleSave = () => {
    saveProject({
      carpetArea,
      wallArea,
      paintType,
      process,
      includeCeiling
    }, totalCost);
  };

  const isLocked = !hasPaid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <section>
        <Card title="Painting Estimator">
          {isLocked && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold text-center">
              <i className="fas fa-lock mr-2"></i> Pro Feature
            </div>
          )}
          <form onSubmit={calculateCost} className="space-y-6">
            <Input label="Carpet Area (sq.ft)" type="number" value={carpetArea} onChange={(e) => setCarpetArea(e.target.value)} disabled={isLocked} />
            <Input label="Total Paintable Area (Auto)" type="number" value={wallArea} onChange={(e) => setWallArea(e.target.value)} disabled={isLocked} />
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={includeCeiling} onChange={(e) => setIncludeCeiling(e.target.checked)} disabled={isLocked} className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" />
                <span className="ml-3 text-gray-700">Include Ceiling</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Paint Type</label>
              <select value={paintType} onChange={(e) => setPaintType(e.target.value as any)} disabled={isLocked} className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white">
                {Object.entries(PAINT_TYPES).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Process</label>
              <select value={process} onChange={(e) => setProcess(e.target.value as any)} disabled={isLocked} className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white">
                {Object.entries(PROCESS_TYPES).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-md" disabled={isLocked}>Calculate</button>
          </form>
        </Card>
      </section>

      {totalCost > 0 && (
        <section ref={resultsRef}>
          <Card title="Painting Estimate" className="border-primary/20">
            <div className="text-center py-6 bg-gray-50 rounded-xl mb-6">
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">Estimated Cost</p>
              <h2 className="text-4xl font-extrabold text-secondary">{formatCurrency(totalCost)}</h2>
            </div>
            
            <div className="h-64 mb-6">
              <Chart data={{ "Paint Material": 45, "Putty & Primer": process === "fresh" ? 25 : 10, Labor: process === "fresh" ? 30 : 45 }} colors={CHART_COLORS} />
            </div>

            {hasPaid && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => downloadPDF(resultsRef, "painting-estimate")} disabled={isDownloading} className="py-3 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all">Download PDF</button>
                <button onClick={handleSave} disabled={isSaving} className="py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all">Save Project</button>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
};

export default PaintingCalculator;