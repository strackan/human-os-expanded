// Mock data for reports

export const segmentPriceIncreaseData = [
  { segment: 'SMB', avgIncrease: 4.2, optimal: 5, winRate: 0.82 },
  { segment: 'Mid-Market', avgIncrease: 6.1, optimal: 7, winRate: 0.77 },
  { segment: 'Enterprise', avgIncrease: 8.5, optimal: 9, winRate: 0.69 },
];

export const industryValueData = [
  { industry: 'SaaS', valueRealized: 1.25 }, // 1.25x ROI
  { industry: 'Healthcare', valueRealized: 1.12 },
  { industry: 'Finance', valueRealized: 1.18 },
  { industry: 'Retail', valueRealized: 1.09 },
  { industry: 'Manufacturing', valueRealized: 1.15 },
];

export const contractAnomaliesData = [
  { anomaly: 'Price Constraints', count: 18, percent: 0.12 },
  { anomaly: 'High Liability', count: 9, percent: 0.06 },
  { anomaly: 'No Auto-Renew', count: 22, percent: 0.15 },
  { anomaly: 'Unusual Payment Terms', count: 7, percent: 0.05 },
];

export const renewalPerformanceData = [
  { segment: 'SMB', timeToClose: 14, priceIncrease: 4.2, renewalRate: 0.91, nrg: 1.08 },
  { segment: 'Mid-Market', timeToClose: 21, priceIncrease: 6.1, renewalRate: 0.87, nrg: 1.12 },
  { segment: 'Enterprise', timeToClose: 35, priceIncrease: 8.5, renewalRate: 0.81, nrg: 1.15 },
];

export const bespokeReportsData = {
  mostProfitableUpsellIndustry: { industry: 'SaaS', upsellRate: 0.22, avgUpsell: 32000 },
  fastestGrowingSegment: { segment: 'Mid-Market', growth: 0.19 },
  contractsAtRisk: [
    { customer: 'Acme Corp', risk: 'High Churn Probability', nrg: 0.92 },
    { customer: 'Globex', risk: 'No Auto-Renew', nrg: 0.95 },
  ],
};

export const renewalPerformanceByRepData = [
  { rep: 'Sarah Chen', timeToClose: 12, priceIncrease: 5.2, renewalRate: 0.93, nrg: 1.11 },
  { rep: 'Michael Rodriguez', timeToClose: 18, priceIncrease: 6.8, renewalRate: 0.89, nrg: 1.09 },
  { rep: 'Alex Kim', timeToClose: 22, priceIncrease: 7.1, renewalRate: 0.85, nrg: 1.13 },
  { rep: 'Priya Patel', timeToClose: 15, priceIncrease: 5.9, renewalRate: 0.91, nrg: 1.10 },
];

export const unrealizedProfitTrailing4QData = [
  { quarter: 'Q2 2023', actual: 420000, recommended: 510000, churnRelease: 32000, delta: 510000 + 32000 - 420000 },
  { quarter: 'Q3 2023', actual: 460000, recommended: 540000, churnRelease: 35000, delta: 540000 + 35000 - 460000 },
  { quarter: 'Q4 2023', actual: 480000, recommended: 560000, churnRelease: 37000, delta: 560000 + 37000 - 480000 },
  { quarter: 'Q1 2024', actual: 500000, recommended: 590000, churnRelease: 40000, delta: 590000 + 40000 - 500000 },
];

export const repPerformanceTrailing4QData = [
  { quarter: 'Q2 2023', Sarah: 1.11, Michael: 1.09, Alex: 1.13, Priya: 1.10 },
  { quarter: 'Q3 2023', Sarah: 1.13, Michael: 1.10, Alex: 1.15, Priya: 1.12 },
  { quarter: 'Q4 2023', Sarah: 1.12, Michael: 1.11, Alex: 1.16, Priya: 1.13 },
  { quarter: 'Q1 2024', Sarah: 1.14, Michael: 1.12, Alex: 1.17, Priya: 1.15 },
]; 