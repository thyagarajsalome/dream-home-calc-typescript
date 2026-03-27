import React, { useState, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatCurrency } from "../../utils/currency";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MaterialRow {
  item: string;
  unit: string;
  qty: number;
  rate: number;
  cost: number;
  brand: string;
  spec: string;
  wastage: string;
}

interface PhaseResult {
  phase: string;
  icon: string;
  color: string;
  rows: MaterialRow[];
  subtotal: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const WALL_TYPES = {
  redBrick:  { name: "Red Clay Bricks (9\")",      cementFactor: 1.0, countPerSqFt: 12, desc: "Traditional, excellent thermal mass" },
  flyAsh:    { name: "Fly Ash Bricks (9\")",       cementFactor: 0.9, countPerSqFt: 11, desc: "Eco-friendly, 10% less cement" },
  aac:       { name: "AAC Blocks (8\" thick)",     cementFactor: 0.5, countPerSqFt: 8,  desc: "Lightweight, best thermal/acoustic insulation" },
  ccb:       { name: "Concrete Solid Blocks (6\")",cementFactor: 0.7, countPerSqFt: 9,  desc: "High strength, fast construction" },
};

const QUALITY_PRESETS = {
  economy:  { label: "Economy",  desc: "Budget materials, local brands",          factor: 0.8 },
  standard: { label: "Standard", desc: "Mid-range materials, IS-certified",       factor: 1.0 },
  premium:  { label: "Premium",  desc: "High-grade materials, leading brands",    factor: 1.3 },
};

const FLOORS = [1, 2, 3, 4];

// Base rates (standard quality, per unit)
const RATES = {
  cement:    380,   // per 50kg bag
  steel:     68,    // per kg (Fe500D TMT)
  sand:      55,    // per cft (river)
  msand:     35,    // per cft (manufactured)
  aggregate: 42,    // per cft (20mm)
  fagg:      48,    // per cft (fine agg / 6mm)
  brick:     9,     // per piece (red brick)
  flyash:    7,     // per piece
  aac:       55,    // per piece (600x200x200)
  ccb:       30,    // per piece
  paint:     320,   // per litre (emulsion)
  primer:    180,   // per litre
  putty:     22,    // per kg
  tiles:     65,    // per sqft (basic vitrified)
  wire:      18,    // per metre (4 sqmm)
  pvc:       85,    // per metre (CPVC 3/4")
  wood:      950,   // per cft (teak equivalent)
  glass:     75,    // per sqft
  waterproof:320,   // per litre (Dr Fixit)
  curing:    12,    // per sqft
};

// ── Calculation Engine ─────────────────────────────────────────────────────────
function computeBOQ(
  area: number,
  wallType: keyof typeof WALL_TYPES,
  floors: number,
  quality: keyof typeof QUALITY_PRESETS
): PhaseResult[] {
  const f = QUALITY_PRESETS[quality].factor;
  const wt = WALL_TYPES[wallType];

  // Derived quantities (industry thumb rules, India)
  const builtUpArea   = area;                          // sqft total
  const floorArea     = area / floors;                 // sqft per floor
  const wallArea      = builtUpArea * 2.5;             // approx wall area (external + internal)
  const wallVolumeCFT = wallArea * 0.75;               // 9" wall = 0.75 cft per sqft
  const concreteVol   = builtUpArea * 0.30;            // cft of RCC (slabs, beams, columns)

  // ── Phase 1: Substructure & Foundation ───────────────────────────────────────
  const foundCement  = Math.ceil(builtUpArea * 0.18 * f);
  const foundSteel   = Math.ceil(builtUpArea * 1.2 * f);
  const foundSand    = Math.ceil(builtUpArea * 0.60);
  const foundAgg     = Math.ceil(builtUpArea * 0.50);

  // ── Phase 2: Superstructure (RCC) ────────────────────────────────────────────
  const rccCement = Math.ceil(concreteVol * 0.50 * f);
  const rccSteel  = Math.ceil(builtUpArea * 2.8 * f);  // kg / sqft
  const rccSand   = Math.ceil(concreteVol * 0.45);
  const rccAgg    = Math.ceil(concreteVol * 0.90);

  // ── Phase 3: Masonry ──────────────────────────────────────────────────────────
  const brickCount  = Math.ceil(wallArea * wt.countPerSqFt * 1.05); // 5% wastage
  const msnCement   = Math.ceil(wallVolumeCFT * 0.28 * wt.cementFactor * f);
  const msnSand     = Math.ceil(wallVolumeCFT * 1.10);

  // ── Phase 4: Plastering ───────────────────────────────────────────────────────
  const plasterArea  = wallArea * 2;          // both sides
  const plsCement    = Math.ceil(plasterArea * 0.015 * f);
  const plsSand      = Math.ceil(plasterArea * 0.06);

  // ── Phase 5: Flooring & Tiling ────────────────────────────────────────────────
  const tileArea   = builtUpArea * 1.10;       // 10% wastage
  const tileCement = Math.ceil(tileArea * 0.012 * f);
  const tileSand   = Math.ceil(tileArea * 0.04);
  const grout      = Math.ceil(tileArea * 0.18);  // kg

  // ── Phase 6: Painting ─────────────────────────────────────────────────────────
  const paintableArea = (wallArea + builtUpArea) * 1.1;  // walls + ceiling + 10%
  const puttyKg       = Math.ceil(paintableArea * 0.40 * f);
  const primerLtr     = Math.ceil(paintableArea / 100 * 12 * f);  // 100 sqft / 12 ltr coverage
  const paintLtr      = Math.ceil(paintableArea / 100 * 10 * 2);  // 2 coats

  // ── Phase 7: Waterproofing ────────────────────────────────────────────────────
  const wpArea   = floorArea + (builtUpArea * 0.30);  // terrace + wet areas
  const wpLtr    = Math.ceil(wpArea / 50 * 5 * f);    // 5 ltr / 50 sqft

  // ── Misc structural ───────────────────────────────────────────────────────────
  const curingAgent = Math.ceil(builtUpArea * 0.5);   // sqft

  const r = (base: number) => Math.round(base * f);

  const phases: PhaseResult[] = [
    {
      phase: "Foundation & Substructure", icon: "fas fa-mountain", color: "bg-stone-100 text-stone-700",
      rows: [
        { item: "Cement (OPC 53 Grade)", unit: "Bags (50kg)", qty: foundCement, rate: r(RATES.cement), cost: foundCement * r(RATES.cement), brand: "UltraTech / Ambuja", spec: "IS 8112, Grade 53", wastage: "5%" },
        { item: "TMT Steel Bars",        unit: "kg",          qty: foundSteel,  rate: r(RATES.steel),  cost: foundSteel  * r(RATES.steel),  brand: "TATA Tiscon / SAIL", spec: "Fe500D, IS 1786", wastage: "3-5%" },
        { item: "River Sand / M-Sand",   unit: "cft",         qty: foundSand,   rate: RATES.sand,      cost: foundSand   * RATES.sand,      brand: "Local / Robo Sand", spec: "Zone-II, FM 2.5-3.0", wastage: "8%" },
        { item: "Coarse Aggregate 20mm", unit: "cft",         qty: foundAgg,    rate: RATES.aggregate, cost: foundAgg    * RATES.aggregate, brand: "Local Quarry", spec: "IS 383, 20mm graded", wastage: "5%" },
      ],
      subtotal: 0,
    },
    {
      phase: "RCC Structural Work", icon: "fas fa-layer-group", color: "bg-blue-100 text-blue-700",
      rows: [
        { item: "Cement (OPC 53 Grade)", unit: "Bags (50kg)", qty: rccCement, rate: r(RATES.cement), cost: rccCement * r(RATES.cement), brand: "UltraTech / ACC", spec: "IS 8112, M20 mix", wastage: "5%" },
        { item: "TMT Steel (Columns/Beams)", unit: "kg",      qty: rccSteel,  rate: r(RATES.steel),  cost: rccSteel  * r(RATES.steel),  brand: "TATA Tiscon", spec: "Fe500D — 12mm, 16mm, 20mm dia", wastage: "3%" },
        { item: "Fine Aggregate (Sand)",  unit: "cft",        qty: rccSand,   rate: RATES.sand,      cost: rccSand   * RATES.sand,      brand: "River / M-Sand", spec: "Zone-II", wastage: "8%" },
        { item: "Coarse Aggregate 20mm",  unit: "cft",        qty: rccAgg,    rate: RATES.aggregate, cost: rccAgg    * RATES.aggregate, brand: "Crushed Stone", spec: "IS 383, 20mm nominal size", wastage: "5%" },
        { item: "Curing Compound",        unit: "sqft",       qty: curingAgent, rate: RATES.curing,  cost: curingAgent * RATES.curing,  brand: "Fosroc / Pidilite", spec: "Liquid applied, IS 9103", wastage: "2%" },
      ],
      subtotal: 0,
    },
    {
      phase: "Masonry & Brickwork", icon: "fas fa-border-all", color: "bg-orange-100 text-orange-700",
      rows: [
        { item: wt.name,                  unit: "Nos",         qty: brickCount, rate: wallType === "redBrick" ? r(RATES.brick) : wallType === "flyAsh" ? r(RATES.flyash) : wallType === "aac" ? r(RATES.aac) : r(RATES.ccb), cost: brickCount * (wallType === "redBrick" ? r(RATES.brick) : wallType === "flyAsh" ? r(RATES.flyash) : wallType === "aac" ? r(RATES.aac) : r(RATES.ccb)), brand: "Local / Wienerberger", spec: wt.desc, wastage: "5-8%" },
        { item: "Cement (PPC Grade)",     unit: "Bags (50kg)", qty: msnCement, rate: r(RATES.cement * 0.95), cost: msnCement * r(RATES.cement * 0.95), brand: "UltraTech PPC", spec: "IS 1489, 1:5 mortar mix", wastage: "5%" },
        { item: "Plastering Sand",        unit: "cft",         qty: msnSand,   rate: RATES.sand,             cost: msnSand * RATES.sand, brand: "River Sand Zone-III", spec: "Fine, FM 1.2-2.0", wastage: "10%" },
      ],
      subtotal: 0,
    },
    {
      phase: "Plastering", icon: "fas fa-brush", color: "bg-yellow-100 text-yellow-700",
      rows: [
        { item: "Cement (PPC)",           unit: "Bags (50kg)", qty: plsCement, rate: r(RATES.cement * 0.95), cost: plsCement * r(RATES.cement * 0.95), brand: "Coromandel / Dalmia", spec: "1:4 mix for internal, 1:6 external", wastage: "5%" },
        { item: "Fine Sand",              unit: "cft",         qty: plsSand,   rate: RATES.sand,             cost: plsSand * RATES.sand, brand: "Zone-III River Sand", spec: "Sieved, FM < 2.0", wastage: "8%" },
      ],
      subtotal: 0,
    },
    {
      phase: "Flooring & Tiling", icon: "fas fa-th", color: "bg-teal-100 text-teal-700",
      rows: [
        { item: "Vitrified Tiles (600×600)", unit: "sqft", qty: tileArea,  rate: r(RATES.tiles),  cost: tileArea  * r(RATES.tiles),  brand: "Kajaria / Somany / Johnson", spec: "600×600 GVT, 8–10mm thick, <0.5% absorption", wastage: "10%" },
        { item: "Tile Adhesive Cement",      unit: "Bags", qty: tileCement,rate: r(RATES.cement * 0.90), cost: tileCement * r(RATES.cement * 0.90), brand: "Kerakoll / Pidilite", spec: "IS 12269, polymer modified", wastage: "5%" },
        { item: "Tile Grout",                unit: "kg",   qty: grout,     rate: r(25),           cost: grout     * r(25),           brand: "Ardex / Dr Fixit", spec: "Epoxy grout 3mm joints", wastage: "3%" },
        { item: "Bedding Sand",              unit: "cft",  qty: tileSand,  rate: RATES.sand,      cost: tileSand  * RATES.sand,      brand: "Zone-II Fine Sand", spec: "1:4 dry mix bedding", wastage: "8%" },
      ],
      subtotal: 0,
    },
    {
      phase: "Painting & Finishing", icon: "fas fa-paint-roller", color: "bg-pink-100 text-pink-700",
      rows: [
        { item: "Wall Putty",         unit: "kg",    qty: puttyKg,   rate: r(RATES.putty),  cost: puttyKg   * r(RATES.putty),  brand: "Birla White / Asian Paints", spec: "Polymer-modified, IS 15477", wastage: "3%" },
        { item: "Primer (Wall)",      unit: "Litres",qty: primerLtr, rate: r(RATES.primer), cost: primerLtr * r(RATES.primer), brand: "Asian Paints / Berger", spec: "Alkali-resistant primer", wastage: "5%" },
        { item: "Interior Emulsion",  unit: "Litres",qty: paintLtr,  rate: r(RATES.paint),  cost: paintLtr  * r(RATES.paint),  brand: "Asian Paints Royale / Dulux", spec: "Sheen finish, 2 coats, 100 sqft/ltr", wastage: "5%" },
      ],
      subtotal: 0,
    },
    {
      phase: "Waterproofing", icon: "fas fa-tint", color: "bg-cyan-100 text-cyan-700",
      rows: [
        { item: "Crystalline Waterproofing", unit: "Litres", qty: wpLtr, rate: r(RATES.waterproof), cost: wpLtr * r(RATES.waterproof), brand: "Dr Fixit / Fosroc Brushbond", spec: "Brush-applied 2 coats, terrace + wet areas", wastage: "5%" },
      ],
      subtotal: 0,
    },
  ];

  // Compute subtotals
  phases.forEach(ph => {
    ph.subtotal = ph.rows.reduce((s, r) => s + r.cost, 0);
  });

  return phases;
}

// ── Component ──────────────────────────────────────────────────────────────────
const MaterialQuantityCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const { saveProject, downloadSpreadsheetPDF, isSaving, isDownloading } = useProjectActions("materials");

