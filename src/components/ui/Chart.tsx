import React, { useState } from "react";

interface ChartProps {
  data: { [key: string]: number };
  colors: string[];
}

const DonutChart: React.FC<ChartProps> = ({ data, colors }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = Object.values(data).reduce((acc, curr) => acc + curr, 0);

  if (total === 0) return null;

  const items = Object.entries(data).map(([label, val], idx) => ({
    label,
    value: val,
    color: colors[idx % colors.length],
    percentage: (val / total) * 100,
  }));

  let accumulatedPercentage = 0;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 font-sans">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="9"
            className="text-zinc-100 dark:text-zinc-800"
          />
          {items.map((item, idx) => {
            const currentOffset = accumulatedPercentage;
            accumulatedPercentage += item.percentage;
            const isHovered = hoveredIndex === idx;

            // Stroke properties for SVG circle: circumference is 2 * pi * r = 2 * 3.14159 * 40 = 251.3
            const dashArray = `${item.percentage * 2.513} 251.3`;
            const dashOffset = `${-currentOffset * 2.513}`;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? 12 : 9}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300 cursor-pointer origin-center"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  transform: isHovered ? "scale(1.04)" : "scale(1)",
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {hoveredIndex !== null ? (
            <>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-extrabold truncate w-full">
                {items[hoveredIndex].label}
              </span>
              <span className="text-lg font-black text-secondary dark:text-zinc-100 leading-none mt-0.5">
                {Math.round(items[hoveredIndex].percentage)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-widest text-primary dark:text-zinc-300 font-black">
                COST SPLIT
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                Hover Slices
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Legend Section */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs px-2 select-none">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ 
              opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.35,
              transform: hoveredIndex === idx ? "translateX(2px)" : "translateX(0)"
            }}
          >
            <span className="w-3 h-3 rounded-md flex-shrink-0 shadow-sm border border-white/50" style={{ backgroundColor: item.color }} />
            <span className="truncate text-zinc-600 dark:text-zinc-400 font-semibold">{item.label}</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-300 ml-auto">{Math.round(item.percentage)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
