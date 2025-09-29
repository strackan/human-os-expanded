"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Customer, CustomerWithContact } from "../../types/customer";
import { CustomerService } from "../../lib/services/CustomerService";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: CustomerWithContact | null;
  mode: 'add' | 'edit';
}

interface CustomerFormData {
  name: string;
  domain: string;
  industry: string;
  health_score: number;
  current_arr: string;
  renewal_date: string;
  assigned_to: string;
  primary_contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    title: string;
  };
}

export default function CustomerModal({ isOpen, onClose, onSave, customer, mode }: CustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    domain: '',
    industry: '',
    health_score: 50,
    current_arr: '',
    renewal_date: '',
    assigned_to: '',
    primary_contact: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && customer) {
        setFormData({
          name: customer.name || '',
          domain: customer.domain || '',
          industry: customer.industry || '',
          health_score: customer.health_score || 50,
          current_arr: customer.current_arr?.toString() || '',
          renewal_date: customer.renewal_date || '',
          assigned_to: customer.assigned_to || '',
          primary_contact: {
            first_name: customer.primary_contact?.first_name || '',
            last_name: customer.primary_contact?.last_name || '',
            email: customer.primary_contact?.email || '',
            phone: customer.primary_contact?.phone || '',
            title: customer.primary_contact?.title || ''
          }
        });
      } else {
        // Reset to empty form for add mode
        setFormData({
          name: '',
          domain: '',
          industry: '',
          health_score: 50,
          current_arr: '',
          renewal_date: '',
          assigned_to: '',
          primary_contact: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            title: ''
          }
        });
      }
      setError(null);
      setValidationErrors({});
    }
  }, [isOpen, customer, mode]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }

    if (formData.current_arr && isNaN(Number(formData.current_arr))) {
      errors.current_arr = 'Current ARR must be a valid number';
    }

    if (formData.health_score < 0 || formData.health_score > 100) {
      errors.health_score = 'Health score must be between 0 and 100';
    }

    if (formData.primary_contact.email && !/\S+@\S+\.\S+/.test(formData.primary_contact.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const customerData = {
        name: formData.name.trim(),
        domain: formData.domain.trim(),
        industry: formData.industry.trim(),
        health_score: formData.health_score,
        current_arr: formData.current_arr ? parseFloat(formData.current_arr) : 0,
        renewal_date: formData.renewal_date || null,
        assigned_to: formData.assigned_to || null
      };

      let savedCustomer: Customer;

      if (mode === 'edit' && customer) {
        savedCustomer = await CustomerService.updateCustomer(customer.id, customerData);
      } else {
        savedCustomer = await CustomerService.createCustomer(customerData);
      }

      onSave(savedCustomer);
      onClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleContactChange = (field: keyof CustomerFormData['primary_contact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      primary_contact: {
        ...prev.primary_contact,
        [field]: value
      }
    }));

    // Clear validation error for email if applicable
    if (field === 'email' && validationErrors.email) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-6">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel - 80% of screen size */}
        <div className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full h-full max-w-[80vw] max-h-[80vh] flex flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {mode === 'edit' ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter company name"
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Health Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.health_score}
                      onChange={(e) => handleInputChange('health_score', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.health_score ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.health_score && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.health_score}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current ARR ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.current_arr}
                      onChange={(e) => handleInputChange('current_arr', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.current_arr ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {validationErrors.current_arr && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.current_arr}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Renewal Date
                    </label>
                    <input
                      type="date"
                      value={formData.renewal_date}
                      onChange={(e) => handleInputChange('renewal_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Contact Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Primary Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact.first_name}
                      onChange={(e) => handleContactChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact.last_name}
                      onChange={(e) => handleContactChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.primary_contact.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="john.doe@company.com"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.primary_contact.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact.title}
                      onChange={(e) => handleContactChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Chief Technology Officer"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          {/* Fixed Footer */}
          <div className="flex-shrink-0 bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                mode === 'edit' ? 'Update Customer' : 'Create Customer'
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
