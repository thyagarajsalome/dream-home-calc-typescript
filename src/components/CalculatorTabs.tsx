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
}

const calculators: { id: CalculatorType; name: string; icon: string }[] = [
  { id: "construction", name: "Construction", icon: "fas fa-home" },
  { id: "flooring", name: "Flooring", icon: "fas fa-layer-group" },
  { id: "painting", name: "Painting", icon: "fas fa-paint-roller" },
  { id: "plumbing", name: "Plumbing", icon: "fas fa-bath" },
  { id: "electrical", name: "Electrical", icon: "fas fa-bolt" },
];

const CalculatorTabs: React.FC<CalculatorTabsProps> = ({
  activeCalculator,
  setActiveCalculator,
}) => {
  return (
    <div className="calculator-tabs-container">
      <div className="calculator-tabs">
        {calculators.map(({ id, name, icon }) => (
          <button
            key={id}
            className={`tab-item ${activeCalculator === id ? "active" : ""}`}
            onClick={() => setActiveCalculator(id)}
          >
            <i className={icon}></i>
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalculatorTabs;
