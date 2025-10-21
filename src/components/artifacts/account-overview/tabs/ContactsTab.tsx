import React, { useState } from 'react';
import { ContactsTabProps } from '../types';
import { ContactCard } from '../components/ContactCard';
import { ReviewCheckbox } from '../components/ReviewCheckbox';
import { useContactManagement } from '../hooks/useContactManagement';
import ContactEditModal from '../../ContactEditModal';

/**
 * ContactsTab - Standalone component for displaying and managing contacts
 *
 * Can be used independently or within the AccountOverview tab container.
 * Displays stakeholder contacts with confirmation and edit capabilities.
 */
export function ContactsTab({
  contacts,
  customerName,
  onReview,
  onContactConfirm,
  onContactEdit,
  onContactUpdate
}: ContactsTabProps) {
  const [contactsReviewed, setContactsReviewed] = useState(false);

  const {
    localContacts,
    editingContact,
    isEditModalOpen,
    handleContactConfirm,
    handleContactEditClick,
    handleContactUpdate,
    closeEditModal
  } = useContactManagement(contacts, onContactConfirm, onContactEdit, onContactUpdate);

  const handleReviewChange = (reviewed: boolean) => {
    setContactsReviewed(reviewed);
    onReview?.(reviewed);
  };

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-gray-600 mb-4">
        Confirm your key stakeholders for this account. These contacts will be included in your strategic plan.
      </p>

      <div className="space-y-3">
        {localContacts.map((contact, index) => (
          <ContactCard
            key={index}
            contact={contact}
            onConfirm={handleContactConfirm}
            onEdit={handleContactEditClick}
          />
        ))}
      </div>

      {/* Confirmation Call-to-Action */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-1">
          ✓ Confirm Your Stakeholder Strategy
        </p>
        <p className="text-sm text-blue-700">
          Make sure these are the right contacts for your plan. You can confirm or update each person above.
        </p>
      </div>

      {/* Review Checkbox */}
      <ReviewCheckbox
        label="I have reviewed the Contacts"
        checked={contactsReviewed}
        onChange={handleReviewChange}
      />

      {/* Contact Edit Modal */}
      {editingContact && (
        <ContactEditModal
          isOpen={isEditModalOpen}
          currentContact={editingContact}
          onClose={closeEditModal}
          onUpdate={handleContactUpdate}
        />
      )}
    </div>
  );
}
