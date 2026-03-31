import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useProjectActions } from "../../hooks/useProjectActions";
import { useUser } from "../../context/UserContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Chart from "../../components/ui/Chart";
import { formatCurrency } from "../../utils/currency";
import { useGSAPCounter, useGSAPReveal, useGSAPPulse } from "../../hooks/useGSAP";

// ── Constants ──────────────────────────────────────────────────────────────────
const PARKING_RATE_FACTOR = 0.7;
const COMPOUND_WALL_RATE  = 800;
const SUMP_TANK_COST      = { basic: 150000, standard: 200000, premium: 250000 };
const QUALITY_RATES       = { basic: 1600, standard: 2100, premium: 2900 };

const QUALITY_INFO: Record<string, { label: string; desc: string; features: string[] }> = {
  basic: {
    label: "Basic",
    desc: "Entry-level construction with standard materials and minimal finishes.",
    features: ["OPC cement, Fe415 steel", "Red brick masonry", "Basic vitrified tiles", "Distemper paint", "Standard sanitary fittings"],
  },
  standard: {
    label: "Standard",
    desc: "Good quality construction with ISI-certified materials and decent finishes.",
    features: ["PPC/OPC 53 cement, Fe500D steel", "Fly ash brick masonry", "GVT/PGVT tiles 600x600", "Premium emulsion paint (2 coats)", "Mid-range sanitary (Parryware/Cera)"],
  },
  premium: {
    label: "Premium",
    desc: "High-end construction with top brands, superior finishes, and advanced features.",
    features: ["UltraTech/ACC cement, TATA Tiscon Fe500D", "AAC block masonry", "Marble/granite/imported tiles", "Luxury paint (Asian Royale)", "Premium sanitary (Kohler/Jaguar)"],
  },
};

const BREAKDOWN_PERCENTAGES: Record<string, number> = {
  Foundation: 12, Structure: 30, Masonry: 12, Roofing: 10,
  Finishing: 20, "Elec/Plumbing": 10, Miscellaneous: 6,
};

const CHART_COLORS = ["#D9A443","#59483B","#8C6A4E","#C4B594","#A0896B","#E8D4B0","#6B5344"];

const CITY_BENCHMARKS = [
  { city: "Mumbai",      basic: 2200, standard: 3200, premium: 4500 },
  { city: "Bengaluru",   basic: 1700, standard: 2400, premium: 3500 },
  { city: "Delhi NCR",   basic: 1800, standard: 2600, premium: 3800 },
  { city: "Chennai",     basic: 1600, standard: 2200, premium: 3200 },
  { city: "Hyderabad",   basic: 1700, standard: 2400, premium: 3400 },
  { city: "Pune",        basic: 1900, standard: 2700, premium: 3800 },
  { city: "Tier-2 City", basic: 1400, standard: 1900, premium: 2700 },
];

const CONSTRUCTION_PHASES = [
  { phase: "Site Preparation & Foundation", weeks: "1-4",  pct: "10-15" },
  { phase: "Columns & Slabs (Structural)",  weeks: "5-16", pct: "25-35" },
  { phase: "Masonry & Brick Work",          weeks: "17-24",pct: "15-20" },
  { phase: "Plastering & Waterproofing",    weeks: "25-30",pct: "10-12" },
  { phase: "Flooring & Tiling",             weeks: "31-36",pct: "12-15" },
  { phase: "Electrical & Plumbing",         weeks: "31-38",pct: "8-10"  },
  { phase: "Painting & Finishing",          weeks: "37-42",pct: "8-12"  },
  { phase: "Handover & Snag",               weeks: "43-48",pct: "3-5"   },
];

