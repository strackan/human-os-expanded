/**
 * Finalize Renewal Workflow
 *
 * Triggered when: 30-59 days until renewal
 * Urgency: HIGH - Contract execution and formalization
 *
 * Purpose: Execute and finalize renewal contract after verbal commitment
 * - Prepare renewal contract with agreed terms
 * - Legal/compliance review (if required)
 * - Payment terms and billing setup
 * - Internal approvals (for discounts/custom terms)
 * - Final documentation preparation
 * - Handoff to signature workflow
 *
 * Key Distinction:
 * - Negotiate = DISCUSSION & VERBAL COMMITMENT
 * - Finalize = FORMALIZE & PREPARE FOR EXECUTION
 * - Signature = EXECUTE SIGNATURES
 *
 * IMPORTANT: This workflow assumes verbal commitment secured in Negotiate.
 * If no verbal commitment yet, may need to loop back to Negotiate.
 */

import { WorkflowDefinition } from '../workflow-types';
import { ActionPlanStep } from '../workflow-steps/ActionPlanStep';

export const FinalizeRenewalWorkflow: WorkflowDefinition = {
  id: 'finalize-renewal',
  type: 'renewal',
  stage: 'Finalize',
  name: 'Finalize Renewal',
  description: '30-59 days until renewal - contract execution and formalization',

  baseScore: 65,        // Higher than Negotiate (55)
  urgencyScore: 65,     // High urgency - contract execution

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 30,
      daysMax: 59
    }
  },

  // Can also be triggered early from Negotiate workflow when verbal commitment secured
  earlyTrigger: {
    from: 'negotiate-renewal',
    conditions: [
      {
        type: 'milestone',
        value: 'verbal_commitment_secured',
        description: 'Customer provides verbal commitment to renew'
      }
    ]
  },

  steps: [
    // =========================================================================
    // STEP 1: VERBAL COMMITMENT CONFIRMATION
    // =========================================================================
    {
      id: 'verbal-commitment-check',
      name: 'Verbal Commitment Confirmation',
      type: 'confirmation',
      estimatedTime: '5min',

      execution: {
        llmPrompt: `
          VERBAL COMMITMENT CONFIRMATION

          Customer: {{customer.name}}
          Agreed Price: ${{negotiate.agreedPrice}}
          Agreed Terms: {{negotiate.agreedTerms}}

          TASK:
          Confirm that verbal commitment has been secured before proceeding with contract formalization.

          ═══════════════════════════════════════════════════════════════════════
          VERBAL COMMITMENT CHECKLIST
          ═══════════════════════════════════════════════════════════════════════

          Has the customer provided verbal commitment to renew?

          **What counts as verbal commitment:**
          ✓ "Yes, we'll renew at $X for Y years"
          ✓ "That works, let's proceed with the contract"
          ✓ "Approved on our end, send the paperwork"
          ✓ "We're good to go"

          **What does NOT count:**
          ✗ "Let me think about it"
          ✗ "I'll get back to you"
          ✗ "Probably yes, but need to check with..."
          ✗ "Send the contract and we'll review"

          ═══════════════════════════════════════════════════════════════════════

          IF NO VERBAL COMMITMENT YET:
          - Stop Finalize workflow
          - Return to Negotiate workflow
          - Schedule follow-up with customer
          - DO NOT proceed with contract preparation

          IF VERBAL COMMITMENT SECURED:
          - Proceed to contract preparation
          - Document commitment details:
            - Who committed: __________ (stakeholder name/role)
            - When: __________ (date)
            - Via what channel: __________ (email, call, meeting)
            - Exact terms agreed: __________

          OUTPUT FORMAT:
          {
            "verbalCommitmentSecured": true | false,
            "commitmentDate": "2025-01-15",
            "committedBy": "John Smith, CFO",
            "commitmentChannel": "Phone call",
            "agreedPrice": 268000,
            "agreedTerms": {
              "term_length": "2 years",
              "payment_terms": "Annual, Net 30",
              "discount": "5% for 2-year commitment",
              "other_terms": ["Premium support included", "Quarterly business reviews"]
            },
            "notes": "CFO approved on phone call. Mentioned urgency to finalize before end of quarter."
          }
        `,

        dataRequired: [
          'customer.name',
          'negotiate.agreedPrice',
          'negotiate.agreedTerms',
          'negotiate.verbalCommitment'
        ],

        processor: 'validators/verbalCommitmentCheck.js',

        outputs: [
          'verbal_commitment_secured',
          'commitment_date',
          'committed_by',
          'commitment_channel',
          'agreed_price',
          'agreed_terms',
          'notes'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '📋 **VERBAL COMMITMENT CHECK**\n\nBefore we prepare the contract, let\'s confirm you have verbal commitment from {{customer.name}}.\n\n**Question:** Has the customer verbally committed to renewing?',
            buttons: [
              { label: '✅ Yes, We Have Verbal Commitment', value: 'yes' },
              { label: '❌ No, Still Negotiating', value: 'no', action: 'return_to_negotiate' }
            ]
          },

          branches: {
            yes: {
              response: 'Great! Please provide details:',
              inputType: 'form',
              fields: [
                {
                  id: 'committedBy',
                  label: 'Who committed? (Name & Role)',
                  type: 'text',
                  required: true,
                  placeholder: 'e.g., Jane Doe, CFO'
                },
                {
                  id: 'commitmentDate',
                  label: 'When did they commit?',
                  type: 'date',
                  required: true
                },
                {
                  id: 'commitmentChannel',
                  label: 'Via what channel?',
                  type: 'select',
                  options: ['Phone Call', 'Email', 'Video Meeting', 'In-Person Meeting', 'Slack/Teams'],
                  required: true
                },
                {
                  id: 'agreedPrice',
                  label: 'Agreed Price',
                  type: 'currency',
                  required: true,
                  defaultValue: '{{negotiate.agreedPrice}}'
                },
                {
                  id: 'agreedTermLength',
                  label: 'Term Length',
                  type: 'select',
                  options: ['1 year', '2 years', '3 years', 'Multi-year (custom)'],
                  required: true
                },
                {
                  id: 'paymentTerms',
                  label: 'Payment Terms',
                  type: 'select',
                  options: ['Annual, Net 30', 'Quarterly, Net 30', 'Monthly, Net 15', 'Custom'],
                  required: true
                },
                {
                  id: 'notes',
                  label: 'Additional Notes',
                  type: 'textarea',
                  placeholder: 'Any special terms, conditions, or context...'
                }
              ],
              nextButtons: [
                { label: 'Continue to Contract Prep', value: 'continue', action: 'proceed_to_step_2' }
              ]
            },

            no: {
              response: '⚠️ **HOLD UP**\n\nYou should not proceed to Finalize without verbal commitment.\n\n**Next Steps:**\n1. Continue negotiation efforts\n2. Get verbal commitment\n3. Return to Finalize workflow\n\nWould you like to return to Negotiate workflow or schedule a follow-up?',
              buttons: [
                { label: 'Return to Negotiate', value: 'negotiate', action: 'return_to_negotiate' },
                { label: 'Schedule Follow-Up', value: 'follow_up', action: 'create_follow_up_task' }
              ]
            }
          }
        }
      }
    },

    // =========================================================================
    // STEP 2: QUOTE/PROPOSAL GENERATION
    // =========================================================================
    {
      id: 'quote-generation',
      name: 'Quote/Proposal Generation',
      type: 'document_generation',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          RENEWAL QUOTE/PROPOSAL GENERATION

          Customer: {{customer.name}}
          Agreed Price: ${{outputs.agreed_price}}
          Term Length: {{outputs.agreed_terms.term_length}}

          TASK:
          Generate formal renewal quote/proposal based on verbal commitment.

          ═══════════════════════════════════════════════════════════════════════
          QUOTE STRUCTURE
          ═══════════════════════════════════════════════════════════════════════

          **1. HEADER**
          - Quote Number: AUTO-GENERATED (e.g., Q-2026-{{customer.id}}-001)
          - Quote Date: {{workflow.currentDate}}
          - Valid Until: {{workflow.currentDate + 30 days}}
          - Customer: {{customer.name}}
          - Prepared By: {{currentUser.name}}

          **2. PRICING BREAKDOWN**

          Line Items:
          {{#if customer.hasMultipleProducts}}
          | Product/Service | Quantity | Unit Price | Subtotal |
          |-----------------|----------|------------|----------|
          {{#each customer.products}}
          | {{this.name}} | {{this.quantity}} | ${{this.unitPrice}} | ${{this.subtotal}} |
          {{/each}}
          {{else}}
          | Product/Service | Quantity | Unit Price | Subtotal |
          |-----------------|----------|------------|----------|
          | {{customer.productName}} | {{customer.seatCount}} seats | ${{outputs.agreed_price / customer.seatCount}} | ${{outputs.agreed_price}} |
          {{/if}}

          **Subtotal**: ${{outputs.agreed_price}}

          {{#if outputs.agreed_terms.discount}}
          **Discount**: -{{outputs.agreed_terms.discount}} (${{calculate: discount_amount}})
          {{/if}}

          **Total Annual Recurring Revenue**: ${{outputs.agreed_price}}

          **3. TERM & PAYMENT**

          - **Contract Term**: {{outputs.agreed_terms.term_length}}
          - **Contract Start Date**: {{customer.currentContract.endDate + 1 day}}
          - **Contract End Date**: {{calculate: start_date + term_length}}
          - **Payment Terms**: {{outputs.agreed_terms.payment_terms}}
          - **Billing Frequency**: {{calculate: from payment_terms}} (Annual | Quarterly | Monthly)

          {{#if outputs.agreed_terms.payment_terms == "Quarterly, Net 30"}}
          **Payment Schedule**:
          - Q1: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 30 days}})
          - Q2: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 3 months + 30 days}})
          - Q3: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 6 months + 30 days}})
          - Q4: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 9 months + 30 days}})
          {{/if}}

          **4. WHAT'S INCLUDED**

          - {{customer.productName}} access for {{customer.seatCount}} users
          - {{customer.supportLevel}} support (24/7 | Business hours | Email only)
          - {{customer.slaLevel}} SLA
          {{#each outputs.agreed_terms.other_terms}}
          - {{this}}
          {{/each}}

          **5. SPECIAL TERMS** (if any)

          {{#each outputs.agreed_terms.other_terms}}
          - {{this}}
          {{/each}}

          {{#if outputs.agreed_terms.discount}}
          - **Multi-year discount**: {{outputs.agreed_terms.discount}} applied for {{outputs.agreed_terms.term_length}} commitment
          {{/if}}

          **6. NEXT STEPS**

          1. Review this quote
          2. Confirm acceptance (mark as "Closed Won" in Salesforce)
          3. We'll send formal contract for signature
          4. Contract execution and renewal begins {{contract_start_date}}

          **7. CONTACT INFORMATION**

          Questions? Contact:
          - {{currentUser.name}}, {{currentUser.title}}
          - {{currentUser.email}}
          - {{currentUser.phone}}

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "quoteNumber": "Q-2026-ACME-001",
            "quoteDate": "2025-01-15",
            "validUntil": "2025-02-14",
            "pricingBreakdown": {
              "lineItems": [
                {
                  "description": "Platform License - Enterprise",
                  "quantity": 500,
                  "unitPrice": 536,
                  "subtotal": 268000
                }
              ],
              "subtotal": 268000,
              "discount": {
                "type": "Multi-year commitment",
                "percent": 5,
                "amount": 13400
              },
              "total": 254600
            },
            "termDetails": {
              "termLength": "2 years",
              "startDate": "2026-01-01",
              "endDate": "2027-12-31",
              "paymentTerms": "Quarterly, Net 30",
              "paymentSchedule": [
                {"quarter": "Q1", "amount": 63650, "dueDate": "2026-01-30"},
                {"quarter": "Q2", "amount": 63650, "dueDate": "2026-04-30"},
                {"quarter": "Q3", "amount": 63650, "dueDate": "2026-07-30"},
                {"quarter": "Q4", "amount": 63650, "dueDate": "2026-10-30"}
              ]
            },
            "documentsGenerated": [
              {
                "type": "quote_pdf",
                "url": "/quotes/Q-2026-ACME-001.pdf",
                "status": "ready"
              },
              {
                "type": "quote_spreadsheet",
                "url": "/quotes/Q-2026-ACME-001.xlsx",
                "status": "ready"
              }
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.products',
          'customer.seatCount',
          'customer.currentContract',
          'outputs.agreed_price',
          'outputs.agreed_terms',
          'currentUser'
        ],

        processor: 'generators/quoteGenerator.js',

        outputs: [
          'quote_number',
          'quote_date',
          'valid_until',
          'pricing_breakdown',
          'term_details',
          'documents_generated'
        ]
      },

      ui: {
        type: 'artifact_interaction',
        description: 'Review and deliver renewal quote',

        artifacts: [
          {
            id: 'renewal-quote',
            title: 'Renewal Quote - {{customer.name}}',
            type: 'quote_document',
            icon: '💰',
            visible: true,
            editable: true,

            config: {
              allowEditing: true,
              allowDownload: true,
              allowPreview: true,
              allowSending: true,

              actions: [
                {
                  id: 'preview-quote',
                  label: 'Preview Quote',
                  type: 'secondary',
                  onExecute: {
                    openPreview: true,
                    url: '{{documents_generated.quote_pdf.url}}'
                  }
                },
                {
                  id: 'download-quote',
                  label: 'Download PDF',
                  type: 'secondary',
                  onExecute: {
                    download: true,
                    url: '{{documents_generated.quote_pdf.url}}'
                  }
                },
                {
                  id: 'send-quote',
                  label: 'Send Quote to Customer',
                  type: 'primary',
                  requiresConfirmation: true,
                  confirmMessage: 'Send renewal quote to {{customer.name}}?',
                  onExecute: {
                    apiEndpoint: 'POST /api/quotes/send',
                    payload: {
                      customerId: '{{customer.id}}',
                      quoteId: '{{outputs.quote_number}}',
                      recipients: '{{customer.financialContacts}}',
                      ccRecipients: '{{customer.mainContact}}',
                      emailTemplate: 'renewal_quote',
                      attachments: ['{{documents_generated.quote_pdf.url}}']
                    },
                    onSuccess: {
                      createAITask: {
                        action: 'Update Salesforce Quote Status',
                        processor: 'salesforce-quote-updater.js',
                        metadata: {
                          quoteId: '{{outputs.quote_number}}',
                          status: 'sent',
                          sentAt: '{{response.sentAt}}'
                        }
                      },
                      notification: 'Quote sent to {{customer.name}}',
                      updateArtifact: {
                        status: 'sent',
                        sentAt: '{{response.sentAt}}'
                      }
                    }
                  }
                },
                {
                  id: 'mark-salesforce-closed-won',
                  label: 'Mark Salesforce as Closed Won',
                  type: 'secondary',
                  onExecute: {
                    apiEndpoint: 'POST /api/salesforce/opportunities/update',
                    payload: {
                      opportunityId: '{{customer.salesforceOpportunityId}}',
                      stage: 'Closed Won',
                      amount: '{{outputs.agreed_price}}',
                      closeDate: '{{outputs.term_details.startDate}}'
                    },
                    onSuccess: {
                      notification: 'Salesforce updated: Closed Won'
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'quote-header',
                title: 'Quote Details',
                type: 'summary',
                content: {
                  quoteNumber: '{{outputs.quote_number}}',
                  quoteDate: '{{outputs.quote_date}}',
                  validUntil: '{{outputs.valid_until}}'
                }
              },
              {
                id: 'pricing',
                title: 'Pricing Breakdown',
                type: 'pricing_table',
                content: '{{outputs.pricing_breakdown}}'
              },
              {
                id: 'terms',
                title: 'Term & Payment Details',
                type: 'term_summary',
                content: '{{outputs.term_details}}'
              },
              {
                id: 'documents',
                title: 'Quote Documents',
                type: 'document_list',
                content: '{{outputs.documents_generated}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 3: CONTRACT PREPARATION
    // =========================================================================
    {
      id: 'contract-preparation',
      name: 'Contract Preparation',
      type: 'document_generation',
      estimatedTime: '20min',

      execution: {
        llmPrompt: `
          RENEWAL CONTRACT PREPARATION

          Customer: {{customer.name}}
          Agreed Price: ${{outputs.agreed_price}}
          Term Length: {{outputs.agreed_terms.term_length}}

          TASK:
          Prepare renewal contract based on agreed terms from negotiation.

          ═══════════════════════════════════════════════════════════════════════
          CONTRACT COMPONENTS
          ═══════════════════════════════════════════════════════════════════════

          **1. PRICING & TERMS**

          Current Contract (expiring):
          - ARR: ${{customer.arr}}
          - Term: {{customer.currentContract.termLength}}
          - Start Date: {{customer.currentContract.startDate}}
          - End Date: {{customer.currentContract.endDate}}

          New Contract (renewal):
          - ARR: ${{outputs.agreed_price}}
          - Term: {{outputs.agreed_terms.term_length}}
          - Start Date: {{customer.currentContract.endDate + 1 day}}
          - End Date: {{calculate: startDate + term_length}}
          - Discount Applied: {{outputs.agreed_terms.discount}}
          - Payment Terms: {{outputs.agreed_terms.payment_terms}}

          **2. CHANGES FROM CURRENT CONTRACT**

          What's changing?
          - Price: {{customer.arr}} → ${{outputs.agreed_price}} ({{calculate: percent change}}%)
          - Term: {{customer.currentContract.termLength}} → {{outputs.agreed_terms.term_length}}
          - Payment: {{customer.currentContract.paymentTerms}} → {{outputs.agreed_terms.payment_terms}}
          - Other: {{outputs.agreed_terms.other_terms}}

          **3. LEGAL STRUCTURE**

          Contract Type Options:
          - **Amendment**: If only price/term changing, amend existing MSA
          - **Renewal Order**: If MSA stays same, new order form
          - **Full Contract**: If MSA needs updates, full new contract

          Recommended for this renewal: __________
          Rationale: __________

          **4. REQUIRED DOCUMENTS**

          Based on changes, you need:
          {{#if agreedTerms.discount > 0}}
          ☐ Discount Approval Form (if discount applied)
          {{/if}}
          {{#if agreedTerms.term_length != customer.currentContract.termLength}}
          ☐ Term Change Addendum
          {{/if}}
          {{#if agreedTerms.payment_terms != customer.currentContract.paymentTerms}}
          ☐ Payment Terms Amendment
          {{/if}}
          {{#if agreedTerms.other_terms.length > 0}}
          ☐ Special Terms Addendum
          {{/if}}
          ☐ Renewal Order Form / Amendment (always)
          ☐ Signature Page (always)

          **5. SPECIAL CLAUSES**

          From negotiation, include:
          {{#each outputs.agreed_terms.other_terms}}
          - {{this}}
          {{/each}}

          Auto-renewal clause: {{customer.autoRenewalPreference}}
          Price escalation clause: {{customer.priceEscalationClause}}
          Termination notice: {{customer.terminationNoticeDays}} days

          **6. APPROVALS REQUIRED**

          {{#if outputs.agreed_price < customer.arr}}
          ⚠️ Price Decrease: Requires CFO approval
          {{/if}}
          {{#if outputs.agreed_terms.discount >= 5}}
          ⚠️ Discount ≥5%: Requires VP approval
          {{/if}}
          {{#if outputs.agreed_terms.term_length > 2}}
          ⚠️ Multi-year (>2): Requires legal review
          {{/if}}
          {{#if outputs.agreed_terms.other_terms.length > 0}}
          ⚠️ Custom Terms: Requires legal review
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          CONTRACT GENERATION
          ═══════════════════════════════════════════════════════════════════════

          Generate renewal contract documents:

          1. Identify contract template to use
          2. Populate with agreed terms
          3. Generate redlines showing changes from current contract
          4. Create signature-ready PDF
          5. Flag required approvals

          OUTPUT FORMAT:
          {
            "contractType": "amendment | renewal_order | full_contract",
            "documents": [
              {
                "type": "renewal_order_form",
                "template": "standard_renewal_v3",
                "status": "draft",
                "url": "/contracts/acme-corp-renewal-2026-draft.pdf"
              },
              {
                "type": "redline_comparison",
                "status": "generated",
                "url": "/contracts/acme-corp-renewal-redline.pdf"
              }
            ],
            "changesFromCurrent": {
              "price": {
                "from": 250000,
                "to": 268000,
                "change_percent": 7.2
              },
              "term": {
                "from": "1 year",
                "to": "2 years"
              },
              "payment": {
                "from": "Annual",
                "to": "Quarterly"
              }
            },
            "approvalsRequired": [
              {
                "type": "manager",
                "reason": "5% discount applied",
                "approver": "Jane Smith (CSM Manager)",
                "status": "pending"
              },
              {
                "type": "legal",
                "reason": "Custom payment terms",
                "approver": "Legal Team",
                "status": "pending"
              }
            ],
            "specialClauses": [
              "Premium support included at no extra cost",
              "Quarterly business reviews guaranteed"
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.arr',
          'customer.currentContract',
          'outputs.agreed_price',
          'outputs.agreed_terms'
        ],

        processor: 'generators/contractGenerator.js',

        outputs: [
          'contract_type',
          'documents',
          'changes_from_current',
          'approvals_required',
          'special_clauses'
        ]
      },

      ui: {
        type: 'artifact_interaction',
        description: 'Review and finalize contract documents',

        artifacts: [
          {
            id: 'contract-package',
            title: 'Renewal Contract - {{customer.name}}',
            type: 'document_package',
            icon: '📄',
            visible: true,
            editable: true,

            config: {
              allowEditing: true,
              allowDownload: true,
              allowPreview: true,
              requiresApproval: true,

              actions: [
                {
                  id: 'preview-contract',
                  label: 'Preview Contract',
                  type: 'secondary',
                  onExecute: {
                    openPreview: true,
                    url: '{{documents.renewal_order_form.url}}'
                  }
                },
                {
                  id: 'download-package',
                  label: 'Download All Documents',
                  type: 'secondary',
                  onExecute: {
                    apiEndpoint: 'POST /api/contracts/package/download',
                    payload: {
                      customerId: '{{customer.id}}',
                      documents: '{{documents}}'
                    }
                  }
                },
                {
                  id: 'request-approval',
                  label: 'Request Approvals',
                  type: 'primary',
                  requiresConfirmation: true,
                  confirmMessage: 'Send contract for approvals to: {{approvals_required}}?',
                  onExecute: {
                    apiEndpoint: 'POST /api/contracts/approvals/request',
                    payload: {
                      customerId: '{{customer.id}}',
                      contractId: '{{documents.renewal_order_form.id}}',
                      approvals: '{{approvals_required}}'
                    },
                    onSuccess: {
                      createAITask: {
                        action: 'Track Approval Status',
                        processor: 'approval-tracker.js'
                      },
                      notification: 'Approval requests sent'
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'summary',
                title: 'Contract Summary',
                type: 'summary',
                content: {
                  contractType: '{{outputs.contract_type}}',
                  agreedPrice: '{{outputs.agreed_price}}',
                  termLength: '{{outputs.agreed_terms.term_length}}',
                  startDate: '{{calculated.start_date}}',
                  endDate: '{{calculated.end_date}}'
                }
              },
              {
                id: 'changes',
                title: 'Changes from Current Contract',
                type: 'comparison_table',
                content: '{{outputs.changes_from_current}}'
              },
              {
                id: 'documents',
                title: 'Contract Documents',
                type: 'document_list',
                content: '{{outputs.documents}}'
              },
              {
                id: 'approvals',
                title: 'Required Approvals',
                type: 'approval_list',
                content: '{{outputs.approvals_required}}'
              },
              {
                id: 'special-clauses',
                title: 'Special Terms',
                type: 'list',
                content: '{{outputs.special_clauses}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 3: LEGAL & COMPLIANCE REVIEW
    // =========================================================================
    {
      id: 'legal-compliance-review',
      name: 'Legal & Compliance Review',
      type: 'review',
      estimatedTime: '15min',
      conditional: true, // Only required if custom terms or high-value deal

      execution: {
        llmPrompt: `
          LEGAL & COMPLIANCE REVIEW

          Customer: {{customer.name}}
          Contract Value: ${{outputs.agreed_price}}

          TASK:
          Determine if legal/compliance review is required and coordinate if needed.

          ═══════════════════════════════════════════════════════════════════════
          REVIEW REQUIRED CHECK
          ═══════════════════════════════════════════════════════════════════════

          Legal review IS required if:
          ✓ Contract value > $500k (this: ${{outputs.agreed_price}})
          ✓ Custom terms negotiated (this: {{outputs.special_clauses.length > 0}})
          ✓ Multi-year term >2 years (this: {{outputs.agreed_terms.term_length}})
          ✓ Non-standard payment terms (this: {{outputs.agreed_terms.payment_terms}})
          ✓ Customer in regulated industry (healthcare, finance, govt)
          ✓ International contract (data privacy laws)

          Legal review NOT required if:
          ✗ Standard renewal at market rate
          ✗ No custom terms
          ✗ Standard 1-2 year term
          ✗ Standard payment terms

          Based on this renewal:
          → Legal review required: YES / NO
          → Reason: __________

          ═══════════════════════════════════════════════════════════════════════
          IF LEGAL REVIEW REQUIRED
          ═══════════════════════════════════════════════════════════════════════

          **What legal needs to review:**
          1. Contract structure (amendment vs. new contract)
          2. Pricing and discount terms
          3. Payment terms and billing
          4. Special clauses negotiated
          5. Compliance with regulations (GDPR, SOC2, etc.)
          6. Liability and indemnification clauses
          7. Termination and renewal clauses

          **Review checklist:**
          ☐ Send contract package to legal team
          ☐ Provide context on negotiated terms
          ☐ Highlight any custom clauses
          ☐ Set review deadline (target: 5 business days)
          ☐ Track review status
          ☐ Address any legal feedback
          ☐ Get legal sign-off

          **Timeline:**
          - Review requested: {{workflow.currentDate}}
          - Review deadline: {{workflow.currentDate + 5 business days}}
          - Expected completion: {{workflow.currentDate + 7 days}}

          ═══════════════════════════════════════════════════════════════════════
          IF NO LEGAL REVIEW REQUIRED
          ═══════════════════════════════════════════════════════════════════════

          Proceed directly to payment setup (Step 4).

          Document why legal review skipped:
          - Standard renewal terms
          - No custom clauses
          - Within standard approval limits
          - No compliance concerns

          OUTPUT FORMAT:
          {
            "legalReviewRequired": true | false,
            "reviewReason": "Contract value $600k + custom payment terms",
            "reviewChecklist": [
              {
                "item": "Send contract to legal",
                "status": "pending",
                "assignedTo": "legal@company.com"
              },
              {
                "item": "Provide negotiation context",
                "status": "pending",
                "assignedTo": "CSM"
              }
            ],
            "reviewDeadline": "2025-01-22",
            "complianceFlags": [
              {
                "type": "GDPR",
                "applicable": true,
                "status": "compliant"
              },
              {
                "type": "SOC2",
                "applicable": true,
                "status": "pending_review"
              }
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.industry',
          'customer.country',
          'outputs.agreed_price',
          'outputs.agreed_terms',
          'outputs.special_clauses'
        ],

        processor: 'validators/legalReviewCheck.js',

        outputs: [
          'legal_review_required',
          'review_reason',
          'review_checklist',
          'review_deadline',
          'compliance_flags'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '⚖️ **LEGAL REVIEW CHECK**\n\nDetermining if legal review is required for this renewal...\n\n{{#if outputs.legal_review_required}}\n✅ **Legal review IS required**\n\nReason: {{outputs.review_reason}}\n\nDeadline: {{outputs.review_deadline}}\n\n{{else}}\n✅ **Legal review NOT required**\n\nThis is a standard renewal with no custom terms or compliance concerns.\n\n{{/if}}',
            buttons: [
              {
                label: 'Request Legal Review',
                value: 'request',
                action: 'send_legal_review_request',
                visible: '{{outputs.legal_review_required}}'
              },
              {
                label: 'Skip to Payment Setup',
                value: 'skip',
                action: 'proceed_to_step_4',
                visible: '{{!outputs.legal_review_required}}'
              }
            ]
          }
        },

        artifacts: [
          {
            id: 'legal-review',
            title: 'Legal Review Status',
            type: 'review_tracker',
            icon: '⚖️',
            visible: '{{outputs.legal_review_required}}',

            sections: [
              {
                id: 'checklist',
                title: 'Review Checklist',
                type: 'checklist',
                content: '{{outputs.review_checklist}}'
              },
              {
                id: 'compliance',
                title: 'Compliance Flags',
                type: 'compliance_status',
                content: '{{outputs.compliance_flags}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 4: PAYMENT TERMS & BILLING SETUP
    // =========================================================================
    {
      id: 'payment-billing-setup',
      name: 'Payment Terms & Billing Setup',
      type: 'setup',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          PAYMENT TERMS & BILLING SETUP

          Customer: {{customer.name}}
          Agreed Price: ${{outputs.agreed_price}}
          Payment Terms: {{outputs.agreed_terms.payment_terms}}

          TASK:
          Set up payment terms and billing for renewal.

          ═══════════════════════════════════════════════════════════════════════
          PAYMENT STRUCTURE
          ═══════════════════════════════════════════════════════════════════════

          **Agreed Terms:**
          - Total ARR: ${{outputs.agreed_price}}
          - Term Length: {{outputs.agreed_terms.term_length}}
          - Payment Frequency: {{outputs.agreed_terms.payment_terms}}

          **Billing Schedule:**

          {{#if agreed_terms.payment_terms == "Annual, Net 30"}}
          - Invoice 1: ${{outputs.agreed_price}} (due {{contract_start_date + 30 days}})
          {{/if}}

          {{#if agreed_terms.payment_terms == "Quarterly, Net 30"}}
          - Invoice 1: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 30 days}})
          - Invoice 2: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 3 months + 30 days}})
          - Invoice 3: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 6 months + 30 days}})
          - Invoice 4: ${{outputs.agreed_price / 4}} (due {{contract_start_date + 9 months + 30 days}})
          {{/if}}

          {{#if agreed_terms.payment_terms == "Monthly, Net 15"}}
          - 12 monthly invoices of ${{outputs.agreed_price / 12}}
          - Due 15 days after each invoice date
          {{/if}}

          **Discount Applied:**
          {{#if agreed_terms.discount}}
          - Discount: {{agreed_terms.discount}}
          - Applied to: {{agreed_terms.discount_application}} (each invoice | first invoice | spread across term)
          - Pre-discount total: ${{calculate: agreed_price / (1 - discount_percent)}}
          {{else}}
          - No discount applied
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          BILLING METHOD
          ═══════════════════════════════════════════════════════════════════════

          Current billing method: {{customer.currentBillingMethod}}
          Options: Credit Card | ACH | Wire Transfer | Check | Purchase Order

          {{#if customer.currentBillingMethod == "Credit Card"}}
          ✓ Credit card on file: {{customer.creditCardLast4}}
          ✓ Auto-billing enabled
          Action: Verify card is valid and not expiring
          {{/if}}

          {{#if customer.currentBillingMethod == "Purchase Order"}}
          ⚠️ Purchase Order required
          Action:
          1. Request PO from customer ({{customer.poContactEmail}})
          2. Wait for PO approval (can take 2-4 weeks)
          3. Issue invoice against PO
          4. Track PO number in billing system
          {{/if}}

          {{#if customer.currentBillingMethod == "ACH"}}
          ✓ ACH details on file
          Action: Verify bank account active
          {{/if}}

          **Action Items:**
          {{#if customer.currentBillingMethod == "Purchase Order"}}
          ☐ Email PO request to {{customer.poContactEmail}}
          ☐ Include contract and payment schedule
          ☐ Set reminder to follow up in 1 week
          ☐ Escalate if PO not received within 2 weeks
          {{else}}
          ☐ Verify payment method on file
          ☐ Update billing system with new ARR
          ☐ Schedule invoices based on payment terms
          ☐ Set auto-billing (if applicable)
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          TAX & COMPLIANCE
          ═══════════════════════════════════════════════════════════════════════

          Customer Location: {{customer.billingAddress.country}}, {{customer.billingAddress.state}}

          Tax Applicability:
          {{#if customer.taxExempt}}
          ✓ Tax exempt (certificate on file: {{customer.taxExemptCertificate}})
          {{else}}
          ⚠️ Sales tax applicable: {{calculate: sales_tax_rate}}%
          Total with tax: ${{outputs.agreed_price * (1 + sales_tax_rate)}}
          {{/if}}

          {{#if customer.billingAddress.country != "US"}}
          ⚠️ International customer
          - VAT/GST applicable: {{calculate: vat_rate}}%
          - Withholding tax: {{calculate: withholding_tax}}%
          - Currency: {{customer.currency}}
          {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          OUTPUT FORMAT
          ═══════════════════════════════════════════════════════════════════════

          {
            "billingSchedule": [
              {
                "invoice_number": 1,
                "amount": 268000,
                "due_date": "2026-01-30",
                "status": "scheduled"
              }
            ],
            "billingMethod": {
              "type": "credit_card",
              "last4": "4242",
              "expiry": "12/2026",
              "auto_billing": true
            },
            "taxInfo": {
              "tax_exempt": false,
              "sales_tax_rate": 0.08,
              "total_with_tax": 289440
            },
            "poRequired": false,
            "actionItems": [
              "Verify credit card not expiring before renewal",
              "Update ARR in billing system to $268,000",
              "Schedule annual invoice for Jan 30, 2026"
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.currentBillingMethod',
          'customer.billingAddress',
          'customer.taxExempt',
          'outputs.agreed_price',
          'outputs.agreed_terms'
        ],

        processor: 'generators/billingSetup.js',

        outputs: [
          'billing_schedule',
          'billing_method',
          'tax_info',
          'po_required',
          'action_items'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review and confirm billing setup',

        artifacts: [
          {
            id: 'billing-setup',
            title: 'Billing Setup - {{customer.name}}',
            type: 'billing_config',
            icon: '💳',
            visible: true,

            sections: [
              {
                id: 'schedule',
                title: 'Billing Schedule',
                type: 'invoice_schedule',
                content: '{{outputs.billing_schedule}}'
              },
              {
                id: 'method',
                title: 'Payment Method',
                type: 'payment_info',
                content: '{{outputs.billing_method}}'
              },
              {
                id: 'tax',
                title: 'Tax Information',
                type: 'tax_summary',
                content: '{{outputs.tax_info}}'
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
    // STEP 5: INTERNAL APPROVALS
    // =========================================================================
    {
      id: 'internal-approvals',
      name: 'Internal Approvals',
      type: 'approval',
      estimatedTime: '10min',
      conditional: true, // Only if approvals required

      execution: {
        llmPrompt: `
          INTERNAL APPROVALS

          Customer: {{customer.name}}
          Contract Value: ${{outputs.agreed_price}}

          TASK:
          Track and obtain required internal approvals before sending contract to customer.

          ═══════════════════════════════════════════════════════════════════════
          REQUIRED APPROVALS
          ═══════════════════════════════════════════════════════════════════════

          From Step 2 (Contract Preparation):
          {{#each outputs.approvals_required}}
          {{this.priority}}. **{{this.type}}** - {{this.reason}}
             Approver: {{this.approver}}
             Status: {{this.status}}
          {{/each}}

          ═══════════════════════════════════════════════════════════════════════
          APPROVAL WORKFLOW
          ═══════════════════════════════════════════════════════════════════════

          For each required approval:

          1. **Request Approval**
             - Send notification to approver
             - Include contract details and rationale
             - Set deadline (typically 2-3 business days)

          2. **Track Status**
             - Pending: Awaiting approver action
             - Approved: Approver signed off
             - Rejected: Approver declined (requires renegotiation)
             - Escalated: Past deadline, needs escalation

          3. **Handle Feedback**
             - If approved: Proceed
             - If rejected: Address concerns, resubmit
             - If no response: Escalate to approver's manager

          ═══════════════════════════════════════════════════════════════════════
          APPROVAL TEMPLATE
          ═══════════════════════════════════════════════════════════════════════

          Email to approver:

          Subject: Approval Required: {{customer.name}} Renewal (${{outputs.agreed_price}})

          Hi {{approver.name}},

          I need your approval for {{customer.name}}'s renewal contract.

          **Contract Details:**
          - Customer: {{customer.name}}
          - Current ARR: ${{customer.arr}}
          - Renewal ARR: ${{outputs.agreed_price}} ({{calculate: change_percent}}% change)
          - Term: {{outputs.agreed_terms.term_length}}
          - Payment: {{outputs.agreed_terms.payment_terms}}

          **Reason for Approval:**
          {{approval.reason}}

          **Rationale:**
          {{approval.rationale}}

          Please review and approve by {{approval.deadline}}.

          [Approve] [Reject] [Request Changes]

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "approvals": [
              {
                "id": "approval-1",
                "type": "manager",
                "approver": "Jane Smith",
                "approver_email": "jane.smith@company.com",
                "reason": "5% discount applied",
                "status": "pending",
                "requested_at": "2025-01-15T10:00:00Z",
                "deadline": "2025-01-17T17:00:00Z",
                "approved_at": null,
                "notes": null
              },
              {
                "id": "approval-2",
                "type": "legal",
                "approver": "Legal Team",
                "approver_email": "legal@company.com",
                "reason": "Custom payment terms",
                "status": "approved",
                "requested_at": "2025-01-15T10:00:00Z",
                "deadline": "2025-01-18T17:00:00Z",
                "approved_at": "2025-01-16T14:30:00Z",
                "notes": "Approved with minor language changes to Section 4"
              }
            ],
            "allApproved": false,
            "pendingCount": 1,
            "nextAction": "Wait for manager approval from Jane Smith (deadline: Jan 17)"
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.arr',
          'outputs.agreed_price',
          'outputs.agreed_terms',
          'outputs.approvals_required'
        ],

        processor: 'workflows/approvalTracker.js',

        outputs: [
          'approvals',
          'all_approved',
          'pending_count',
          'next_action'
        ]
      },

      ui: {
        type: 'approval_tracker',
        description: 'Track internal approval status',

        artifacts: [
          {
            id: 'approval-status',
            title: 'Approval Status',
            type: 'approval_dashboard',
            icon: '✅',
            visible: true,

            config: {
              allowRequestApproval: true,
              allowReminderSend: true,

              actions: [
                {
                  id: 'send-reminder',
                  label: 'Send Reminder',
                  type: 'secondary',
                  onExecute: {
                    apiEndpoint: 'POST /api/approvals/remind',
                    payload: {
                      approvalId: '{{approval.id}}'
                    }
                  }
                },
                {
                  id: 'escalate',
                  label: 'Escalate',
                  type: 'warning',
                  onExecute: {
                    apiEndpoint: 'POST /api/approvals/escalate',
                    payload: {
                      approvalId: '{{approval.id}}'
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'approvals-list',
                title: 'Approval Status',
                type: 'approval_list',
                content: '{{outputs.approvals}}'
              },
              {
                id: 'summary',
                title: 'Summary',
                type: 'metrics',
                content: {
                  total: '{{outputs.approvals.length}}',
                  approved: '{{outputs.approvals.filter(a => a.status == "approved").length}}',
                  pending: '{{outputs.pending_count}}',
                  rejected: '{{outputs.approvals.filter(a => a.status == "rejected").length}}'
                }
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 6: FINAL DOCUMENTATION PREPARATION
    // =========================================================================
    {
      id: 'final-documentation',
      name: 'Final Documentation Preparation',
      type: 'document_finalization',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          FINAL DOCUMENTATION PREPARATION

          Customer: {{customer.name}}
          Contract Status: {{#if outputs.all_approved}}✅ All approvals received{{else}}⏳ Pending approvals{{/if}}

          TASK:
          Prepare final contract package for customer signature.

          ═══════════════════════════════════════════════════════════════════════
          FINAL CONTRACT PACKAGE
          ═══════════════════════════════════════════════════════════════════════

          **Documents to Include:**

          1. ✓ Renewal Order Form / Amendment
             - Final version with all approvals
             - Incorporates any legal feedback
             - Ready for signature

          2. ✓ Signature Page
             - Customer signatories: {{customer.signatories}}
             - Our signatories: {{company.signatories}}
             - Signature method: {{customer.signaturePreference}} (DocuSign | Adobe Sign | Wet signature)

          3. ✓ Billing Schedule
             - Invoice schedule and amounts
             - Payment terms
             - PO requirements (if applicable)

          4. Optional Documents:
             {{#if outputs.special_clauses.length > 0}}
             - Special Terms Addendum
             {{/if}}
             {{#if customer.requiresSOW}}
             - Statement of Work (SOW)
             {{/if}}
             {{#if customer.requiresSecurityReview}}
             - Security & Compliance Attestation
             {{/if}}

          ═══════════════════════════════════════════════════════════════════════
          PRE-SIGNATURE CHECKLIST
          ═══════════════════════════════════════════════════════════════════════

          Before sending to customer:

          ☐ All internal approvals received
          ☐ Legal review complete (if required)
          ☐ Contract reflects final negotiated terms
          ☐ Pricing and term length correct
          ☐ Payment terms accurate
          ☐ Special clauses included
          ☐ Signature fields populated with correct names/titles
          ☐ DocuSign/signature system configured
          ☐ Billing system updated with new ARR
          ☐ CRM updated with renewal status

          ═══════════════════════════════════════════════════════════════════════
          SIGNATURE ROUTING
          ═══════════════════════════════════════════════════════════════════════

          **Customer Signature Order:**
          {{#each customer.signatories}}
          {{this.order}}. {{this.name}} ({{this.title}})
             Email: {{this.email}}
             Signature Authority: ${{this.signatureLimit}}
             {{#if outputs.agreed_price > this.signatureLimit}}
             ⚠️ Contract value (${{outputs.agreed_price}}) exceeds authority - need higher approval
             {{/if}}
          {{/each}}

          **Our Signature Order:**
          1. CSM signs first (relationship owner)
          2. Manager co-signs (if discount >5%)
          3. VP/CRO signs (if contract >$500k)

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "finalPackage": {
              "documents": [
                {
                  "name": "Renewal Order Form",
                  "type": "contract",
                  "url": "/contracts/acme-renewal-final.pdf",
                  "status": "ready_for_signature"
                },
                {
                  "name": "Billing Schedule",
                  "type": "billing",
                  "url": "/contracts/acme-billing-schedule.pdf",
                  "status": "informational"
                }
              ],
              "totalPages": 12,
              "packageSize": "2.4 MB"
            },
            "signatureConfig": {
              "method": "docusign",
              "signingOrder": [
                {
                  "order": 1,
                  "name": "John Smith, CFO",
                  "email": "john.smith@acmecorp.com",
                  "role": "customer"
                },
                {
                  "order": 2,
                  "name": "Sarah Jones, CSM",
                  "email": "sarah.jones@ourcompany.com",
                  "role": "vendor"
                }
              ]
            },
            "preSignatureChecklist": {
              "completed": 9,
              "total": 10,
              "incomplete": ["Update CRM with renewal status"]
            },
            "readyToSend": true,
            "nextStep": "Send for signature via DocuSign"
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.signatories',
          'customer.signaturePreference',
          'outputs.agreed_price',
          'outputs.documents',
          'outputs.all_approved'
        ],

        processor: 'generators/finalDocPackage.js',

        outputs: [
          'final_package',
          'signature_config',
          'pre_signature_checklist',
          'ready_to_send',
          'next_step'
        ]
      },

      ui: {
        type: 'artifact_interaction',
        description: 'Review final contract package before sending for signature',

        artifacts: [
          {
            id: 'final-package',
            title: 'Final Contract Package',
            type: 'document_package',
            icon: '📦',
            visible: true,

            config: {
              allowDownload: true,
              allowPreview: true,

              actions: [
                {
                  id: 'preview-package',
                  label: 'Preview All Documents',
                  type: 'secondary',
                  onExecute: {
                    openPreview: true,
                    documents: '{{outputs.final_package.documents}}'
                  }
                },
                {
                  id: 'send-for-signature',
                  label: 'Send for Signature',
                  type: 'primary',
                  requiresConfirmation: true,
                  confirmMessage: 'Send contract package to {{customer.name}} for signature?',
                  disabled: '{{!outputs.ready_to_send}}',
                  onExecute: {
                    apiEndpoint: 'POST /api/signatures/send',
                    payload: {
                      customerId: '{{customer.id}}',
                      documents: '{{outputs.final_package.documents}}',
                      signatureConfig: '{{outputs.signature_config}}'
                    },
                    onSuccess: {
                      createAITask: {
                        action: 'Track Signature Status',
                        processor: 'signature-tracker.js'
                      },
                      notification: 'Contract sent for signature',
                      transitionToWorkflow: 'signature-renewal' // Move to Signature workflow
                    }
                  }
                }
              ]
            },

            sections: [
              {
                id: 'documents',
                title: 'Documents',
                type: 'document_list',
                content: '{{outputs.final_package.documents}}'
              },
              {
                id: 'signature-routing',
                title: 'Signature Routing',
                type: 'signature_order',
                content: '{{outputs.signature_config.signingOrder}}'
              },
              {
                id: 'checklist',
                title: 'Pre-Signature Checklist',
                type: 'checklist',
                content: '{{outputs.pre_signature_checklist}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 7: ACTION PLAN
    // =========================================================================
    {
      ...ActionPlanStep,

      execution: {
        ...ActionPlanStep.execution,

        llmPrompt: `
          ${ActionPlanStep.execution.llmPrompt}

          ═══════════════════════════════════════════════════════════════════════
          FINALIZE STAGE SPECIFIC CONTEXT
          ═══════════════════════════════════════════════════════════════════════

          This is the FINALIZE stage (30-59 days until renewal).

          Focus Areas:
          - Execute contract preparation and legal review
          - Set up billing and payment terms
          - Obtain internal approvals
          - Prepare final contract package for signature

          TYPICAL AI TASK PRIORITIES FOR FINALIZE:
          1. Generate renewal contract documents
          2. Track legal review status (if required)
          3. Track internal approval status
          4. Update billing system with new ARR
          5. Schedule invoices based on payment terms
          6. Monitor for PO receipt (if required)
          7. Trigger Signature workflow when ready to send

          TYPICAL CSM TASK PRIORITIES FOR FINALIZE:
          1. Confirm verbal commitment details
          2. Review and approve contract documents
          3. Request internal approvals (manager, legal, etc.)
          4. Coordinate with billing team on payment setup
          5. Request PO from customer (if required)
          6. Complete pre-signature checklist
          7. Send contract for signature (transitions to Signature workflow)

          NEXT WORKFLOW EXPECTATION:
          - Next Stage: Signature (15-29 days)
          - Trigger Condition: Contract sent for signature
          - Focus: Track signature progress, handle signature blockers

          KEY FINALIZE OUTPUTS TO REFERENCE:
          - Verbal Commitment: {{outputs.committed_by}}, {{outputs.commitment_date}}
          - Contract Documents: {{outputs.documents}}
          - Billing Setup: {{outputs.billing_schedule}}
          - Approvals: {{outputs.approvals}}
          - Final Package: {{outputs.final_package}}

          CRITICAL TRIGGERS:
          - If contract sent for signature → Trigger Signature workflow
          - If PO required and not received → Follow-up task at Day 21
          - If approvals not received within 3 days → Escalation task

          Use these outputs to inform your action plan generation.
        `
      }
    }
  ]
};

export default FinalizeRenewalWorkflow;
