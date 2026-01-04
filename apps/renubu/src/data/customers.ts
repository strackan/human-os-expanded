// import { Customer } from '@/types';

export interface CustomerRenewalData {
  key: string;
  name: string;
  arr: string;
  usage: string;
  renewalLikelihood: string;
  stage: string;
  stats: { label: string; value: string }[];
  aiInsights: { category: string; color: string; text: string }[];
}

export const customers: Record<string, CustomerRenewalData> = {
  initech: {
    key: 'initech',
    name: 'Initech',
    arr: '$320,000',
    usage: '78%',
    renewalLikelihood: 'Medium',
    stage: 'Outreach',
    stats: [
      { label: 'Current ARR', value: '$320,000' },
      { label: 'Renewal Date', value: 'Sep 30, 2024' },
      { label: 'Usage', value: '78%' },
      { label: '2Y Avg PI%', value: '4.8%' },
      { label: 'Support Tickets (30d)', value: '5' },
      { label: 'Last Engagement', value: '7 days ago' },
    ],
    aiInsights: [
      { category: 'Profit', color: 'green', text: 'Customer is likely to accept a 3-5% price increase.' },
      { category: 'Engagement', color: 'blue', text: 'Recent support tickets resolved; sentiment neutral.' },
      { category: 'Sponsor', color: 'purple', text: 'Executive sponsor has not attended recent QBRs.' },
      { category: 'Risk', color: 'red', text: 'Feature X usage declined 10% last quarter.' },
    ],
  },
  acme: {
    key: 'acme',
    name: 'Acme Corporation',
    arr: '$450,000',
    usage: '92%',
    renewalLikelihood: 'High',
    stage: 'Planning',
    stats: [
      { label: 'Current ARR', value: '$450,000' },
      { label: 'Renewal Date', value: 'Aug 15, 2024' },
      { label: 'Usage', value: '92%' },
      { label: '2Y Avg PI%', value: '6.2%' },
      { label: 'Support Tickets (30d)', value: '3' },
      { label: 'Last Engagement', value: '4 days ago' },
    ],
    aiInsights: [
      { category: 'Profit', color: 'green', text: 'Customer is likely to accept a 5-7% price increase.' },
      { category: 'Engagement', color: 'blue', text: 'Recent support tickets resolved quickly; sentiment positive.' },
      { category: 'Sponsor', color: 'purple', text: 'Executive sponsor attended last QBR.' },
      { category: 'Risk', color: 'red', text: 'No open escalations; renewal risk is low.' },
    ],
  },
};

export const customerOrder = [
  "acme",
  "risky-corp",
  "initech"
];

export const acmeCorpData = {
  customer: {
    name: "Acme Corporation",
    arr: "$450,000",
    stages: [
      { id: 1, name: "Planning", status: "current" as const },
      { id: 2, name: "Outreach", status: "upcoming" as const },
      { id: 3, name: "Negotiation", status: "upcoming" as const },
      { id: 4, name: "Approval", status: "upcoming" as const },
      { id: 5, name: "Closed", status: "upcoming" as const },
    ],
  },
  stats: [
    { label: "Current ARR", value: "$450,000" },
    { label: "Renewal Date", value: "Aug 15, 2024" },
    { label: "Usage", value: "92%" },
    { label: "2Y Avg PI%", value: "6.2%" },
    { label: "Support Tickets (30d)", value: "3" },
    { label: "Last Engagement", value: "4 days ago" },
  ],
  aiInsights: [
    { category: "Profit", color: "green" as const, text: "Customer is likely to accept a 5-7% price increase." },
    { category: "Engagement", color: "blue" as const, text: "Recent support tickets resolved quickly; sentiment positive." },
    { category: "Sponsor", color: "purple" as const, text: "Executive sponsor attended last QBR." },
    { category: "Risk", color: "red" as const, text: "No open escalations; renewal risk is low." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [10, 12, 14, 13, 15, 16, 18] },
    { label: "Usage", data: [80, 85, 90, 92, 91, 93, 92] },
    { label: "PI%", data: [5.2, 5.8, 6.0, 6.1, 6.2, 6.2, 6.2] },
  ],
  contextByStep: [
    [
      { label: 'Usage', value: '92%' },
      { label: 'Current ARR', value: '$450,000' },
      { label: 'Renewal Date', value: 'Aug 15, 2024' },
    ],
    [
      { label: 'Usage', value: '92%' },
      { label: '2Y Avg PI%', value: '6.2%' },
      { label: 'Support Tickets (30d)', value: '3' },
    ],
    [
      { label: 'Primary Contact', value: 'Sarah Johnson (sarah@acme.com)' },
      { label: 'Exec Sponsor', value: 'Michael Chen (michael@acme.com)' },
    ],
    [
      { label: 'Feature X Usage', value: 'Down 15% last quarter' },
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
      label: "Prepare for Renewal",
      icon: "HandRaisedIcon",
    },
    botIntroMessage: "Please review the information to the left and feel free to ask any questions about this account.",
    inputPlaceholder: "Type your question...",
  },
  prevCustomer: "Globex Inc.",
  nextCustomer: "risky-corp",
};

