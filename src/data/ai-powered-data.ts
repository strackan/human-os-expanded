import { RocketLaunchIcon } from "@heroicons/react/24/outline";

export const cloudforceData = {
  customer: {
    name: "CloudForce Systems",
    arr: "$420,000",
    stages: [
      { id: 1, name: "Planning", status: "complete" },
      { id: 2, name: "Outreach", status: "current" },
      { id: 3, name: "Negotiation", status: "upcoming" },
      { id: 4, name: "Approval", status: "upcoming" },
      { id: 5, name: "Closed", status: "upcoming" },
    ],
  },
  stats: [
    { label: "Current ARR", value: "$420,000" },
    { label: "Renewal Date", value: "Nov 30, 2024" },
    { label: "Usage", value: "85%" },
    { label: "2Y Avg PI%", value: "4.5%" },
    { label: "Support Tickets (30d)", value: "4" },
    { label: "Last Engagement", value: "10 days ago" },
  ],
  aiInsights: [
    { category: "Automation", color: "green", text: "AI has drafted renewal email; ready for review." },
    { category: "Time Saved", color: "blue", text: "4.5 hours saved this month through automated tasks." },
    { category: "Workflow", color: "purple", text: "QBR scheduled by AI based on stakeholder availability." },
    { category: "Analysis", color: "red", text: "Support tickets show pattern around Feature Y." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [10, 11, 12, 13, 14, 15, 15.5] },
    { label: "Usage", data: [75, 78, 80, 82, 84, 85, 85] },
    { label: "PI%", data: [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.5] },
  ],
  contextByStep: [
    [
      { label: 'Usage', value: '85%' },
      { label: 'Current ARR', value: '$420,000' },
      { label: 'Renewal Date', value: 'Nov 30, 2024' },
    ],
    [
      { label: 'Usage', value: '85%' },
      { label: '2Y Avg PI%', value: '4.5%' },
      { label: 'Support Tickets (30d)', value: '4' },
    ],
    [
      { label: 'Primary Contact', value: 'Jordan Lee (jordan@cloudforce.com)' },
      { label: 'Exec Sponsor', value: 'Pat Reynolds (pat@cloudforce.com)' },
    ],
    [
      { label: 'Feature Y Issues', value: 'Identified in support tickets' },
      { label: 'Renewal Risk', value: 'Low' },
    ],
    [
      { label: 'Ready to send renewal notice', value: '' },
    ],
  ],
  additionalSteps: [],
  aiTasks: [
    { task: "Draft renewal email", status: "Completed by AI", timeSaved: "45 min" },
    { task: "Schedule QBR", status: "Completed by AI", timeSaved: "30 min" },
    { task: "Support ticket analysis", status: "Completed by AI", timeSaved: "2 hrs" },
    { task: "Usage report generation", status: "In Progress", timeSaved: "1 hr" },
    { task: "Contact verification", status: "Completed by AI", timeSaved: "15 min" },
  ],
  riskLevel: "Medium",
  riskColor: "blue",
  chatConfig: {
    recommendedAction: {
      label: "Review AI Work",
      icon: "RocketLaunchIcon"
    },
    botIntroMessage: "AI has completed several routine tasks for you. Review the automated work products and approve or edit as needed.",
    inputPlaceholder: "Ask about AI-completed tasks...",
  },
  prevCustomer: "dataone",
  nextCustomer: "techvision",
}; 