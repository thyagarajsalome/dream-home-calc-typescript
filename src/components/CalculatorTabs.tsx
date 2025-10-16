import React from "react";

type CalculatorType =
  | "construction"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical";

interface CalculatorTabsProps {
  activeCalculator: CalculatorType;
  setActiveCalculator: (calculator: CalculatorType) => void;
  hasPaid: boolean; // New prop to track payment status
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
];

const CalculatorTabs: React.FC<CalculatorTabsProps> = ({
  activeCalculator,
  setActiveCalculator,
  hasPaid,
}) => {
  return (
    <div className="calculator-tabs-container">
      <div className="calculator-tabs">
        {calculators.map(({ id, name, icon, isPremium }) => {
          const isDisabled = isPremium && !hasPaid;
          return (
            <button
              key={id}
              className={`tab-item ${activeCalculator === id ? "active" : ""}`}
              onClick={() => !isDisabled && setActiveCalculator(id)}
              disabled={isDisabled}
              style={{
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              <i className={icon}></i>
              <span>
                {name} {isDisabled && " (Pro)"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorTabs;