export const riskyCorpData = {
  customer: {
    name: "RiskyCorp",
    arr: "$380,000",
    stages: [
      { id: 1, name: "Planning", status: "current" as const },
      { id: 2, name: "Outreach", status: "upcoming" as const },
      { id: 3, name: "Negotiation", status: "upcoming" as const },
      { id: 4, name: "Approval", status: "upcoming" as const },
      { id: 5, name: "Closed", status: "upcoming" as const },
    ],
  },
  stats: [
    { label: "Current ARR", value: "$380,000" },
    { label: "Renewal Date", value: "Sep 30, 2024" },
    { label: "Usage", value: "65%" },
    { label: "2Y Avg PI%", value: "3.2%" },
    { label: "Support Tickets (30d)", value: "12" },
    { label: "Last Engagement", value: "15 days ago" },
  ],
  aiInsights: [
    { category: "Profit", color: "red" as const, text: "Customer may resist any price increase due to budget constraints." },
    { category: "Engagement", color: "red" as const, text: "Multiple unresolved support tickets; sentiment trending negative." },
    { category: "Sponsor", color: "red" as const, text: "Executive sponsor changed; new sponsor not engaged." },
    { category: "Risk", color: "red" as const, text: "High churn risk due to low usage and engagement." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [10, 12, 14, 13, 12, 11, 10] },
    { label: "Usage", data: [85, 82, 78, 75, 72, 68, 65] },
    { label: "PI%", data: [4.2, 4.0, 3.8, 3.6, 3.4, 3.3, 3.2] },
  ],
  contextByStep: [
    [
      { label: 'Usage', value: '65%' },
      { label: 'Current ARR', value: '$380,000' },
      { label: 'Renewal Date', value: 'Sep 30, 2024' },
    ],
    [
      { label: 'Usage', value: '65%' },
      { label: '2Y Avg PI%', value: '3.2%' },
      { label: 'Support Tickets (30d)', value: '12' },
    ],
    [
      { label: 'Primary Contact', value: 'John Smith (john@riskycorp.com)' },
      { label: 'Exec Sponsor', value: 'New: Sarah Williams (sarah@riskycorp.com)' },
    ],
    [
      { label: 'Feature Usage', value: 'Critical features down 35% last quarter' },
      { label: 'Renewal Risk', value: 'High' },
    ],
    [
      { label: 'Risk Factors', value: 'Low usage, New sponsor, Budget constraints' },
      { label: 'Mitigation Plan', value: 'Executive engagement needed' },
    ],
    [
      { label: 'Escalation Plan', value: 'Schedule C-level meeting' },
      { label: 'Key Points', value: 'Value demonstration, ROI analysis' },
    ],
    [
      { label: 'Ready to send renewal notice', value: '' },
    ],
  ],
  additionalSteps: [
    { id: 6, name: "Risk Mitigation", status: "upcoming" as const },
    { id: 7, name: "Executive Escalation", status: "upcoming" as const },
  ],
  riskLevel: "High Risk",
  riskColor: "red",
  chatConfig: {
    recommendedAction: {
      label: "Urgent: Address Risk Factors",
      icon: "ExclamationTriangleIcon",
    },
    botIntroMessage: "This customer is at high risk. Please review the risk factors and mitigation plan.",
    inputPlaceholder: "Type your question...",
  },
  prevCustomer: "acme",
  nextCustomer: "initech",
};

export const initechData = {
  customer: {
    name: "Initech",
    arr: "$320,000",
    stages: [
      { id: 1, name: "Planning", status: "complete" as const },
      { id: 2, name: "Outreach", status: "current" as const },
      { id: 3, name: "Negotiation", status: "upcoming" as const },
      { id: 4, name: "Approval", status: "upcoming" as const },
      { id: 5, name: "Closed", status: "upcoming" as const },
    ],
  },
  stats: [
    { label: "Current ARR", value: "$320,000" },
    { label: "Renewal Date", value: "Sep 30, 2024" },
    { label: "Usage", value: "78%" },
    { label: "2Y Avg PI%", value: "4.8%" },
    { label: "Support Tickets (30d)", value: "5" },
    { label: "Last Engagement", value: "7 days ago" },
  ],
  aiInsights: [
    { category: "Profit", color: "green" as const, text: "Customer is likely to accept a 3-5% price increase." },
    { category: "Engagement", color: "blue" as const, text: "Recent support tickets resolved; sentiment neutral." },
    { category: "Sponsor", color: "purple" as const, text: "Executive sponsor has not attended recent QBRs." },
    { category: "Risk", color: "red" as const, text: "Feature X usage declined 10% last quarter." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [8, 9, 10, 10, 11, 12, 12] },
    { label: "Usage", data: [70, 72, 75, 77, 78, 78, 78] },
    { label: "PI%", data: [4.0, 4.2, 4.5, 4.6, 4.7, 4.8, 4.8] },
  ],
  contextByStep: [
    [
      { label: 'Usage', value: '78%' },
      { label: 'Current ARR', value: '$320,000' },
      { label: 'Renewal Date', value: 'Sep 30, 2024' },
    ],
    [
      { label: 'Usage', value: '78%' },
      { label: '2Y Avg PI%', value: '4.8%' },
      { label: 'Support Tickets (30d)', value: '5' },
    ],
    [
      { label: 'Primary Contact', value: 'Jane Doe (jane@initech.com)' },
      { label: 'Exec Sponsor', value: 'Robert Smith (robert@initech.com)' },
    ],
    [
      { label: 'Feature X Usage', value: 'Down 10% last quarter' },
      { label: 'Renewal Risk', value: 'Medium' },
    ],
    [
      { label: 'Ready to send renewal notice', value: '' },
    ],
  ],
  additionalSteps: [],
  riskLevel: "Medium",
  riskColor: "yellow",
  chatConfig: {
    recommendedAction: {
      label: "Review Renewal Plan",
      icon: "HandRaisedIcon",
    },
    botIntroMessage: "Review the renewal plan and address any outstanding issues.",
    inputPlaceholder: "Type your question...",
  },
  prevCustomer: "risky-corp",
  nextCustomer: "acme",
}; 