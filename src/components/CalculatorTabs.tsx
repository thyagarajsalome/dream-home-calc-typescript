import React from "react";
import { useNavigate } from "react-router-dom";

type CalculatorType =
  | "construction"
  | "eligibility"
  | "loan"
  | "interior"
  | "doors-windows"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "materials"; // <-- ADDED

interface CalculatorTabsProps {
  activeCalculator: CalculatorType;
  setActiveCalculator: (calculator: CalculatorType) => void;
  hasPaid: boolean;
}

const calculators: {
  id: CalculatorType;
  name: string;
  icon: string;
  isPremium: boolean;
}[] = [
  {
    id: "construction",
    name: "Construction",
    icon: "fas fa-home",
    isPremium: false,
  },
  {
    id: "eligibility",
    name: "Eligibility",
    icon: "fas fa-check-circle",
    isPremium: false,
  },
  {
    id: "loan",
    name: "Loan EMI",
    icon: "fas fa-hand-holding-usd",
    isPremium: false,
  },
  // --- NEW: Material Quantity Calculator ---
  {
    id: "materials",
    name: "Materials BOQ",
    icon: "fas fa-cubes",
    isPremium: true,
  },
  // ----------------------------------------
  { id: "interior", name: "Interiors", icon: "fas fa-couch", isPremium: true },
  {
    id: "doors-windows",
    name: "Doors & Windows",
    icon: "fas fa-door-open",
    isPremium: true,
  },
  {
    id: "flooring",
    name: "Flooring",
    icon: "fas fa-layer-group",
    isPremium: true,
  },
  {
    id: "painting",
    name: "Painting",
    icon: "fas fa-paint-roller",
    isPremium: true,
  },
  { id: "plumbing", name: "Plumbing", icon: "fas fa-bath", isPremium: true },
  {
    id: "electrical",
    name: "Electrical",
    icon: "fas fa-bolt",
    isPremium: true,
  },
];

const CalculatorTabs: React.FC<CalculatorTabsProps> = ({
  activeCalculator,
  setActiveCalculator,
  hasPaid,
}) => {
  const navigate = useNavigate();

  const handleTabClick = (id: CalculatorType, isPremium: boolean) => {
    if (isPremium && !hasPaid) {
      navigate("/upgrade");
    } else {
      setActiveCalculator(id);
    }
  };

  return (
    <div className="calculator-tabs-container">
      <div className="calculator-tabs">
        {calculators.map(({ id, name, icon, isPremium }) => {
          const isLocked = isPremium && !hasPaid;
          return (
            <button
              key={id}
              className={`tab-item ${
                activeCalculator === id && !isLocked ? "active" : ""
              }`}
              onClick={() => handleTabClick(id, isPremium)}
            >
              <i className={icon}></i>
              <span>
                {name} {isLocked && "🔒"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorTabs;
