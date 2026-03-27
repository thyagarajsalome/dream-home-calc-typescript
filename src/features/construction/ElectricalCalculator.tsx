import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import Chart from "../../components/ui/Chart";
import { useProjectActions } from "../../hooks/useProjectActions";
import { Card } from "../../components/ui/Card";
import { formatCurrency } from "../../utils/currency";

// ── Constants ──────────────────────────────────────────────────────────────────
const POINT_RATES = { light: 700, fan: 800, power: 1300, mcb: 28000 };

const QUALITY_OPTIONS = {
  basic:   { name: "Basic (Anchor/Roma/Mylinc)",        factor: 1.0 },
  premium: { name: "Premium (Legrand/Schneider)",        factor: 1.6 },
  smart:   { name: "Smart Home (WiFi / Touch Switches)", factor: 3.8 },
};

const CHART_COLORS = ["#D9A443","#59483B","#8C6A4E","#C4B594"];

const WIRING_TYPES = [
  { type: "FR-LSH Wire",    size: "1.5 / 2.5 / 4 sqmm", brand: "Finolex / Polycab / Havells", use: "Internal house wiring — standard choice", note: "Flame retardant, low smoke halogen-free. IS 694 certified." },
  { type: "FRLS Wire",      size: "1.5 / 2.5 / 4 sqmm", brand: "KEI / RR Kabel",              use: "Budget alternative to FR-LSH",            note: "Flame retardant, low smoke. Adequate for residential." },
  { type: "Armoured Cable", size: "4 / 6 / 10 sqmm",    brand: "Havells / Polycab",            use: "Underground / outdoor runs",             note: "PVC armoured protection. Use for DB feeder cables." },
];

const SAFETY_TIPS = [
  { icon: "fas fa-plug",         color: "text-red-500",    tip: "Always use 3-pin earthed sockets for AC, geyser, washing machine and other 15A loads." },
  { icon: "fas fa-bolt",         color: "text-orange-500", tip: "Install a separate ELCB (Earth Leakage Circuit Breaker) for wet areas — bathroom, kitchen, outdoor." },
  { icon: "fas fa-shield-alt",   color: "text-blue-500",   tip: "Use minimum 2.5 sqmm FR-LSH wire for all power points. Never use 1.5 sqmm for AC or geyser circuits." },
  { icon: "fas fa-fire",         color: "text-red-600",    tip: "Keep wire joints inside junction boxes. Never splice wires inside walls — causes fire hazards." },
  { icon: "fas fa-home",         color: "text-green-500",  tip: "Plan dedicated circuits for kitchen appliances, AC units, geyser — never share with lighting circuits." },
  { icon: "fas fa-certificate",  color: "text-purple-500", tip: "Insist on ISI-marked switches, sockets and MCBs. Cheap uncertified items are a fire risk." },
];

const LOAD_GUIDE = [
  { appliance: "LED Light (10W)",       current: "0.04A", circuit: "5A", qty: "10–15 per circuit" },
  { appliance: "Ceiling Fan (75W)",     current: "0.33A", circuit: "5A", qty: "8–10 per circuit"  },
  { appliance: "AC 1.5 Ton Split",      current: "7–9A",  circuit: "16A dedicated", qty: "1 per circuit" },
  { appliance: "Geyser (2000W)",        current: "9A",    circuit: "16A dedicated", qty: "1 per circuit" },
  { appliance: "Microwave / OTG",       current: "8–10A", circuit: "16A",           qty: "1 per circuit" },
  { appliance: "Washing Machine",       current: "5–8A",  circuit: "16A",           qty: "1 per circuit" },
  { appliance: "Refrigerator (250L)",   current: "1.5A",  circuit: "5A / 6A",       qty: "1 per circuit" },
  { appliance: "EV Charger (Level-1)",  current: "16A",   circuit: "20A dedicated", qty: "1 per circuit" },
];

// ── Component ──────────────────────────────────────────────────────────────────
const ElectricalCalculator: React.FC = () => {
  const { hasPaid }  = useUser();
  const location     = useLocation();
  const { saveProject, downloadSpreadsheetPDF, isSaving, isDownloading } = useProjectActions("electrical");
  const resultsRef   = useRef<HTMLDivElement>(null);

  const [lightPoints, setLightPoints] = useState("20");
  const [fanPoints,   setFanPoints]   = useState("8");
  const [powerPoints, setPowerPoints] = useState("6");
  const [quality,     setQuality]     = useState<keyof typeof QUALITY_OPTIONS>("basic");
  const [acPoints,    setAcPoints]    = useState("2");
  const [geyserPoints,setGeyserPoints]= useState("2");
  const [activeTab,   setActiveTab]   = useState<"result"|"wiring"|"load"|"safety">("result");

  useEffect(() => {
    const state = (location.state as any)?.projectData;
    if (state?.lightPoints) { setLightPoints(state.lightPoints); setFanPoints(state.fanPoints); setPowerPoints(state.powerPoints); setQuality(state.quality); }
  }, [location]);

  const calc = useMemo(() => {
    const lCount = parseInt(lightPoints) || 0;
    const fCount = parseInt(fanPoints)   || 0;
    const pCount = parseInt(powerPoints) || 0;
    const aCount = parseInt(acPoints)    || 0;
    const gCount = parseInt(geyserPoints)|| 0;
    const factor = QUALITY_OPTIONS[quality].factor;

    const lightCost   = lCount * POINT_RATES.light  * factor;
    const fanCost     = fCount * POINT_RATES.fan    * factor;
    const powerCost   = pCount * POINT_RATES.power  * factor;
    const acCost      = aCount * POINT_RATES.power  * 1.5 * factor;  // dedicated circuit premium
    const geyserCost  = gCount * POINT_RATES.power  * 1.3 * factor;
    const boardCost   = POINT_RATES.mcb * Math.min(factor, 2);
    const total       = lightCost + fanCost + powerCost + acCost + geyserCost + boardCost;

    return { lightCost, fanCost, powerCost, acCost, geyserCost, boardCost, total, lCount, fCount, pCount, aCount, gCount };
  }, [lightPoints, fanPoints, powerPoints, acPoints, geyserPoints, quality]);

  const isLocked = !hasPaid;

  const handleSave = () => {
    if (calc.total > 0) saveProject({ lightPoints, fanPoints, powerPoints, acPoints, geyserPoints, quality, breakdown: calc }, calc.total);
  };

  const handleDownloadPDF = () => {
    const rows: [string,string,string][] = [
      ["Light / Plug Points (6A)", `${calc.lCount} pts`, formatCurrency(calc.lightCost)],
      ["Fan Points",               `${calc.fCount} pts`, formatCurrency(calc.fanCost)],
      ["Power Sockets (15A)",      `${calc.pCount} pts`, formatCurrency(calc.powerCost)],
      ["AC Dedicated Circuits",    `${calc.aCount} pts`, formatCurrency(calc.acCost)],
      ["Geyser Circuits",          `${calc.gCount} pts`, formatCurrency(calc.geyserCost)],
      ["Distribution Board & MCBs","Lump sum",           formatCurrency(calc.boardCost)],
    ];
    downloadSpreadsheetPDF(`Electrical-Estimate`, ["Component","Quantity","Cost"], rows, "TOTAL ESTIMATE", formatCurrency(calc.total));
  };

  const fields = [
    { label: "Light / Plug Points (6A)", icon: "far fa-lightbulb", val: lightPoints, set: setLightPoints, hint: "~3–4 per room" },
    { label: "Fan Points",               icon: "fas fa-fan",        val: fanPoints,   set: setFanPoints,   hint: "1–2 per room" },
    { label: "Power Sockets (15A)",      icon: "fas fa-plug",       val: powerPoints, set: setPowerPoints, hint: "Kitchen, utility" },
    { label: "AC Dedicated Circuits",    icon: "fas fa-snowflake",  val: acPoints,    set: setAcPoints,    hint: "1 per AC unit"  },
    { label: "Geyser Circuits",          icon: "fas fa-fire-flame-simple", val: geyserPoints, set: setGeyserPoints, hint: "1 per bathroom" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">

      {/* ── Left ── */}
      <div className="space-y-5">
        <Card title="⚡ Electrical Point Estimator">
          {isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold text-center">
              <i className="fas fa-lock mr-2"></i> Upgrade to Pro for the full electrical estimator.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {fields.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`${f.icon} text-primary`}></i>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">{f.label} <span className="text-gray-400 font-normal">({f.hint})</span></label>
                  <input type="number" value={f.val} onChange={e => f.set(e.target.value)} min="0" disabled={isLocked}
                    className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white disabled:bg-gray-50" />
                </div>
              </div>
            ))}
          </div>

          {/* Quality */}
          <div className="mt-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Switch & Wire Quality</label>
            <div className="space-y-2">
              {Object.entries(QUALITY_OPTIONS).map(([k, v]) => (
                <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${quality === k ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="eq" value={k} checked={quality === k} onChange={() => setQuality(k as any)} disabled={isLocked} className="text-primary" />
                  <span className="text-sm font-semibold text-gray-800">{v.name}</span>
                  <span className="ml-auto text-xs text-gray-400">×{v.factor.toFixed(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Wiring Guide */}
        <Card title="🔌 Wiring Reference">
          <div className="space-y-3">
            {WIRING_TYPES.map((w, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-800 text-sm">{w.type}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{w.size}</span>
                </div>
                <p className="text-xs text-primary font-medium mb-1">{w.brand}</p>
                <p className="text-xs text-gray-500">{w.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Right ── */}
      <div className="space-y-5">
        {calc.total > 0 ? (
          <>
            {/* Tab Switcher */}
            <div className="flex gap-2 flex-wrap">
              {(["result","load","safety"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? "bg-secondary text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
                  {tab === "result" ? "💰 Cost Estimate" : tab === "load" ? "🔋 Load Guide" : "🛡 Safety Rules"}
                </button>
              ))}
            </div>

            {activeTab === "result" && (
              <Card title="Electrical Estimate" className="border-primary/20" ref={resultsRef as any}>
                <div className="text-center py-4 bg-gray-50 rounded-xl mb-5">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Electrical Estimate</p>
                  <h2 className="text-4xl font-extrabold text-secondary">{formatCurrency(calc.total)}</h2>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 mb-5">
                  <table className="w-full text-sm min-w-0">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-2 text-left">Component</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { label: "Lights & Plugs (6A)", qty: `${calc.lCount} pts`, cost: calc.lightCost },
                        { label: "Fan Points",          qty: `${calc.fCount} pts`, cost: calc.fanCost   },
                        { label: "Power Sockets (15A)", qty: `${calc.pCount} pts`, cost: calc.powerCost },
                        { label: "AC Circuits",         qty: `${calc.aCount} pts`, cost: calc.acCost    },
                        { label: "Geyser Circuits",     qty: `${calc.gCount} pts`, cost: calc.geyserCost},
                        { label: "Distribution Board",  qty: "1 set",              cost: calc.boardCost  },
                      ].map((r, i) => (
                        <tr key={i}><td className="px-4 py-2">{r.label}</td><td className="px-4 py-2 text-center text-gray-500">{r.qty}</td><td className="px-4 py-2 text-right font-semibold">{formatCurrency(r.cost)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-52 mb-5">
                  <Chart data={{ "Wiring & Conduit": calc.total * 0.35, "Switches & Sockets": calc.total * 0.30, "Labor": calc.total * 0.25, "DB / MCBs": calc.total * 0.10 }} colors={CHART_COLORS} />
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 mb-4">
                  <i className="fas fa-info-circle mr-1"></i> Estimate covers wiring, conduits, switches, sockets, MCBs and labor. Does not include light fixtures, fans, ACs or heavy appliances.
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

            {activeTab === "load" && (
              <Card title="Appliance Load Reference">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2 text-left">Appliance</th>
                        <th className="px-3 py-2 text-right">Current</th>
                        <th className="px-3 py-2 text-right">Circuit</th>
                        <th className="px-3 py-2 text-right hidden sm:table-cell">Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {LOAD_GUIDE.map((l, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{l.appliance}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{l.current}</td>
                          <td className="px-3 py-2 text-right"><span className="bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded text-xs">{l.circuit}</span></td>
                          <td className="px-3 py-2 text-right text-gray-400 hidden sm:table-cell">{l.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === "safety" && (
              <Card title="Electrical Safety Rules">
                <div className="space-y-3">
                  {SAFETY_TIPS.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <i className={`${s.icon} ${s.color} mt-0.5 flex-shrink-0`}></i>
                      <p className="text-xs text-gray-700 leading-relaxed">{s.tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400 min-h-[400px]">
            <i className="fas fa-bolt text-4xl mb-4 text-gray-300"></i>
            <p className="font-medium">Enter point counts to view estimate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectricalCalculator;