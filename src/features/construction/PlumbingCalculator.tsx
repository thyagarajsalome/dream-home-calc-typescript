import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Chart from "../../components/ui/Chart";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { formatCurrency } from "../../utils/currency";

// ── Constants ──────────────────────────────────────────────────────────────────
const UNIT_RATES = {
  kitchen:    { name: "Kitchen (Sink + Taps + Drain)", rate: 13000 },
  commonBath: { name: "Common Bathroom (Basic)",        rate: 28000 },
  masterBath: { name: "Master Bathroom (Premium)",      rate: 50000 },
  motor:      { name: "Motor, Pump & Overhead Tank",    rate: 18000 },
};

const QUALITY_OPTIONS = {
  basic:    { name: "Basic (PVC / Chrome-plated)",      factor: 0.8 },
  standard: { name: "Standard (Jaguar / Parryware)",    factor: 1.0 },
  premium:  { name: "Premium (Grohe / Kohler / Jaquar)",factor: 1.8 },
};

const CHART_COLORS = ["#D9A443","#59483B","#8C6A4E","#C4B594"];

const PIPE_TYPES = [
  { type: "CPVC Pipe",   brand: "Ashirvad / Supreme / Finolex", size: "½\" to 2\"", use: "Hot & cold water supply (recommended for India)", note: "Temperature resistant up to 93°C. IS 15778 certified. Preferred for all internal plumbing." },
  { type: "UPVC Pipe",   brand: "Prince / Astral / Jain",       size: "½\" to 4\"", use: "Cold water supply and drainage",                   note: "Cost-effective for cold water. Not suitable for hot water lines." },
  { type: "GI Pipe",     brand: "Tata Steel / Surya",            size: "½\" to 3\"", use: "Overhead tank outlets, main supply line",         note: "Galvanised iron. Heavy, durable, but corrodes over 15–20 years. Avoid for internal use." },
  { type: "HDPE Pipe",   brand: "Supreme / Jain Irrigation",     size: "¾\" to 6\"", use: "Underground & sump connections",                  note: "Best for underground runs. Flexible, corrosion-proof. IS 4984 certified." },
  { type: "SWR Pipe",    brand: "Finolex / Wavin / Prince",      size: "75mm to 160mm", use: "Soil, waste & rainwater drainage",             note: "Structured Wall Ring (SWR) — for drain / waste water only. NOT for supply lines." },
];

const FIXTURE_BRANDS = [
  { category: "Economy",  brands: ["Hindware Basic","Cera Melody","Parryware Budget"],           range: "₹3,000–8,000 per bathroom set"  },
  { category: "Mid-Range",brands: ["Parryware","Cera","Jaquar Budget","American Standard"],       range: "₹8,000–20,000 per bathroom set" },
  { category: "Premium",  brands: ["Jaquar (Kubix/Ornamix)","Grohe","Hansgrohe","Kohler"],        range: "₹25,000–1,00,000+ per bathroom" },
];

const WATER_TIPS = [
  { icon: "fas fa-tint-slash",   title: "Dual-flush Toilets",     body: "Save up to 40% water vs single-flush. 3L/6L options. Look for BEE 5-star rated products." },
  { icon: "fas fa-shower",       title: "Low-flow Showerheads",   body: "Aerating showerheads use 6–8 litres/min vs 15–20 litres/min standard. No perceived difference in shower experience." },
  { icon: "fas fa-faucet",       title: "Aerator Tap Fittings",   body: "Mix air with water flow. Reduces flow to 4–6 L/min without pressure loss. Cheap add-on upgrade." },
  { icon: "fas fa-recycle",      title: "Grey-water Recycling",   body: "Route bathroom wash-basin and shower water to garden or toilet flush. Saves 30–40% of total household water usage." },
  { icon: "fas fa-thermometer",  title: "Tankless Geysers",       body: "Instant geysers eliminate standby heat loss. For a family of 4, saves ₹1,500–2,500/yr on electricity vs storage geyser." },
  { icon: "fas fa-wrench",       title: "Pressure Regulator",     body: "Install a PRV (Pressure Reducing Valve) if municipal supply pressure exceeds 3 bar. Prevents fixture wear and leaks." },
];