  const [area,    setArea]    = useState("");
  const [floors,  setFloors]  = useState(1);
  const [wallType,setWallType]= useState<keyof typeof WALL_TYPES>("redBrick");
  const [quality, setQuality] = useState<keyof typeof QUALITY_PRESETS>("standard");
  const [showBOQ, setShowBOQ] = useState(false);
  const [openPhase, setOpenPhase] = useState<number | null>(0);

  const phases = useMemo(() => {
    const a = parseFloat(area);
    if (!a || a <= 0) return null;
    return computeBOQ(a, wallType, floors, quality);
  }, [area, wallType, floors, quality]);

  const grandTotal  = phases ? phases.reduce((s, p) => s + p.subtotal, 0) : 0;
  const totalBags   = phases ? phases.flatMap(p => p.rows).filter(r => r.unit === "Bags (50kg)").reduce((s, r) => s + r.qty, 0) : 0;
  const totalSteel  = phases ? phases.flatMap(p => p.rows).filter(r => r.item.includes("Steel")).reduce((s, r) => s + r.qty, 0) : 0;

  const isLocked = !hasPaid;

  const handleCalculate = () => {
    if (!area || parseFloat(area) <= 0) return;
    setShowBOQ(true);
    setOpenPhase(0);
  };

  const handleSave = () => {
    if (phases) saveProject({ area, floors, wallType, quality, phases }, grandTotal);
  };

