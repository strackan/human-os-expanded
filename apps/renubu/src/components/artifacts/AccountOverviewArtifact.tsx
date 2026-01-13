'use client';

import React from 'react';
import { FileText, Users, DollarSign } from 'lucide-react';
import { AccountOverview } from './account-overview/AccountOverview';
import { ContractTab } from './account-overview/tabs/ContractTab';
import { ContactsTab } from './account-overview/tabs/ContactsTab';
import { PricingTab } from './account-overview/tabs/PricingTab';
import { Contact, ContractInfo, PricingInfo, TabConfig } from './account-overview/types';

/**
 * Original props interface - maintained for backward compatibility
 */
interface AccountOverviewArtifactProps {
  customerName: string;
  contractInfo: ContractInfo;
  contacts: Contact[];
  pricingInfo: PricingInfo;
  onContinue?: () => void;
  onBack?: () => void;
  onContactConfirm?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactUpdate?: (oldContact: Contact, newContact: Contact, context: { davidRole: string; newContactRole: string }) => void;
  onContractQuestion?: (question: string, answer: string) => void;
  showSkipSnooze?: boolean;
  onSkip?: () => void;
  onSnooze?: () => void;
  showPricingTab?: boolean;
}

/**
 * AccountOverviewArtifact - Backward-compatible wrapper
 *
 * This component maintains the original API for existing code while using
 * the new composable architecture under the hood.
 *
 * **Refactored from 704 → ~50 lines**
 *
 * For new code, consider using the composable components directly:
 * - `AccountOverview` with custom tab configurations
 * - Individual tab components (`ContractTab`, `ContactsTab`, `PricingTab`)
 *
 * @example New composable approach
 * ```tsx
 * import { AccountOverview } from './account-overview/AccountOverview';
 * import { ContractTab } from './account-overview/tabs/ContractTab';
 *
 * <AccountOverview
 *   customerName="Acme Corp"
 *   tabs={[
 *     { id: 'contract', label: 'Contract', icon: FileText, component: ContractTab, props: {...} }
 *   ]}
 * />
 * ```
 */
export default function AccountOverviewArtifact({
  customerName,
  contractInfo,
  contacts,
  pricingInfo,
  onContinue,
  onBack,
  onContactConfirm,
  onContactEdit,
  onContactUpdate,
  onContractQuestion,
  showSkipSnooze = false,
  onSkip,
  onSnooze,
  showPricingTab = true
}: AccountOverviewArtifactProps) {
  // Build tab configuration array
  const tabs: TabConfig[] = [
    {
      id: 'contract',
      label: 'Contract',
      icon: FileText,
      component: ContractTab,
      props: {
        contractInfo,
        customerName,
        onContractQuestion
      }
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      component: ContactsTab,
      props: {
        contacts,
        customerName,
        onContactConfirm,
        onContactEdit,
        onContactUpdate
      }
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: DollarSign,
      component: PricingTab,
      props: {
        pricingInfo,
        customerName
      },
      show: showPricingTab
    }
  ];

  return (
    <AccountOverview
      customerName={customerName}
      tabs={tabs}
      onContinue={onContinue}
      onBack={onBack}
      showSkipSnooze={showSkipSnooze}
      onSkip={onSkip}
      onSnooze={onSnooze}
    />
  );
}

/**
 * Export types for convenience
 */
export type { Contact, ContractInfo, PricingInfo };
