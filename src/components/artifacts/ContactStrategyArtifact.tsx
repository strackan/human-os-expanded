"use client";

import React, { useState } from 'react';
import { User, Mail, Edit2, UserX, RefreshCw, Check, Building, Briefcase, Code, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  type: 'business' | 'executive' | 'technical';
  lastMeeting: string;
  meetingStatus: 'recent' | 'overdue' | 'none';
  strategy: string;
  updates?: string;
}

export interface ContactStrategyProps {
  title?: string;
  subtitle?: string;
  contacts: Contact[];
  onContactUpdate?: (contactId: string, contact: Contact) => void;
  onContactRemove?: (contactId: string) => void;
  onContactReplace?: (contactId: string, newContact: Contact) => void;
  onAcceptStrategy?: () => void;
  onNewStrategy?: () => void;
  showActions?: boolean;
  isLoading?: boolean;
}

const ContactStrategyArtifact: React.FC<ContactStrategyProps> = React.memo(({
  title = "Contact Strategy Review",
  subtitle = "Review and update your primary contacts for this account",
  contacts: initialContacts = [],
  onContactUpdate,
  onContactRemove,
  onContactReplace,
  onAcceptStrategy,
  onNewStrategy,
  showActions = true,
  isLoading = false
}) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Contact | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateContact = (contact: Contact): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!contact.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!contact.role.trim()) {
      errors.role = 'Role is required';
    }

    if (!contact.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(contact.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return errors;
  };

  const getContactTypeConfig = (type: Contact['type']) => {
    switch (type) {
      case 'executive':
        return {
          icon: Briefcase,
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-300',
          textColor: 'text-purple-900',
          iconColor: 'text-purple-600',
          label: 'Executive Contact'
        };
      case 'business':
        return {
          icon: Building,
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          label: 'Business Contact'
        };
      case 'technical':
        return {
          icon: Code,
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          label: 'Technical Contact'
        };
    }
  };

  const getMeetingStatusConfig = (status: Contact['meetingStatus']) => {
    switch (status) {
      case 'recent':
        return {
          icon: Check,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Recent meeting'
        };
      case 'overdue':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          label: 'Meeting overdue'
        };
      case 'none':
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          label: 'No recent meeting'
        };
    }
  };

  const handleEditClick = (contact: Contact) => {
    setEditingId(contact.id);
    setEditForm({ ...contact });
  };

  const handleEditSave = () => {
    if (editForm) {
      const errors = validateContact(editForm);
      setValidationErrors(errors);

      if (Object.keys(errors).length === 0) {
        const updatedContacts = contacts.map(c =>
          c.id === editForm.id ? editForm : c
        );
        setContacts(updatedContacts);
        onContactUpdate?.(editForm.id, editForm);
        setEditingId(null);
        setEditForm(null);
        setValidationErrors({});
      }
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm(null);
    setValidationErrors({});
  };

  const handleRemoveContact = (contactId: string) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    setContacts(updatedContacts);
    onContactRemove?.(contactId);
  };

  const handleReplaceContact = (contactId: string) => {
    // In a real implementation, this would open a contact picker
    const newContact: Contact = {
      id: `new-${Date.now()}`,
      name: 'New Contact',
      role: 'Role',
      email: 'new@example.com',
      type: 'business',
      lastMeeting: 'Never',
      meetingStatus: 'none',
      strategy: 'To be defined',
      updates: 'Newly added contact'
    };

    const updatedContacts = contacts.map(c =>
      c.id === contactId ? newContact : c
    );
    setContacts(updatedContacts);
    onContactReplace?.(contactId, newContact);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300 px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-3" />
              <p className="text-gray-600">Loading contact strategy...</p>
            </div>
          </div>
        )}

        {/* Contact Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {contacts.map((contact) => {
            const typeConfig = getContactTypeConfig(contact.type);
            const meetingConfig = getMeetingStatusConfig(contact.meetingStatus);
            const isEditing = editingId === contact.id;
            const TypeIcon = typeConfig.icon;
            const MeetingIcon = meetingConfig.icon;

            return (
              <div
                key={contact.id}
                className={`border-2 ${typeConfig.borderColor} ${typeConfig.bgColor} rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
              >
                {/* Contact Type Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                    <TypeIcon size={14} className={typeConfig.iconColor} />
                    <span className="text-xs font-medium">{typeConfig.label}</span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEditClick(contact)}
                      className="p-1 hover:bg-white/50 rounded transition-colors"
                      title="Edit contact"
                    >
                      <Edit2 size={14} className="text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Contact Details */}
                {isEditing && editForm ? (
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Name"
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          validationErrors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Role"
                      />
                      {validationErrors.role && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.role}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Email"
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleEditSave}
                        className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Mail size={12} className="text-gray-500" />
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </div>

                    {/* Meeting Status */}
                    <div className={`flex items-center gap-2 px-2 py-1 rounded ${meetingConfig.bgColor} mb-3`}>
                      <MeetingIcon size={14} className={meetingConfig.color} />
                      <div className="text-xs">
                        <span className="font-medium">Last meeting:</span>
                        <span className="ml-1">{contact.lastMeeting}</span>
                      </div>
                    </div>

                    {/* Strategy Section */}
                    <div className="border-t border-gray-300 pt-3 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp size={14} className="text-indigo-600" />
                        <span className="text-xs font-semibold text-gray-700">Recommended Strategy</span>
                      </div>
                      <p className="text-xs text-gray-600">{contact.strategy}</p>
                      {contact.updates && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">{contact.updates}</p>
                      )}
                    </div>

                    {/* Contact Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReplaceContact(contact.id)}
                        className="flex-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
                        title="Switch contact"
                      >
                        <RefreshCw size={12} />
                        Switch
                      </button>
                      <button
                        onClick={() => handleRemoveContact(contact.id)}
                        className="flex-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
                        title="Remove contact"
                      >
                        <UserX size={12} />
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          </div>
        )}

        {/* Global Actions */}
        {showActions && !isLoading && (
          <>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-lg font-medium text-gray-900 mb-2">Ready to proceed with this contact strategy?</p>
              <p className="text-sm text-gray-600">
                You can accept the recommended strategy and reach out to these contacts, or request a new strategy.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={onAcceptStrategy}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                Accept Strategy & Reach Out
              </button>

              <button
                onClick={onNewStrategy}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Generate New Strategy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ContactStrategyArtifact.displayName = 'ContactStrategyArtifact';

export default ContactStrategyArtifact;