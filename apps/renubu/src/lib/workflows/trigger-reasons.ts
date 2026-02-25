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
  ariScoreDelta?: number;
  ariScore?: number;
}

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${Math.round(arr / 1_000)}K`;
  return `$${arr}`;
}

export function getTriggerReason(params: TriggerReasonParams): string {
  const { workflowType, daysUntilRenewal, currentArr, healthScore, opportunityScore, ariScoreDelta, ariScore } = params;
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

    case 'ari_drop':
      if (ariScoreDelta !== undefined && ariScore !== undefined) {
        return `AI visibility dropped ${Math.abs(ariScoreDelta).toFixed(1)} pts \u2014 ARI score now ${ariScore.toFixed(0)}`;
      }
      return 'AI visibility declined \u2014 review recommended';

    case 'ari_surge':
      if (ariScoreDelta !== undefined && ariScore !== undefined) {
        return `AI visibility surged ${ariScoreDelta.toFixed(1)} pts \u2014 expansion signal`;
      }
      return 'AI visibility improved significantly \u2014 expansion opportunity';

    default:
      return 'Workflow requires attention';
  }
}
