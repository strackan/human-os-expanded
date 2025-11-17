/**
 * Artifact Templates for Renubu Workflows
 *
 * This file provides reusable templates and helper functions for creating
 * commonly used artifacts in workflows.
 */


/**
 * Email Artifact Template
 *
 * The email artifact type provides a styled email composer with:
 * - Professional email UI with header
 * - To, Subject, and Body fields
 * - Rich text editing toolbar (when editable)
 * - Typing animation for progressive reveal
 * - Save draft and Send functionality
 * - Toast notifications for actions
 *
 * Styling:
 * - Container: White background with gray border, rounded corners, shadow
 * - Header: Gray background with Mail icon
 * - Fields: Standard input/textarea styling with blue focus states
 * - Actions: Gray "Save Draft" and blue "Send Email" buttons
 *
 * @example
 * ```typescript
 * const emailArtifact = createEmailArtifact({
 *   id: 'renewal-email',
 *   title: 'Renewal Outreach',
 *   to: 'customer@example.com',
 *   subject: 'Your Renewal is Coming Up',
 *   body: 'Email content here...',
 *   editable: true,
 *   visible: false
 * });
 * ```
 */
export interface EmailArtifactConfig {
  id: string;
  title: string;
  to: string;
  subject: string;
  body: string;
  editable?: boolean;
  visible?: boolean;
}

export const createEmailArtifact = (config: EmailArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'email' as const,
    visible: config.visible ?? false,
    editable: config.editable ?? true,
    content: {
      to: config.to,
      subject: config.subject,
      body: config.body
    }
  };
};

/**
 * License Analysis Artifact Template
 *
 * The license-analysis type provides a structured view of:
 * - Current license details
 * - Anticipated renewal pricing
 * - Early renewal discounts
 * - Multi-year discount options
 */
export interface LicenseAnalysisConfig {
  id: string;
  title: string;
  currentTokens: number;
  currentUnitPrice: number;
  renewalTokens: number;
  renewalUnitPrice: number;
  earlyDiscountPercentage?: number;
  multiYearDiscountPercentage?: number;
  visible?: boolean;
}

export const createLicenseAnalysisArtifact = (config: LicenseAnalysisConfig) => {
  const currentTotal = config.currentTokens * config.currentUnitPrice;
  const renewalTotal = config.renewalTokens * config.renewalUnitPrice;
  const earlyTotal = config.earlyDiscountPercentage
    ? renewalTotal * (1 - config.earlyDiscountPercentage / 100)
    : renewalTotal;
  const multiYearTotal = config.multiYearDiscountPercentage
    ? renewalTotal * (1 - config.multiYearDiscountPercentage / 100)
    : renewalTotal;

  return {
    id: config.id,
    title: config.title,
    type: 'license-analysis' as const,
    visible: config.visible ?? false,
    content: {
      currentLicense: {
        tokens: config.currentTokens,
        unitPrice: config.currentUnitPrice,
        total: currentTotal
      },
      anticipatedRenewal: {
        tokens: config.renewalTokens,
        unitPrice: config.renewalUnitPrice,
        total: renewalTotal
      },
      earlyDiscount: {
        percentage: config.earlyDiscountPercentage || 0,
        total: earlyTotal
      },
      multiYearDiscount: {
        percentage: config.multiYearDiscountPercentage || 0,
        total: multiYearTotal
      }
    }
  };
};

/**
 * Workflow Summary Artifact Template
 *
 * The workflow-summary type provides a comprehensive overview of:
 * - Customer name and current stage
 * - Progress percentage
 * - Completed and pending actions
 * - Next steps
 * - Key metrics
 * - Recommendations
 */
export interface WorkflowSummaryConfig {
  id: string;
  title: string;
  customerName: string;
  currentStage: string;
  progressPercentage: number;
  completedActions: string[];
  pendingActions: string[];
  nextSteps: string[];
  keyMetrics?: {
    currentARR?: string;
    projectedARR?: string;
    growthRate?: string;
    riskScore?: string;
    renewalDate?: string;
  };
  recommendations?: string[];
  visible?: boolean;
}

export const createWorkflowSummaryArtifact = (config: WorkflowSummaryConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'workflow-summary' as const,
    visible: config.visible ?? false,
    content: {
      customerName: config.customerName,
      currentStage: config.currentStage,
      progressPercentage: config.progressPercentage,
      completedActions: config.completedActions,
      pendingActions: config.pendingActions,
      nextSteps: config.nextSteps,
      keyMetrics: config.keyMetrics || {},
      recommendations: config.recommendations || []
    }
  };
};

/**
 * HTML Artifact Template
 *
 * The html type allows rendering custom HTML content.
 * Useful for quotes, invoices, reports, etc.
 */
export interface HtmlArtifactConfig {
  id: string;
  title: string;
  htmlContent: string;
  styles?: string;
  visible?: boolean;
}

export const createHtmlArtifact = (config: HtmlArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'html' as const,
    visible: config.visible ?? false,
    htmlContent: config.htmlContent,
    styles: config.styles
  };
};

/**
 * Planning Checklist Artifact Template
 *
 * The planning-checklist type provides an interactive checklist for workflow planning with:
 * - Header with title and description
 * - Interactive checkboxes for task items
 * - Progress tracking
 * - Action buttons: "Let's Do It!", "Not Yet", "Go Back"
 * - Visual feedback for completion status
 *
 * Styling:
 * - Container: White background with gray border, rounded corners, shadow
 * - Header: Gray background with checklist icon
 * - Items: Hover effects, checkmark animations, strikethrough for completed
 * - Progress: Visual progress bar showing completion percentage
 * - Actions: Primary blue button for "Let's Do It!", secondary gray buttons
 *
 * @example
 * ```typescript
 * const planningArtifact = createPlanningChecklistArtifact({
 *   id: 'renewal-planning',
 *   title: 'Renewal Planning Checklist',
 *   description: "Let's review what we need to accomplish:",
 *   items: [
 *     { id: 'review-contract', label: 'Review contract terms', completed: false },
 *     { id: 'set-price', label: 'Set target price', completed: false }
 *   ],
 *   visible: true
 * });
 * ```
 */
export interface PlanningChecklistArtifactConfig {
  id: string;
  title: string;
  description?: string;
  items: Array<{
    id: string;
    label: string;
    completed?: boolean;
  }>;
  showActions?: boolean;
  visible?: boolean;
}

export const createPlanningChecklistArtifact = (config: PlanningChecklistArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'planning-checklist' as const,
    visible: config.visible ?? false,
    content: {
      description: config.description || "Let's review what we need to accomplish:",
      items: config.items.map(item => ({
        id: item.id,
        label: item.label,
        completed: item.completed ?? false
      })),
      showActions: config.showActions ?? true
    }
  };
};

/**
 * Pricing Analysis Artifact Template
 *
 * The pricing-analysis type provides a comprehensive pricing strategy analysis with:
 * - Current pricing metrics and ARR
 * - Comparative analysis across similar customers
 * - Price per unit calculations
 * - Usage metrics and growth trends
 * - Risk factors for expansion
 * - Opportunities for growth
 * - AI-powered recommendation with supporting rationale
 * - Interactive action buttons for decision making
 *
 * Styling:
 * - Container: White background with gray border, rounded corners, shadow
 * - Header: Gradient blue background with pricing icon
 * - Metrics: Key pricing indicators in cards
 * - Analysis: Visual percentile indicator and comparison charts
 * - Recommendations: Highlighted section with action buttons
 *
 * @example
 * ```typescript
 * const pricingArtifact = createPricingAnalysisArtifact({
 *   id: 'pricing-strategy',
 *   title: 'Q4 Pricing Analysis',
 *   customerName: 'TechCorp Solutions',
 *   currentPrice: 84000,
 *   currentARR: 84000,
 *   pricePerUnit: 350,
 *   unitType: 'seat/month',
 *   comparativeAnalysis: {
 *     averagePrice: 380,
 *     percentile: 35,
 *     similarCustomerCount: 47
 *   },
 *   recommendation: {
 *     priceIncrease: 8,
 *     newAnnualPrice: 90720
 *   },
 *   visible: true
 * });
 * ```
 */
export interface PricingAnalysisArtifactConfig {
  id: string;
  title: string;
  customerName?: string;
  currentPrice?: number;
  currentARR?: number;
  pricePerUnit?: number;
  unitType?: string;
  comparativeAnalysis?: {
    averagePrice?: number;
    percentile?: number;
    similarCustomerCount?: number;
  };
  usageMetrics?: {
    currentUsage?: number;
    usageGrowth?: number;
    usageEfficiency?: number;
  };
  riskFactors?: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  opportunities?: Array<{
    title: string;
    description: string;
    potential: 'high' | 'medium' | 'low';
  }>;
  recommendation?: {
    priceIncrease?: number;
    newAnnualPrice?: number;
    reasons?: string[];
  };
  visible?: boolean;
}

export const createPricingAnalysisArtifact = (config: PricingAnalysisArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'pricing-analysis' as const,
    visible: config.visible ?? false,
    data: {
      customerName: config.customerName,
      currentPrice: config.currentPrice,
      currentARR: config.currentARR,
      pricePerUnit: config.pricePerUnit,
      unitType: config.unitType,
      comparativeAnalysis: config.comparativeAnalysis,
      usageMetrics: config.usageMetrics,
      riskFactors: config.riskFactors,
      opportunities: config.opportunities,
      recommendation: config.recommendation
    }
  };
};

/**
 * Contract Artifact Template
 *
 * The contract type provides a comprehensive contract overview with:
 * - Contract value and renewal date
 * - Signer base amount
 * - Pricing calculation breakdown
 * - Business impacting terms organized by category
 * - Risk level indicators
 * - View PDF functionality
 *
 * Styling:
 * - Container: White background with gray border, rounded corners, shadow
 * - Header: Gradient blue background with contract icon
 * - Metrics: Key values displayed prominently
 * - Terms: Color-coded by risk level (red for unsigned, amber for non-standard, etc.)
 * - Actions: View PDF button for document access
 *
 * @example
 * ```typescript
 * const contractArtifact = createContractArtifact({
 *   id: 'customer-contract',
 *   title: 'Enterprise Agreement',
 *   contractId: 'CNT-2024-001',
 *   customerName: 'Acme Corp',
 *   contractValue: 250000,
 *   renewalDate: 'June 30, 2025',
 *   signerBaseAmount: 200000,
 *   businessTerms: {
 *     unsigned: ['Liability amendment pending'],
 *     nonStandardPricing: ['Custom enterprise pricing tier']
 *   },
 *   visible: true
 * });
 * ```
 */
export interface ContractArtifactConfig {
  id: string;
  title: string;
  contractId?: string;
  customerName?: string;
  contractValue?: number;
  renewalDate?: string;
  signerBaseAmount?: number;
  pricingCalculation?: {
    basePrice?: number;
    volumeDiscount?: number;
    additionalServices?: number;
    totalPrice?: number;
  };
  businessTerms?: {
    unsigned?: string[];
    nonStandardRenewal?: string[];
    nonStandardPricing?: string[];
    pricingCaps?: string[];
    otherTerms?: string[];
  };
  riskLevel?: 'low' | 'medium' | 'high';
  lastUpdated?: string;
  visible?: boolean;
}

export const createContractArtifact = (config: ContractArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'contract' as const,
    visible: config.visible ?? false,
    data: {
      contractId: config.contractId,
      customerName: config.customerName,
      contractValue: config.contractValue,
      renewalDate: config.renewalDate,
      signerBaseAmount: config.signerBaseAmount,
      pricingCalculation: config.pricingCalculation,
      businessTerms: config.businessTerms,
      riskLevel: config.riskLevel,
      lastUpdated: config.lastUpdated
    }
  };
};

/**
 * Contact Strategy Artifact Template
 *
 * The contact-strategy type provides stakeholder analysis and engagement planning with:
 * - Primary and secondary contact identification
 * - Stakeholder influence mapping
 * - Communication cadence recommendations
 * - Engagement timeline
 * - Key talking points for each stakeholder
 *
 * Styling:
 * - Container: White background with gray border, rounded corners, shadow
 * - Header: Gradient blue background with contacts icon
 * - Stakeholders: Cards with role, influence level, and engagement strategy
 * - Timeline: Visual timeline showing planned touchpoints
 *
 * @example
 * ```typescript
 * const contactStrategyArtifact = createContactStrategyArtifact({
 *   id: 'renewal-contacts',
 *   title: 'Stakeholder Engagement Strategy',
 *   primaryContact: {
 *     name: 'Sarah Chen',
 *     role: 'VP Operations',
 *     influenceLevel: 'high',
 *     engagement: 'weekly'
 *   },
 *   stakeholders: [
 *     { name: 'John Doe', role: 'CFO', influenceLevel: 'high', priority: 1 }
 *   ],
 *   visible: true
 * });
 * ```
 */
export interface ContactStrategyArtifactConfig {
  id: string;
  title: string;
  primaryContact?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    influenceLevel?: 'high' | 'medium' | 'low';
    engagement?: string;
  };
  stakeholders?: Array<{
    name: string;
    role: string;
    email?: string;
    influenceLevel: 'high' | 'medium' | 'low';
    priority: number;
    talkingPoints?: string[];
    nextAction?: string;
  }>;
  timeline?: Array<{
    date: string;
    contact: string;
    action: string;
    status?: 'completed' | 'planned' | 'overdue';
  }>;
  strategy?: string;
  visible?: boolean;
}

export const createContactStrategyArtifact = (config: ContactStrategyArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'contact-strategy' as const,
    visible: config.visible ?? false,
    data: {
      primaryContact: config.primaryContact,
      stakeholders: config.stakeholders || [],
      timeline: config.timeline || [],
      strategy: config.strategy
    }
  };
};

/**
 * Plan Summary Artifact Template
 *
 * The plan-summary type provides a comprehensive overview of the complete plan with:
 * - Executive summary
 * - Key objectives and goals
 * - Action items with owners and deadlines
 * - Success metrics
 * - Risk mitigation strategies
 * - Next steps and timeline
 *
 * Styling:
 * - Container: White background with gray border, rounded corners, shadow
 * - Header: Gradient purple background with summary icon
 * - Sections: Organized cards for each plan component
 * - Action Items: Interactive checklist with status indicators
 *
 * @example
 * ```typescript
 * const planSummaryArtifact = createPlanSummaryArtifact({
 *   id: 'renewal-plan',
 *   title: 'Q4 Renewal Plan Summary',
 *   executiveSummary: 'Comprehensive renewal strategy...',
 *   objectives: ['Increase ARR by 20%', 'Secure multi-year commitment'],
 *   actionItems: [
 *     { task: 'Send proposal', owner: 'John', deadline: '2024-12-15', status: 'pending' }
 *   ],
 *   visible: true
 * });
 * ```
 */
export interface PlanSummaryArtifactConfig {
  id: string;
  title: string;
  executiveSummary?: string;
  objectives?: string[];
  actionItems?: Array<{
    task: string;
    owner?: string;
    deadline?: string;
    status: 'completed' | 'in-progress' | 'pending' | 'blocked';
    priority?: 'high' | 'medium' | 'low';
  }>;
  successMetrics?: Array<{
    metric: string;
    target: string;
    current?: string;
  }>;
  risks?: Array<{
    risk: string;
    mitigation: string;
    severity?: 'high' | 'medium' | 'low';
  }>;
  timeline?: Array<{
    phase: string;
    startDate: string;
    endDate: string;
    milestones?: string[];
  }>;
  visible?: boolean;
}

export const createPlanSummaryArtifact = (config: PlanSummaryArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'plan-summary' as const,
    visible: config.visible ?? false,
    content: {
      executiveSummary: config.executiveSummary,
      objectives: config.objectives || [],
      actionItems: config.actionItems || [],
      successMetrics: config.successMetrics || [],
      risks: config.risks || [],
      timeline: config.timeline || []
    }
  };
};

/**
 * Quote Artifact Template
 *
 * The quote type provides a professional quote/proposal document with:
 * - Line items with descriptions and pricing
 * - Subtotal, discounts, taxes, and total
 * - Terms and conditions
 * - Validity period
 * - Approval workflow
 *
 * Styling:
 * - Container: White background with professional styling
 * - Header: Company branding area
 * - Line Items: Table format with clear pricing
 * - Total: Highlighted final amount
 * - Actions: Generate PDF, Send, Edit buttons
 *
 * @example
 * ```typescript
 * const quoteArtifact = createQuoteArtifact({
 *   id: 'renewal-quote',
 *   title: 'Renewal Quote',
 *   quoteNumber: 'Q-2024-001',
 *   customerName: 'Acme Corp',
 *   lineItems: [
 *     { description: 'Enterprise License', quantity: 100, unitPrice: 50, total: 5000 }
 *   ],
 *   validUntil: '2024-12-31',
 *   visible: true
 * });
 * ```
 */
export interface QuoteArtifactConfig {
  id: string;
  title: string;
  quoteNumber?: string;
  customerName?: string;
  customerContact?: string;
  issueDate?: string;
  validUntil?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discount?: number;
  }>;
  subtotal?: number;
  discountAmount?: number;
  discountPercentage?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  terms?: string;
  notes?: string;
  visible?: boolean;
}

