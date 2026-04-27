import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

type CalculatorType = "construction" | "interior" | "doors-windows" | "flooring" | "painting" | "plumbing" | "electrical" | "materials";

interface CalculatorTabsProps {
  activeCalculator: CalculatorType;
  setActiveCalculator: (calculator: CalculatorType) => void;
}

const CALCULATORS: { id: CalculatorType; name: string; icon: string; reqTier: number }[] = [
  { id: "construction",  name: "Construction",   icon: "fas fa-home",        reqTier: 0 },
  { id: "interior",      name: "Interiors",      icon: "fas fa-couch",       reqTier: 1 },
  { id: "flooring",      name: "Flooring",       icon: "fas fa-layer-group", reqTier: 1 },
  { id: "painting",      name: "Painting",       icon: "fas fa-paint-roller",reqTier: 1 },
  { id: "doors-windows", name: "Doors/Windows",  icon: "fas fa-door-open",   reqTier: 2 },
  { id: "plumbing",      name: "Plumbing",       icon: "fas fa-bath",        reqTier: 2 },
  { id: "electrical",    name: "Electrical",     icon: "fas fa-bolt",        reqTier: 2 },
  { id: "materials",     name: "Materials BOQ",  icon: "fas fa-cubes",       reqTier: 3 },
];

const CalculatorTabs: React.FC<CalculatorTabsProps> = ({ activeCalculator, setActiveCalculator }) => {
  const navigate = useNavigate();
  const { tierValue } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentCalc = CALCULATORS.find(c => c.id === activeCalculator) || CALCULATORS[0];

  const handleTabClick = (id: CalculatorType, reqTier: number) => {
    if (tierValue < reqTier) {
      navigate("/upgrade");
    } else {
      setActiveCalculator(id);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="w-full pt-2 pb-4">
      {/* MOBILE DROPDOWN (Visible only on <768px) */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm text-secondary font-bold"
        >
          <div className="flex items-center gap-3">
            <i className={`${currentCalc.icon} text-primary`}></i>
            <span>{currentCalc.name}</span>
          </div>
          <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-gray-400`}></i>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
            {CALCULATORS.map((calc) => (
              <button
                key={calc.id}
                onClick={() => handleTabClick(calc.id, calc.reqTier)}
                className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors
                  ${activeCalculator === calc.id ? "bg-amber-50/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <i className={`${calc.icon} ${activeCalculator === calc.id ? 'text-primary' : 'text-gray-400'}`}></i>
                  <span className={`text-sm ${activeCalculator === calc.id ? 'font-bold text-secondary' : 'text-gray-600'}`}>{calc.name}</span>
                </div>
                {tierValue < calc.reqTier && <i className="fas fa-lock text-xs text-gray-300"></i>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TABLET & DESKTOP GRID (Visible on >=768px - No sliding, all visible) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CALCULATORS.map(({ id, name, icon, reqTier }) => {
          const isActive = activeCalculator === id;
          const isLocked = tierValue < reqTier;

          return (
            <button
              key={id}
              onClick={() => handleTabClick(id, reqTier)}
              className={`flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 border
                ${isActive ? "bg-secondary text-white border-secondary shadow-lg scale-[1.02]" : "bg-white text-gray-600 border-gray-100 hover:border-primary/30 hover:bg-amber-50/20"}
                ${isLocked ? "opacity-80" : ""}`}
            >
              <i className={`${icon} ${isActive ? "text-primary" : "text-gray-300"}`}></i>
              <span className="whitespace-nowrap">{name}</span>
              {isLocked && <i className="fas fa-lock text-[10px] ml-1 opacity-40"></i>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorTabs;