import React from "react";
import { useNavigate } from "react-router-dom";

type CalculatorType = "construction" | "eligibility" | "loan" | "interior" | "doors-windows" | "flooring" | "painting" | "plumbing" | "electrical" | "materials";

interface CalculatorTabsProps {
  activeCalculator: CalculatorType;
  setActiveCalculator: (calculator: CalculatorType) => void;
  hasPaid: boolean;
}

const CALCULATORS: { id: CalculatorType; name: string; icon: string; isPremium: boolean }[] = [
  { id: "construction", name: "Construction", icon: "fas fa-home", isPremium: false },
  { id: "eligibility", name: "Eligibility", icon: "fas fa-check-circle", isPremium: false },
  { id: "loan", name: "Loan EMI", icon: "fas fa-hand-holding-usd", isPremium: false },
  { id: "materials", name: "Materials BOQ", icon: "fas fa-cubes", isPremium: true },
  { id: "interior", name: "Interiors", icon: "fas fa-couch", isPremium: true },
  { id: "doors-windows", name: "Doors/Windows", icon: "fas fa-door-open", isPremium: true },
  { id: "flooring", name: "Flooring", icon: "fas fa-layer-group", isPremium: true },
  { id: "painting", name: "Painting", icon: "fas fa-paint-roller", isPremium: true },
  { id: "plumbing", name: "Plumbing", icon: "fas fa-bath", isPremium: true },
  { id: "electrical", name: "Electrical", icon: "fas fa-bolt", isPremium: true },
];

const CalculatorTabs: React.FC<CalculatorTabsProps> = ({ activeCalculator, setActiveCalculator, hasPaid }) => {
  const navigate = useNavigate();

  const handleTabClick = (id: CalculatorType, isPremium: boolean) => {
    if (isPremium && !hasPaid) {
      navigate("/upgrade");
    } else {
      setActiveCalculator(id);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4 mb-6 scrollbar-hide">
      <div className="flex space-x-3 px-1 min-w-max">
        {CALCULATORS.map(({ id, name, icon, isPremium }) => {
          const isActive = activeCalculator === id;
          const isLocked = isPremium && !hasPaid;
          
          return (
            <button
              key={id}
              onClick={() => handleTabClick(id, isPremium)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
                ${isActive 
                  ? "bg-primary text-white shadow-md transform scale-105" 
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"}
                ${isLocked ? "opacity-75" : ""}
              `}
            >
              <i className={`${icon} ${isActive ? "text-white" : "text-primary"}`}></i>
              {name}
              {isLocked && <i className="fas fa-lock text-xs ml-1 text-gray-400"></i>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorTabs;