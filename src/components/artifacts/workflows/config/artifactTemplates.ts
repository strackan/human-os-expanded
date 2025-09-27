/**
 * Artifact Templates for Renubu Workflows
 *
 * This file provides reusable templates and helper functions for creating
 * commonly used artifacts in workflows.
 */

import { WorkflowConfig } from './WorkflowConfig';

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
 * Helper function to create multiple artifacts at once
 */
export const createArtifactSection = (artifacts: Array<ReturnType<
  typeof createEmailArtifact |
  typeof createLicenseAnalysisArtifact |
  typeof createWorkflowSummaryArtifact |
  typeof createHtmlArtifact
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