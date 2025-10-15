'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, User } from 'lucide-react';

interface Contact {
  name: string;
  role: string;
  email?: string;
  type: 'executive' | 'champion' | 'business';
}

interface ContactEditModalProps {
  isOpen: boolean;
  currentContact: Contact;
  onClose: () => void;
  onUpdate: (newContact: Contact, context: { davidRole: string; newContactRole: string }) => void;
}

// Mock contact database for autocomplete
const AVAILABLE_CONTACTS: Contact[] = [
  { name: 'Sarah Chen', role: 'VP of Engineering', email: 'sarah.chen@company.com', type: 'executive' },
  { name: 'Michael Torres', role: 'CTO', email: 'michael.torres@company.com', type: 'executive' },
  { name: 'Emily Rodriguez', role: 'Director of Product', email: 'emily.rodriguez@company.com', type: 'champion' },
  { name: 'James Wilson', role: 'Senior Engineering Manager', email: 'james.wilson@company.com', type: 'champion' },
  { name: 'Lisa Anderson', role: 'Head of Operations', email: 'lisa.anderson@company.com', type: 'executive' },
  { name: 'Robert Kim', role: 'Product Manager', email: 'robert.kim@company.com', type: 'business' },
  { name: 'Jennifer Martinez', role: 'Technical Lead', email: 'jennifer.martinez@company.com', type: 'business' },
  { name: 'David Lee', role: 'VP of Sales', email: 'david.lee@company.com', type: 'executive' },
  { name: 'Amanda Thompson', role: 'Customer Success Manager', email: 'amanda.thompson@company.com', type: 'champion' },
  { name: 'Chris Brown', role: 'Software Architect', email: 'chris.brown@company.com', type: 'business' }
];

export default function ContactEditModal({
  isOpen,
  currentContact,
  onClose,
  onUpdate
}: ContactEditModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [davidRole, setDavidRole] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter contacts based on search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const filtered = AVAILABLE_CONTACTS.filter(contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.role.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to top 5 results
        setFilteredContacts(filtered);
        setShowDropdown(true);
      } else {
        setFilteredContacts([]);
        setShowDropdown(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFilteredContacts([]);
      setSelectedContact(null);
      setShowConfirmation(false);
      setDavidRole('');
      setNewContactRole('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setSearchQuery(contact.name);
    setShowDropdown(false);
    setShowConfirmation(true);
  };

  const handleUpdate = () => {
    if (selectedContact && davidRole.trim() && newContactRole.trim()) {
      onUpdate(selectedContact, {
        davidRole: davidRole.trim(),
        newContactRole: newContactRole.trim()
      });
      onClose();
    }
  };

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
      setSelectedContact(null);
      setSearchQuery('');
      setDavidRole('');
      setNewContactRole('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Contact: {currentContact.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {!showConfirmation ? (
            <>
              {/* Search Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for new contact
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (filteredContacts.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    placeholder="Type name or role..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Dropdown */}
                {showDropdown && filteredContacts.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 mt-1 w-full max-w-[calc(100%-3rem)] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredContacts.map((contact, index) => (
                      <button
                        key={index}
                        onClick={() => handleContactSelect(contact)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {contact.role}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim().length > 0 && filteredContacts.length === 0 && !showDropdown && (
                  <p className="mt-2 text-sm text-gray-500">No contacts found matching "{searchQuery}"</p>
                )}
              </div>

              {/* Current Contact Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Current Contact</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{currentContact.name}</p>
                    <p className="text-xs text-gray-600">{currentContact.role}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Section */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Update Contact: {currentContact.name} → {selectedContact?.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    Please provide context for this change:
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Will {currentContact.name.split(' ')[0]} still play a role in the account?
                  </label>
                  <textarea
                    value={davidRole}
                    onChange={(e) => setDavidRole(e.target.value)}
                    placeholder="e.g., 'Yes, David will transition to an advisory role' or 'No, David is moving to a different department'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What role will {selectedContact?.name.split(' ')[0]} play?
                  </label>
                  <textarea
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value)}
                    placeholder="e.g., 'Primary technical contact for renewal discussions' or 'Will be the main decision-maker going forward'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Selected Contact Preview */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 uppercase tracking-wide mb-2">New Contact</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900">{selectedContact?.name}</p>
                      <p className="text-xs text-green-700">{selectedContact?.role}</p>
                      {selectedContact?.email && (
                        <p className="text-xs text-green-600">{selectedContact.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            {showConfirmation ? 'Back' : 'Cancel'}
          </button>
          {showConfirmation && (
            <button
              onClick={handleUpdate}
              disabled={!davidRole.trim() || !newContactRole.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Update Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
