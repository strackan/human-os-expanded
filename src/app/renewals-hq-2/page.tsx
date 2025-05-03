"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";

// Mock data for Acme Corp
const acmeCustomer = {
  name: "Acme Corporation",
  arr: "$450,000",
  stages: [
    { id: 1, name: "Planning", status: "current" },
    { id: 2, name: "Outreach", status: "upcoming" },
    { id: 3, name: "Negotiation", status: "upcoming" },
    { id: 4, name: "Approval", status: "upcoming" },
    { id: 5, name: "Closed", status: "upcoming" },
  ],
};

const prevCustomer = "Globex Inc.";
const nextCustomer = "Initech";

const stats = [
  { label: "Current ARR", value: "$450,000" },
  { label: "Renewal Date", value: "Aug 15, 2024" },
  { label: "Usage", value: "92%" },
  { label: "2Y Avg PI%", value: "6.2%" },
  { label: "Support Tickets (30d)", value: "3" },
  { label: "Last Engagement", value: "4 days ago" },
];

const aiInsights: { category: string; color: 'green' | 'blue' | 'purple' | 'red'; text: string }[] = [
  { category: "Profit", color: "green", text: "Customer is likely to accept a 5-7% price increase." },
  { category: "Engagement", color: "blue", text: "Recent support tickets resolved quickly; sentiment positive." },
  { category: "Sponsor", color: "purple", text: "Executive sponsor attended last QBR." },
  { category: "Risk", color: "red", text: "No open escalations; renewal risk is low." },
];

const recommendedAction = {
  label: "Prepare for Renewal",
  icon: HandRaisedIcon,
};

const metricCaptions = [
  "ARR",
  "RENEWAL",
  "USAGE",
  "PI%",
  "TICKETS",
  "ENGAGE",
];

const miniCharts = [
  { label: "ARR Trend", data: [10, 12, 14, 13, 15, 16, 18] },
  { label: "Usage", data: [80, 85, 90, 92, 91, 93, 92] },
  { label: "PI%", data: [5.2, 5.8, 6.0, 6.1, 6.2, 6.2, 6.2] },
];

const MiniSparklineChart: React.FC<{ data: number[] }> = ({ data }) => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="overflow-visible">
    <polyline
      fill="none"
      stroke="#3B82F6"
      strokeWidth="2"
      points={data
        .map((d, i) => `${(i / (data.length - 1)) * 58 + 1},${23 - ((d - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * 20}`)
        .join(" ")}
    />
  </svg>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col items-start bg-gray-50 rounded-lg p-4 min-w-[120px] min-h-[64px]">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-lg font-bold text-gray-900 mt-1">{value}</span>
  </div>
);

const StageTimeline: React.FC<{ stages: any[] }> = ({ stages }) => (
  <div className="flex items-center space-x-4 mt-4">
    {stages.map((stage, idx) => (
      <div key={stage.id} className="flex flex-col items-center">
        <div className="flex items-center">
          {stage.status === "complete" ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : stage.status === "current" ? (
            <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
          )}
          {idx < stages.length - 1 && (
            <div
              className={`h-0.5 w-8 ${
                stage.status === "complete" ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
        <span
          className={`mt-2 text-sm ${
            stage.status === "complete"
              ? "text-green-600"
              : stage.status === "current"
              ? "text-blue-600 font-medium"
              : "text-gray-500"
          }`}
        >
          {stage.name}
        </span>
      </div>
    ))}
  </div>
);

const categoryColor = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

const RenewalsHQ2Page = () => {
  const [showStats, setShowStats] = useState(true);
  const [leftWidthPx, setLeftWidthPx] = useState(400); // px
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial leftWidthPx to 50% of container on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLeftWidthPx(rect.width / 2);
    }
  }, []);

  // Drag handlers
  const startDrag = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
  };
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    let newWidth = e.clientX - rect.left;
    newWidth = Math.max(250, Math.min(newWidth, rect.width - 250));
    setLeftWidthPx(newWidth);
  };
  const stopDrag = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">
                {acmeCustomer.name}
              </h2>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
                <span className="font-medium text-gray-500">Success Likelihood:</span>
                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">High</span>
              </div>
            </div>
            <StageTimeline stages={acmeCustomer.stages} />
          </div>
        </div>
        {/* Main Container with draggable divider */}
        <div className="relative flex w-full" ref={containerRef} style={{ minHeight: 400 }}>
          {/* Left: Tail of the Tape */}
          <div
            className={`bg-white rounded-l-2xl shadow-lg p-8 flex flex-col h-full relative ${showStats ? "" : "justify-center items-center"}`}
            style={{ width: leftWidthPx, minWidth: 180 }}
          >
            {showStats ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Tail of the Tape</h3>
                </div>
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {stats.map((stat) => (
                    <div className="bg-gray-50 rounded-lg p-4 min-h-[64px]" key={stat.label}>
                      <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                      <span className="text-2xl font-bold text-gray-900 mt-1 block">{stat.value}</span>
                    </div>
                  ))}
                </div>
                {/* Mini charts row */}
                <div className="flex gap-4 mb-6">
                  {miniCharts.map((chart, i) => (
                    <div className="flex flex-col items-center" key={i}>
                      <MiniSparklineChart data={chart.data} />
                      <span className="text-xs text-gray-500 mt-1">{chart.label}</span>
                    </div>
                  ))}
                </div>
                {/* AI Insights grid */}
                <div className="grid grid-cols-2 gap-4">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 h-full flex flex-col items-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}>{insight.category}</span>
                      <span className="text-sm text-gray-700 text-center">{insight.text}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">Tail of the Tape</h3>
              </>
            )}
            {/* Collapse/Expand Icon at bottom right */}
            <div className="absolute right-4 bottom-2">
              <button
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label={showStats ? "Collapse stats" : "Expand stats"}
                onClick={() => setShowStats((s) => !s)}
                tabIndex={0}
              >
                {showStats ? (
                  <ChevronUpIcon className="h-6 w-6 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            {/* Bottom left: carat + prev customer */}
            {showStats && (
              <div className="mt-auto flex items-center gap-2 pt-4">
                <ChevronLeftIcon className="w-7 h-7 text-gray-300" />
                <span className="text-xs text-gray-500">Prev: {prevCustomer}</span>
              </div>
            )}
          </div>
          {/* Draggable Divider */}
          <div
            className="absolute top-0 z-10 h-full w-px cursor-col-resize bg-gray-200 hover:bg-gray-400 transition-colors duration-150 flex-shrink-0"
            style={{ left: leftWidthPx - 0.5 }}
            onMouseDown={startDrag}
            tabIndex={0}
            aria-label="Resize panel"
            role="separator"
          />
          {/* Right: Recommended Action */}
          <div
            className="bg-green-50 rounded-r-2xl shadow-lg p-8 flex flex-col justify-between flex-1"
            style={{ minWidth: 180 }}
          >
            <div className="flex-1 flex flex-col justify-center items-center">
              <button
                className="px-8 py-4 bg-green-600 text-white rounded-xl text-lg font-bold flex items-center gap-2 hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow"
                tabIndex={0}
                aria-label={recommendedAction.label}
              >
                <recommendedAction.icon className="h-6 w-6" />
                {recommendedAction.label}
              </button>
            </div>
            {/* Bottom right: carat + next customer */}
            <div className="flex items-center gap-2 justify-end pt-4">
              <span className="text-xs text-gray-500">Next: {nextCustomer}</span>
              <ChevronRightIcon className="w-7 h-7 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalsHQ2Page; 