'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Calendar, DollarSign, User, Building, Palette } from 'lucide-react';

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
      tagline?: string;
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

interface ColorPreset {
  bg: string;
  text: string;
  name: string;
}

const colorPresets: ColorPreset[] = [
  { bg: '#EFF6FF', text: '#1E3A8A', name: 'Blue' },
  { bg: '#F0FDF4', text: '#14532D', name: 'Green' },
  { bg: '#FAF5FF', text: '#581C87', name: 'Purple' },
  { bg: '#F9FAFB', text: '#111827', name: 'Gray' },
  { bg: '#F0FDFA', text: '#134E4A', name: 'Teal' },
  { bg: '#FFF7ED', text: '#7C2D12', name: 'Orange' }
];

// Header color presets - vibrant colors for quote header
const headerColorPresets: ColorPreset[] = [
  { bg: '#2563EB', text: '#FFFFFF', name: 'Blue' },
  { bg: '#059669', text: '#FFFFFF', name: 'Green' },
  { bg: '#DC2626', text: '#FFFFFF', name: 'Red' },
  { bg: '#1F2937', text: '#FFFFFF', name: 'Black' },
  { bg: '#7C3AED', text: '#FFFFFF', name: 'Purple' },
  { bg: '#0891B2', text: '#FFFFFF', name: 'Cyan' },
  { bg: '#EA580C', text: '#FFFFFF', name: 'Orange' },
  { bg: '#4338CA', text: '#FFFFFF', name: 'Indigo' }
];

// Editable Text Component
interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
  multiline?: boolean;
}

