import { RocketLaunchIcon } from "@heroicons/react/24/outline";

export const techvisionData = {
  customer: {
    name: "TechVision Inc.",
    arr: "$350,000",
    stages: [
      { id: 1, name: "Planning", status: "complete" },
      { id: 2, name: "Outreach", status: "complete" },
      { id: 3, name: "Negotiation", status: "current" },
      { id: 4, name: "Approval", status: "upcoming" },
      { id: 5, name: "Closed", status: "upcoming" },
    ],
  },
  stats: [
    { label: "Current ARR", value: "$350,000" },
    { label: "Renewal Date", value: "Dec 15, 2024" },
    { label: "Usage", value: "90%" },
    { label: "2Y Avg PI%", value: "5.2%" },
    { label: "Support Tickets (30d)", value: "1" },
    { label: "Last Engagement", value: "2 days ago" },
  ],
  aiInsights: [
    { category: "Value", color: "green", text: "Customer achieved 120% ROI in first year based on usage metrics." },
    { category: "Milestone", color: "blue", text: "Customer reached 1M transactions last week - key achievement." },
    { category: "Engagement", color: "purple", text: "Sponsor shared positive feedback after last QBR." },
    { category: "Opportunity", color: "red", text: "Perfect timing for value summary to reinforce renewal decision." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [9, 10, 11, 12, 12.5, 13, 13.5] },
    { label: "Usage", data: [70, 75, 82, 85, 88, 90, 90] },
    { label: "PI%", data: [4.8, 4.9, 5.0, 5.1, 5.2, 5.2, 5.2] },
  ],
  contextByStep: [
    [
      { label: 'Usage', value: '90%' },
      { label: 'Current ARR', value: '$350,000' },
      { label: 'Renewal Date', value: 'Dec 15, 2024' },
    ],
    [
      { label: 'Usage', value: '90%' },
      { label: '2Y Avg PI%', value: '5.2%' },
      { label: 'Support Tickets (30d)', value: '1' },
    ],
    [
      { label: 'Primary Contact', value: 'Sam Zhang (sam@techvision.com)' },
      { label: 'Exec Sponsor', value: 'Robin Garcia (robin@techvision.com)' },
    ],
    [
      { label: 'Key Milestone', value: '1M transactions processed' },
      { label: 'Renewal Risk', value: 'Low' },
    ],
    [
      { label: 'Ready to send renewal notice', value: '' },
    ],
  ],
  additionalSteps: [],
  milestones: [
    { date: "Jan 15, 2024", title: "Initial Implementation", description: "Successful go-live" },
    { date: "Apr 22, 2024", title: "Usage Milestone", description: "500K transactions processed" },
    { date: "Jun 10, 2024", title: "QBR", description: "Positive feedback from stakeholders" },
    { date: "Sep 5, 2024", title: "Impact Report", description: "120% ROI documented" },
    { date: "Nov 12, 2024", title: "1M Milestone", description: "Reached 1M transactions" },
  ],
  riskLevel: "High",
  riskColor: "green",
  chatConfig: {
    recommendedAction: {
      label: "Send Value Summary",
      icon: "RocketLaunchIcon"
    },
    botIntroMessage: "TechVision just reached a major milestone of 1M transactions. Now is the perfect time to celebrate this achievement and share a value summary.",
    inputPlaceholder: "Ask about customer impact...",
  },
  prevCustomer: "cloudforce",
  nextCustomer: "dataone",
}; 