// ── Component ──────────────────────────────────────────────────────────────────
const PlumbingCalculator: React.FC = () => {
  const { hasPaid }  = useUser();
  const location     = useLocation();
  const { saveProject, downloadSpreadsheetPDF, isSaving, isDownloading } = useProjectActions("plumbing");

  const [kitchens,      setKitchens]      = useState("1");
  const [commonBaths,   setCommonBaths]   = useState("2");
  const [masterBaths,   setMasterBaths]   = useState("1");
  const [includeMotor,  setIncludeMotor]  = useState(true);
  const [quality,       setQuality]       = useState<keyof typeof QUALITY_OPTIONS>("standard");
  const [activeTab,     setActiveTab]     = useState<"result"|"pipes"|"water">("result");

  useEffect(() => {
    const state = (location.state as any)?.projectData;
    if (state?.kitchens) { setKitchens(state.kitchens); setCommonBaths(state.commonBaths); setMasterBaths(state.masterBaths); setIncludeMotor(state.includeMotor); setQuality(state.quality); }
  }, [location]);

  const calc = useMemo(() => {
    const kCount = parseInt(kitchens)    || 0;
    const cCount = parseInt(commonBaths) || 0;
    const mCount = parseInt(masterBaths) || 0;
    const f      = QUALITY_OPTIONS[quality].factor;

    const kitchenCost    = kCount * UNIT_RATES.kitchen.rate    * f;
    const commonBathCost = cCount * UNIT_RATES.commonBath.rate * f;
    const masterBathCost = mCount * UNIT_RATES.masterBath.rate * f;
    const motorCost      = includeMotor ? UNIT_RATES.motor.rate : 0;
    const total          = kitchenCost + commonBathCost + masterBathCost + motorCost;

    return { kitchenCost, commonBathCost, masterBathCost, motorCost, total, kCount, cCount, mCount };
  }, [kitchens, commonBaths, masterBaths, includeMotor, quality]);

  const isLocked = !hasPaid;

  const handleSave = () => {
    if (calc.total > 0) saveProject({ kitchens, commonBaths, masterBaths, includeMotor, quality, breakdown: calc }, calc.total);
  };

  const handleDownloadPDF = () => {
    const rows: [string,string,string][] = [
      ["Kitchen / Utility",         `${calc.kCount} unit(s)`, formatCurrency(calc.kitchenCost)],
      ["Common Bathrooms",           `${calc.cCount} unit(s)`, formatCurrency(calc.commonBathCost)],
      ["Master Bathrooms (Premium)", `${calc.mCount} unit(s)`, formatCurrency(calc.masterBathCost)],
    ];
    if (calc.motorCost > 0) rows.push(["Overhead Tank + Motor", "1 set", formatCurrency(calc.motorCost)]);
    downloadSpreadsheetPDF(`Plumbing-Estimate`, ["Item","Quantity","Cost"], rows, "TOTAL ESTIMATE", formatCurrency(calc.total));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">

      {/* ── Left ── */}
      <div className="space-y-5">
        <Card title="🚿 Plumbing Cost Calculator">
          {isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold text-center">
              <i className="fas fa-lock mr-2"></i> Upgrade to Pro to use the room-wise plumbing estimator.
            </div>
          )}

          <div className="space-y-4">
            {[
              { label: "Kitchens / Utility Rooms", icon: "fas fa-utensils", val: kitchens,    set: setKitchens,    info: `₹${(UNIT_RATES.kitchen.rate/1000).toFixed(0)}k/unit — Sink, mixer tap, drain` },
              { label: "Master Bathrooms",          icon: "fas fa-bath",     val: masterBaths, set: setMasterBaths, info: `₹${(UNIT_RATES.masterBath.rate/1000).toFixed(0)}k/unit — Full set, premium fittings` },
              { label: "Common Bathrooms",          icon: "fas fa-toilet",   val: commonBaths, set: setCommonBaths, info: `₹${(UNIT_RATES.commonBath.rate/1000).toFixed(0)}k/unit — Standard fittings` },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`${f.icon} text-cyan-600`}></i>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">{f.label}</label>
                  <p className="text-xs text-gray-400 mb-1">{f.info}</p>
                  <input type="number" min="0" value={f.val} onChange={e => f.set(e.target.value)} disabled={isLocked}
                    className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white disabled:bg-gray-50" />
                </div>
              </div>
            ))}

            {/* Motor & Tank */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="flex items-center cursor-pointer gap-3 select-none">
                <input type="checkbox" checked={includeMotor} onChange={e => setIncludeMotor(e.target.checked)} disabled={isLocked}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary accent-primary" />
                <div>
                  <span className="text-sm font-bold text-gray-700">Include Overhead Tank & Motor Pump</span>
                  <p className="text-xs text-gray-400">0.5HP pump + 500L HDPE tank + plumbing connections</p>
                </div>
                <span className="ml-auto text-sm font-bold text-primary">{formatCurrency(UNIT_RATES.motor.rate)}</span>
              </label>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fixture Quality</label>
              <div className="space-y-2">
                {Object.entries(QUALITY_OPTIONS).map(([k, v]) => (
                  <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${quality === k ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="pq" value={k} checked={quality === k} onChange={() => setQuality(k as any)} disabled={isLocked} className="text-primary" />
                    <span className="text-sm font-semibold text-gray-800">{v.name}</span>
                    <span className="ml-auto text-xs text-gray-400">×{v.factor.toFixed(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Fixture Brand Guide */}
        <Card title="🏷 Fixture Brand Guide">
          <div className="space-y-3">
            {FIXTURE_BRANDS.map((g, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gray-800 text-sm">{g.category}</span>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{g.range}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.brands.map((b, bi) => (
                    <span key={bi} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Right ── */}
      <div className="space-y-5">
        {calc.total > 0 ? (
          <>
            <div className="flex gap-2 flex-wrap">
              {(["result","pipes","water"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? "bg-secondary text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
                  {tab === "result" ? "💰 Cost Estimate" : tab === "pipes" ? "🔧 Pipe Types" : "💧 Water-saving Tips"}
                </button>
              ))}
            </div>

            {activeTab === "result" && (
              <Card title="Plumbing Estimate" className="border-primary/20">
                <div className="text-center py-4 bg-gray-50 rounded-xl mb-5">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Plumbing Estimate</p>
                  <h2 className="text-4xl font-extrabold text-secondary">{formatCurrency(calc.total)}</h2>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 mb-5">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { label: "Master Bathrooms",  qty: `${calc.mCount}`, cost: calc.masterBathCost },
                        { label: "Common Bathrooms",  qty: `${calc.cCount}`, cost: calc.commonBathCost },
                        { label: "Kitchens / Utility",qty: `${calc.kCount}`, cost: calc.kitchenCost    },
                        ...(calc.motorCost > 0 ? [{ label: "Motor & Tank", qty: "1 set", cost: calc.motorCost }] : []),
                      ].map((r, i) => (
                        <tr key={i}><td className="px-4 py-2 font-medium">{r.label}</td><td className="px-4 py-2 text-center text-gray-500">{r.qty}</td><td className="px-4 py-2 text-right font-semibold">{formatCurrency(r.cost)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-52 mb-5">
                  <Chart data={{ "Fixtures & Fittings": calc.total * 0.45, "CPVC / GI Pipes": calc.total * 0.30, "Labor": calc.total * 0.25 }} colors={CHART_COLORS} />
                </div>
                <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-xs text-cyan-700 mb-4">
                  <i className="fas fa-info-circle mr-1"></i> Estimate includes fixtures, CPVC supply pipes, drainage SWR pipes and labor. Excludes water softener, RO systems and overhead water tank if not selected above.
                </div>
                {hasPaid && (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all">
                      <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i> PDF
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all">
                      <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i> Save
                    </button>
                  </div>
                )}
              </Card>
            )}

            {activeTab === "pipes" && (
              <Card title="Pipe Type Reference">
                <div className="space-y-3">
                  {PIPE_TYPES.map((p, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 text-sm">{p.type}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.size}</span>
                      </div>
                      <p className="text-xs text-primary font-medium mb-1">{p.brand}</p>
                      <p className="text-xs text-gray-500 mb-1"><strong>Use:</strong> {p.use}</p>
                      <p className="text-xs text-gray-400">{p.note}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "water" && (
              <Card title="💧 Water-saving Features">
                <div className="space-y-3">
                  {WATER_TIPS.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                      <i className={`${t.icon} text-cyan-600 mt-0.5 flex-shrink-0`}></i>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{t.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400 min-h-[400px]">
            <i className="fas fa-bath text-4xl mb-4 text-gray-300"></i>
            <p className="font-medium">Enter room counts to view estimate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlumbingCalculator;