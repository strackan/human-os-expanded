/**
 * Pre-configured Assessment Question Blocks
 *
 * These are reusable assessment configurations that can be imported
 * and used throughout the application.
 */

import { QuestionBlock } from './types';

/**
 * Account Assessment - Strategic Planning Workflow
 */
export const accountAssessmentQuestions: QuestionBlock[] = [
  {
    id: 'opportunity-score',
    type: 'slider-with-reason',
    question: "What's the opportunity score?",
    description: 'Rate from 1 (low opportunity) to 10 (high opportunity)',
    min: 1,
    max: 10,
    defaultValue: 5,
    labels: {
      min: 'Low (1)',
      max: 'High (10)'
    },
    reasonPlaceholder: 'Explain your opportunity score...',
    reasonRows: 3,
    accentColor: 'purple',
    required: true
  },
  {
    id: 'risk-score',
    type: 'slider-with-reason',
    question: "What's the risk score?",
    description: 'Rate from 0 (no risk) to 10 (high risk)',
    min: 0,
    max: 10,
    defaultValue: 5,
    labels: {
      min: 'None (0)',
      max: 'High (10)'
    },
    reasonPlaceholder: 'Explain your risk score...',
    reasonRows: 3,
    accentColor: 'red',
    required: true
  },
  {
    id: 'year-overview',
    type: 'long-text',
    question: 'Overview of the past year',
    description: 'Share your perspective on how things have gone with this account',
    placeholder: 'Describe the account\'s journey over the past year...',
    rows: 3,
    required: true
  }
];

/**
 * Growth Assessment - Expansion Workflow
 */
export const growthAssessmentQuestions: QuestionBlock[] = [
  {
    id: 'usage-trajectory',
    type: 'slider-with-reason',
    question: 'How would you describe their usage trajectory?',
    description: 'Rate from 1 (declining) to 10 (rapid growth)',
    min: 1,
    max: 10,
    defaultValue: 7,
    labels: {
      min: 'Declining (1)',
      max: 'Rapid Growth (10)'
    },
    reasonPlaceholder: 'What signals indicate this trajectory?',
    reasonRows: 3,
    accentColor: 'blue',
    required: true
  },
  {
    id: 'price-sensitivity',
    type: 'radio-with-reason',
    question: 'How price-sensitive is this customer?',
    description: 'Based on past conversations and their market position',
    options: [
      { value: 'low', label: 'Low - Value-focused, willing to pay for quality' },
      { value: 'medium', label: 'Medium - Balanced approach to pricing' },
      { value: 'high', label: 'High - Very cost-conscious, price-driven decisions' }
    ],
    reasonPlaceholder: 'What evidence supports this assessment?',
    reasonRows: 3,
    required: true
  },
  {
    id: 'competitive-risk',
    type: 'radio-with-reason',
    question: "What's the competitive risk level?",
    description: 'Likelihood of losing them to a competitor',
    options: [
      { value: 'low', label: 'Low - Strong relationship, no active evaluation' },
      { value: 'medium', label: 'Medium - Some competitive interest' },
      { value: 'high', label: 'High - Actively evaluating alternatives' }
    ],
    reasonPlaceholder: 'What competitive dynamics are at play?',
    reasonRows: 3,
    required: true
  }
];

/**
 * Executive Engagement Strategy - Executive Workflow
 */
export const executiveEngagementQuestions: QuestionBlock[] = [
  {
    id: 'primary-objective',
    type: 'multiple-choice',
    question: "What's your primary objective for this engagement?",
    description: 'Choose the most important goal for this interaction',
    options: [
      {
        value: 'rebuild-trust',
        label: 'Rebuild Trust',
        description: 'Acknowledge issues and demonstrate commitment to improvement'
      },
      {
        value: 'acknowledge-issue',
        label: 'Acknowledge & Address Issue',
        description: 'Take accountability for specific problems'
      },
      {
        value: 'set-expectations',
        label: 'Set Clear Expectations',
        description: 'Define what success looks like going forward'
      }
    ],
    allowMultiple: false,
    required: true
  },
  {
    id: 'tone',
    type: 'slider-with-reason',
    question: 'What tone should this engagement take?',
    description: 'Rate from 1 (formal/apologetic) to 10 (casual/forward-looking)',
    min: 1,
    max: 10,
    defaultValue: 4,
    labels: {
      min: 'Formal (1)',
      max: 'Casual (10)'
    },
    reasonPlaceholder: 'Why is this the right tone for this executive?',
    reasonRows: 3,
    accentColor: 'purple',
    required: true
  },
  {
    id: 'urgency',
    type: 'dropdown',
    question: "What's the response timeline?",
    description: 'When should you reach out?',
    options: [
      { value: 'immediate', label: 'Immediate - Today or tomorrow' },
      { value: 'this-week', label: 'This Week - Within 5 business days' },
      { value: 'flexible', label: 'Flexible - When appropriate' }
    ],
    placeholder: 'Select timeline...',
    required: true
  },
  {
    id: 'key-message',
    type: 'long-text',
    question: "What's the key message you want to convey?",
    description: 'The core takeaway from this engagement',
    placeholder: 'In one or two sentences, what do you want them to remember?',
    rows: 3,
    maxLength: 500,
    required: true
  }
];