export const createQuoteArtifact = (config: QuoteArtifactConfig) => {
  // Calculate totals if not provided
  const subtotal = config.subtotal ?? config.lineItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = config.discountAmount ?? (config.discountPercentage ? subtotal * (config.discountPercentage / 100) : 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = config.taxAmount ?? (config.taxRate ? afterDiscount * (config.taxRate / 100) : 0);
  const total = config.total ?? (afterDiscount + taxAmount);

  return {
    id: config.id,
    title: config.title,
    type: 'quote' as const,
    visible: config.visible ?? false,
    data: {
      quoteNumber: config.quoteNumber,
      customerName: config.customerName,
      customerContact: config.customerContact,
      issueDate: config.issueDate || new Date().toISOString().split('T')[0],
      validUntil: config.validUntil,
      lineItems: config.lineItems,
      subtotal,
      discountAmount,
      discountPercentage: config.discountPercentage,
      taxRate: config.taxRate,
      taxAmount,
      total,
      terms: config.terms,
      notes: config.notes
    }
  };
};

/**
 * Document Artifact Template
 *
 * The document type provides a general-purpose document viewer/editor with:
 * - Rich text content
 * - Section headings
 * - Formatted text with markdown support
 * - Attachments or embedded media
 * - Version history
 *
 * Styling:
 * - Container: White background, document-like appearance
 * - Content: Clean typography, proper spacing
 * - Sections: Clear hierarchy with headings
 * - Actions: Download, Share, Edit buttons
 *
 * @example
 * ```typescript
 * const documentArtifact = createDocumentArtifact({
 *   id: 'proposal-doc',
 *   title: 'Renewal Proposal',
 *   sections: [
 *     { heading: 'Overview', content: 'This proposal outlines...' },
 *     { heading: 'Pricing', content: 'Our pricing structure...' }
 *   ],
 *   visible: true
 * });
 * ```
 */
export interface DocumentArtifactConfig {
  id: string;
  title: string;
  documentType?: string;
  version?: string;
  lastModified?: string;
  author?: string;
  sections?: Array<{
    heading: string;
    content: string;
    level?: 1 | 2 | 3;
  }>;
  content?: string; // Raw content if not using sections
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  editable?: boolean;
  visible?: boolean;
}

export const createDocumentArtifact = (config: DocumentArtifactConfig) => {
  return {
    id: config.id,
    title: config.title,
    type: 'document' as const,
    visible: config.visible ?? false,
    editable: config.editable ?? false,
    content: {
      documentType: config.documentType,
      version: config.version || '1.0',
      lastModified: config.lastModified || new Date().toISOString(),
      author: config.author,
      sections: config.sections || [],
      content: config.content,
      attachments: config.attachments || []
    }
  };
};

/**
 * Pre-defined Planning Checklist Templates
 */
export const PLANNING_CHECKLIST_TEMPLATES = {
  renewal: (customItems?: Array<{ id: string; label: string; completed?: boolean }>) =>
    createPlanningChecklistArtifact({
      id: 'renewal-planning',
      title: 'Renewal Planning Checklist',
      description: "Let's review what we need to accomplish:",
      items: customItems || [
        { id: 'review-contract', label: 'Review the contract terms', completed: false },
        { id: 'set-target-price', label: 'Set our target price', completed: false },
        { id: 'establish-pricing', label: 'Establish our initial pricing strategy', completed: false },
        { id: 'confirm-contacts', label: 'Confirm our contacts', completed: false },
        { id: 'send-notice', label: 'Send out the renewal notice', completed: false }
      ],
      visible: true
    }),

  onboarding: (customItems?: Array<{ id: string; label: string; completed?: boolean }>) =>
    createPlanningChecklistArtifact({
      id: 'onboarding-planning',
      title: 'Customer Onboarding Checklist',
      description: "Let's ensure a smooth onboarding process:",
      items: customItems || [
        { id: 'welcome-call', label: 'Schedule welcome call', completed: false },
        { id: 'setup-account', label: 'Set up customer account', completed: false },
        { id: 'training-materials', label: 'Send training materials', completed: false },
        { id: 'assign-csm', label: 'Assign customer success manager', completed: false },
        { id: 'first-checkin', label: 'Schedule first check-in', completed: false }
      ],
      visible: true
    }),

  expansion: (customItems?: Array<{ id: string; label: string; completed?: boolean }>) =>
    createPlanningChecklistArtifact({
      id: 'expansion-planning',
      title: 'Account Expansion Checklist',
      description: "Let's plan the expansion opportunity:",
      items: customItems || [
        { id: 'analyze-usage', label: 'Analyze current usage patterns', completed: false },
        { id: 'identify-stakeholders', label: 'Identify expansion stakeholders', completed: false },
        { id: 'create-proposal', label: 'Create expansion proposal', completed: false },
        { id: 'schedule-meeting', label: 'Schedule presentation meeting', completed: false },
        { id: 'follow-up-plan', label: 'Create follow-up plan', completed: false }
      ],
      visible: true
    })
};

/**
 * Brand Exposure Report Artifact Template (InHerSight-specific)
 *
 * The brand-exposure-report type provides InHerSight-specific metrics:
 * - Brand impressions and visibility metrics
 * - Profile engagement (views, completion)
 * - Job posting performance (matches, clicks, conversions)
 * - Content metrics (articles, social, ratings)
 * - Performance analysis and recommendations
 */
export interface BrandExposureReportConfig {
  id: string;
  title: string;
  customerName: string;
  reportingPeriod: string;
  healthScore: number;
  metrics: {
    brandImpressions: number;
    brandImpressionsTrend: string;
    profileViews: number;
    profileViewsTrend: string;
    profileCompletionPct: number;
    jobMatches: number;
    applyClicks: number;
    applyClicksTrend: string;
    clickThroughRate: number;
    articleInclusions: number;
    socialMentions: number;
    newRatings: number;
    followerGrowth: number;
  };
  performanceAnalysis: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  visible?: boolean;
}

export const createBrandExposureReportArtifact = (config: BrandExposureReportConfig) => {
  const content = `# ${config.customerName} - Brand Performance Report

## Overview
**Reporting Period**: ${config.reportingPeriod}
**Platform Health Score**: ${config.healthScore}/100

---

## Key Metrics

### Brand Visibility
- **Brand Impressions**: ${config.metrics.brandImpressions.toLocaleString()} (${config.metrics.brandImpressionsTrend})
- **Profile Views**: ${config.metrics.profileViews.toLocaleString()} (${config.metrics.profileViewsTrend})
- **Profile Completion**: ${config.metrics.profileCompletionPct}%

### Job Posting Performance
- **Job Matches**: ${config.metrics.jobMatches.toLocaleString()}
- **Apply Clicks**: ${config.metrics.applyClicks.toLocaleString()} (${config.metrics.applyClicksTrend})
- **Click-Through Rate**: ${config.metrics.clickThroughRate}%

### Content & Engagement
- **Article Inclusions**: ${config.metrics.articleInclusions}
- **Social Mentions**: ${config.metrics.socialMentions}
- **New Ratings Received**: ${config.metrics.newRatings}
- **Follower Growth**: ${config.metrics.followerGrowth > 0 ? '+' : ''}${config.metrics.followerGrowth}

---

## Performance Analysis

${config.performanceAnalysis}

### Strengths
${config.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${config.improvements.map(i => `- ${i}`).join('\n')}

---

## Recommendations

${config.recommendations.map(r => `- ${r}`).join('\n')}
`;

  return {
    id: config.id,
    title: config.title,
    type: 'document' as const,
    visible: config.visible ?? false,
    content: content,
    editable: false
  };
};

/**
 * Helper function to create multiple artifacts at once
 */
export const createArtifactSection = (artifacts: Array<ReturnType<
  typeof createEmailArtifact |
  typeof createLicenseAnalysisArtifact |
  typeof createWorkflowSummaryArtifact |
  typeof createHtmlArtifact |
  typeof createPlanningChecklistArtifact |
  typeof createPricingAnalysisArtifact |
  typeof createContractArtifact |
  typeof createContactStrategyArtifact |
  typeof createPlanSummaryArtifact |
  typeof createQuoteArtifact |
  typeof createDocumentArtifact |
  typeof createBrandExposureReportArtifact
>>) => {
  return {
    sections: artifacts
  };
};

/**
 * Example usage in a workflow config:
 *
 * ```typescript
 * import { createEmailArtifact, createWorkflowSummaryArtifact } from './artifactTemplates';
 *
 * const myWorkflowConfig: WorkflowConfig = {
 *   // ... other config
 *   artifacts: {
 *     sections: [
 *       createEmailArtifact({
 *         id: 'customer-email',
 *         title: 'Customer Outreach',
 *         to: 'customer@example.com',
 *         subject: 'Important Update',
 *         body: 'Dear Customer...',
 *         editable: true
 *       }),
 *       createWorkflowSummaryArtifact({
 *         id: 'summary',
 *         title: 'Workflow Summary',
 *         customerName: 'Acme Corp',
 *         currentStage: 'Negotiation',
 *         progressPercentage: 75,
 *         completedActions: ['Initial contact', 'Needs assessment'],
 *         pendingActions: ['Send proposal', 'Schedule meeting'],
 *         nextSteps: ['Review proposal', 'Get approval']
 *       })
 *     ]
 *   }
 * };
 * ```
 */