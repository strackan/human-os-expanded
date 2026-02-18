/**
 * Human-readable trigger reason generator for workflow cards.
 * Maps workflow metadata into friendly, context-rich strings.
 */

export interface TriggerReasonParams {
  workflowType: string;
  daysUntilRenewal?: number;
  currentArr?: number;
  healthScore?: number;
  opportunityScore?: number;
}

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${Math.round(arr / 1_000)}K`;
  return `$${arr}`;
}

export function getTriggerReason(params: TriggerReasonParams): string {
  const { workflowType, daysUntilRenewal, currentArr, healthScore, opportunityScore } = params;
  const arrStr = currentArr ? formatArr(currentArr) : '';

  switch (workflowType) {
    case 'renewal':
      if (daysUntilRenewal !== undefined && arrStr) {
        return `Renewal in ${daysUntilRenewal} days \u2014 ${arrStr} ARR at stake`;
      }
      if (daysUntilRenewal !== undefined) {
        return `Renewal in ${daysUntilRenewal} days`;
      }
      return 'Upcoming renewal requires attention';

    case 'risk':
      if (healthScore !== undefined && arrStr) {
        return `Health score dropped to ${healthScore} \u2014 ${arrStr} account needs intervention`;
      }
      if (healthScore !== undefined) {
        return `Health score dropped to ${healthScore} \u2014 proactive intervention needed`;
      }
      return 'At-risk account needs proactive intervention';

    case 'opportunity':
      if (arrStr) {
        return `Expansion signal detected \u2014 ${arrStr} account showing growth`;
      }
      if (opportunityScore !== undefined) {
        return `Opportunity score ${opportunityScore} \u2014 expansion potential detected`;
      }
      return 'Expansion signal detected \u2014 growth opportunity';

    case 'strategic':
      if (arrStr) {
        return `Investment account \u2014 align on ${arrStr} growth plan`;
      }
      return 'Strategic account \u2014 align on growth plan';

    default:
      return 'Workflow requires attention';
  }
}
