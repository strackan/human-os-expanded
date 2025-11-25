/**
 * Review Contract Terms Slide - Renewal-Specific Slide
 *
 * Used ONLY in renewal workflows to review current contract terms and identify
 * what needs to change for the renewal.
 *
 * This is workflow-specific to renewals - not reused in risk, opportunity, or strategic workflows.
 */

import type { UniversalSlideBuilder } from '../baseSlide';

/**
 * Review Contract Terms Slide Builder
 *
 * Renewal-specific slide for reviewing current contract and planning renewal terms.
 */
export const reviewContractTermsSlide: UniversalSlideBuilder = (context): any => ({
  id: 'review-contract-terms',
  version: '2',
  name: 'Review Contract Terms',
  category: 'renewal',

  structure: {
    id: 'review-contract-terms',
    title: 'Review Contract Terms',
    description: 'Review current contract and plan renewal terms',
    label: 'Contract Review',
    stepMapping: 'review-contract-terms',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Let's review {{customer.name}}'s current contract to prepare for the renewal conversation. I've pulled together the key terms and dates.`,
        buttons: [
          {
            label: 'Review Contract',
            value: 'review',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'review': 'review',
        },
      },
      branches: {
        review: {
          response: 'Great! Take a look at the contract summary. Make note of any terms you want to discuss or change.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Ready to review the contract terms?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'contract-review',
          type: 'document',
          title: 'Contract Review',
          content: `# {{customer.name}} - Contract Review

**Review Date**: {{current_date}}
**Days Until Renewal**: {{customer.days_to_renewal}}

---

## Current Contract Terms

### Term & Dates
| Field | Value |
|-------|-------|
| Contract Start | {{customer.contract_start_date}} |
| Contract End | {{customer.contract_end_date}} |
| Contract Term | ${context?.variables?.contractTerm || 12} months |
| Auto-Renewal | {{customer.auto_renewal}} |

### Financial Terms
| Field | Value |
|-------|-------|
| Current ARR | \${{customer.current_arr}} |
| Payment Terms | ${context?.variables?.paymentTerms || 'Annual'} |
| License Unit Price | \${{customer.license_unit_price}} |

### Product & Services
| Field | Value |
|-------|-------|
| Products | {{customer.products}} |
| License Count | {{customer.license_count}} |
| Support Level | {{customer.support_level}} |

---

## Usage & Performance

| Metric | Value |
|--------|-------|
| Utilization | {{customer.utilization_percent}}% |
| Active Users | {{customer.active_users}} of {{customer.license_count}} |
| Health Score | {{customer.health_score}}/100 |

---

## Proposed Changes for Renewal

### Recommendations
- **Contract Term**: ${context?.variables?.proposedTerm || 'No change recommended'}
- **License Count**: ${context?.variables?.proposedLicenses || 'Review based on utilization'}
- **Support Level**: ${context?.variables?.proposedSupport || 'Maintain current level'}
- **Payment Terms**: ${context?.variables?.proposedPayment || 'No change'}

### Additional Considerations

**Expansion Opportunity**:
${context?.variables?.expansionNotes || 'Review utilization trends to identify expansion potential'}

**Discount Strategy**:
${context?.variables?.discountNotes || 'Standard renewal pricing unless justified by multi-year commitment'}

---

## Contract Review Checklist

- [ ] Reviewed all current contract terms
- [ ] Analyzed usage relative to contract
- [ ] Identified changes needed for renewal
- [ ] Understood customer's desired changes
- [ ] Prepared renewal terms proposal

---

*Prepared for renewal planning. Update this document as discussions progress.*
`,
          editable: true,
          visible: true,
        }
      ],
    },

    sidePanel: {
      enabled: true,
      title: {
        text: 'Workflow Progress',
        subtitle: 'Track your progress',
        icon: 'checklist',
      },
      steps: [],
      progressMeter: {
        currentStep: 0,
        totalSteps: 0,
        progressPercentage: 0,
        showPercentage: true,
        showStepNumbers: true,
      },
      showProgressMeter: true,
      showSteps: true,
    },

    onComplete: {
      nextSlide: undefined,
      updateProgress: true,
    },
  },
});
