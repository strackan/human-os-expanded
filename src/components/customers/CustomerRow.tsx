import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WrenchIcon, BoltIcon } from '@heroicons/react/24/outline';
import { CustomerWithContact, Customer } from '../../types/customer';
import EditableCell from '../common/EditableCell';
import { URL_PATTERNS } from '../../lib/constants';

interface CustomerRowProps {
  customer: CustomerWithContact;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (customerId: string, selected: boolean) => void;
  onUpdate: (customerId: string, field: keyof Customer, value: string | number) => Promise<void>;
}

/**
 * CustomerRow Component
 *
 * Individual customer table row with:
 * - Selection checkbox
 * - Editable cells (industry, health score, ARR, renewal date)
 * - Action buttons (manage, trigger webhook)
 * - Color-coded health score
 */
export const CustomerRow: React.FC<CustomerRowProps> = ({
  customer,
  isSelected,
  isHighlighted,
  onSelect,
  onUpdate
}) => {
  const router = useRouter();
  const [triggeringWebhook, setTriggeringWebhook] = useState(false);

  const handleView = () => {
    router.push(URL_PATTERNS.VIEW_CUSTOMER(customer.id));
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const validateHealthScore = (value: string | number): boolean => {
    const numValue = Number(value);
    return numValue >= 0 && numValue <= 100;
  };

  const validateARR = (value: string | number): boolean => {
    const numValue = Number(value);
    return numValue >= 0;
  };

  const handleTriggerWebhook = async () => {
    if (!customer.renewal_date) {
      alert('Customer must have a renewal date to trigger webhook');
      return;
    }

    setTriggeringWebhook(true);

    try {
      const response = await fetch(`/api/automations/trigger-webhook/${customer.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Webhook triggered successfully for ${customer.name}!\n\nUrgency: ${result.payload.urgency_label}\nDays until renewal: ${result.payload.days_until_renewal}`);
      } else {
        alert(`❌ Failed to trigger webhook for ${customer.name}:\n${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error triggering webhook:', error);
      alert(`❌ Failed to trigger webhook for ${customer.name}:\nNetwork error`);
    } finally {
      setTriggeringWebhook(false);
    }
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors duration-300 ${
      isSelected ? 'bg-blue-50' :
      isHighlighted ? 'bg-green-100 animate-pulse' : ''
    }`}>
      <td className="relative w-12 px-6 sm:w-16 sm:px-8">
        <input
          type="checkbox"
          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
          checked={isSelected}
          onChange={(e) => onSelect(customer.id, e.target.checked)}
        />
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <button
          onClick={handleView}
          className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 font-medium"
          aria-label={`View ${customer.name} details`}
        >
          {customer.name}
        </button>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
        <EditableCell
          value={customer.industry}
          onSave={(newValue) => onUpdate(customer.id, 'industry', newValue)}
          type="text"
          placeholder="Enter industry"
        />
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex justify-center">
          <EditableCell
            value={customer.health_score}
            onSave={(newValue) => onUpdate(customer.id, 'health_score', newValue)}
            type="number"
            placeholder="0-100"
            validateValue={validateHealthScore}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(customer.health_score)}`}
            displayFormat={(value) => `${value}/100`}
          />
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
        <EditableCell
          value={customer.current_arr || 0}
          onSave={(newValue) => onUpdate(customer.id, 'current_arr', newValue)}
          type="number"
          placeholder="Enter ARR"
          validateValue={validateARR}
          displayFormat={(value) => `$${Number(value).toLocaleString()}`}
        />
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
        <EditableCell
          value={customer.renewal_date || ''}
          onSave={(newValue) => onUpdate(customer.id, 'renewal_date', newValue)}
          type="date"
          placeholder="Select date"
          displayFormat={(value) => value ? new Date(value).toLocaleDateString() : 'Not set'}
        />
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
        {customer.primary_contact
          ? `${customer.primary_contact.first_name} ${customer.primary_contact.last_name}`
          : 'No contact'
        }
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/customers/${customer.id}/manage`)}
            className="text-gray-600 hover:text-gray-900"
            aria-label={`Manage ${customer.name}`}
          >
            <WrenchIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleTriggerWebhook}
            disabled={triggeringWebhook || !customer.renewal_date}
            className={`${
              customer.renewal_date
                ? 'text-blue-600 hover:text-blue-900'
                : 'text-gray-400 cursor-not-allowed'
            } ${triggeringWebhook ? 'animate-spin' : ''}`}
            aria-label={`Trigger webhook for ${customer.name}`}
            title={customer.renewal_date ? 'Send to Active Pieces' : 'Requires renewal date'}
          >
            <BoltIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
