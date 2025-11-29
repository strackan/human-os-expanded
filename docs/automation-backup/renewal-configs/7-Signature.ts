/**
 * Signature Renewal Workflow
 *
 * Triggered when: 15-29 days until renewal
 * Urgency: VERY HIGH - Final signature collection
 *
 * Purpose: Collect signatures on finalized contract/quote
 * - Send contract/quote for signature (DocuSign)
 * - Track signature status
 * - Resolve signature blockers (if any)
 * - Collect payment/invoice (if applicable)
 * - Confirm completion and transition to post-renewal
 *
 * Key Distinction:
 * - Finalize = PREPARE CONTRACT & GET APPROVALS
 * - Signature = COLLECT SIGNATURES FROM CUSTOMER
 * - Post-signature = Renewal complete, move to monitoring
 *
 * IMPORTANT: This workflow assumes contract ready from Finalize.
 *
 * Best case: Smooth signature collection, no issues (most renewals if done well)
 * Worst case: Last-minute pushback, need executive involvement
 */

import { WorkflowDefinition } from '../workflow-types';
import { ActionPlanStep } from '../workflow-steps/ActionPlanStep';

export const SignatureRenewalWorkflow: WorkflowDefinition = {
  id: 'signature-renewal',
  type: 'renewal',
  stage: 'Signature',
  name: 'Signature Collection',
  description: '15-29 days until renewal - collecting final signatures',

  baseScore: 75,        // Higher than Finalize (65)
  urgencyScore: 75,     // Very high urgency - close to renewal date

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 15,
      daysMax: 29
    }
  },

  // Can also be triggered from Finalize workflow when contract sent
  earlyTrigger: {
    from: 'finalize-renewal',
    conditions: [
      {
        type: 'milestone',
        value: 'contract_sent_for_signature',
        description: 'Contract package sent to customer for signature'
      }
    ]
  },

  steps: [
    // =========================================================================
    // STEP 1: SIGNATURE INITIATION
    // =========================================================================
    {
      id: 'signature-initiation',
      name: 'Signature Initiation',
      type: 'signature_send',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          SIGNATURE INITIATION

          Customer: {{customer.name}}
          Contract Value: ${{finalize.agreed_price}}
          Renewal Date: {{customer.renewalDate}}
          Days Until Renewal: {{workflow.daysUntilRenewal}}

          TASK:
          Initiate signature collection for renewal contract/quote.

          ═══════════════════════════════════════════════════════════════════════
          SIGNATURE METHOD CHECK
          ═══════════════════════════════════════════════════════════════════════

          **Customer Preference**: {{customer.signaturePreference}}
          Options:
          - DocuSign (electronic signature)
          - Adobe Sign (electronic signature)
          - Wet signature (physical signature)
          - Quote acceptance (lighter than contract signature)

          **Recommended Method**:
          {{#if finalize.contract_type == "amendment"}}
          → DocuSign (quick, simple amendment)
          {{else if finalize.agreed_price > 500000}}
          → Formal contract signature (DocuSign with multiple signatories)
          {{else}}
          → Quote acceptance with signature block (lighter weight)
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          DOCUMENTS TO SIGN
          ═══════════════════════════════════════════════════════════════════════

          From Finalize workflow:
          {{#each finalize.documents}}
          - {{this.name}} ({{this.type}})
          {{/each}}

          **Primary Signature Document**:
          {{#if finalize.contract_type == "quote_with_signature"}}
          → Renewal Quote with Signature Block
          {{else}}
          → Renewal Contract / Amendment
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          SIGNATURE ROUTING
          ═══════════════════════════════════════════════════════════════════════

          **Customer Signatories** (in order):
          {{#each finalize.signature_config.customer_signatories}}
          {{this.order}}. {{this.name}} ({{this.title}})
             Email: {{this.email}}
             Signature Authority: ${{this.signatureLimit}}
             {{#if finalize.agreed_price > this.signatureLimit}}
             ⚠️ Contract value exceeds authority - need higher level signer
             {{/if}}
          {{/each}}

          **Our Signatories**:
          {{#each finalize.signature_config.vendor_signatories}}
          {{this.order}}. {{this.name}} ({{this.title}})
             Email: {{this.email}}
          {{/each}}

          **Signing Order**:
          1. Customer signs first (all customer signatories complete)
          2. Then our team signs (counter-signature)
          3. Fully executed contract distributed to both parties

          ═══════════════════════════════════════════════════════════════════════
          DOCUSIGN CONFIGURATION
          ═══════════════════════════════════════════════════════════════════════

          **Envelope Settings**:
          - Subject: "{{customer.name}} - Renewal Contract for Signature"
          - Message: "Please review and sign the attached renewal contract. The contract is valid until {{finalize.quote_valid_until}}."
          - Expiration: {{workflow.daysUntilRenewal - 2}} days (must sign before renewal date)
          - Reminder: Every 3 days
          - Completion notifications: Yes (to CSM)

          **Signature Fields**:
          - Customer signature blocks (1 per signatory)
          - Date signed (auto-fill)
          - Title (pre-filled from customer data)

          **Security**:
          - Access code: {{#if finalize.agreed_price > 500000}}Yes (high-value contract){{else}}No{{/if}}
          - Email authentication: Yes

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "signatureMethod": "docusign | adobe_sign | wet_signature | quote_acceptance",
            "documentsToSign": [
              {
                "name": "Renewal Contract",
                "type": "contract",
                "url": "/contracts/acme-renewal-final.pdf",
                "signatureBlockCount": 2
              }
            ],
            "signatoryRouting": {
              "customerSignatories": [
                {
                  "order": 1,
                  "name": "John Smith",
                  "title": "CFO",
                  "email": "john.smith@acmecorp.com",
                  "signatureAuthority": 1000000
                }
              ],
              "vendorSignatories": [
                {
                  "order": 2,
                  "name": "Sarah Jones",
                  "title": "Customer Success Manager",
                  "email": "sarah.jones@company.com"
                }
              ]
            },
            "docusignConfig": {
              "envelopeId": null,
              "subject": "Acme Corp - Renewal Contract for Signature",
              "expirationDays": 20,
              "reminderFrequencyDays": 3,
              "requireAccessCode": false
            },
            "readyToSend": true
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.renewalDate',
          'customer.signaturePreference',
          'workflow.daysUntilRenewal',
          'finalize.agreed_price',
          'finalize.documents',
          'finalize.signature_config',
          'finalize.contract_type',
          'finalize.quote_valid_until'
        ],

        processor: 'generators/signatureInitiation.js',

        outputs: [
          'signature_method',
          'documents_to_sign',
          'signatory_routing',
          'docusign_config',
          'ready_to_send'
        ]
      },

      ui: {
        type: 'artifact_interaction',
        description: 'Review signature configuration and send for signature',

        artifacts: [
          {
            id: 'signature-package',
            title: 'Signature Package - {{customer.name}}',
            type: 'signature_config',
            icon: '✍️',
            visible: true,

            config: {
              allowPreview: true,
              allowCustomization: true,

              actions: [
                {
                  id: 'preview-documents',
                  label: 'Preview Documents',
                  type: 'secondary',
                  onExecute: {
                    openPreview: true,
                    documents: '{{outputs.documents_to_sign}}'
                  }
                },
                {
                  id: 'customize-quote-template',
                  label: 'Customize Quote Template',
                  type: 'secondary',
                  visible: '{{outputs.signature_method == "quote_acceptance"}}',
                  onExecute: {
                    openModal: {
                      type: 'quote_template_editor',
                      config: {
                        quoteId: '{{finalize.quote_number}}',
                        allowBlockEditing: true,
                        allowCSSEditing: true,
                        devToolsEnabled: true
                      }
                    }
                  }
                },
                {
                  id: 'send-for-signature',
                  label: 'Send for Signature',
                  type: 'primary',
                  requiresConfirmation: true,
                  confirmMessage: 'Send contract to {{customer.name}} for signature via {{outputs.signature_method}}?',
                  disabled: '{{!outputs.ready_to_send}}',
                  onExecute: {
                    apiEndpoint: 'POST /api/signatures/docusign/send',
                    payload: {
                      customerId: '{{customer.id}}',
                      documents: '{{outputs.documents_to_sign}}',
                      signatories: '{{outputs.signatory_routing}}',
                      config: '{{outputs.docusign_config}}'
                    },
                    onSuccess: {
                      createAITask: {
                        action: 'Track DocuSign Status',
                        processor: 'docusign-tracker.js',
                        metadata: {
                          envelopeId: '{{response.envelopeId}}',
                          customerId: '{{customer.id}}'
                        },
                        schedule: {
                          frequency: 'hourly',
                          until: 'envelope_completed'
                        }
                      },
                      notification: 'Contract sent for signature',
                      updateArtifact: {
                        status: 'sent',
                        sentAt: '{{response.sentAt}}',
                        envelopeId: '{{response.envelopeId}}'
                      }
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'method',
                title: 'Signature Method',
                type: 'summary',
                content: {
                  method: '{{outputs.signature_method}}',
                  expirationDays: '{{outputs.docusign_config.expirationDays}}'
                }
              },
              {
                id: 'documents',
                title: 'Documents to Sign',
                type: 'document_list',
                content: '{{outputs.documents_to_sign}}'
              },
              {
                id: 'routing',
                title: 'Signature Routing',
                type: 'signatory_list',
                content: '{{outputs.signatory_routing}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 2: SIGNATURE TRACKING
    // =========================================================================
    {
      id: 'signature-tracking',
      name: 'Signature Status Tracking',
      type: 'monitoring',
      estimatedTime: 'Ongoing',

      execution: {
        llmPrompt: `
          SIGNATURE STATUS TRACKING

          Customer: {{customer.name}}
          Envelope ID: {{outputs.docusign_config.envelopeId}}
          Sent: {{outputs.sentAt}}

          TASK:
          Monitor signature status and alert on issues.

          ═══════════════════════════════════════════════════════════════════════
          DOCUSIGN STATUS TRACKING
          ═══════════════════════════════════════════════════════════════════════

          **Envelope Status**: {{docusign.envelopeStatus}}
          - sent: Envelope sent to signatories
          - delivered: Envelope opened/viewed
          - signed: At least one signature completed
          - completed: All signatures collected
          - voided: Envelope cancelled
          - declined: Signatory declined to sign

          **Current Status**: {{docusign.envelopeStatus}}

          **Signatory Status**:
          {{#each docusign.signatories}}
          {{this.order}}. {{this.name}} ({{this.email}})
             Status: {{this.status}}
             {{#if this.status == "sent"}}
             ⏳ Not yet viewed
             {{else if this.status == "delivered"}}
             👀 Viewed, not signed
             {{else if this.status == "signed"}}
             ✅ Signed on {{this.signedAt}}
             {{else if this.status == "declined"}}
             ❌ Declined: {{this.declineReason}}
             {{/if}}
          {{/each}}

          ═══════════════════════════════════════════════════════════════════════
          TIME-BASED ALERTS
          ═══════════════════════════════════════════════════════════════════════

          Days since sent: {{calculate: today - outputs.sentAt}}
          Days until renewal: {{workflow.daysUntilRenewal}}

          **Alert Thresholds**:

          {{#if daysUntilRenewal <= 10 && docusign.envelopeStatus != "completed"}}
          🚨 **CRITICAL**: 10 days or less to renewal, not signed yet
          Action: Immediate CSM follow-up + executive escalation
          {{else if daysUntilRenewal <= 15 && docusign.envelopeStatus != "completed"}}
          ⚠️ **HIGH PRIORITY**: 15 days or less to renewal, not signed
          Action: Daily CSM follow-up
          {{else if daysSinceSent >= 3 && docusign.envelopeStatus == "sent"}}
          ⏰ **FOLLOW-UP**: Sent 3+ days ago, not viewed
          Action: Gentle reminder to customer
          {{else if daysSinceSent >= 7 && docusign.envelopeStatus == "delivered"}}
          ⏰ **FOLLOW-UP**: Viewed but not signed after 7 days
          Action: Check for blockers
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          SIGNATURE COMPLETION CHECK
          ═══════════════════════════════════════════════════════════════════════

          {{#if docusign.envelopeStatus == "completed"}}
          ✅ **ALL SIGNATURES COLLECTED**

          Signed by:
          {{#each docusign.signatories}}
          - {{this.name}}: {{this.signedAt}}
          {{/each}}

          Next steps:
          1. Download fully executed contract
          2. Distribute to customer and internal stakeholders
          3. Update Salesforce opportunity to "Closed Won"
          4. Trigger billing/invoice
          5. Move to post-renewal monitoring

          {{else}}
          ⏳ Waiting for signatures

          Pending:
          {{#each docusign.signatories}}
          {{#if this.status != "signed"}}
          - {{this.name}} ({{this.status}})
          {{/if}}
          {{/each}}
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "envelopeStatus": "completed | sent | delivered | signed | voided | declined",
            "signatoryStatuses": [
              {
                "name": "John Smith",
                "email": "john.smith@acmecorp.com",
                "status": "signed",
                "signedAt": "2025-01-20T14:30:00Z",
                "ipAddress": "192.168.1.1"
              }
            ],
            "allSigned": true | false,
            "daysSinceSent": 5,
            "daysUntilRenewal": 18,
            "alerts": [
              {
                "level": "high",
                "message": "15 days until renewal, signatures not complete",
                "action": "Daily follow-up required"
              }
            ],
            "nextAction": "Download executed contract and distribute"
          }
        `,

        dataRequired: [
          'customer.name',
          'workflow.daysUntilRenewal',
          'outputs.docusign_config.envelopeId',
          'outputs.sentAt',
          'docusign.envelopeStatus',
          'docusign.signatories'
        ],

        processor: 'trackers/docusignStatusTracker.js',

        outputs: [
          'envelope_status',
          'signatory_statuses',
          'all_signed',
          'days_since_sent',
          'days_until_renewal',
          'alerts',
          'next_action'
        ]
      },

      ui: {
        type: 'monitoring_dashboard',
        description: 'Track signature progress in real-time',

        artifacts: [
          {
            id: 'signature-status',
            title: 'Signature Status - {{customer.name}}',
            type: 'signature_tracker',
            icon: '📊',
            visible: true,
            autoRefresh: true,
            refreshInterval: 3600, // Refresh every hour

            config: {
              allowManualRefresh: true,
              allowReminderSend: true,
              allowVoid: true,

              actions: [
                {
                  id: 'refresh-status',
                  label: 'Refresh Status',
                  type: 'secondary',
                  onExecute: {
                    apiEndpoint: 'GET /api/signatures/docusign/status',
                    payload: {
                      envelopeId: '{{outputs.docusign_config.envelopeId}}'
                    }
                  }
                },
                {
                  id: 'send-reminder',
                  label: 'Send Reminder',
                  type: 'secondary',
                  visible: '{{!outputs.all_signed}}',
                  onExecute: {
                    apiEndpoint: 'POST /api/signatures/docusign/remind',
                    payload: {
                      envelopeId: '{{outputs.docusign_config.envelopeId}}',
                      recipientEmail: '{{selected.signatory.email}}'
                    },
                    onSuccess: {
                      notification: 'Reminder sent to {{selected.signatory.name}}'
                    }
                  }
                },
                {
                  id: 'download-executed',
                  label: 'Download Executed Contract',
                  type: 'primary',
                  visible: '{{outputs.all_signed}}',
                  onExecute: {
                    apiEndpoint: 'GET /api/signatures/docusign/download',
                    payload: {
                      envelopeId: '{{outputs.docusign_config.envelopeId}}',
                      certificate: true
                    },
                    onSuccess: {
                      download: true,
                      notification: 'Executed contract downloaded'
                    }
                  }
                },
                {
                  id: 'void-envelope',
                  label: 'Void Envelope',
                  type: 'danger',
                  requiresConfirmation: true,
                  confirmMessage: 'Are you sure you want to void this envelope? This cannot be undone.',
                  visible: '{{!outputs.all_signed}}',
                  onExecute: {
                    apiEndpoint: 'POST /api/signatures/docusign/void',
                    payload: {
                      envelopeId: '{{outputs.docusign_config.envelopeId}}',
                      reason: '{{user.voidReason}}'
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'status-summary',
                title: 'Status',
                type: 'status_badge',
                content: {
                  status: '{{outputs.envelope_status}}',
                  allSigned: '{{outputs.all_signed}}',
                  daysSinceSent: '{{outputs.days_since_sent}}',
                  daysUntilRenewal: '{{outputs.days_until_renewal}}'
                }
              },
              {
                id: 'signatory-progress',
                title: 'Signatory Progress',
                type: 'signatory_list',
                content: '{{outputs.signatory_statuses}}'
              },
              {
                id: 'alerts',
                title: 'Alerts',
                type: 'alert_list',
                content: '{{outputs.alerts}}',
                visible: '{{outputs.alerts.length > 0}}'
              },
              {
                id: 'timeline',
                title: 'Timeline',
                type: 'timeline',
                content: {
                  sent: '{{outputs.sentAt}}',
                  viewed: '{{docusign.firstViewedAt}}',
                  signed: '{{docusign.firstSignedAt}}',
                  completed: '{{docusign.completedAt}}'
                }
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 3: SIGNATURE BLOCKER RESOLUTION
    // =========================================================================
    {
      id: 'signature-blocker-resolution',
      name: 'Signature Blocker Resolution',
      type: 'problem_solving',
      estimatedTime: '15min',
      conditional: true, // Only if blockers exist

      execution: {
        llmPrompt: `
          SIGNATURE BLOCKER RESOLUTION

          Customer: {{customer.name}}
          Days Until Renewal: {{workflow.daysUntilRenewal}}
          Envelope Status: {{outputs.envelope_status}}

          TASK:
          Identify and resolve blockers preventing signature completion.

          ═══════════════════════════════════════════════════════════════════════
          COMMON SIGNATURE BLOCKERS
          ═══════════════════════════════════════════════════════════════════════

          **1. NOT VIEWED** (envelope status: sent)
          - Signatory hasn't opened envelope
          - Email may be in spam/junk
          - Wrong email address
          - Signatory on vacation/unavailable

          **Actions**:
          - Send reminder via DocuSign
          - Follow up via email/phone/Slack
          - Verify email address correct
          - Request alternate signatory if needed

          **2. VIEWED BUT NOT SIGNED** (envelope status: delivered)
          - Signatory opened but hesitating
          - Last-minute questions/concerns
          - Waiting for internal approval
          - Technical issues with signing

          **Actions**:
          - Call signatory to check for concerns
          - Address any last-minute questions
          - Offer assistance with signing process
          - Executive escalation if concerns about terms

          **3. DECLINED** (envelope status: declined)
          - Signatory explicitly declined
          - Reason: {{docusign.declineReason}}
          - May indicate last-minute objections

          **Actions**:
          - **CRITICAL**: Immediate call to understand why
          - May need to return to Negotiate workflow
          - Executive involvement likely required
          - Assess if deal is at risk

          **4. SIGNATORY UNAVAILABLE**
          - On vacation, out of office
          - Left the company
          - No longer authorized to sign

          **Actions**:
          - Request alternate signatory
          - Update signatory in DocuSign
          - May need legal approval for signer change

          **5. INTERNAL BLOCKER**
          - Our signatory hasn't signed (counter-signature)
          - Waiting on internal approval

          **Actions**:
          - Follow up with internal signatory
          - Escalate if needed
          - Ensure no internal delays

          ═══════════════════════════════════════════════════════════════════════
          URGENCY ESCALATION
          ═══════════════════════════════════════════════════════════════════════

          {{#if workflow.daysUntilRenewal <= 10}}
          🚨 **CRITICAL ESCALATION**
          - Time: {{workflow.daysUntilRenewal}} days to renewal
          - Action: Executive involvement NOW
          - Options:
            1. CEO/CRO call to customer CEO/CFO
            2. Expedited review process
            3. Emergency authorization if needed

          {{else if workflow.daysUntilRenewal <= 15}}
          ⚠️ **HIGH PRIORITY ESCALATION**
          - Time: {{workflow.daysUntilRenewal}} days to renewal
          - Action: Daily check-ins with customer
          - Manager involvement recommended

          {{else}}
          📞 **STANDARD FOLLOW-UP**
          - Time: {{workflow.daysUntilRenewal}} days to renewal
          - Action: Regular follow-up via email/call
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          RESOLUTION PLAN
          ═══════════════════════════════════════════════════════════════════════

          For each blocker:
          1. Identify root cause
          2. Define action plan
          3. Assign owner
          4. Set resolution deadline
          5. Execute and track

          OUTPUT FORMAT:
          {
            "blockers": [
              {
                "type": "not_viewed",
                "signatory": "John Smith, CFO",
                "rootCause": "Email in spam folder",
                "actionPlan": [
                  "Call John directly to alert him",
                  "Resend via alternate email",
                  "Request whitelist our domain"
                ],
                "owner": "CSM",
                "deadline": "2025-01-18",
                "status": "in_progress"
              }
            ],
            "escalationRequired": true | false,
            "escalationLevel": "executive | manager | none",
            "riskLevel": "critical | high | medium | low",
            "recommendedActions": [
              "Immediate call to CFO",
              "Executive involvement (CEO to CEO)",
              "Prepare for potential deal risk"
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'workflow.daysUntilRenewal',
          'outputs.envelope_status',
          'outputs.signatory_statuses',
          'outputs.alerts',
          'docusign.declineReason'
        ],

        processor: 'resolvers/signatureBlockerResolver.js',

        outputs: [
          'blockers',
          'escalation_required',
          'escalation_level',
          'risk_level',
          'recommended_actions'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '⚠️ **SIGNATURE BLOCKERS DETECTED**\n\n{{#if outputs.blockers.length > 0}}We\'ve identified {{outputs.blockers.length}} blocker(s) preventing signature completion.\n\nRisk Level: {{outputs.risk_level}}\nDays Until Renewal: {{workflow.daysUntilRenewal}}\n\n{{#if outputs.escalation_required}}🚨 Executive escalation recommended{{/if}}{{/if}}',
            buttons: [
              {
                label: 'View Blockers',
                value: 'view',
                action: 'show_artifact',
                artifactId: 'blocker-resolution'
              },
              {
                label: 'Escalate to Executive',
                value: 'escalate',
                action: 'create_escalation_task',
                visible: '{{outputs.escalation_required}}'
              }
            ]
          }
        },

        artifacts: [
          {
            id: 'blocker-resolution',
            title: 'Signature Blocker Resolution',
            type: 'action_plan',
            icon: '🚧',
            visible: true,

            sections: [
              {
                id: 'blockers',
                title: 'Identified Blockers',
                type: 'blocker_list',
                content: '{{outputs.blockers}}'
              },
              {
                id: 'actions',
                title: 'Recommended Actions',
                type: 'action_list',
                content: '{{outputs.recommended_actions}}'
              },
              {
                id: 'escalation',
                title: 'Escalation Status',
                type: 'escalation_summary',
                content: {
                  required: '{{outputs.escalation_required}}',
                  level: '{{outputs.escalation_level}}',
                  riskLevel: '{{outputs.risk_level}}'
                }
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 4: PAYMENT/INVOICE (IF APPLICABLE)
    // =========================================================================
    {
      id: 'payment-invoice',
      name: 'Payment/Invoice Processing',
      type: 'payment',
      estimatedTime: '10min',
      conditional: true, // Only if not already invoiced

      execution: {
        llmPrompt: `
          PAYMENT/INVOICE PROCESSING

          Customer: {{customer.name}}
          Contract Status: {{#if outputs.all_signed}}✅ Fully Executed{{else}}⏳ Pending Signature{{/if}}
          Billing Method: {{finalize.billing_method.type}}

          TASK:
          Process payment or issue invoice based on billing method.

          ═══════════════════════════════════════════════════════════════════════
          PAYMENT TIMING
          ═══════════════════════════════════════════════════════════════════════

          **Trigger payment/invoice when:**
          - Contract fully executed (all signatures collected)
          - OR renewal date approaching (within 5 days)
          - OR payment terms require advance payment

          **Current Status**:
          - Signatures complete: {{outputs.all_signed}}
          - Days until renewal: {{workflow.daysUntilRenewal}}
          - Payment due: {{finalize.billing_schedule[0].due_date}}

          Should we process payment now? {{calculate: yes if all_signed OR days <= 5}}

          ═══════════════════════════════════════════════════════════════════════
          BILLING METHOD
          ═══════════════════════════════════════════════════════════════════════

          {{#if finalize.billing_method.type == "credit_card"}}
          **CREDIT CARD (AUTO-BILLING)**
          - Card on file: **** {{finalize.billing_method.last4}}
          - Amount: ${{finalize.billing_schedule[0].amount}}
          - Auto-charge on: {{finalize.billing_schedule[0].due_date}}

          Action:
          ☐ Verify card valid and not expiring
          ☐ Set up auto-charge in billing system
          ☐ Send payment confirmation email to customer

          {{else if finalize.billing_method.type == "purchase_order"}}
          **PURCHASE ORDER**
          - PO Number: {{customer.poNumber}}
          - PO Amount: ${{customer.poAmount}}
          - Invoice against PO

          Action:
          ☐ Generate invoice referencing PO number
          ☐ Send invoice to AP: {{customer.apContactEmail}}
          ☐ Track payment (typically 30-60 days)

          {{else if finalize.billing_method.type == "ach"}}
          **ACH / WIRE TRANSFER**
          - Bank account on file
          - Invoice customer with payment instructions

          Action:
          ☐ Generate invoice with wire instructions
          ☐ Send to customer finance team
          ☐ Track payment receipt

          {{else}}
          **MANUAL INVOICE**
          - Generate and send invoice
          - Customer pays per payment terms

          Action:
          ☐ Generate invoice
          ☐ Send to customer
          ☐ Track payment
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          INVOICE GENERATION
          ═══════════════════════════════════════════════════════════════════════

          **Invoice Details**:
          - Invoice Number: AUTO-GENERATED
          - Invoice Date: {{workflow.currentDate}}
          - Due Date: {{finalize.billing_schedule[0].due_date}}
          - Amount: ${{finalize.billing_schedule[0].amount}}
          - Payment Terms: {{finalize.payment_terms}}

          **Line Items**:
          {{#each finalize.pricing_breakdown.line_items}}
          - {{this.description}}: ${{this.subtotal}}
          {{/each}}

          {{#if finalize.pricing_breakdown.discount}}
          - Discount ({{finalize.pricing_breakdown.discount.type}}): -${{finalize.pricing_breakdown.discount.amount}}
          {{/if}}

          **Total**: ${{finalize.pricing_breakdown.total}}

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "shouldProcessNow": true | false,
            "billingMethod": "credit_card | purchase_order | ach | manual",
            "invoiceGenerated": true | false,
            "invoiceDetails": {
              "invoiceNumber": "INV-2026-001",
              "invoiceDate": "2025-01-20",
              "dueDate": "2025-02-19",
              "amount": 268000,
              "status": "sent | paid | overdue"
            },
            "actionItems": [
              "Verify credit card valid",
              "Set up auto-charge for Feb 19",
              "Send payment confirmation to customer"
            ],
            "paymentExpected": "2025-02-19"
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.poNumber',
          'workflow.daysUntilRenewal',
          'outputs.all_signed',
          'finalize.billing_method',
          'finalize.billing_schedule',
          'finalize.pricing_breakdown',
          'finalize.payment_terms'
        ],

        processor: 'generators/invoiceProcessor.js',

        outputs: [
          'should_process_now',
          'billing_method',
          'invoice_generated',
          'invoice_details',
          'action_items',
          'payment_expected'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review and process payment/invoice',

        artifacts: [
          {
            id: 'payment-processing',
            title: 'Payment Processing',
            type: 'payment_config',
            icon: '💳',
            visible: true,

            config: {
              allowInvoiceGeneration: true,
              allowPaymentProcessing: true,

              actions: [
                {
                  id: 'generate-invoice',
                  label: 'Generate Invoice',
                  type: 'primary',
                  visible: '{{!outputs.invoice_generated}}',
                  onExecute: {
                    apiEndpoint: 'POST /api/billing/invoices/generate',
                    payload: {
                      customerId: '{{customer.id}}',
                      amount: '{{finalize.billing_schedule[0].amount}}',
                      dueDate: '{{finalize.billing_schedule[0].due_date}}',
                      lineItems: '{{finalize.pricing_breakdown.line_items}}'
                    },
                    onSuccess: {
                      createAITask: {
                        action: 'Track Invoice Payment',
                        processor: 'invoice-payment-tracker.js'
                      },
                      notification: 'Invoice generated'
                    }
                  }
                },
                {
                  id: 'send-invoice',
                  label: 'Send Invoice to Customer',
                  type: 'primary',
                  visible: '{{outputs.invoice_generated}}',
                  onExecute: {
                    apiEndpoint: 'POST /api/billing/invoices/send',
                    payload: {
                      invoiceId: '{{outputs.invoice_details.invoiceNumber}}',
                      recipientEmail: '{{customer.billingEmail}}'
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'method',
                title: 'Billing Method',
                type: 'summary',
                content: {
                  method: '{{outputs.billing_method}}',
                  autoCharge: '{{finalize.billing_method.auto_billing}}'
                }
              },
              {
                id: 'invoice',
                title: 'Invoice Details',
                type: 'invoice_summary',
                content: '{{outputs.invoice_details}}'
              },
              {
                id: 'actions',
                title: 'Action Items',
                type: 'checklist',
                content: '{{outputs.action_items}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 5: COMPLETION CONFIRMATION
    // =========================================================================
    {
      id: 'completion-confirmation',
      name: 'Renewal Completion Confirmation',
      type: 'confirmation',
      estimatedTime: '5min',

      execution: {
        llmPrompt: `
          RENEWAL COMPLETION CONFIRMATION

          Customer: {{customer.name}}
          Renewal Date: {{customer.renewalDate}}

          TASK:
          Confirm renewal process complete and transition to monitoring.

          ═══════════════════════════════════════════════════════════════════════
          COMPLETION CHECKLIST
          ═══════════════════════════════════════════════════════════════════════

          **Signatures**:
          {{#if outputs.all_signed}}
          ✅ All signatures collected
          {{else}}
          ❌ Signatures pending
          {{/if}}

          **Payment/Invoice**:
          {{#if outputs.invoice_generated}}
          ✅ Invoice generated and sent
          {{else if finalize.billing_method.auto_billing}}
          ✅ Auto-billing configured
          {{else}}
          ⏳ Payment processing pending
          {{/if}}

          **Salesforce**:
          ☐ Opportunity marked "Closed Won"
          ☐ Contract uploaded to Salesforce
          ☐ Renewal date updated
          ☐ ARR updated

          **Contract Distribution**:
          ☐ Fully executed contract sent to customer
          ☐ Contract filed in internal repository
          ☐ Finance notified of renewal

          **System Updates**:
          ☐ Customer account renewed (access continues)
          ☐ Billing system updated with new ARR
          ☐ Support team notified
          ☐ Success plan updated for new term

          ═══════════════════════════════════════════════════════════════════════
          RENEWAL SUCCESS
          ═══════════════════════════════════════════════════════════════════════

          {{#if outputs.all_signed && (outputs.invoice_generated || finalize.billing_method.auto_billing)}}
          🎉 **RENEWAL COMPLETE!**

          Renewal Summary:
          - Customer: {{customer.name}}
          - Renewal ARR: ${{finalize.agreed_price}}
          - Change from previous: {{calculate: change_percent}}%
          - Term Length: {{finalize.term_length}}
          - Start Date: {{finalize.contract_start_date}}
          - End Date: {{finalize.contract_end_date}}

          Next renewal in: {{finalize.term_length}}

          **Next Steps**:
          1. Send thank you note to customer
          2. Schedule QBR (Quarterly Business Review)
          3. Update success plan for new term
          4. Return to Monitor workflow for ongoing management

          {{else}}
          ⏳ **RENEWAL IN PROGRESS**

          Still pending:
          {{#if !outputs.all_signed}}
          - Signatures from: {{pending_signatories}}
          {{/if}}
          {{#if !outputs.invoice_generated && !finalize.billing_method.auto_billing}}
          - Invoice generation/payment setup
          {{/if}}

          Continue tracking until complete.
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "renewalComplete": true | false,
            "completionDate": "2025-01-20",
            "checklistStatus": {
              "signaturesComplete": true,
              "paymentProcessed": true,
              "salesforceUpdated": false,
              "contractDistributed": false,
              "systemsUpdated": false
            },
            "nextRenewalDate": "2027-12-31",
            "postRenewalTasks": [
              "Send thank you email to customer",
              "Schedule kickoff QBR for new term",
              "Update customer success plan",
              "Transition to Monitor workflow"
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.renewalDate',
          'outputs.all_signed',
          'outputs.invoice_generated',
          'finalize.billing_method',
          'finalize.agreed_price',
          'finalize.term_length',
          'finalize.contract_start_date'
        ],

        processor: 'validators/renewalCompletionCheck.js',

        outputs: [
          'renewal_complete',
          'completion_date',
          'checklist_status',
          'next_renewal_date',
          'post_renewal_tasks'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '{{#if outputs.renewal_complete}}🎉 **RENEWAL COMPLETE!**\n\nCongratulations! {{customer.name}} renewal is fully executed.\n\nRenewal ARR: ${{finalize.agreed_price}}\nNext renewal: {{outputs.next_renewal_date}}\n\nReady to transition to post-renewal monitoring?{{else}}⏳ **RENEWAL IN PROGRESS**\n\nAlmost there! Just a few items remaining on the checklist.{{/if}}',
            buttons: [
              {
                label: 'View Completion Checklist',
                value: 'checklist',
                action: 'show_artifact',
                artifactId: 'completion-checklist'
              },
              {
                label: 'Complete Renewal & Return to Monitor',
                value: 'complete',
                action: 'transition_to_monitor',
                visible: '{{outputs.renewal_complete}}'
              }
            ]
          }
        },

        artifacts: [
          {
            id: 'completion-checklist',
            title: 'Renewal Completion Checklist',
            type: 'checklist',
            icon: '✅',
            visible: true,

            sections: [
              {
                id: 'status',
                title: 'Completion Status',
                type: 'checklist',
                content: '{{outputs.checklist_status}}'
              },
              {
                id: 'post-renewal',
                title: 'Post-Renewal Tasks',
                type: 'task_list',
                content: '{{outputs.post_renewal_tasks}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 6: ACTION PLAN
    // =========================================================================
    {
      ...ActionPlanStep,

      execution: {
        ...ActionPlanStep.execution,

        llmPrompt: `
          ${ActionPlanStep.execution.llmPrompt}

          ═══════════════════════════════════════════════════════════════════════
          SIGNATURE STAGE SPECIFIC CONTEXT
          ═══════════════════════════════════════════════════════════════════════

          This is the SIGNATURE stage (15-29 days until renewal).

          Focus Areas:
          - Collect signatures on finalized contract
          - Monitor signature status hourly
          - Resolve blockers preventing signature
          - Process payment/invoice when signatures complete
          - Confirm renewal completion

          TYPICAL AI TASK PRIORITIES FOR SIGNATURE:
          1. Track DocuSign envelope status (hourly checks)
          2. Alert CSM if signatures delayed (3+ days no view, 7+ days no sign)
          3. Alert CSM if renewal < 10 days and not signed (CRITICAL)
          4. Generate and send invoice when signatures complete
          5. Update Salesforce opportunity to "Closed Won"
          6. Track invoice payment (if applicable)
          7. Transition to Monitor workflow when complete

          TYPICAL CSM TASK PRIORITIES FOR SIGNATURE:
          1. Send DocuSign envelope to customer
          2. Follow up if no response after 3 days
          3. Call customer if viewed but not signed after 7 days
          4. Resolve any signature blockers
          5. Executive escalation if < 10 days and not signed
          6. Distribute fully executed contract
          7. Send thank you note and schedule QBR

          NEXT WORKFLOW EXPECTATION:
          - If renewal completes successfully: Return to Monitor workflow (for next renewal cycle)
          - If <10 days and not signed: Escalate to Critical workflow
          - If renewal date passes without signature: Move to Overdue workflow

          KEY SIGNATURE OUTPUTS TO REFERENCE:
          - DocuSign Envelope: {{outputs.docusign_config.envelopeId}}
          - Signature Status: {{outputs.envelope_status}}
          - Blockers: {{outputs.blockers}}
          - Invoice: {{outputs.invoice_details}}
          - Completion: {{outputs.renewal_complete}}

          CRITICAL TRIGGERS:
          - If all signatures complete → Generate invoice, update Salesforce, complete renewal
          - If signature declined → URGENT: Return to Negotiate, executive involvement
          - If < 10 days and not signed → Escalate to Critical workflow
          - If renewal date passes → Move to Overdue workflow

          Use these outputs to inform your action plan generation.
        `
      }
    }
  ]
};

export default SignatureRenewalWorkflow;
