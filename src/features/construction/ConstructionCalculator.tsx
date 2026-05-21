// src/features/construction/ConstructionCalculator.tsx
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

const CHART_COLORS = ["#c5a059", "#0f2042", "#3b4e70", "#5c473c", "#8c776c", "#dfd0bf", "#ebdcd0"];

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
export const ConstructionCalculator = ({ projectData }: { projectData?: any }) => {
  // FIXED: Single destructured assignment for UserContext data at the top
  const { hasPaid, markup = 0 } = useUser();
  
  const location    = useLocation();
  const { 
    saveProject, 
    downloadSpreadsheetPDF, 
    isSaving, 
    isDownloading,
    autosaveDraft,
    getAutosaveDraft
  } = useProjectActions("construction");
  const resultsRef  = useRef<HTMLDivElement>(null);

  // GSAP hooks
  const { counterRef, animateCounter } = useGSAPCounter();
  const { revealRef: leftRevealRef }   = useGSAPReveal({ delay: 0.07, y: 20 });
  const { revealRef: rightRevealRef }  = useGSAPReveal({ delay: 0.10, y: 16 });
  const { pulseRef, pulse }            = useGSAPPulse();

  // Wizard state
  const [wizardStep,         setWizardStep]        = useState(1);
  const [targetBudget,       setTargetBudget]      = useState<number | "">("");
  const [selectedSavings,    setSelectedSavings]   = useState<string[]>([]);

  // Input states
  const [area,               setArea]              = useState("");
  const [parkingArea,        setParkingArea]       = useState("");
  const [compoundWallLength, setCompoundWallLength]= useState("");
  const [includeSump,        setIncludeSump]       = useState(false);
  const [quality,            setQuality]           = useState<"basic"|"standard"|"premium">("basic");
  const [customRate,         setCustomRate]        = useState<number>(QUALITY_RATES.basic);
  const [isEditingRate,      setIsEditingRate]     = useState(false);
  const [activeTab,          setActiveTab]         = useState<"rates"|"timeline">("rates");
  const [detectedCityName,   setDetectedCityName]  = useState<string | null>(null);

  // 1. Pathname-change effect: Detects city from URL path and resets edit rate status on navigation
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    let cityMatched: string | null = null;
    if (path.includes("mumbai")) cityMatched = "Mumbai";
    else if (path.includes("bengaluru")) cityMatched = "Bengaluru";
    else if (path.includes("delhi")) cityMatched = "Delhi NCR";
    else if (path.includes("chennai")) cityMatched = "Chennai";
    else if (path.includes("hyderabad")) cityMatched = "Hyderabad";
    else if (path.includes("pune")) cityMatched = "Pune";
    
    setDetectedCityName(cityMatched);
    setIsEditingRate(false);
  }, [location.pathname]);

  // 2. Mount-time effect: Pre-fill from saved project or fetch draft
  useEffect(() => {
    const state = location.state as { projectData?: any } | null;
    const data  = projectData || state?.projectData;

    if (data) {
      if (data.area)               setArea(String(data.area));
      if (data.parkingArea)        setParkingArea(String(data.parkingArea));
      if (data.compoundWallLength) setCompoundWallLength(String(data.compoundWallLength));
      if (data.includeSump !== undefined) setIncludeSump(Boolean(data.includeSump));
      if (data.quality)            setQuality(data.quality);
      if (data.rate) {
        setCustomRate(data.rate);
        setIsEditingRate(data.rate !== QUALITY_RATES[data.quality as keyof typeof QUALITY_RATES]);
      }
      if (data.selectedSavings)    setSelectedSavings(data.selectedSavings);
      // Skip wizard steps directly to results if we loaded a saved project
      setWizardStep(3);
    } else {
      // If not editing an existing project, attempt to load draft
      getAutosaveDraft().then((draft) => {
        if (draft && draft.data) {
          const d = draft.data;
          if (d.area)                  setArea(String(d.area));
          if (d.parkingArea)           setParkingArea(String(d.parkingArea));
          if (d.compoundWallLength)    setCompoundWallLength(String(d.compoundWallLength));
          if (d.includeSump !== undefined) setIncludeSump(Boolean(d.includeSump));
          if (d.quality)               setQuality(d.quality);
          if (d.rate) {
            setCustomRate(d.rate);
            setIsEditingRate(d.rate !== QUALITY_RATES[d.quality as keyof typeof QUALITY_RATES]);
          }
        } else {
          // If no draft exists, preload the city benchmark rate if present in URL
          const path = window.location.pathname.toLowerCase();
          let cityMatched: string | null = null;
          if (path.includes("mumbai")) cityMatched = "Mumbai";
          else if (path.includes("bengaluru")) cityMatched = "Bengaluru";
          else if (path.includes("delhi")) cityMatched = "Delhi NCR";
          else if (path.includes("chennai")) cityMatched = "Chennai";
          else if (path.includes("hyderabad")) cityMatched = "Hyderabad";
          else if (path.includes("pune")) cityMatched = "Pune";
          
          if (cityMatched) {
            const benchmark = CITY_BENCHMARKS.find(b => b.city === cityMatched);
            if (benchmark) {
              setCustomRate(benchmark.basic);
            }
          }
        }
      });
    }
  }, []);

  // Debounced Autosave effect to update draft in Firestore when inputs change
  useEffect(() => {
    const state = location.state as { projectData?: any } | null;
    // Don't autosave if editing an active saved project
    if (state?.projectData) return;

    if (area || parkingArea || compoundWallLength) {
      const delayDebounceFn = setTimeout(() => {
        autosaveDraft({
          area,
          parkingArea,
          compoundWallLength,
          includeSump,
          quality,
          rate: customRate
        });
      }, 1500); // 1.5 seconds debounce

      return () => clearTimeout(delayDebounceFn);
    }
  }, [area, parkingArea, compoundWallLength, includeSump, quality, customRate, location.state]);

  useEffect(() => {
    if (!isEditingRate) {
      if (detectedCityName) {
        const benchmark = CITY_BENCHMARKS.find(b => b.city === detectedCityName);
        if (benchmark) {
          setCustomRate(benchmark[quality]);
          return;
        }
      }
      setCustomRate(QUALITY_RATES[quality]);
    }
  }, [quality, isEditingRate, detectedCityName]);

  // Sync to localStorage for sharing with other calculators in the funnel
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (area) window.localStorage.setItem("hde_shared_area", area);
      if (quality) window.localStorage.setItem("hde_shared_quality", quality);
    }
  }, [area, quality]);

  const parsedArea    = parseFloat(area)               || 0;
  const parsedParking = parseFloat(parkingArea)        || 0;
  const parsedWall    = parseFloat(compoundWallLength) || 0;

  // Builder Markup Multiplier
  const mFactor = hasPaid ? (1 + markup / 100) : 1;

  // Raw costs multiplication by mFactor
  const costs = useMemo(() => ({
    main:    (parsedArea    * customRate) * mFactor,
    parking: (parsedParking * (customRate * PARKING_RATE_FACTOR)) * mFactor,
    wall:    (parsedWall    * COMPOUND_WALL_RATE) * mFactor,
    sump:    (includeSump   ? SUMP_TANK_COST[quality] : 0) * mFactor,
  }), [parsedArea, parsedParking, parsedWall, customRate, includeSump, quality, mFactor]);

  const totalCost = costs.main + costs.parking + costs.wall + costs.sump;

  // Calculate dynamic savings based on selections
  const savings = useMemo(() => {
    let tilesSaving = 0;
    let flyashSaving = 0;
    let sumpSaving = 0;

    if (quality === "premium" && selectedSavings.includes("tiles")) {
      tilesSaving = parsedArea * 120 * mFactor;
    }
    if ((quality === "premium" || quality === "standard") && selectedSavings.includes("flyash")) {
      flyashSaving = parsedArea * 50 * mFactor;
    }
    if (includeSump && selectedSavings.includes("sump_tank")) {
      sumpSaving = 50000 * mFactor;
    }

    return {
      tiles: tilesSaving,
      flyash: flyashSaving,
      sump: sumpSaving,
      total: tilesSaving + flyashSaving + sumpSaving
    };
  }, [quality, selectedSavings, parsedArea, includeSump, mFactor]);

  const finalTotalCost = Math.max(0, totalCost - savings.total);
  const perSqftCost = parsedArea > 0 ? Math.round(finalTotalCost / parsedArea) : 0;

  // Initialize budget slider target
  useEffect(() => {
    if (wizardStep === 3 && targetBudget === "" && finalTotalCost > 0) {
      setTargetBudget(Math.round(finalTotalCost));
    }
  }, [wizardStep, finalTotalCost]);

  // Animate counter + pulse KPI strip whenever finalTotalCost changes
  useEffect(() => {
    if (finalTotalCost > 0) {
      animateCounter(finalTotalCost, formatINR);
      pulse();
    }
  }, [finalTotalCost, animateCounter, pulse]);

  const breakdownData = useMemo(() => {
    const structuralBase = costs.main;
    // Map slice costs
    return Object.fromEntries(
      Object.entries(BREAKDOWN_PERCENTAGES).map(([k, pct]) => {
        let phaseCost = (structuralBase * pct) / 100;
        // Apply savings splits to target categories
        if (k === "Masonry" && selectedSavings.includes("flyash")) {
          phaseCost = Math.max(0, phaseCost - savings.flyash);
        }
        if (k === "Finishing" && selectedSavings.includes("tiles")) {
          phaseCost = Math.max(0, phaseCost - savings.tiles);
        }
        return [k, phaseCost];
      })
    );
  }, [costs.main, selectedSavings, savings]);

  const handleSave = () => {
    saveProject({ 
      area, 
      parkingArea, 
      compoundWallLength, 
      includeSump, 
      quality, 
      rate: customRate, 
      breakdown: costs,
      selectedSavings
    }, finalTotalCost);
  };

  const handleDownloadPDF = () => {
    const rows: [string, string, string][] = [
      ["Construction Base", `${area} sq.ft @ Rs.${Math.round(customRate * mFactor)}/sqft`, formatCurrency(costs.main)],
    ];
    if (costs.parking > 0) rows.push(["Parking Construction", `${parkingArea} sq.ft`, formatCurrency(costs.parking)]);
    if (costs.wall > 0) rows.push(["Compound Wall Boundary", `${compoundWallLength} ft`, formatCurrency(costs.wall)]);
    if (costs.sump > 0) rows.push(["Sump & Septic Vault", `${quality} preset`, formatCurrency(costs.sump)]);
    
    if (savings.total > 0) {
      rows.push(["Cost Optimization Savings", `Applied deductions`, `-${formatCurrency(savings.total)}`]);
    }

    Object.entries(BREAKDOWN_PERCENTAGES).forEach(([k, pct]) => {
      let phaseCost = (costs.main * pct) / 100;
      if (k === "Masonry" && selectedSavings.includes("flyash")) {
        phaseCost = Math.max(0, phaseCost - savings.flyash);
      }
      if (k === "Finishing" && selectedSavings.includes("tiles")) {
        phaseCost = Math.max(0, phaseCost - savings.tiles);
      }
      rows.push([`  -> Phase: ${k}`, `${pct}% structural allocation`, formatCurrency(phaseCost)]);
    });

    downloadSpreadsheetPDF(`HDE-Estimate-${area}sqft`, ["Est. Item","Parameters","Amount"], rows, "TOTAL ESTIMATE", formatCurrency(finalTotalCost));
  };

  const handleNextStep = () => {
    if (parsedArea <= 0) return;
    setWizardStep(2);
  };

  const handlePrevStep = () => {
    setWizardStep(wizardStep - 1);
  };

  const handleCalculate = () => {
    if (parsedArea > 0) {
      setWizardStep(3);
    }
  };

  // Savings helper checklist
  const toggleSavingOption = (id: string) => {
    setSelectedSavings(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Rendering step indicator progress bar
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100 select-none">
      {[
        { step: 1, label: "Plot details", icon: "fa-map-marked-alt" },
        { step: 2, label: "Quality preset", icon: "fa-sliders-h" },
        { step: 3, label: "Final summary", icon: "fa-chart-pie" }
      ].map((s) => {
        const isCurrent = wizardStep === s.step;
        const isPassed = wizardStep > s.step;
        return (
          <div key={s.step} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 step-indicator
              ${isCurrent ? "active bg-primary text-white" : isPassed ? "bg-secondary text-white" : "bg-gray-100 text-gray-400"}`}>
              {isPassed ? <i className="fas fa-check text-xs"></i> : s.step}
            </div>
            <span className={`text-xs font-bold hidden sm:inline transition-colors duration-300
              ${isCurrent ? "text-primary" : "text-gray-500"}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in font-sans">

      {/* ── Left Column — Form and Wizard Steps ── */}
      <section
        ref={leftRevealRef as React.Ref<HTMLElement>}
        className="lg:col-span-7 space-y-6"
      >
        {wizardStep === 1 && (
          <Card className="glass-panel rounded-2xl shadow-xl border-gray-100/50">
            {renderStepIndicator()}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Step 1: Plot Footprint Details</h3>
                <p className="text-xs text-gray-400 leading-normal">Enter the sizes of your living built-up space and boundary structures.</p>
              </div>

              {detectedCityName && (
                <div className="px-3.5 py-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <i className="fas fa-map-marker-alt text-emerald-500 text-sm"></i>
                  <span>Pre-loaded regional calculations for <strong>{detectedCityName}</strong>.</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="form-group">
                  <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Living / Built-up Area (sq. ft.) *</label>
                  <input
                    type="number"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 gold-focus-glow font-bold text-gray-800 bg-gray-50/50"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Parking Area (sq. ft.)</label>
                    <input
                      type="number"
                      value={parkingArea}
                      onChange={e => setParkingArea(e.target.value)}
                      placeholder="e.g. 200"
                      className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 gold-focus-glow text-gray-700 bg-gray-50/50"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Compound Wall Length (ft)</label>
                    <input
                      type="number"
                      value={compoundWallLength}
                      onChange={e => setCompoundWallLength(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 gold-focus-glow text-gray-700 bg-gray-50/50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={parsedArea <= 0}
                className="w-full mt-4 py-3.5 px-5 bg-primary text-white dark:text-zinc-950 font-bold rounded-xl shadow-lg hover:bg-primary-hover transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                <span>Continue: Select Quality</span>
                <i className="fas fa-arrow-right text-sm"></i>
              </button>
            </div>
          </Card>
        )}

        {wizardStep === 2 && (
          <Card className="glass-panel rounded-2xl shadow-xl border-gray-100/50">
            {renderStepIndicator()}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Step 2: Materials & Finishes Preset</h3>
                <p className="text-xs text-gray-400 leading-normal">Choose the material quality class for your structure and finishes.</p>
              </div>

              {/* Advanced Presets selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["basic","standard","premium"] as const).map(q => {
                  const isSelected = quality === q;
                  return (
                    <div
                      key={q}
                      onClick={() => { setQuality(q); setIsEditingRate(false); }}
                      className={`preset-card p-5 rounded-2xl border-2 cursor-pointer flex flex-col justify-between h-full bg-white select-none
                        ${isSelected ? "border-primary shadow-md ring-1 ring-primary" : "border-gray-200 hover:border-primary/40"}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-800 text-sm capitalize">{q} preset</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                            ${isSelected ? "border-primary bg-primary" : "border-gray-300"}`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed mb-4">{QUALITY_INFO[q].desc}</p>
                      </div>
                      <div className="pt-3.5 border-t border-gray-50 mt-auto">
                        <span className="text-xs font-black text-primary">₹{QUALITY_RATES[q].toLocaleString()}/sqft</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preset details bullet items */}
              <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Features included in {quality}:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {QUALITY_INFO[quality].features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-500 flex-shrink-0 text-sm"></i>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sump tank and custom rates panel */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer select-none">
                    <input type="checkbox" checked={includeSump} onChange={e => setIncludeSump(e.target.checked)}
                      className="w-5 h-5 text-primary rounded border-gray-350 focus:ring-primary accent-primary" />
                    <span className="ml-3 text-gray-700 font-bold text-xs uppercase tracking-wider">Include Sump & Septic Vault</span>
                  </label>
                  {includeSump && <span className="text-xs font-black text-primary">+{formatCurrency(SUMP_TANK_COST[quality] * mFactor)}</span>}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Custom Base Rate</span>
                    <button type="button" onClick={() => setIsEditingRate(!isEditingRate)}
                      className="text-[10px] text-primary hover:underline text-left mt-0.5 font-bold uppercase tracking-wider">
                      {isEditingRate ? "Reset to Default" : "Override Sqft Rate"}
                    </button>
                  </div>
                  <div className="relative w-36">
                    <input type="number" value={customRate}
                      onChange={e => { setCustomRate(parseFloat(e.target.value)); setIsEditingRate(true); }}
                      disabled={!isEditingRate}
                      className={`w-full p-2.5 text-right font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${isEditingRate ? "border-primary bg-white" : "border-transparent bg-transparent"}`} />
                    <span className="absolute right-8 top-3 text-[10px] text-gray-400 font-bold pointer-events-none">Rs./sqft</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="py-3.5 px-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-arrow-left text-sm"></i>
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="col-span-2 py-3.5 px-5 bg-primary text-white dark:text-zinc-950 font-bold rounded-xl shadow-lg hover:bg-primary-hover transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <span>Generate Estimate</span>
                  <i className="fas fa-magic text-sm"></i>
                </button>
              </div>
            </div>
          </Card>
        )}

        {wizardStep === 3 && (
          <div className="space-y-6">
            {/* Step 3 Config Summary panel */}
            <Card className="glass-panel rounded-2xl shadow-xl border-gray-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-gray-800 text-base">Estimate Configured</h4>
                  <p className="text-xs text-gray-400 leading-none mt-1">Calculation parameters are locked.</p>
                </div>
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                >
                  <i className="fas fa-edit text-xs"></i>
                  <span>Adjust Details</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-50 select-none">
                <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Area</p>
                  <p className="text-xs font-extrabold text-secondary mt-0.5">{area} sqft</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Quality</p>
                  <p className="text-xs font-extrabold text-secondary mt-0.5 capitalize">{quality}</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Base Rate</p>
                  <p className="text-xs font-extrabold text-secondary mt-0.5">Rs.{customRate}/sqft</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Parking</p>
                  <p className="text-xs font-extrabold text-secondary mt-0.5">{parkingArea ? `${parkingArea} sqft` : "None"}</p>
                </div>
              </div>
            </Card>

            {/* Smart Target Budget Optimizer Card */}
            {finalTotalCost > 0 && targetBudget !== "" && (
              <Card className="glass-panel rounded-2xl shadow-xl border-gray-150 relative overflow-hidden">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                      <i className="fas fa-piggy-bank text-primary"></i>
                      <span>Gamified Cost Optimizer</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Set a budget limit to see dynamically recommended cost deductions.</p>
                  </div>

                  {/* target budget slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-500 uppercase tracking-wide">Target Budget:</span>
                      <span className="font-black text-secondary text-sm">{formatCurrency(Number(targetBudget))}</span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(totalCost * 0.65)}
                      max={Math.round(totalCost * 1.35)}
                      step={10000}
                      value={targetBudget}
                      onChange={e => setTargetBudget(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                      <span>Min: {formatCurrency(Math.round(totalCost * 0.65))}</span>
                      <span>Max: {formatCurrency(Math.round(totalCost * 1.35))}</span>
                    </div>
                  </div>

                  {/* Budget meter progress bar */}
                  {(() => {
                    const isOverBudget = finalTotalCost > Number(targetBudget);
                    const overAmount = finalTotalCost - Number(targetBudget);
                    return (
                      <div className="space-y-2 pt-1.5">
                        <div className="flex items-center justify-between text-xs select-none">
                          <span className="font-bold text-gray-500 uppercase">Budget Meter status:</span>
                          {isOverBudget ? (
                            <span className="text-red-500 font-extrabold flex items-center gap-1.5">
                              <i className="fas fa-exclamation-triangle"></i>
                              <span>Over by {formatCurrency(overAmount)}</span>
                            </span>
                          ) : (
                            <span className="text-green-500 font-extrabold flex items-center gap-1.5">
                              <i className="fas fa-check-circle"></i>
                              <span>Under Budget!</span>
                            </span>
                          )}
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full
                              ${isOverBudget ? "bg-red-500" : finalTotalCost > Number(targetBudget) * 0.95 ? "bg-zinc-400" : "bg-green-500"}`}
                            style={{ width: `${Math.min(100, (finalTotalCost / Number(targetBudget)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Saving recommendations toggles */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Optimize costs to fit budget:</p>
                    
                    <div className="space-y-2">
                      {/* Premium Tiles optimization (only for premium class) */}
                      {quality === "premium" && (
                        <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 hover:border-primary/20 rounded-xl cursor-pointer select-none transition-all">
                          <input
                            type="checkbox"
                            checked={selectedSavings.includes("tiles")}
                            onChange={() => toggleSavingOption("tiles")}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary accent-primary mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-700">Premium tiles instead of Marble flooring</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">Saves ~Rs.120/sqft. Reduces finishes expense.</p>
                          </div>
                          <span className="text-xs font-bold text-green-500 ml-auto flex-shrink-0">-{formatCurrency(parsedArea * 120 * mFactor)}</span>
                        </label>
                      )}

                      {/* Fly ash blocks optimization (for standard & premium) */}
                      {(quality === "premium" || quality === "standard") && (
                        <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 hover:border-primary/20 rounded-xl cursor-pointer select-none transition-all">
                          <input
                            type="checkbox"
                            checked={selectedSavings.includes("flyash")}
                            onChange={() => toggleSavingOption("flyash")}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary accent-primary mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-700">Fly ash bricks instead of traditional red bricks</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">Saves ~Rs.50/sqft. Environmentally sustainable choice.</p>
                          </div>
                          <span className="text-xs font-bold text-green-500 ml-auto flex-shrink-0">-{formatCurrency(parsedArea * 50 * mFactor)}</span>
                        </label>
                      )}

                      {/* Sump tank optimization */}
                      {includeSump && (
                        <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 hover:border-primary/20 rounded-xl cursor-pointer select-none transition-all">
                          <input
                            type="checkbox"
                            checked={selectedSavings.includes("sump_tank")}
                            onChange={() => toggleSavingOption("sump_tank")}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary accent-primary mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-700">Standard brick septic tank instead of concrete vault</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">Saves flat Rs.50,000 markup from custom construction.</p>
                          </div>
                          <span className="text-xs font-bold text-green-500 ml-auto flex-shrink-0">-{formatCurrency(50000 * mFactor)}</span>
                        </label>
                      )}

                      {/* Fallback if no optimizations are available */}
                      {quality !== "premium" && quality !== "standard" && !includeSump && (
                        <p className="text-xs text-gray-400 italic">No recommendations available for Basic tier estimates. Increase quality class or add sumps to unlock optimizer recommendations.</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Reference Information cards (Only for input stages, hidden on step 3 for neat layout) */}
        {wizardStep < 3 && (
          <Card className="glass-panel border-gray-100/50 rounded-2xl shadow-md">
            <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3 select-none">
              {(["rates","timeline"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? "bg-secondary text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
                  {tab === "rates" ? "Regional rate benchmarks" : "Project schedule timeline"}
                </button>
              ))}
            </div>

            {activeTab === "rates" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">City region</th>
                      <th className="px-3 py-2 text-right">Basic (Rs)</th>
                      <th className="px-3 py-2 text-right">Standard (Rs)</th>
                      <th className="px-3 py-2 text-right">Premium (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/40">
                    {CITY_BENCHMARKS.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-700">{row.city}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">₹{row.basic.toLocaleString()}/sqft</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">₹{row.standard.toLocaleString()}/sqft</td>
                        <td className="px-3 py-2.5 text-right font-bold text-primary">₹{row.premium.toLocaleString()}/sqft</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-2">
                {CONSTRUCTION_PHASES.map((ph, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                    <div className="flex-shrink-0 w-5.5 h-5.5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-extrabold">{i+1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">{ph.phase}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Week {ph.weeks}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Structural budget allocation: ~{ph.pct}% of total estimation</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </section>

      {/* ── Right Column — Estimation Results ── */}
      <section
        ref={rightRevealRef as React.Ref<HTMLElement>}
        className="lg:col-span-5 space-y-6 lg:sticky lg:top-24"
      >
        {wizardStep === 3 && finalTotalCost > 0 ? (
          <>
            {/* Total card — GSAP animated counter */}
            <Card className="glass-panel rounded-2xl shadow-xl border-primary/25 relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <i className="fas fa-coins text-8xl text-primary transform rotate-12"></i>
              </div>
              <div className="text-center py-4 relative z-10">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Optimized Total Estimate</p>

                {/* counterRef */}
                <h2
                  ref={counterRef as React.Ref<HTMLHeadingElement>}
                  className="text-4xl md:text-5xl font-black text-secondary tracking-tight"
                >
                  {formatCurrency(finalTotalCost)}
                </h2>

                <p className="mt-2.5 text-xs text-gray-400 font-semibold select-none">
                  approx <span className="font-black text-gray-600">{formatCurrency(perSqftCost)}/sq.ft</span> effective rate
                </p>
              </div>

              {/* pulseRef */}
              <div
                ref={pulseRef as React.Ref<HTMLDivElement>}
                className="grid grid-cols-3 gap-2 mt-2 select-none"
              >
                {[
                  { label: "Construction", value: formatCurrency(costs.main - savings.tiles - savings.flyash), color: "text-secondary" },
                  { label: "Ancillaries", value: formatCurrency(costs.parking + costs.wall + costs.sump - savings.sump), color: "text-gray-600" },
                  { label: "Est. Savings", value: savings.total > 0 ? `-${formatCurrency(savings.total)}` : "₹0", color: savings.total > 0 ? "text-green-500 font-black" : "text-gray-400" },
                ].map((k, i) => (
                  <div key={i} className="bg-white/60 border border-gray-100/50 rounded-xl p-2.5 text-center shadow-sm">
                    <p className={`text-[10px] font-black truncate ${k.color}`}>{k.value}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 leading-tight">{k.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Breakdown Table & Donut Chart */}
            <Card title="Cost Analysis Breakdown" className="glass-panel rounded-2xl shadow-xl border-gray-100/50">
              <div className="overflow-x-auto rounded-xl border border-gray-100 mb-5">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black">
                    <tr>
                      <th className="px-4 py-3 text-left">Item / Spec details</th>
                      <th className="px-4 py-3 text-right">Cost (Rs)</th>
                      <th className="px-4 py-3 text-right hidden sm:table-cell">% share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3.5 font-bold text-secondary">
                        Structure Base <span className="text-[10px] text-gray-400 block font-normal mt-0.5">({area} sqft @ Rs.{Math.round(customRate * mFactor)}/sqft)</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black">{formatCurrency(costs.main)}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500 font-bold hidden sm:table-cell">
                        {finalTotalCost > 0 ? Math.round((costs.main / finalTotalCost) * 100) : 0}%
                      </td>
                    </tr>
                    {costs.parking > 0 && (
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-700">Parking footprint ({parkingArea} sqft)</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-600">{formatCurrency(costs.parking)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-semibold hidden sm:table-cell">{Math.round((costs.parking / finalTotalCost) * 100)}%</td>
                      </tr>
                    )}
                    {costs.wall > 0 && (
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-700">Compound Boundary Wall ({compoundWallLength} ft)</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-600">{formatCurrency(costs.wall)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-semibold hidden sm:table-cell">{Math.round((costs.wall / finalTotalCost) * 100)}%</td>
                      </tr>
                    )}
                    {costs.sump > 0 && (
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-700">Sump & Septic vaults</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-600">{formatCurrency(costs.sump)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-semibold hidden sm:table-cell">{Math.round((costs.sump / finalTotalCost) * 100)}%</td>
                      </tr>
                    )}
                    {savings.total > 0 && (
                      <tr className="bg-green-50/50 font-bold">
                        <td className="px-4 py-3 text-green-700">Optimizations applied</td>
                        <td className="px-4 py-3 text-right text-green-600">-{formatCurrency(savings.total)}</td>
                        <td className="px-4 py-3 text-right text-green-500 hidden sm:table-cell">-{Math.round((savings.total / finalTotalCost) * 100)}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Interactive SVG Donut chart segment */}
              <div className="h-72 flex items-center justify-center p-3 border-t border-gray-50 mt-5">
                <Chart data={breakdownData} colors={CHART_COLORS} />
              </div>
            </Card>

            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed shadow-sm select-none">
              <i className="fas fa-info-circle mr-1 text-primary"></i>
              <strong>Indicative Report Disclaimer:</strong> Covers standard masonry structural grey stage and typical finishes. Land registrations, municipal approvals, architectural consultancy, elevations design, main service line tap-ins, and furniture items are excluded. We advise maintaining a 10% cash liquidity contingency buffer.
            </div>

            <div className="grid grid-cols-2 gap-4">
              {hasPaid && (
                <button onClick={handleDownloadPDF} disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-zinc-900 border border-secondary dark:border-zinc-700 text-secondary dark:text-zinc-100 font-black rounded-xl hover:bg-secondary dark:hover:bg-zinc-800 hover:text-white transition-all duration-300 shadow-sm">
                  <i className={`fas ${isDownloading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                  <span>Export PDF</span>
                </button>
              )}
              <button onClick={handleSave} disabled={isSaving}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-white dark:text-zinc-950 font-black rounded-xl hover:bg-primary-hover transition-all duration-300 shadow-md transform active:scale-95 ${!hasPaid ? "col-span-2" : ""}`}>
                <i className={`fas ${isSaving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                <span>{isSaving ? "Saving details..." : "Save Project"}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-150 shadow-md p-12 text-center select-none">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300 shadow-inner">
              <i className="fas fa-hard-hat text-3xl"></i>
            </div>
            <h3 className="text-base font-extrabold text-gray-600">Calculations Pending</h3>
            <p className="text-gray-400 mt-2 text-xs max-w-[240px] leading-relaxed">Configure the plot parameters and select your quality spec classes to compile your estimate breakdown report.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ConstructionCalculator;