  const handleDownloadPDF = () => {
    if (!phases) return;
    const rows: [string, string, string, string][] = [];
    phases.forEach(ph => {
      ph.rows.forEach(r => {
        rows.push([`[${ph.phase}] ${r.item}`, `${r.qty} ${r.unit}`, r.brand, formatCurrency(r.cost)]);
      });
    });
    downloadSpreadsheetPDF(
      `Material-BOQ-${area}sqft`,
      ["Item", "Quantity", "Recommended Brand", "Estimated Cost"],
      rows,
      "TOTAL MATERIAL COST",
      formatCurrency(grandTotal)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Input Card ── */}
      <Card title="📐 Material BOQ Estimator">
        {isLocked && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <i className="fas fa-lock text-amber-500 text-lg"></i>
            <div>
              <p className="font-bold text-amber-800 text-sm">Pro Feature — Upgrade to unlock</p>
              <p className="text-amber-700 text-xs">Get a detailed phase-wise Bill of Quantities with brand recommendations</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Area */}
          <div>
            <Input label="Built-up Area (sq.ft)" type="number" placeholder="e.g. 1200" value={area} onChange={e => setArea(e.target.value)} disabled={isLocked} />
            <p className="text-xs text-gray-400 -mt-3 ml-1">Total super built-up area</p>
          </div>

          {/* Floors */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Number of Floors</label>
            <div className="flex gap-2">
              {FLOORS.map(n => (
                <button key={n} onClick={() => setFloors(n)} disabled={isLocked}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${floors === n ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"}`}>
                  {n}G{n > 1 ? `+${n-1}` : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Wall Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Wall Material</label>
            <select value={wallType} onChange={e => setWallType(e.target.value as any)} disabled={isLocked}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-sm focus:border-primary outline-none">
              {Object.entries(WALL_TYPES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">{WALL_TYPES[wallType].desc}</p>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Material Quality</label>
            <div className="space-y-1.5">
              {Object.entries(QUALITY_PRESETS).map(([k, v]) => (
                <label key={k} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${quality === k ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="quality" value={k} checked={quality === k} onChange={() => setQuality(k as any)} disabled={isLocked} className="text-primary" />
                  <div>
                    <span className="text-sm font-bold text-gray-800">{v.label}</span>
                    <span className="text-xs text-gray-400 block">{v.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleCalculate} disabled={isLocked || !area}
          className="mt-6 w-full py-4 bg-primary text-white font-bold text-base rounded-xl shadow-md hover:bg-yellow-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <i className="fas fa-calculator"></i> Generate Full BOQ
        </button>
      </Card>

      {/* ── Summary KPI Strip ── */}
      {showBOQ && phases && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Material Cost",  value: formatCurrency(grandTotal), icon: "fas fa-rupee-sign",  color: "text-green-600",  bg: "bg-green-50" },
              { label: "Cement Required",       value: `${totalBags} Bags`,        icon: "fas fa-box",         color: "text-blue-600",   bg: "bg-blue-50"  },
              { label: "Steel Required",        value: `${totalSteel} kg`,          icon: "fas fa-ruler",       color: "text-orange-600", bg: "bg-orange-50"},
              { label: "Phases Covered",        value: `${phases.length} phases`,   icon: "fas fa-list-check",  color: "text-purple-600", bg: "bg-purple-50"},
            ].map((kpi, i) => (
              <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-white shadow-sm`}>
                <div className={`${kpi.color} text-xl mb-1`}><i className={kpi.icon}></i></div>
                <div className={`text-lg font-extrabold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* ── Phase Accordion ── */}
          <div className="space-y-3">
            {phases.map((ph, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Phase Header */}
                <button
                  onClick={() => setOpenPhase(openPhase === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm ${ph.color}`}>
                      <i className={ph.icon}></i>
                    </span>
                    <div className="text-left">
                      <span className="font-bold text-gray-800 text-sm">{ph.phase}</span>
                      <span className="block text-xs text-gray-400">{ph.rows.length} materials</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-secondary text-sm">{formatCurrency(ph.subtotal)}</span>
                    <i className={`fas fa-chevron-${openPhase === idx ? "up" : "down"} text-gray-400 text-xs`}></i>
                  </div>
                </button>

                {/* Phase Table */}
                {openPhase === idx && (
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                        <tr>
                          <th className="px-4 py-3 text-left">Material</th>
                          <th className="px-4 py-3 text-center">Quantity</th>
                          <th className="px-4 py-3 text-left hidden md:table-cell">Specification</th>
                          <th className="px-4 py-3 text-left hidden lg:table-cell">Recommended Brand</th>
                          <th className="px-4 py-3 text-center hidden sm:table-cell">Wastage</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ph.rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{row.item}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded-lg text-xs">
                                {row.qty.toLocaleString()} {row.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{row.spec}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{row.brand}</span>
                            </td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span className="text-xs text-gray-400">{row.wastage}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(row.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-600 text-sm">Phase Subtotal</td>
                          <td className="px-4 py-3 text-right font-extrabold text-secondary">{formatCurrency(ph.subtotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Grand Total Card ── */}
          <div className="bg-secondary rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-gray-300 text-sm uppercase font-bold tracking-wider">Total Estimated Material Cost</p>
              <p className="text-4xl font-extrabold text-primary">{formatCurrency(grandTotal)}</p>
              <p className="text-gray-400 text-xs mt-1">* Excludes labour. Add 35–45% for complete construction cost.</p>
            </div>
            {hasPaid && (
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleDownloadPDF} disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-secondary font-bold rounded-xl hover:bg-gray-100 transition-all text-sm">
                  <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                  Download BOQ PDF
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm shadow-float">
                  <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                  Save Project
                </button>
              </div>
            )}
          </div>

          {/* ── Procurement Tips ── */}
          <Card title="💡 Procurement & Quality Tips">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                { icon: "fas fa-certificate", color: "text-blue-500", title: "Cement — Always ISI Marked", body: "Check for IS 8112 (OPC 53) or IS 1489 (PPC) mark. Store in dry place, use within 90 days. Never use lumpy cement." },
                { icon: "fas fa-ruler-combined", color: "text-orange-500", title: "Steel — Demand Mill Test Cert", body: "Insist on Fe500D grade. Check for rib pattern, weight per metre and IS 1786 certification sticker on every bundle." },
                { icon: "fas fa-water", color: "text-teal-500", title: "Sand — Source Matters", body: "M-Sand is a reliable alternative to river sand. Avoid beach sand (salt content causes corrosion). Check silt content < 8%." },
                { icon: "fas fa-cube", color: "text-red-500", title: "Bricks / Blocks — Check Absorption", body: "Water absorption must be < 20% for clay bricks. Soak AAC blocks 24 hrs before use to avoid excessive mortar absorption." },
                { icon: "fas fa-shield-alt", color: "text-green-500", title: "Waterproofing — Don't Compromise", body: "Use crystalline coating (Dr Fixit 101) for terraces + bathrooms. Apply 2 coats. Test with ponding test (48 hrs) before tiling." },
                { icon: "fas fa-truck", color: "text-purple-500", title: "Bulk Buying — Save 8–12%", body: "Negotiate bulk rates for cement, steel and aggregates. Order complete lot together to avoid price fluctuation. Validate weights on delivery." },
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <i className={`${tip.icon} ${tip.color} mt-0.5 text-base flex-shrink-0`}></i>
                  <div>
                    <p className="font-bold text-gray-800 text-xs mb-1">{tip.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default MaterialQuantityCalculator;