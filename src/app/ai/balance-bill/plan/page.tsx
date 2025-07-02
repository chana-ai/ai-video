"use client";

import React, { useState } from "react";

const plans = [
  {
    key: "pay-by-use",
    title: "Pay by Use",
    description: "Only pay for what you use. No monthly fee.",
  },
  {
    key: "basic",
    title: "Basic",
    description: "A basic monthly plan for regular users.",
  },
  {
    key: "premi",
    title: "Premium",
    description: "All features unlocked for power users.",
  },
];

export default function PlanPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSet = () => {
    if (selected) {
      // Replace with real submit logic
      console.log("Selected plan:", selected);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-8 relative">
      <h1 className="text-2xl font-bold mb-8">Choose Your Plan</h1>
      <div className="flex flex-row gap-8 w-full max-w-5xl justify-center">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`flex-1 bg-white rounded-2xl shadow p-8 border transition-all cursor-pointer flex flex-col items-start ${
              selected === plan.key ? "border-black ring-2 ring-black" : "border-gray-200 hover:border-black"
            }`}
            onClick={() => setSelected(plan.key)}
          >
            <div className="text-lg font-semibold mb-2">{plan.title}</div>
            <div className="text-2xl font-bold mb-4">{plan.key === "pay-by-use" ? "$0" : plan.key === "basic" ? "$20" : "$200"}</div>
            <div className="text-gray-500 mb-8">{plan.description}</div>
          </div>
        ))}
      </div>
      <button
        className="fixed bottom-8 right-8 bg-black text-white px-8 py-3 rounded-lg shadow-lg disabled:bg-gray-400 transition-all"
        disabled={!selected}
        onClick={handleSet}
      >
        Set
      </button>
    </div>
  );
} 