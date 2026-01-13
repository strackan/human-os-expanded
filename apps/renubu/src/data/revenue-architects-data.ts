export const dataOneData = {
  customer: {
    name: "DataOne Technologies",
    arr: "$580,000",
    stages: [
      { id: 1, name: "Planning", status: "current" as const },
      { id: 2, name: "Outreach", status: "upcoming" as const },
      { id: 3, name: "Negotiation", status: "upcoming" as const },
      { id: 4, name: "Approval", status: "upcoming" as const },
      { id: 5, name: "Closed", status: "upcoming" as const },
    ],
  },
  stats: [
    { label: "Current ARR", value: "$580,000" },
    { label: "Renewal Date", value: "Oct 15, 2024" },
    { label: "Usage", value: "94%" },
    { label: "2Y Avg PI%", value: "5.8%" },
    { label: "Support Tickets (30d)", value: "2" },
    { label: "Last Engagement", value: "3 days ago" },
  ],
  aiInsights: [
    { category: "Profit", color: "green" as const, text: "Customer is likely to accept a 5-7% price increase based on historical data." },
    { category: "Expansion", color: "blue" as const, text: "Usage patterns indicate 40% more capacity needed in Q4." },
    { category: "Upsell", color: "purple" as const, text: "Ready for Premium Analytics add-on based on feature usage." },
    { category: "Risk", color: "red" as const, text: "No major risks identified; renewal probability high." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [12, 14, 16, 18, 19, 19.5, 20] },
    { label: "Usage", data: [80, 85, 88, 90, 92, 93, 94] },
    { label: "PI%", data: [5.0, 5.2, 5.4, 5.6, 5.7, 5.8, 5.8] },
  ],
  contextByStep: [
    [
      { label: 'Usage', value: '94%' },
      { label: 'Current ARR', value: '$580,000' },
      { label: 'Renewal Date', value: 'Oct 15, 2024' },
    ],
    [
      { label: 'Usage', value: '94%' },
      { label: '2Y Avg PI%', value: '5.8%' },
      { label: 'Support Tickets (30d)', value: '2' },
    ],
    [
      { label: 'Primary Contact', value: 'Alex Morgan (alex@dataone.com)' },
      { label: 'Exec Sponsor', value: 'Chris Taylor (chris@dataone.com)' },
    ],
    [
      { label: 'Upsell Opportunity', value: 'Premium Analytics add-on ($120K ARR)' },
      { label: 'Renewal Risk', value: 'Low' },
    ],
    [
      { label: 'Ready to send renewal notice', value: '' },
    ],
  ],
  additionalSteps: [],
  riskLevel: "High",
  riskColor: "green",
  chatConfig: {
    recommendedAction: {
      label: "Recommend Upsell",
      icon: "RocketLaunchIcon"
    },
    botIntroMessage: "This customer shows strong usage patterns indicating readiness for Premium Analytics. Usage data indicates they will need 40% more capacity in Q4.",
    inputPlaceholder: "Ask about upsell opportunity...",
  },
  prevCustomer: "acme",
  nextCustomer: "cloudforce",
}; 