function EditableText({ value, onChange, className = '', readOnly = false, multiline = false }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    if (readOnly) return;
    setIsEditing(true);
    setTimeout(() => {
      if (multiline) {
        textareaRef.current?.select();
      } else {
        inputRef.current?.select();
      }
    }, 0);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (readOnly) {
    return <span className={className}>{value}</span>;
  }

  return isEditing ? (
    multiline ? (
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-blue-50 border-2 border-blue-400 rounded px-2 py-1 w-full ${className}`}
        rows={2}
      />
    ) : (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-blue-50 border-2 border-blue-400 rounded px-2 py-1 ${className}`}
      />
    )
  ) : (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-text hover:border-b-2 hover:border-dotted hover:border-gray-400 transition-all ${className}`}
      title="Double-click to edit"
    >
      {value}
    </span>
  );
}

// Color Picker Popover Component
interface ColorPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (color: ColorPreset) => void;
  position: { top: number; left: number };
  colors?: ColorPreset[];
}

function ColorPickerPopover({ isOpen, onClose, onSelectColor, position, colors = colorPresets }: ColorPickerPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3"
      style={{ top: position.top, left: position.left }}
    >
      <p className="text-xs text-gray-500 mb-2 font-medium">Choose Color</p>
      <div className="grid grid-cols-4 gap-2">
        {colors.map(color => (
          <button
            key={color.name}
            onClick={() => {
              onSelectColor(color);
              onClose();
            }}
            className="group relative w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
            style={{ backgroundColor: color.bg }}
            title={color.name}
          >
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: color.text }}
            >
              Aa
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const QuoteArtifact: React.FC<QuoteArtifactProps> = ({
  data = {},
  readOnly = false,
  onFieldChange
}) => {
  // State for editable content
  const [quoteData, setQuoteData] = useState({
    quoteNumber: data.quoteNumber || 'Q-2025-0924',
    quoteDate: data.quoteDate || new Date().toLocaleDateString(),
    customerName: data.customerName || 'Customer Name',
    companyName: data.companyInfo?.name || 'Renubu',
    companyTagline: data.companyInfo?.tagline || 'Enterprise Software Solutions',
  });

  const [lineItems, setLineItems] = useState(
    data.lineItems && data.lineItems.length > 0
      ? data.lineItems
      : [{
          product: 'Renubu Platform License',
          description: 'AI-powered customer success automation',
          period: '12 months',
          rate: 3996,
          quantity: 50
        }]
  );

  // State for styling
  const [quoteHeaderStyle, setQuoteHeaderStyle] = useState<ColorPreset>({ bg: '#2563EB', text: '#FFFFFF', name: 'Blue' });
  const [headerStyle, setHeaderStyle] = useState<ColorPreset>({ bg: '#F9FAFB', text: '#6B7280', name: 'Gray' });
  const [lineItemStyle, setLineItemStyle] = useState<ColorPreset>({ bg: '#FFFFFF', text: '#111827', name: 'White' });
  const [showQuoteHeaderPicker, setShowQuoteHeaderPicker] = useState(false);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);
  const [showLineItemPicker, setShowLineItemPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  const quoteHeaderRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const lineItemRef = useRef<HTMLTableRowElement>(null);

  const {
    customerContact = {},
    customerAddress = {},
    companyInfo = {},
    summary = {},
    terms = [],
    effectiveDate,
    notes
  } = data;

  // Auto-calculate totals
  const calculateLineTotal = (rate: number, quantity: number) => rate * quantity;
  const subtotal = data.summary?.subtotal || lineItems.reduce((sum, item) => sum + ((item.rate || 0) * (item.quantity || 0)), 0);
  const increasePercentage = data.summary?.increase?.percentage || 0;
  const increaseAmount = data.summary?.increase?.amount || 0;
  const total = data.summary?.total || subtotal;

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const updateField = (field: string, value: any) => {
    setQuoteData(prev => ({ ...prev, [field]: value }));
    onFieldChange?.(field, value);
  };

  const handleQuoteHeaderClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    const rect = quoteHeaderRef.current?.getBoundingClientRect();
    if (rect) {
      setPickerPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowQuoteHeaderPicker(true);
    }
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    const rect = headerRef.current?.getBoundingClientRect();
    if (rect) {
      // Get the parent scrollable container
      const scrollContainer = headerRef.current?.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;

      setPickerPosition({
        top: rect.top + scrollTop, // Align with top of header
        left: rect.right + 10 // Position to the right of the header
      });
      setShowHeaderPicker(true);
    }
  };

  const handleLineItemClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    const rect = lineItemRef.current?.getBoundingClientRect();
    if (rect) {
      setPickerPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowLineItemPicker(true);
    }
  };

  return (
    <div className="bg-white h-full flex flex-col rounded-lg border border-gray-200 shadow-sm">
      {/* Quote Header */}
      <div
        ref={quoteHeaderRef}
        onClick={handleQuoteHeaderClick}
        className={`flex-shrink-0 text-white p-6 relative group ${!readOnly ? 'cursor-pointer' : ''}`}
        style={{ backgroundColor: quoteHeaderStyle.bg, color: quoteHeaderStyle.text }}
      >
        {!readOnly && (
          <Palette className="w-4 h-4 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">R</span>
              </div>
              <EditableText
                value={quoteData.companyName}
                onChange={(val) => updateField('companyName', val)}
                className="text-2xl font-bold"
                readOnly={readOnly}
              />
            </div>
            <EditableText
              value={quoteData.companyTagline}
              onChange={(val) => updateField('companyTagline', val)}
              className="text-sm opacity-80"
              readOnly={readOnly}
            />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold mb-1">RENEWAL QUOTE</h1>
            <p className="text-sm opacity-80">{quoteData.quoteNumber}</p>
            <p className="text-xs mt-1 opacity-80">{quoteData.quoteDate}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
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
              <p className="font-medium text-gray-900">{companyInfo.name || 'Renubu Technologies Inc.'}</p>
              <p className="text-gray-700">{companyInfo.address?.street || '1247 Innovation Drive, Suite 400'}</p>
              <p className="text-gray-700">{companyInfo.address?.city || 'San Francisco'}, {companyInfo.address?.state || 'CA'} {companyInfo.address?.zip || '94105'}</p>
              <p className="text-gray-700">Email: {companyInfo.email || 'renewals@renubu.com'}</p>
            </div>
          </div>

          {/* To Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4" />
              To
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">
                {customerContact.name || 'Customer Contact'}
                {customerContact.title && `, ${customerContact.title}`}
              </p>
              <p className="text-gray-700">{customerAddress.company || quoteData.customerName}</p>
              {customerAddress.street && <p className="text-gray-700">{customerAddress.street}</p>}
              {(customerAddress.city || customerAddress.state || customerAddress.zip) && (
                <p className="text-gray-700">
                  {customerAddress.city}, {customerAddress.state} {customerAddress.zip}
                </p>
              )}
              {customerContact.email && <p className="text-gray-700">Email: {customerContact.email}</p>}
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

        <div className="overflow-hidden rounded-lg border border-gray-200 relative">
          <table className="w-full">
            <thead
              ref={headerRef}
              className="group relative cursor-pointer transition-all"
              style={{ backgroundColor: headerStyle.bg }}
              onClick={handleHeaderClick}
            >
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: headerStyle.text }}>
                  Product
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: headerStyle.text }}>
                  Period
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: headerStyle.text }}>
                  Rate
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider relative" style={{ color: headerStyle.text }}>
                  Total
                  {!readOnly && (
                    <Palette className="w-3 h-3 absolute top-3 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item, index) => (
                <tr
                  key={index}
                  ref={index === 0 ? lineItemRef : undefined}
                  className="group cursor-pointer transition-all"
                  style={{ backgroundColor: lineItemStyle.bg }}
                  onClick={index === 0 ? handleLineItemClick : undefined}
                >
                  <td className="px-4 py-3 relative">
                    <div>
                      <div className="mb-1">
                        <EditableText
                          value={item.product || ''}
                          onChange={(val) => {
                            const newItems = [...lineItems];
                            newItems[index].product = val;
                            setLineItems(newItems);
                          }}
                          className="text-gray-900 font-semibold"
                          readOnly={readOnly}
                        />
                      </div>
                      <EditableText
                        value={item.description || ''}
                        onChange={(val) => {
                          const newItems = [...lineItems];
                          newItems[index].description = val;
                          setLineItems(newItems);
                        }}
                        className="text-sm text-gray-600"
                        readOnly={readOnly}
                      />
                    </div>
                    {!readOnly && index === 0 && (
                      <Palette className="w-3 h-3 absolute top-3 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm" style={{ color: lineItemStyle.text }}>
                    <EditableText
                      value={item.period || ''}
                      onChange={(val) => {
                        const newItems = [...lineItems];
                        newItems[index].period = val;
                        setLineItems(newItems);
                      }}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: lineItemStyle.text }}>
                    <EditableText
                      value={formatCurrency(item.rate)}
                      onChange={(val) => {
                        const num = parseFloat(val.replace(/[$,]/g, ''));
                        if (!isNaN(num)) {
                          const newItems = [...lineItems];
                          newItems[index].rate = num;
                          setLineItems(newItems);
                        }
                      }}
                      readOnly={readOnly}
                    />
                    <span className="text-gray-500">/seat</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: lineItemStyle.text }}>
                    {formatCurrency(calculateLineTotal(item.rate || 0, item.quantity || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Color Pickers */}
        <ColorPickerPopover
          isOpen={showQuoteHeaderPicker}
          onClose={() => setShowQuoteHeaderPicker(false)}
          onSelectColor={setQuoteHeaderStyle}
          position={pickerPosition}
          colors={headerColorPresets}
        />
        <ColorPickerPopover
          isOpen={showHeaderPicker}
          onClose={() => setShowHeaderPicker(false)}
          onSelectColor={setHeaderStyle}
          position={pickerPosition}
        />
        <ColorPickerPopover
          isOpen={showLineItemPicker}
          onClose={() => setShowLineItemPicker(false)}
          onSelectColor={setLineItemStyle}
          position={pickerPosition}
        />

        {/* Totals Section */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-80">
            <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Year Total:</span>
                  <span className="text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {summary.increase && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {summary.increase.description || `${summary.increase.percentage}% Annual Increase:`}
                    </span>
                    <span className="text-gray-900">
                      {formatCurrency(increaseAmount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Renewal Total:</span>
                    <span className="text-blue-600">
                      {formatCurrency(total)}
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
                <p>• Renewal effective March 15, 2026</p>
                <p>• 8% annual increase based on market adjustment</p>
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
            Thank you for your continued partnership with Renubu. We look forward to supporting {quoteData.customerName}'s continued success.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default QuoteArtifact;
