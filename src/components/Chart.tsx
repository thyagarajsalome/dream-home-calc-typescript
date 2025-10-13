import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface ChartProps {
  data: { [key: string]: number };
  colors: string[];
}

const PieChart: React.FC<ChartProps> = ({ data, colors }) => {
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
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  padding: 10,
                  font: {
                    family: "'Roboto', sans-serif",
                  },
                },
              },
            },
          },
        });
      }
    }
  }, [data, colors]);

  return <canvas ref={chartRef} />;
};

export default PieChart;
