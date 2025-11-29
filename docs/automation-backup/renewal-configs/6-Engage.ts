/**
 * Engage Renewal Workflow
 *
 * Triggered when: 90-119 days until renewal
 * Urgency: MEDIUM - Initial engagement phase
 *
 * Purpose: Initiate renewal conversation and assess customer needs
 * - Initial renewal discussion
 * - Stakeholder mapping
 * - Needs assessment
 * - Relationship status check
 */

import { WorkflowDefinition } from '../workflow-types';

export const EngageRenewalWorkflow: WorkflowDefinition = {
  id: 'engage-renewal',
  type: 'renewal',
  stage: 'Engage',
  name: 'Renewal Engagement',
  description: '90-119 days until renewal - initial engagement phase',

  baseScore: 45,
  urgencyScore: 35,

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 90,
      daysMax: 119
    }
  },

  steps: [
    {
      id: 'stakeholder-mapping',
      name: 'Stakeholder Mapping & Assessment',
      type: 'data_analysis',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          RENEWAL ENGAGEMENT ASSESSMENT

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days (~3 months)

          Current Relationships:
          - Primary contacts: {{data.salesforce.contacts}}
          - Last engagement: {{data.engagement.lastMeeting}}
          - Engagement frequency: {{data.engagement.meetingFrequency}}

          Assess:
          1. Stakeholder map (who are decision makers, influencers, champions?)
          2. Relationship strength by stakeholder
          3. Engagement gaps (who haven't we talked to lately?)
          4. Recommended engagement approach
          5. Key topics to discuss in renewal kickoff
        `,

        dataRequired: [
          'data.salesforce.contacts',
          'data.engagement.lastMeeting',
          'intelligence.healthScore'
        ],

        processor: 'analyzers/stakeholderMapping.js',

        outputs: ['stakeholder_map', 'engagement_strategy']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '🤝 **RENEWAL ENGAGEMENT**\n\n{{customer.name}} renewal is in {{workflow.daysUntilRenewal}} days.\n\nTime to start the conversation. Analyzing stakeholders...',
            buttons: [
              { label: 'View Stakeholder Map', value: 'view', action: 'show_artifact', artifactId: 'stakeholders' },
              { label: 'See Engagement Plan', value: 'plan', action: 'show_artifact', artifactId: 'engagement-plan' }
            ]
          },

          branches: {
            'view': {
              response: 'Here\'s the stakeholder landscape:',
              actions: ['show_artifact'],
              artifactId: 'stakeholders',
              nextButtons: [
                { label: 'See Engagement Plan', value: 'plan' },
                { label: 'Draft Kickoff Email', value: 'draft' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'stakeholders',
            title: 'Stakeholder Map - {{customer.name}}',
            type: 'stakeholder_map',
            icon: '👥',
            visible: false,

            content: {
              stakeholders: '{{outputs.stakeholder_map.contacts}}',
              decisionMakers: '{{outputs.stakeholder_map.decisionMakers}}',
              champions: '{{outputs.stakeholder_map.champions}}',
              gaps: '{{outputs.stakeholder_map.engagementGaps}}'
            }
          },

          {
            id: 'engagement-plan',
            title: 'Engagement Plan',
            type: 'action_plan',
            icon: '📋',
            visible: false,

            content: '{{outputs.engagement_strategy}}'
          }
        ]
      }
    },

    {
      id: 'renewal-kickoff',
      name: 'Renewal Kickoff Communication',
      type: 'action',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          Create renewal kickoff communications.

          Customer: {{customer.name}}
          Renewal date: {{customer.renewalDate}}
          Stakeholders: {{outputs.stakeholder_map}}

          Generate:
          1. Renewal kickoff email (professional, forward-looking)
          2. Meeting agenda for renewal discussion
          3. Key topics and questions to explore
          4. Value talking points
        `,

        dataRequired: ['outputs.stakeholder_map'],

        processor: 'generators/renewalKickoff.js',

        outputs: ['kickoff_email', 'meeting_agenda']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'I\'ve prepared renewal kickoff materials. Ready to launch the conversation?',
            buttons: [
              { label: 'View Kickoff Email', value: 'email', action: 'show_artifact', artifactId: 'email' },
              { label: 'See Meeting Agenda', value: 'agenda', action: 'show_artifact', artifactId: 'agenda' }
            ]
          },

          branches: {
            'email': {
              response: 'Here\'s the renewal kickoff email:',
              actions: ['show_artifact'],
              artifactId: 'email',
              nextButtons: [
                { label: 'Send Email', value: 'send', action: 'send_email' },
                { label: 'Schedule Meeting First', value: 'meeting' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'email',
            title: 'Renewal Kickoff Email',
            type: 'email',
            icon: '📧',
            visible: false,
            editable: true,

            content: {
              to: '{{data.salesforce.contacts[0].email}}',
              subject: '{{outputs.kickoff_email.subject}}',
              body: '{{outputs.kickoff_email.body}}'
            }
          },

          {
            id: 'agenda',
            title: 'Renewal Discussion Agenda',
            type: 'meeting_agenda',
            icon: '📝',
            visible: false,

            content: '{{outputs.meeting_agenda}}'
          }
        ]
      }
    }
  ]
};

export default EngageRenewalWorkflow;
