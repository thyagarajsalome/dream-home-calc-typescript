import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Chart from "../../components/ui/Chart";
import { formatCurrency } from "../../utils/currency";

// ── Types & Constants ─────────────────────────────────────────────────────────
const FLOORING_TYPES = {
  vitrified: { name: "Vitrified Tiles (600×600)",       rate: 120, wastage: 0.10, labor: 35, desc: "Most popular choice. Durable, easy to maintain, available in endless designs.", pros: "Low maintenance, durable, variety of designs", cons: "Can be slippery when wet; grout needs sealing", thickness: "8–10mm", brand: "Kajaria / Somany / Johnson" },
  gvt:       { name: "GVT / PGVT (800×800 High Gloss)", rate: 200, wastage: 0.10, labor: 42, desc: "Glazed Vitrified — mirror-like gloss. Ideal for living rooms and lobbies.", pros: "Elegant finish, easy cleaning, stain resistant", cons: "Shows scratches over time, slippery", thickness: "10mm", brand: "Kajaria Eternity / Asian Granito" },
  marble:    { name: "Indian Marble (Rajasthani White)", rate: 280, wastage: 0.15, labor: 60, desc: "Timeless luxury with natural veining. Needs periodic sealing and polishing.", pros: "Premium look, cool underfoot, ages gracefully", cons: "Porous, stains from acids; needs polishing every 3–5 yrs", thickness: "18–20mm", brand: "Makrana / Kishangarh Marble" },
  granite:   { name: "Granite (Black / Multi-colour)",  rate: 380, wastage: 0.10, labor: 65, desc: "Extremely hard and scratch-resistant. Best for high-traffic areas.", pros: "Very durable, heat resistant, low maintenance", cons: "Heavy, cold underfoot, limited patterns", thickness: "18–20mm", brand: "Local Quarry / Gem Granites" },
  wood:      { name: "Wooden Laminate (AC4 Grade)",     rate: 160, wastage: 0.05, labor: 30, desc: "Warm aesthetic at an affordable price. Not suitable for wet areas.", pros: "Warm feel, easy installation, consistent pattern", cons: "Not waterproof, scratches, cannot be polished", thickness: "8–12mm", brand: "Pergo / Kronotex / Quick-Step" },
  hardwood:  { name: "Engineered Hardwood (Teak/Oak)",  rate: 450, wastage: 0.08, labor: 55, desc: "Real wood veneer over plywood core. Better moisture resistance than solid wood.", pros: "Natural wood look, can be sanded once, durable", cons: "Expensive, moderate moisture resistance", thickness: "12–15mm", brand: "Greenply / Xylos / Indo Teak" },
  epoxy:     { name: "Epoxy / 3D Floor Coating",        rate: 95,  wastage: 0.02, labor: 45, desc: "Seamless, hygienic surface ideal for garages, kitchens, and hospitals.", pros: "Seamless (no grout), chemical resistant, easy to clean", cons: "Slippery, cracks over time, UV yellowing", thickness: "3–5mm", brand: "Asian Paints Apcolite Epoxy / Sika" },
};

const TILE_PATTERNS = [
  { name: "Straight Lay",     wastage: "5–8%",  icon: "⬜", desc: "Simplest layout. Tiles aligned with room edges. Lowest wastage." },
  { name: "Diagonal (45°)",   wastage: "10–15%",icon: "◇",  desc: "Elegant, makes room feel larger. Higher wastage at edges." },
  { name: "Herringbone",      wastage: "12–18%",icon: "⬡",  desc: "Classic zigzag. Popular for wood floors and narrow corridors." },
  { name: "Staggered (Brick)",wastage: "8–10%", icon: "🧱", desc: "Each row offset by half a tile. Hides lippage effectively." },
];

const ROOM_SUGGESTIONS = [
  { room: "Living Room",  rec: "gvt",       reason: "High gloss GVT makes the space feel larger and luxurious." },
  { room: "Bedroom",      rec: "wood",      reason: "Wooden laminate adds warmth and a cozy, comfortable feel." },
  { room: "Kitchen",      rec: "vitrified", reason: "Matte vitrified tiles — easy to clean, anti-slip finish recommended." },
  { room: "Bathroom",     rec: "vitrified", reason: "Anti-skid vitrified (300×300). Look for R-rating R10 or above." },
  { room: "Terrace",      rec: "vitrified", reason: "Outdoor-rated anti-skid vitrified or stone finish tiles (30×30)." },
  { room: "Study/Office", rec: "wood",      reason: "Laminate or engineered wood — quiet, warm, professional look." },
];

const CHART_COLORS = ["#D9A443","#59483B","#8C6A4E","#C4B594"];

