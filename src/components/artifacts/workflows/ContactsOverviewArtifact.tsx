/**
 * ContactsOverviewArtifact
 *
 * Displays stakeholder/contact information using artifact primitives.
 * Designed for InHerSight workflows to show key contacts with relationship context.
 */

'use client';

import React from 'react';
import { Users, Mail, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';
import {
  ArtifactContainer,
  ArtifactHeader,
  ArtifactSection,
  ArtifactList,
  ArtifactFooter,
  type ListItem,
} from '@/components/artifacts/primitives';

export type RelationshipStrength = 'strong' | 'moderate' | 'weak';

export interface Contact {
  id?: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  relationshipStrength?: RelationshipStrength;
  communicationStyle?: string;
  keyConcerns?: string[];
  leveragePoints?: string[];
  recentInteractions?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface ContactsOverviewArtifactProps {
  /** Artifact ID for debugging */
  artifactId?: string;
  /** Customer/company name */
  customerName?: string;
  /** List of contacts */
  contacts: Contact[];
  /** Optional title override */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Show detailed view with concerns/leverage points */
  detailed?: boolean;
  /** Action button handlers */
  onContactClick?: (contact: Contact) => void;
  onContinue?: () => void;
  onBack?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
}

const RELATIONSHIP_CONFIG: Record<RelationshipStrength, {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  label: string;
}> = {
  strong: {
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: 'Strong',
  },
  moderate: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: <Minus className="w-3.5 h-3.5" />,
    label: 'Moderate',
  },
  weak: {
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    label: 'Needs Work',
  },
};

interface ContactCardProps {
  contact: Contact;
  detailed?: boolean;
  onClick?: () => void;
}

function ContactCard({ contact, detailed = false, onClick }: ContactCardProps) {
  const relationship = contact.relationshipStrength
    ? RELATIONSHIP_CONFIG[contact.relationshipStrength]
    : null;

  return (
    <div
      className={`
        border border-gray-200 rounded-lg overflow-hidden bg-white
        ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''}
      `}
      onClick={onClick}
    >
      {/* Contact Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{contact.name}</h4>
              {contact.isPrimary && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Primary
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{contact.role}</p>
            {contact.email && (
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{contact.email}</span>
              </div>
            )}
          </div>
          {relationship && (
            <div className={`
              px-2.5 py-1 rounded-full border text-xs font-medium
              flex items-center gap-1.5 ${relationship.bgColor} ${relationship.color}
            `}>
              {relationship.icon}
              {relationship.label}
            </div>
          )}
        </div>
      </div>

      {/* Contact Details */}
      {detailed && (
        <div className="px-4 py-3 space-y-3">
          {/* Communication Style */}
          {contact.communicationStyle && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-700">Communication Style</span>
              </div>
              <p className="text-sm text-gray-600 pl-5">{contact.communicationStyle}</p>
            </div>
          )}

          {/* Key Concerns */}
          {contact.keyConcerns && contact.keyConcerns.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-700 block mb-1.5">Key Concerns</span>
              <ArtifactList
                variant="bullet"
                spacing="tight"
                items={contact.keyConcerns.map((concern, i) => ({
                  key: `concern-${i}`,
                  content: <span className="text-red-700">{concern}</span>,
                }))}
              />
            </div>
          )}

          {/* Leverage Points */}
          {contact.leveragePoints && contact.leveragePoints.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-700 block mb-1.5">Leverage Points</span>
              <ArtifactList
                variant="bullet"
                spacing="tight"
                items={contact.leveragePoints.map((point, i) => ({
                  key: `leverage-${i}`,
                  content: <span className="text-green-700">{point}</span>,
                }))}
              />
            </div>
          )}

          {/* Recent Interactions */}
          {contact.recentInteractions && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-700 block mb-1">Recent Activity</span>
              <p className="text-sm text-gray-500 italic">{contact.recentInteractions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContactsOverviewArtifact({
  artifactId = 'contacts-overview',
  customerName,
  contacts,
  title = 'Key Contacts',
  subtitle,
  detailed = false,
  onContactClick,
  onContinue,
  onBack,
  isLoading = false,
  error,
}: ContactsOverviewArtifactProps) {
  const displaySubtitle = subtitle || (customerName ? `Stakeholders at ${customerName}` : undefined);

  // Separate primary contacts
  const primaryContacts = contacts.filter(c => c.isPrimary);
  const otherContacts = contacts.filter(c => !c.isPrimary);

  return (
    <ArtifactContainer
      artifactId={artifactId}
      variant="contacts"
      isLoading={isLoading}
      error={error}
    >
      <ArtifactHeader
        title={title}
        subtitle={displaySubtitle}
        icon={<Users className="w-5 h-5" />}
        variant="contacts"
        badge={
          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </span>
        }
      />

      <div className="px-6 py-4">
        {/* Primary Contacts */}
        {primaryContacts.length > 0 && (
          <ArtifactSection
            title="Primary Contacts"
            titleSize="sm"
            variant="transparent"
            padding="none"
          >
            <div className="grid grid-cols-1 gap-3">
              {primaryContacts.map((contact, index) => (
                <ContactCard
                  key={contact.id || contact.email || index}
                  contact={contact}
                  detailed={detailed}
                  onClick={onContactClick ? () => onContactClick(contact) : undefined}
                />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Other Contacts */}
        {otherContacts.length > 0 && (
          <ArtifactSection
            title={primaryContacts.length > 0 ? "Other Stakeholders" : undefined}
            titleSize="sm"
            variant="transparent"
            padding="none"
            noMargin
          >
            <div className="grid grid-cols-1 gap-3">
              {otherContacts.map((contact, index) => (
                <ContactCard
                  key={contact.id || contact.email || index}
                  contact={contact}
                  detailed={detailed}
                  onClick={onContactClick ? () => onContactClick(contact) : undefined}
                />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Empty state */}
        {contacts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No contacts available</p>
          </div>
        )}
      </div>

      {/* Footer with navigation */}
      {(onBack || onContinue) && (
        <ArtifactFooter align="between">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium"
            >
              Continue
            </button>
          )}
        </ArtifactFooter>
      )}
    </ArtifactContainer>
  );
}

ContactsOverviewArtifact.displayName = 'ContactsOverviewArtifact';
export default ContactsOverviewArtifact;
