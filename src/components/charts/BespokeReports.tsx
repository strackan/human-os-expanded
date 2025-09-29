import React from 'react';

interface BespokeData {
  mostProfitableUpsellIndustry: { industry: string; upsellRate: number; avgUpsell: number };
  fastestGrowingSegment: { segment: string; growth: number };
  contractsAtRisk: { customer: string; risk: string; nrg: number }[];
}

interface Props {
  data: BespokeData;
}

const BespokeReports: React.FC<Props> = ({ data }) => (
  <div className="space-y-6 w-full">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-start">
        <span className="text-xs text-blue-700 font-medium uppercase mb-1">Most Profitable Upsell Industry</span>
        <span className="text-lg font-bold text-blue-900">{data.mostProfitableUpsellIndustry.industry}</span>
        <span className="text-sm text-blue-700">Upsell Rate: {(data.mostProfitableUpsellIndustry.upsellRate * 100).toFixed(1)}%</span>
        <span className="text-sm text-blue-700">Avg Upsell: ${data.mostProfitableUpsellIndustry.avgUpsell.toLocaleString()}</span>
      </div>
      <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
        <span className="text-xs text-green-700 font-medium uppercase mb-1">Fastest Growing Segment</span>
        <span className="text-lg font-bold text-green-900">{data.fastestGrowingSegment.segment}</span>
        <span className="text-sm text-green-700">Growth: {(data.fastestGrowingSegment.growth * 100).toFixed(1)}%</span>
      </div>
    </div>
    <div className="bg-red-50 rounded-lg p-4">
      <span className="text-xs text-red-700 font-medium uppercase mb-2 block">Contracts at Risk</span>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr>
              <th className="px-2 py-1 text-red-800">Customer</th>
              <th className="px-2 py-1 text-red-800">Risk</th>
              <th className="px-2 py-1 text-red-800">NRG</th>
            </tr>
          </thead>
          <tbody>
            {data.contractsAtRisk.map((row, idx) => (
              <tr key={idx} className="odd:bg-red-100 even:bg-red-50">
                <td className="px-2 py-1 font-medium">{row.customer}</td>
                <td className="px-2 py-1">{row.risk}</td>
                <td className="px-2 py-1">{(row.nrg * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default BespokeReports; 