// ── Component ──────────────────────────────────────────────────────────────────
const FlooringCalculator: React.FC = () => {
  const { hasPaid }  = useUser();
  const { saveProject, downloadSpreadsheetPDF, isSaving, isDownloading } = useProjectActions("flooring");
  const location     = useLocation();

  const [area,           setArea]           = useState("");
  const [flooringType,   setFlooringType]   = useState<keyof typeof FLOORING_TYPES>("vitrified");
  const [includeSkirting,setIncludeSkirting]= useState(true);
  const [activeInfo,     setActiveInfo]     = useState<"specs"|"pattern"|"rooms">("specs");

  useEffect(() => {
    const state = (location.state as any)?.projectData;
    if (state?.flooringType) { setArea(state.area); setFlooringType(state.flooringType); setIncludeSkirting(state.includeSkirting); }
  }, [location]);

  const parsedArea = parseFloat(area) || 0;
  const ft         = FLOORING_TYPES[flooringType];

  const breakdown = useMemo(() => {
    if (parsedArea <= 0) return null;
    const materialArea  = parsedArea * (1 + ft.wastage);
    const materialCost  = materialArea * ft.rate;
    const laborCost     = parsedArea * ft.labor;
    const skirtingLen   = includeSkirting ? Math.sqrt(parsedArea) * 4 : 0;
    const skirtingCost  = includeSkirting ? skirtingLen * (ft.rate * 0.8 + 20) : 0;
    const suppliesCost  = parsedArea * 28;   // cement, sand, grout
    const polishingCost = (flooringType === "marble" || flooringType === "granite") ? parsedArea * 25 : 0;
    const total         = materialCost + laborCost + skirtingCost + suppliesCost + polishingCost;
    return { material: materialCost, labor: laborCost, skirting: skirtingCost, supplies: suppliesCost, polishing: polishingCost, skirtingLen: Math.round(skirtingLen), wastageArea: Math.round(materialArea - parsedArea), totalCost: total };
  }, [parsedArea, flooringType, includeSkirting, ft]);

  const handleSave = () => {
    if (breakdown) saveProject({ area, flooringType, includeSkirting, breakdown }, breakdown.totalCost);
  };

  const handleDownloadPDF = () => {
    if (!breakdown) return;
    const rows: [string,string,string][] = [
      ["Material",  `${Math.round(parsedArea * (1 + ft.wastage))} sqft (incl. ${breakdown.wastageArea} sqft wastage)`, formatCurrency(breakdown.material)],
      ["Labor",     "Installation charges",       formatCurrency(breakdown.labor)],
      ["Supplies",  "Cement, Sand, Grout, Spacers",formatCurrency(breakdown.supplies)],
    ];
    if (breakdown.skirting > 0)  rows.push(["Skirting",  `${breakdown.skirtingLen} R.ft`, formatCurrency(breakdown.skirting)]);
    if (breakdown.polishing > 0) rows.push(["Grinding & Polishing", `${parsedArea} sqft`, formatCurrency(breakdown.polishing)]);
    downloadSpreadsheetPDF(`Flooring-Estimate-${area}sqft`, ["Component","Details","Cost"], rows, "TOTAL ESTIMATE", formatCurrency(breakdown.totalCost));
  };

  const isLocked = !hasPaid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">

      {/* ── Left ── */}
      <div className="space-y-5">
        <Card title="Flooring Details">
          {isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold text-center">
              <i className="fas fa-lock mr-2"></i> Upgrade to Pro for detailed flooring estimates.
            </div>
          )}

          <form onSubmit={e => e.preventDefault()} className="space-y-5">
            <Input label="Carpet Area (sq. ft.)" icon="fas fa-ruler-combined" type="number" placeholder="e.g., 800" value={area} onChange={e => setArea(e.target.value)} disabled={isLocked} />

            {/* Flooring type grid */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Flooring Material</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(FLOORING_TYPES).map(([key, val]) => (
                  <label key={key}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${flooringType === key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="flooring" value={key} checked={flooringType === key} onChange={() => setFlooringType(key as any)} disabled={isLocked} className="mt-1 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">{val.name}</span>
                        <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">₹{val.rate}/sqft</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{val.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="flex items-center cursor-pointer select-none">
                <input type="checkbox" checked={includeSkirting} onChange={e => setIncludeSkirting(e.target.checked)} disabled={isLocked}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" />
                <span className="ml-3 text-gray-700 font-medium text-sm">Include Skirting (4" wall border)</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-8">Adds ~₹50–80/R.ft for material + fixing</p>
            </div>
          </form>
        </Card>

        {/* ── Info Tabs ── */}
        <Card title="Material Guide">
          <div className="flex gap-2 mb-4 border-b border-gray-100 pb-3 flex-wrap">
            {(["specs","pattern","rooms"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveInfo(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeInfo === tab ? "bg-secondary text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {tab === "specs" ? "📋 Material Specs" : tab === "pattern" ? "🔲 Tile Patterns" : "🏠 Room Guide"}
              </button>
            ))}
          </div>

          {activeInfo === "specs" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Thickness",     value: ft.thickness },
                  { label: "Wastage Allow", value: `${(ft.wastage * 100).toFixed(0)}%` },
                  { label: "Labor Rate",    value: `₹${ft.labor}/sqft` },
                  { label: "Recommended",   value: ft.brand },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-bold text-green-700 mb-1">✅ Pros</p>
                  <p className="text-xs text-green-600">{ft.pros}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-bold text-red-700 mb-1">⚠️ Cons</p>
                  <p className="text-xs text-red-600">{ft.cons}</p>
                </div>
              </div>
            </div>
          )}

          {activeInfo === "pattern" && (
            <div className="space-y-2">
              {TILE_PATTERNS.map((pat, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-2xl">{pat.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{pat.name}</span>
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{pat.wastage} wastage</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{pat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeInfo === "rooms" && (
            <div className="space-y-2">
              {ROOM_SUGGESTIONS.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <i className="fas fa-door-open text-primary mt-0.5 flex-shrink-0"></i>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{r.room}</span>
                      <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{FLOORING_TYPES[r.rec as keyof typeof FLOORING_TYPES].name.split("(")[0].trim()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Right ── */}
      <div>
        {breakdown && breakdown.totalCost > 0 ? (
          <Card title="Flooring Cost Estimate" className="border-primary/20 shadow-glow">
            <div className="text-center py-4 bg-gray-50 rounded-xl mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Estimate</p>
              <h2 className="text-4xl font-extrabold text-secondary">{formatCurrency(breakdown.totalCost)}</h2>
              <p className="text-xs text-gray-400 mt-1">for {parsedArea} sq.ft — {ft.name}</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 mb-5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Component</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">Details</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">Material</td>
                    <td className="px-4 py-3 text-gray-400 text-xs text-right hidden sm:table-cell">+{breakdown.wastageArea} sqft wastage</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(breakdown.material)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Labor</td>
                    <td className="px-4 py-3 text-gray-400 text-xs text-right hidden sm:table-cell">₹{ft.labor}/sqft</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(breakdown.labor)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Supplies</td>
                    <td className="px-4 py-3 text-gray-400 text-xs text-right hidden sm:table-cell">Cement, sand, grout</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(breakdown.supplies)}</td>
                  </tr>
                  {breakdown.skirting > 0 && (
                    <tr>
                      <td className="px-4 py-3 font-medium">Skirting</td>
                      <td className="px-4 py-3 text-gray-400 text-xs text-right hidden sm:table-cell">{breakdown.skirtingLen} R.ft</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(breakdown.skirting)}</td>
                    </tr>
                  )}
                  {breakdown.polishing > 0 && (
                    <tr>
                      <td className="px-4 py-3 font-medium">Grinding & Polishing</td>
                      <td className="px-4 py-3 text-gray-400 text-xs text-right hidden sm:table-cell">Initial polish</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(breakdown.polishing)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="h-56 mb-5">
              <Chart data={{ Material: breakdown.material, Labor: breakdown.labor, Supplies: breakdown.supplies, Skirting: breakdown.skirting || 0 }} colors={CHART_COLORS} />
            </div>

            {/* Maintenance reminder */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 mb-5">
              <i className="fas fa-lightbulb mr-1"></i>
              <strong>Maintenance tip for {ft.name.split("(")[0].trim()}:</strong> {
                flooringType === "marble" ? "Polish every 3–5 years. Seal annually. Avoid acidic cleaners." :
                flooringType === "granite" ? "Seal once a year. Use pH-neutral cleaner. Lasts decades." :
                flooringType === "wood" || flooringType === "hardwood" ? "Avoid water pooling. Use felt pads on furniture. Re-coat every 5–7 years." :
                "Damp mop with pH-neutral cleaner. Re-seal grout every 2 years."
              }
            </div>

            {hasPaid && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleDownloadPDF} disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all">
                  <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                  <span>Download PDF</span>
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-float active:scale-95">
                  <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                  <span>{isSaving ? "Saving..." : "Save Project"}</span>
                </button>
              </div>
            )}
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400 min-h-[400px]">
            <i className="fas fa-layer-group text-4xl mb-4 text-gray-300"></i>
            <p className="font-medium">Enter carpet area to view estimate</p>
            <p className="text-xs mt-2 text-gray-300">Select a flooring type and area to get a detailed breakdown</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlooringCalculator;