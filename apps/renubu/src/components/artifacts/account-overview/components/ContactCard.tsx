import React from 'react';
import { CheckCircle, Edit2 } from 'lucide-react';
import { Contact } from '../types';
import { getContactTypeConfig } from '../utils/config';

interface ContactCardProps {
  contact: Contact;
  onConfirm?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
}

/**
 * Individual contact card component
 *
 * Displays contact information with type badge and confirmation/edit actions
 */
export function ContactCard({ contact, onConfirm, onEdit }: ContactCardProps) {
  const typeConfig = getContactTypeConfig(contact.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={`border-2 ${typeConfig.borderColor} ${typeConfig.bgColor} rounded-lg p-4 transition-colors`}
    >
      {/* Contact Type Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${typeConfig.bgColor} border ${typeConfig.borderColor}`}>
          <TypeIcon className={`w-4 h-4 ${typeConfig.iconColor}`} />
          <span className={`text-xs font-medium ${typeConfig.textColor}`}>{typeConfig.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {contact.confirmed ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle className="w-4 h-4" />
              Confirmed
            </span>
          ) : (
            onConfirm && (
              <button
                onClick={() => onConfirm(contact)}
                className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 font-medium"
              >
                Confirm
              </button>
            )
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(contact)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title="Edit contact"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">{contact.name}</h4>
        <p className="text-sm text-gray-600 mt-0.5">{contact.role}</p>
        {contact.email && (
          <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
        )}
      </div>
    </div>
  );
}
