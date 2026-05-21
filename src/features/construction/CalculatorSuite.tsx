import React, { useState, useEffect, startTransition, Suspense, lazy } from "react";
import { useUser } from "../../context/UserContext";
import CalculatorTabs from "./CalculatorTabs";
import { supabase } from "../../config/supabaseClient";

// Helper to handle ChunkLoadError on deployment changes
const lazyWithRetry = (componentImport: () => Promise<any>) => 
  lazy(() => componentImport().catch((error) => {
    console.error("Chunk load failed, reloading page...", error);
    window.location.reload();
    return { default: () => null };
  }));

// Lazy-loaded calculators
const ConstructionCalculator     = lazyWithRetry(() => import("./ConstructionCalculator"));
const FlooringCalculator         = lazyWithRetry(() => import("./FlooringCalculator"));
const PaintingCalculator         = lazyWithRetry(() => import("./PaintingCalculator"));
const PlumbingCalculator         = lazyWithRetry(() => import("./PlumbingCalculator"));
const ElectricalCalculator       = lazyWithRetry(() => import("./ElectricalCalculator"));
const InteriorCalculator         = lazyWithRetry(() => import("./InteriorCalculator"));
const DoorsWindowsCalculator     = lazyWithRetry(() => import("./DoorsWindowsCalculator"));
const MaterialQuantityCalculator = lazyWithRetry(() => import("./MaterialQuantityCalculator"));

type CalculatorType =
  | "construction"
  | "interior"
  | "doors-windows"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "materials";

const Loading = () => (
  <div className="flex flex-col justify-center items-center min-h-[600px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p className="text-gray-400 font-medium text-sm">Loading HDE Tools...</p>
  </div>
);

export default function CalculatorSuite() {
  const { hasPaid } = useUser();
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>("construction");
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any | null>(null);

  useEffect(() => {
    // Parse query params to load dynamic calculator type and edit projects
    const params = new URLSearchParams(window.location.search);
    const calcParam = params.get("calc") as CalculatorType | null;
    const projectUuid = params.get("project");

    if (calcParam) {
      setActiveCalculator(calcParam);
      setTimeout(() => {
        const el = document.getElementById("tools");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }

    if (projectUuid) {
      supabase
          .from("projects")
          .select("*")
          .eq("id", projectUuid)
          .maybeSingle()
          .then(({ data, error }) => {
            if (data && !error) {
              setEditingProjectName(data.name);
              setProjectData(data.data);
            }
          });
    }
  }, []);

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":  return <ConstructionCalculator projectData={projectData} />;
      case "materials":     return <MaterialQuantityCalculator />;
      case "interior":      return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows": return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring":      return <FlooringCalculator />;
      case "painting":      return <PaintingCalculator />;
      case "plumbing":      return <PlumbingCalculator />;
      case "electrical":    return <ElectricalCalculator />;
      default:              return <ConstructionCalculator projectData={projectData} />;
    }
  };

  return (
    <div className="container mx-auto px-0" id="tools">
      {editingProjectName && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-xl text-sm">
          <i className="fas fa-folder-open text-primary"></i>
          <span className="text-gray-700">
            Editing saved project: <strong className="text-primary">{editingProjectName}</strong>
          </span>
          <span className="text-gray-400 text-xs ml-1">— modify values and save again to update</span>
        </div>
      )}

      <CalculatorTabs 
        activeCalculator={activeCalculator} 
        setActiveCalculator={(tab) => startTransition(() => setActiveCalculator(tab))} 
        hasPaid={hasPaid}
      />

      <div className="mt-8 min-h-[600px]">
        <Suspense fallback={<Loading />}>
          {renderCalculator()}
        </Suspense>
      </div>
    </div>
  );
}
