"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface ChartDataPoint {
  month: string;
  startingARR: number;
  lostARR: number;
  newARR: number;
  blueBase: number;
  redOverlay: number;
  greenGain: number;
  finalARR: number;
  nrrYTD: number;
  nrrMonthly: number;
  isActual: boolean;
}

interface ReportingProps {
  data: {
    currentYear: number;
    chartData: ChartDataPoint[];
  };
  onGoToReports: () => void;
}

const Reporting: React.FC<ReportingProps> = ({ data, onGoToReports }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revenue Performance</h2>
          <p className="text-sm text-gray-500">Year-to-date ARR with NRR tracking and forecasts</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Forecast</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data.chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            {/* ===== CHART AXES ===== */}
            {/* X-Axis - Month Labels */}
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              id="x-axis-months"
            />
            {/* Y-Axis - ARR Dollar Values (Left Side) */}
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              tickFormatter={(value) => `$${value}M`}
              domain={[0, 3]}
              id="y-axis-arr"
            />
            
            {/* ===== REFERENCE LINES ===== */}
            {/* Red 100% NRR Baseline Reference Line */}
            <ReferenceLine 
              y={100} 
              stroke="#ef4444" 
              strokeWidth={3}
              strokeDasharray="5 5"
              yAxisId="nrr"
              label={{ value: "100% NRR", position: "topLeft", fill: "#ef4444", fontSize: 12 }}
              style={{ zIndex: 1000 }}
              id="ref-line-100-percent"
            />
            
            {/* Custom Tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
                      <div className="font-semibold mb-2">{label} {data.currentYear}</div>
                      <div className="space-y-1">
                        <div>Starting ARR: ${data.startingARR?.toFixed(2) || '0.00'}M</div>
                        <div className="text-green-300">New ARR: +${data.newARR?.toFixed(2) || '0.00'}M</div>
                        <div className="text-red-300">Lost ARR: -${data.lostARR?.toFixed(2) || '0.00'}M</div>
                        <div className="border-t border-gray-600 pt-1 mt-1">
                          <div>Final ARR: ${data.finalARR?.toFixed(2) || '0.00'}M</div>
                          <div>Monthly NRR: {data.nrrMonthly || 0}%</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* ===== STACKED BARS SECTION ===== */}
            {/* Section 1: Blue Base (Starting ARR - Lost ARR) */}
            <Bar 
              dataKey="blueBase" 
              stackId="arr" 
              fill="#93c5fd" 
              name="Retained ARR"
              radius={[0, 0, 0, 0]}
              id="bar-blue-base"
            />
            {/* Section 2: Blue with Purple Overlay (Lost ARR) */}
            <Bar 
              dataKey="redOverlay" 
              stackId="arr" 
              fill="rgba(120, 113, 108, 0.6)" 
              name="Lost ARR"
              radius={[0, 0, 0, 0]}
              id="bar-red-overlay"
            />
            {/* Section 3: Green (New ARR) */}
            <Bar 
              dataKey="greenGain" 
              stackId="arr" 
              fill="#16a34a" 
              name="New ARR"
              radius={[0, 0, 0, 0]}
              id="bar-green-gain"
            />
            
            {/* ===== INDIVIDUAL DOT MARKERS ===== */}
            {/* Black Dots - Starting ARR Baseline Markers (at top of blue + red sections) */}
            <Line 
              type="monotone" 
              dataKey="startingARR" 
              stroke="rgba(0,0,0,0.01)"
              strokeWidth={0.1}
              dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#000000', strokeWidth: 2 }}
              name="Starting ARR"
              connectNulls={false}
              id="dots-starting-arr"
            />
            
            {/* Rich Purple Dots - Final ARR Markers (at top of all sections) */}
            <Line 
              type="monotone" 
              dataKey="finalARR" 
              stroke="rgba(84,56,220,0.01)"
              strokeWidth={0.1}
              dot={{ fill: "#5438DC", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#5438DC", strokeWidth: 2 }}
              name="Final ARR"
              connectNulls={false}
              id="dots-final-arr"
            />
            
            {/* ===== CONNECTED TREND LINE ===== */}
            {/* Blue Connected Line - YTD NRR Trend (only line that connects) */}
            <Line 
              type="monotone" 
              dataKey="nrrYTD" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="NRR (YTD)"
              yAxisId="nrr"
              id="line-nrr-ytd"
            />
            
            {/* Y-Axis - NRR Percentage Values (Right Side) */}
            <YAxis 
              yAxisId="nrr"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 200]}
              ticks={[0, 50, 100, 150, 200]}
              id="y-axis-nrr"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300"></div>
          <span>Retained ARR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgba(120, 113, 108, 0.6)'}}></div>
          <span>Lost ARR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-700"></div>
          <span>New ARR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{
            background: 'linear-gradient(45deg, #93c5fd 50%, #78716c 50%)'
          }}></div>
          <span>Starting ARR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#5438DC'}}></div>
          <span>Final ARR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span>NRR (YTD)</span>
        </div>
      </div>
      
      {/* Go To Reports Link */}
      <div className="flex justify-end mt-4">
        <button 
          onClick={onGoToReports}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1"
        >
          Go To Reports
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Reporting;

