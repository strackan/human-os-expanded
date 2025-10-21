import { useState, useCallback } from 'react';
import { Contact } from '../types';

/**
 * Custom hook for managing contact state and operations
 *
 * Handles:
 * - Local contact list state
 * - Contact confirmation
 * - Contact editing modal
 * - Contact updates
 */
export function useContactManagement(
  initialContacts: Contact[],
  onContactConfirm?: (contact: Contact) => void,
  onContactEdit?: (contact: Contact) => void,
  onContactUpdate?: (oldContact: Contact, newContact: Contact, context: { davidRole: string; newContactRole: string }) => void
) {
  const [localContacts, setLocalContacts] = useState<Contact[]>(initialContacts);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleContactConfirm = useCallback((contact: Contact) => {
    const updatedContacts = localContacts.map(c =>
      c.email === contact.email ? { ...c, confirmed: true } : c
    );
    setLocalContacts(updatedContacts);
    onContactConfirm?.(contact);
  }, [localContacts, onContactConfirm]);

  const handleContactEditClick = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
    onContactEdit?.(contact);
  }, [onContactEdit]);

  const handleContactUpdate = useCallback((
    newContact: Contact,
    context: { davidRole: string; newContactRole: string }
  ) => {
    if (editingContact) {
      // Update local contacts list
      const updatedContacts = localContacts.map(c =>
        c.email === editingContact.email ? { ...newContact, confirmed: false } : c
      );
      setLocalContacts(updatedContacts);

      // Notify parent component
      onContactUpdate?.(editingContact, newContact, context);

      // Close modal
      setIsEditModalOpen(false);
      setEditingContact(null);
    }
  }, [editingContact, localContacts, onContactUpdate]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingContact(null);
  }, []);

  return {
    localContacts,
    editingContact,
    isEditModalOpen,
    handleContactConfirm,
    handleContactEditClick,
    handleContactUpdate,
    closeEditModal
  };
}
