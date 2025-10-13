'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, CheckSquare } from 'lucide-react';

interface WorkflowStep {
  day: number;
  title: string;
  description: string;
  actions: string[];
}

interface StrategicAccountPlanArtifactProps {
  customerName: string;
  strategyType: 'expand' | 'invest' | 'protect';
  renewalDate?: string;
  currentARR?: string;
  healthScore?: number;
  growthPotential?: number;
  riskLevel?: number;
  onModify?: () => void;
  onAgree?: () => void;
  onComeBack?: () => void;
}

const workflows: Record<'expand' | 'invest' | 'protect', WorkflowStep[]> = {
  expand: [
    {
      day: 30,
      title: "Discovery & Opportunity Mapping",
      description: "Conduct deep-dive sessions with key stakeholders to identify unmet needs, new use cases, and expansion opportunities. Review usage data to find underutilized features.",
      actions: [
        "Schedule stakeholder interviews",
        "Analyze product usage analytics",
        "Identify white space opportunities",
        "Document expansion hypotheses"
      ]
    },
    {
      day: 45,
      title: "Value Alignment Workshop",
      description: "Present ROI analysis of current investment and showcase additional capabilities that align with their business objectives.",
      actions: [
        "Prepare ROI deck",
        "Schedule executive session",
        "Demonstrate advanced features",
        "Gather feedback on priorities"
      ]
    },
    {
      day: 60,
      title: "Proposal Development",
      description: "Create customized expansion proposal with clear business case, pricing, and implementation timeline.",
      actions: [
        "Draft proposal document",
        "Get internal approvals",
        "Prepare pricing options",
        "Create implementation roadmap"
      ]
    },
    {
      day: 75,
      title: "Executive Presentation",
      description: "Present expansion proposal to decision-makers with emphasis on business outcomes and strategic value.",
      actions: [
        "Schedule C-level meeting",
        "Deliver presentation",
        "Address objections",
        "Document next steps"
      ]
    },
    {
      day: 90,
      title: "Negotiation & Refinement",
      description: "Work through contract terms, pricing adjustments, and finalize expansion scope.",
      actions: [
        "Engage procurement",
        "Negotiate terms",
        "Finalize scope",
        "Prepare contracts"
      ]
    },
    {
      day: 105,
      title: "Contract Execution",
      description: "Execute amended contract and kick off expansion implementation.",
      actions: [
        "Sign contracts",
        "Process paperwork",
        "Assign implementation team",
        "Schedule kickoff"
      ]
    },
    {
      day: 120,
      title: "Implementation Launch",
      description: "Begin rollout of expanded services with dedicated success resources.",
      actions: [
        "Conduct kickoff meeting",
        "Configure new features",
        "Train end users",
        "Establish success metrics"
      ]
    },
    {
      day: 150,
      title: "Mid-Implementation Check",
      description: "Review progress, address challenges, and ensure adoption is on track.",
      actions: [
        "Review adoption metrics",
        "Gather user feedback",
        "Address blockers",
        "Adjust training as needed"
      ]
    },
    {
      day: 180,
      title: "Expansion Value Realization",
      description: "Measure outcomes against success criteria and document wins for future reference.",
      actions: [
        "Calculate realized ROI",
        "Document case study",
        "Plan celebration/recognition",
        "Identify next expansion opportunities"
      ]
    }
  ],
  invest: [
    {
      day: 30,
      title: "Strategic Alignment Session",
      description: "Meet with executive sponsors to understand long-term business strategy and how your solution fits into their vision.",
      actions: [
        "Schedule executive briefing",
        "Research company strategy",
        "Prepare discussion guide",
        "Document strategic priorities"
      ]
    },
    {
      day: 60,
      title: "Innovation Roadmap Review",
      description: "Share your product roadmap and gather input on features that would drive strategic value.",
      actions: [
        "Present roadmap",
        "Facilitate feedback session",
        "Identify co-innovation opportunities",
        "Document feature requests"
      ]
    },
    {
      day: 75,
      title: "Success Metrics Framework",
      description: "Establish shared KPIs and success metrics that tie to their business outcomes.",
      actions: [
        "Define success metrics",
        "Set up measurement systems",
        "Align on reporting cadence",
        "Create dashboard"
      ]
    },
    {
      day: 90,
      title: "Quarterly Business Review (QBR) #1",
      description: "First formal QBR focusing on value delivered, progress toward goals, and strategic initiatives.",
      actions: [
        "Prepare QBR deck",
        "Review metrics",
        "Present insights",
        "Plan next quarter priorities"
      ]
    },
    {
      day: 120,
      title: "Executive Sponsorship Program",
      description: "Formalize executive relationships and create dedicated communication channels.",
      actions: [
        "Assign executive sponsor",
        "Schedule recurring touchpoints",
        "Create escalation path",
        "Document governance model"
      ]
    },
    {
      day: 150,
      title: "Strategic Initiative Workshop",
      description: "Collaborate on specific business initiatives where deeper partnership can drive mutual value.",
      actions: [
        "Identify joint initiatives",
        "Assign project teams",
        "Create project charters",
        "Set milestones"
      ]
    },
    {
      day: 180,
      title: "QBR #2 with Future Planning",
      description: "Second QBR with focus on long-term planning and multi-year partnership discussion.",
      actions: [
        "Review 6-month progress",
        "Discuss future vision",
        "Explore multi-year agreement",
        "Update success plan"
      ]
    },
    {
      day: 240,
      title: "Co-Innovation Pilot",
      description: "Launch pilot program or beta test of new capabilities with strategic input from the account.",
      actions: [
        "Design pilot program",
        "Select participants",
        "Deploy beta features",
        "Gather feedback"
      ]
    },
    {
      day: 300,
      title: "Partnership Maturity Assessment",
      description: "Evaluate partnership depth, identify advocacy opportunities, and plan for renewal.",
      actions: [
        "Assess partnership health",
        "Identify reference opportunities",
        "Plan renewal strategy",
        "Document case study"
      ]
    }
  ],
  protect: [
    {
      day: 15,
      title: "Critical Situation Assessment",
      description: "Immediate deep-dive to understand all issues, concerns, and risk factors. Rally internal response team.",
      actions: [
        "Schedule urgent stakeholder calls",
        "Document all concerns",
        "Assess churn risk factors",
        "Assemble account rescue team"
      ]
    },
    {
      day: 20,
      title: "Executive Escalation & Commitment",
      description: "Engage executive leadership to demonstrate commitment and ownership of resolution.",
      actions: [
        "Executive apology/commitment call",
        "Assign dedicated resources",
        "Create resolution timeline",
        "Establish daily check-ins"
      ]
    },
    {
      day: 30,
      title: "Quick Wins & Issue Resolution",
      description: "Address immediate pain points and deliver quick wins to rebuild trust.",
      actions: [
        "Fix critical issues",
        "Provide workarounds",
        "Deliver compensatory value",
        "Document resolutions"
      ]
    },
    {
      day: 45,
      title: "Comprehensive Action Plan",
      description: "Present detailed plan addressing all concerns with clear accountability and timelines.",
      actions: [
        "Create remediation plan",
        "Get stakeholder buy-in",
        "Assign owners to each item",
        "Set up tracking system"
      ]
    },
    {
      day: 60,
      title: "Relationship Rebuilding",
      description: "Focus on restoring trust through consistent communication and over-delivery.",
      actions: [
        "Increase touchpoint frequency",
        "Deliver on commitments",
        "Provide extra support",
        "Celebrate small wins"
      ]
    },
    {
      day: 75,
      title: "Mid-Recovery Check",
      description: "Assess progress, validate improvements are working, and adjust approach as needed.",
      actions: [
        "Review satisfaction scores",
        "Gather feedback",
        "Adjust tactics",
        "Communicate progress"
      ]
    },
    {
      day: 90,
      title: "Stability & Satisfaction Validation",
      description: "Confirm account is stabilized and satisfaction is improving. Begin transition to normal cadence.",
      actions: [
        "Measure health improvement",
        "Validate with stakeholders",
        "Document lessons learned",
        "Plan forward strategy"
      ]
    },
    {
      day: 120,
      title: "Value Reinforcement",
      description: "Remind stakeholders of value being delivered and outcomes achieved since intervention.",
      actions: [
        "Prepare value report",
        "Highlight improvements",
        "Share success metrics",
        "Gather testimonials"
      ]
    },
    {
      day: 150,
      title: "Renewal Positioning",
      description: "Carefully position renewal conversation with focus on stability and continued partnership.",
      actions: [
        "Prepare renewal strategy",
        "Address any lingering concerns",
        "Present renewal options",
        "Secure commitment"
      ]
    }
  ]
};