function formatINR(val: number): string {
  return val.toLocaleString("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export const ConstructionCalculator = () => {
  const { hasPaid } = useUser();
  const location    = useLocation();
  const { saveProject, downloadSpreadsheetPDF, isSaving, isDownloading } = useProjectActions("construction");
  const resultsRef  = useRef<HTMLDivElement>(null);

  // GSAP hooks
  const { counterRef, animateCounter } = useGSAPCounter();
  const { revealRef: leftRevealRef }   = useGSAPReveal({ delay: 0.07, y: 20 });
  const { revealRef: rightRevealRef }  = useGSAPReveal({ delay: 0.10, y: 16 });
  const { pulseRef, pulse }            = useGSAPPulse();

  const [area,               setArea]              = useState("");
  const [parkingArea,        setParkingArea]       = useState("");
  const [compoundWallLength, setCompoundWallLength]= useState("");
  const [includeSump,        setIncludeSump]       = useState(false);
  const [quality,            setQuality]           = useState<"basic"|"standard"|"premium">("basic");
  const [customRate,         setCustomRate]        = useState<number>(QUALITY_RATES.basic);
  const [isEditingRate,      setIsEditingRate]     = useState(false);
  const [activeTab,          setActiveTab]         = useState<"estimate"|"timeline"|"rates">("estimate");

  // Pre-fill from saved project (Dashboard edit flow)
  useEffect(() => {
    const state = location.state as { projectData?: any } | null;
    const data  = state?.projectData;
    if (!data) return;
    if (data.area)               setArea(String(data.area));
    if (data.parkingArea)        setParkingArea(String(data.parkingArea));
    if (data.compoundWallLength) setCompoundWallLength(String(data.compoundWallLength));
    if (data.includeSump !== undefined) setIncludeSump(Boolean(data.includeSump));
    if (data.quality)            setQuality(data.quality);
    if (data.rate) {
      setCustomRate(data.rate);
      setIsEditingRate(data.rate !== QUALITY_RATES[data.quality as keyof typeof QUALITY_RATES]);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isEditingRate) setCustomRate(QUALITY_RATES[quality]);
  }, [quality, isEditingRate]);

  const parsedArea    = parseFloat(area)               || 0;
  const parsedParking = parseFloat(parkingArea)        || 0;
  const parsedWall    = parseFloat(compoundWallLength) || 0;

  const costs = useMemo(() => ({
    main:    parsedArea    * customRate,
    parking: parsedParking * (customRate * PARKING_RATE_FACTOR),
    wall:    parsedWall    * COMPOUND_WALL_RATE,
    sump:    includeSump   ? SUMP_TANK_COST[quality] : 0,
  }), [parsedArea, parsedParking, parsedWall, customRate, includeSump, quality]);

  const totalCost   = costs.main + costs.parking + costs.wall + costs.sump;
  const perSqftCost = parsedArea > 0 ? Math.round(totalCost / parsedArea) : 0;

  // Animate counter + pulse KPI strip whenever totalCost changes
  useEffect(() => {
    if (totalCost > 0) {
      animateCounter(totalCost, formatINR);
      pulse();
    }
  }, [totalCost, animateCounter, pulse]);

  const breakdownData = Object.fromEntries(
    Object.entries(BREAKDOWN_PERCENTAGES).map(([k, pct]) => [k, (costs.main * pct) / 100])
  );

  const handleSave = () => {
    saveProject({ area, parkingArea, compoundWallLength, includeSump, quality, rate: customRate, breakdown: costs }, totalCost);
  };

  const handleDownloadPDF = () => {
    const rows: [string, string, string][] = [
      ["Construction", `${area} sq.ft @ Rs.${customRate}/sqft`, formatCurrency(costs.main)],
    ];
    if (costs.parking > 0) rows.push(["Parking Area",  `${parkingArea} sq.ft`,      formatCurrency(costs.parking)]);
    if (costs.wall    > 0) rows.push(["Compound Wall", `${compoundWallLength} ft`,   formatCurrency(costs.wall)]);
    if (costs.sump    > 0) rows.push(["Sump & Septic", `${quality} quality`,         formatCurrency(costs.sump)]);
    Object.entries(BREAKDOWN_PERCENTAGES).forEach(([k, pct]) => {
      rows.push([`  -> ${k}`, `${pct}% of construction`, formatCurrency((costs.main * pct) / 100)]);
    });
    downloadSpreadsheetPDF(`Construction-Estimate-${area}sqft`, ["Item","Details","Cost"], rows, "TOTAL ESTIMATE", formatCurrency(totalCost));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">

      {/* ── Left Column — scroll-reveal ── */}
      <section
        ref={leftRevealRef as React.Ref<HTMLElement>}
        className="lg:col-span-7 space-y-6"
      >
        <Card title="Project Details">
          <form onSubmit={e => e.preventDefault()} className="space-y-6">
            <div className="space-y-4">
              <Input label="Living / Built-up Area (sq. ft.)" type="number" value={area} onChange={e => setArea(e.target.value)} autoFocus />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Parking Area (sq. ft.)" type="number" value={parkingArea} onChange={e => setParkingArea(e.target.value)} />
                <Input label="Compound Wall Length (ft)" type="number" value={compoundWallLength} onChange={e => setCompoundWallLength(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Construction Quality</label>
              <div className="grid grid-cols-3 gap-3">
                {(["basic","standard","premium"] as const).map(q => (
                  <button key={q} type="button"
                    onClick={() => { setQuality(q); setIsEditingRate(false); }}
                    className={`py-3 px-2 rounded-xl border-2 font-medium capitalize transition-all flex flex-col items-center gap-1
                      ${quality === q ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary" : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}>
                    <span className="font-bold">{q}</span>
                    <span className="text-xs opacity-70">Rs.{QUALITY_RATES[q].toLocaleString()}/sqft</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-2">{QUALITY_INFO[quality].desc}</p>
                <ul className="space-y-1">
                  {QUALITY_INFO[quality].features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-400 flex-shrink-0"></i> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={includeSump} onChange={e => setIncludeSump(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary accent-primary" />
                  <span className="ml-3 text-gray-700 font-medium text-sm">Include Sump & Septic Tank</span>
                </label>
                {includeSump && <span className="text-sm font-bold text-primary">+{formatCurrency(SUMP_TANK_COST[quality])}</span>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-600">Custom Rate (Rs./sq.ft)</span>
                  <button type="button" onClick={() => setIsEditingRate(!isEditingRate)}
                    className="text-xs text-primary hover:underline text-left">
                    {isEditingRate ? "<- Reset to Default" : "Edit Rate"}
                  </button>
                </div>
                <div className="relative w-36">
                  <input type="number" value={customRate}
                    onChange={e => { setCustomRate(parseFloat(e.target.value)); setIsEditingRate(true); }}
                    disabled={!isEditingRate}
                    className={`w-full p-2 text-right font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isEditingRate ? "border-primary bg-white" : "border-transparent bg-transparent"}`} />
                  <span className="absolute right-8 top-2 text-xs text-gray-400 pointer-events-none">Rs./sqft</span>
                </div>
              </div>
            </div>
          </form>
        </Card>

        <Card title="Reference Information">
          <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
            {(["rates","timeline"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-secondary text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {tab === "rates" ? "City Rate Benchmarks" : "Construction Timeline"}
              </button>
            ))}
          </div>

          {activeTab === "rates" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="px-3 py-2 text-left">City</th>
                    <th className="px-3 py-2 text-right">Basic</th>
                    <th className="px-3 py-2 text-right">Standard</th>
                    <th className="px-3 py-2 text-right">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {CITY_BENCHMARKS.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{row.city}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">Rs.{row.basic.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">Rs.{row.standard.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-700">Rs.{row.premium.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3">* Indicative 2024-25 rates. Actual rates depend on site conditions and labour market.</p>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-2">
              {CONSTRUCTION_PHASES.map((ph, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{ph.phase}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Wk {ph.weeks}</span>
                    </div>
                    <span className="text-xs text-gray-500">Budget allocation: ~{ph.pct}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ── Right Column — scroll-reveal ── */}
      <section
        ref={rightRevealRef as React.Ref<HTMLElement>}
        className="lg:col-span-5 space-y-6 lg:sticky lg:top-24"
      >
        {totalCost > 0 ? (
          <>
            {/* Total card — GSAP animated counter */}
            <Card className="border-primary/30 shadow-float relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <i className="fas fa-coins text-9xl text-primary transform rotate-12"></i>
              </div>
              <div className="text-center py-4 relative z-10">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Estimated Cost</p>

                {/* counterRef — GSAP writes formatted INR text here on every animation frame */}
                <h2
                  ref={counterRef as React.Ref<HTMLHeadingElement>}
                  className="text-4xl md:text-5xl font-extrabold text-secondary tracking-tight"
                >
                  {formatCurrency(totalCost)}
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  approx <span className="font-bold text-gray-600">{formatCurrency(perSqftCost)}/sq.ft</span> effective rate
                </p>
              </div>

              {/* pulseRef — elastic scale animation on value change */}
              <div
                ref={pulseRef as React.Ref<HTMLDivElement>}
                className="grid grid-cols-3 gap-2 mt-2"
              >
                {[
                  { label: "Main Construction", value: formatCurrency(costs.main),                              color: "text-secondary" },
                  { label: "Ancillary Works",   value: formatCurrency(costs.parking + costs.wall + costs.sump), color: "text-gray-600"  },
                  { label: "Effective Rate",    value: `Rs.${perSqftCost}/sqft`,                                color: "text-primary"  },
                ].map((k, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className={`text-xs font-bold truncate ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{k.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Breakdown Table */}
            <Card title="Cost Breakdown">
              <div className="overflow-hidden rounded-xl border border-gray-100 mb-5">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                      <th className="px-4 py-3 text-right hidden sm:table-cell">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3 font-semibold text-secondary">
                        Construction <span className="text-xs text-gray-400 block font-normal">({area} sqft @ Rs.{customRate})</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(costs.main)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">
                        {totalCost > 0 ? Math.round((costs.main / totalCost) * 100) : 0}%
                      </td>
                    </tr>
                    {costs.parking > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-gray-700">Parking ({parkingArea} sqft)</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.parking)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{Math.round((costs.parking / totalCost) * 100)}%</td>
                      </tr>
                    )}
                    {costs.wall > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-gray-700">Compound Wall ({compoundWallLength} ft)</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.wall)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{Math.round((costs.wall / totalCost) * 100)}%</td>
                      </tr>
                    )}
                    {costs.sump > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-gray-700">Sump & Septic</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(costs.sump)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{Math.round((costs.sump / totalCost) * 100)}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Structural Cost Split</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(BREAKDOWN_PERCENTAGES).map(([k, pct]) => (
                    <div key={k} className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded-lg text-xs">
                      <span className="text-gray-600">{k}</span>
                      <span className="font-bold text-gray-800">{formatCurrency((costs.main * pct) / 100)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-60">
                <Chart data={breakdownData} colors={CHART_COLORS} />
              </div>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <i className="fas fa-info-circle mr-1"></i>
              <strong>Note:</strong> Covers structural and finishing costs only. Land, architect fees, approvals, utility connections, and furniture are excluded. Add 10-15% contingency buffer.
            </div>

            <div className="grid grid-cols-2 gap-4">
              {hasPaid && (
                <button onClick={handleDownloadPDF} disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300 shadow-sm">
                  <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                  <span>PDF</span>
                </button>
              )}
              <button onClick={handleSave} disabled={isSaving}
                className={`flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 transition-all duration-300 shadow-float transform active:scale-95 ${!hasPaid ? "col-span-2" : ""}`}>
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
            <p className="text-gray-400 mt-2 text-sm max-w-[220px]">Enter your built-up area to see the complete cost breakdown.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ConstructionCalculator;