import { LucideIcon } from 'lucide-react';

/**
 * Contact type definition
 */
export type ContactType = 'executive' | 'champion' | 'business';

/**
 * Individual contact information
 */
export interface Contact {
  name: string;
  role: string;
  email?: string;
  type: ContactType;
  confirmed?: boolean;
}

/**
 * Contract information and terms
 */
export interface ContractInfo {
  startDate: string;
  endDate: string;
  term: string;
  autoRenew: boolean;
  autoRenewLanguage?: string;
  noticePeriod: string;
  terminationClause?: string;
  pricingCaps?: string[];
  nonStandardTerms?: string[];
  unsignedAmendments?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Pricing and financial information
 */
export interface PricingInfo {
  currentARR: string;
  lastYearARR?: string;
  seats: number;
  pricePerSeat?: string;
  addOns?: string[];
  discounts?: string;
  marketPercentile?: number;
  usageScore?: number;
  adoptionRate?: number;
  satisfactionScore?: number;
  pricingOpportunity?: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Configuration for contact type styling
 */
export interface ContactTypeConfig {
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  label: string;
}

/**
 * Tab configuration for composable AccountOverview
 */
export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  props: any;
  show?: boolean; // Optional flag to conditionally show tab
}

/**
 * Props for tab components
 */
export interface BaseTabProps {
  customerName?: string;
  onReview?: (reviewed: boolean) => void;
}

export interface ContractTabProps extends BaseTabProps {
  contractInfo: ContractInfo;
  onContractQuestion?: (question: string, answer: string) => void;
}

export interface ContactsTabProps extends BaseTabProps {
  contacts: Contact[];
  onContactConfirm?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactUpdate?: (oldContact: Contact, newContact: Contact, context: { davidRole: string; newContactRole: string }) => void;
}

export interface PricingTabProps extends BaseTabProps {
  pricingInfo: PricingInfo;
}