const strategyInfo = {
  expand: {
    color: 'bg-green-100 border-green-300 text-green-800',
    icon: '📈',
    title: 'EXPAND Strategy',
    description: 'High health, high growth potential. Focus on upsell and expansion opportunities.'
  },
  invest: {
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    icon: '🎯',
    title: 'INVEST Strategy',
    description: 'Strategic partnership potential. Focus on deepening relationship and long-term value.'
  },
  protect: {
    color: 'bg-red-100 border-red-300 text-red-800',
    icon: '🛡️',
    title: 'PROTECT Strategy',
    description: 'At-risk account. Focus on retention, resolution, and rebuilding trust.'
  }
};

export default function StrategicAccountPlanArtifact({
  customerName,
  strategyType,
  renewalDate,
  currentARR,
  healthScore,
  growthPotential,
  riskLevel,
  onModify,
  onAgree,
  onComeBack
}: StrategicAccountPlanArtifactProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  const strategy = strategyInfo[strategyType];
  const steps = workflows[strategyType];

  const toggleStep = (index: number) => {
    setExpandedSteps(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Strategy Header */}
      <div className={`px-6 py-5 border-b-2 ${strategy.color}`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{strategy.icon}</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{strategy.title}</h2>
            <p className="text-sm mt-1">{strategy.description}</p>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          {customerName} - 9-Step Timeline
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {renewalDate && (
            <div>
              <span className="font-medium text-gray-700">Renewal Date:</span>
              <span className="ml-2 text-gray-900">{renewalDate}</span>
            </div>
          )}
          {currentARR && (
            <div>
              <span className="font-medium text-gray-700">Current ARR:</span>
              <span className="ml-2 text-gray-900">{currentARR}</span>
            </div>
          )}
          {healthScore !== undefined && (
            <div>
              <span className="font-medium text-gray-700">Health:</span>
              <span className="ml-2 text-gray-900">{healthScore}/10</span>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-gray-300"
            >
              <button
                onClick={() => toggleStep(index)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold flex-shrink-0">
                    Day {step.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    {!expandedSteps.includes(index) && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{step.description}</p>
                    )}
                  </div>
                </div>
                {expandedSteps.includes(index) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {expandedSteps.includes(index) && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{step.description}</p>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      Action Items:
                    </p>
                    <ul className="space-y-2">
                      {step.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      {(onModify || onAgree || onComeBack) && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
          {onModify && (
            <button
              onClick={onModify}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Modify Plan
            </button>
          )}

          {onComeBack && (
            <button
              onClick={onComeBack}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              Come Back to This
            </button>
          )}

          <div className="flex-1"></div>

          {onAgree && (
            <button
              onClick={onAgree}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
            >
              I Agree, Let's Execute
            </button>
          )}
        </div>
      )}
    </div>
  );
}
