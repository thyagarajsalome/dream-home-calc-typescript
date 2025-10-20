import React from "react";
import { useNavigate } from "react-router-dom";

type CalculatorType =
  | "construction"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "loan"; // New calculator type

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
  {
    id: "loan", // New Loan Calculator
    name: "Loan EMI",
    icon: "fas fa-hand-holding-usd",
    isPremium: false,
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
