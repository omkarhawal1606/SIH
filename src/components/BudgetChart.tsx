"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { formatCurrency } from "@/lib/currency";

ChartJS.register(ArcElement, Tooltip, Legend);

interface BudgetChartProps {
  breakdown: {
    stay: number;
    food: number;
    travel: number;
    activities: number;
  };
  totalBudget: number;
  currency?: string;
}

export default function BudgetChart({ breakdown, totalBudget, currency = "INR" }: BudgetChartProps) {
  const data = {
    labels: ["Stay", "Food", "Travel", "Activities"],
    datasets: [
      {
        data: [breakdown.stay, breakdown.food, breakdown.travel, breakdown.activities],
        backgroundColor: [
          "#164E3D", // Deep Forest
          "#2F8F6B", // Emerald
          "#3FAF8F", // Warm Teal
          "#E8C98A", // Sand
        ],
        borderColor: [
          "#ffffff",
          "#ffffff",
          "#ffffff",
          "#ffffff",
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#17231F",
          font: { family: "Inter", size: 12, weight: "bold" as const },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "#17231F",
        titleColor: "#FFFFFF",
        bodyColor: "#E4EFE9",
        borderColor: "#D5E1DB",
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const value = context.raw;
            const percentage = totalBudget > 0 ? ((value / totalBudget) * 100).toFixed(1) : "0.0";
            return ` ${formatCurrency(value, currency)} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "68%",
    maintainAspectRatio: false,
  };

  const chartEntries = [
    { label: "Stay", value: breakdown.stay, color: "bg-[#164E3D]" },
    { label: "Food", value: breakdown.food, color: "bg-[#2F8F6B]" },
    { label: "Travel", value: breakdown.travel, color: "bg-[#3FAF8F]" },
    { label: "Activities", value: breakdown.activities, color: "bg-[#E8C98A]" },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="w-[180px] h-[180px] shrink-0">
        <Doughnut data={data} options={options} />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3.5 w-full">
        {chartEntries.map((entry) => (
          <div key={entry.label} className="p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--light-sage)]">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${entry.color}`} />
              <span className="text-xs font-semibold text-[var(--slate)] uppercase tracking-wider">{entry.label}</span>
            </div>
            <div className="text-base font-bold text-[var(--charcoal)]">
              {formatCurrency(entry.value, currency)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
