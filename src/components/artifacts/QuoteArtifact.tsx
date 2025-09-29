import React from 'react';
import { FileText, Calendar, DollarSign, User, Building } from 'lucide-react';

interface QuoteArtifactProps {
  data?: {
    quoteNumber?: string;
    quoteDate?: string;
    customerName?: string;
    customerContact?: {
      name?: string;
      title?: string;
      email?: string;
    };
    customerAddress?: {
      company?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    companyInfo?: {
      name?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
      };
      email?: string;
    };
    lineItems?: Array<{
      id?: string;
      product?: string;
      description?: string;
      period?: string;
      rate?: number;
      quantity?: number;
      total?: number;
    }>;
    summary?: {
      subtotal?: number;
      increase?: {
        percentage?: number;
        amount?: number;
        description?: string;
      };
      total?: number;
    };
    terms?: string[];
    effectiveDate?: string;
    notes?: string;
  };
  readOnly?: boolean;
  onFieldChange?: (field: string, value: any) => void;
}

const QuoteArtifact: React.FC<QuoteArtifactProps> = ({
  data = {},
  readOnly = false,
  onFieldChange
}) => {
  const {
    quoteNumber = 'Q-2025-0924',
    quoteDate = new Date().toLocaleDateString(),
    customerName = 'Customer Name',
    customerContact = {},
    customerAddress = {},
    companyInfo = {},
    lineItems = [],
    summary = {},
    terms = [],
    effectiveDate,
    notes
  } = data;

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
      {/* Quote Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">R</span>
              </div>
              <span className="text-2xl font-bold">Renubu</span>
            </div>
            <p className="text-blue-100 text-sm">Enterprise Software Solutions</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold mb-1">RENEWAL QUOTE</h1>
            <p className="text-blue-100 text-sm">{quoteNumber}</p>
            <p className="text-blue-100 text-xs mt-1">{quoteDate}</p>
          </div>
        </div>
      </div>

      {/* Company and Customer Details */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* From Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <Building className="w-4 h-4" />
              From
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{companyInfo.name || 'Renubu Technologies Inc.'}</p>
              <p>{companyInfo.address?.street || '1247 Innovation Drive, Suite 400'}</p>
              <p>{companyInfo.address?.city || 'San Francisco'}, {companyInfo.address?.state || 'CA'} {companyInfo.address?.zip || '94105'}</p>
              <p>Email: {companyInfo.email || 'renewals@renubu.com'}</p>
            </div>
          </div>

          {/* To Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4" />
              To
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {customerContact.name || 'Customer Contact'}
                {customerContact.title && `, ${customerContact.title}`}
              </p>
              <p>{customerAddress.company || customerName}</p>
              {customerAddress.street && <p>{customerAddress.street}</p>}
              {(customerAddress.city || customerAddress.state || customerAddress.zip) && (
                <p>
                  {customerAddress.city}, {customerAddress.state} {customerAddress.zip}
                </p>
              )}
              {customerContact.email && <p>Email: {customerContact.email}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Renewal Details
        </h3>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.length > 0 ? (
                lineItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.product}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {item.period}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {item.rate ? formatCurrency(item.rate) : ''}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-gray-500">/{item.quantity > 1 ? 'unit' : 'license'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.total || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">Renubu Platform License</p>
                      <p className="text-sm text-gray-500">Healthcare workflow optimization platform</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">12 months</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">$150.00/license</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">$124,500.00</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-80">
            <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Year Total:</span>
                  <span className="text-gray-900">
                    {formatCurrency(summary.subtotal || 124500)}
                  </span>
                </div>
                {summary.increase && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {summary.increase.description || `${summary.increase.percentage}% Annual Increase:`}
                    </span>
                    <span className="text-gray-900">
                      {formatCurrency(summary.increase.amount || 2490)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Renewal Total:</span>
                    <span className="text-blue-600">
                      {formatCurrency(summary.total || 126990)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {(terms.length > 0 || effectiveDate) && (
        <div className="px-6 pb-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Terms & Conditions
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            {effectiveDate && (
              <p>• Renewal effective {effectiveDate}</p>
            )}
            {terms.length > 0 ? (
              terms.map((term, index) => (
                <p key={index}>• {term}</p>
              ))
            ) : (
              <>
                <p>• Renewal effective January 18, 2026</p>
                <p>• 2% annual increase per contract terms (Section 4.2)</p>
                <p>• Payment due within 30 days of renewal date</p>
                <p>• This renewal is bound by the existing License Agreement</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 mb-4">Please sign and return this quote to proceed:</p>
            <div className="border-b border-gray-400 w-64 mb-2"></div>
            <p className="text-xs text-gray-500">Customer Signature</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-4">Date:</p>
            <div className="border-b border-gray-400 w-32 mb-2"></div>
            <p className="text-xs text-gray-500">Date</p>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">{notes}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Thank you for your continued partnership with Renubu. We look forward to supporting {customerName}'s continued success.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuoteArtifact;