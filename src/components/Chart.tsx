import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface ChartProps {
  data: { [key: string]: number };
}

const PieChart: React.FC<ChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>();

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const context = chartRef.current.getContext("2d");
      if (context) {
        chartInstance.current = new Chart(context, {
          type: "pie",
          data: {
            labels: Object.keys(data),
            datasets: [
              {
                data: Object.values(data),
                backgroundColor: ["#ff6f00", "#2c3e50", "#f1c40f", "#7f8c8d"],
              },
            ],
          },
        });
      }
    }
  }, [data]);

  return <canvas ref={chartRef} />;
};

export default PieChart;
