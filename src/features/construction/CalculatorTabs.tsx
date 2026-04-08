import React from "react";
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
  const { tierValue } = useUser(); // Fetch tier dynamically

  const handleTabClick = (id: CalculatorType, reqTier: number) => {
    if (tierValue < reqTier) navigate("/upgrade");
    else setActiveCalculator(id);
  };

  return (
    <div className="w-full overflow-x-auto pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-1 scrollbar-hide">
      <div className="flex gap-3 min-w-max">
        {CALCULATORS.map(({ id, name, icon, reqTier }) => {
          const isActive = activeCalculator === id;
          const isLocked = tierValue < reqTier;

          return (
            <button
              key={id}
              onClick={() => handleTabClick(id, reqTier)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex-shrink-0 select-none
                ${isActive ? "bg-secondary text-white border-secondary shadow-md transform scale-[1.02]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-secondary"}
                ${isLocked ? "opacity-75" : ""}`}
            >
              <i className={`${icon} ${isActive ? "text-primary" : "text-gray-400"}`}></i>
              <span className="whitespace-nowrap">{name}</span>
              {isLocked && <i className="fas fa-lock text-xs ml-1 text-gray-400"></i>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorTabs;