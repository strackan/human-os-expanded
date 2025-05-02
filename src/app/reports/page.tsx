import React from 'react';
import ReportCard from '@/components/ReportCard';
import SegmentPriceIncreaseChart from '@/components/charts/SegmentPriceIncreaseChart';
import IndustryValueChart from '@/components/charts/IndustryValueChart';
import ContractAnomaliesChart from '@/components/charts/ContractAnomaliesChart';
import RenewalPerformanceChart from '@/components/charts/RenewalPerformanceChart';
import RenewalPerformanceByRepChart from '@/components/charts/RenewalPerformanceByRepChart';
import UnrealizedProfitChart from '@/components/charts/UnrealizedProfitChart';
import {
  segmentPriceIncreaseData,
  industryValueData,
  contractAnomaliesData,
  renewalPerformanceData,
  renewalPerformanceByRepData,
  unrealizedProfitTrailing4QData
} from '@/data/mockReportsData';

const ReportsPage = () => (
  <main className="w-full max-w-7xl mx-auto px-4 py-10">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Renewals Reports & Insights</h1>
    <p className="text-gray-600 mb-8 max-w-2xl">Actionable, profit-centric analytics to drive smarter renewals, pricing, and contract strategy. All charts below are designed to surface insights you can act on, not just backward-looking stats.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <ReportCard
        title="Optimal Price Increase Points by Segment"
        description="See where you can push price increases for maximum profit and minimal churn, by customer segment."
      >
        <SegmentPriceIncreaseChart data={segmentPriceIncreaseData} />
      </ReportCard>
      <ReportCard
        title="Value Realization by Industry"
        description="Which industries are realizing the most value from your product? Target upsell and expansion where ROI is highest."
      >
        <IndustryValueChart data={industryValueData} />
      </ReportCard>
      <ReportCard
        title="Contract Health Anomalies"
        description="Spot contracts that may be leaking profit: price constraints, high liability, no auto-renew, and more."
      >
        <ContractAnomaliesChart data={contractAnomaliesData} />
      </ReportCard>
      <ReportCard
        title="Renewal Performance by Segment"
        description="Track time to close, price increase rate, renewal rate, and NRG for each segment. Identify where your process is most efficient and profitable."
      >
        <RenewalPerformanceChart data={renewalPerformanceData} />
      </ReportCard>
      <ReportCard
        title="Renewal Performance by Rep"
        description="Compare your reps across key KPIs. Switch tabs to view Time to Close, Price Increase Rate, Renewal Rate, and NRG."
      >
        <RenewalPerformanceByRepChart data={renewalPerformanceByRepData} />
      </ReportCard>
      <ReportCard
        title="Unrealized Profit: Money Left on the Table"
        description="See how much more profit could have been realized if reps followed recommendations, including churn release from optimal price increases."
      >
        <UnrealizedProfitChart data={unrealizedProfitTrailing4QData} />
      </ReportCard>
    </div>
  </main>
);

export default ReportsPage; 