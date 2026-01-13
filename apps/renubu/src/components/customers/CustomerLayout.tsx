import React from 'react';

export default function CustomerLayout({
  company,
  usage,
  arr,
  renewalLikelihood,
  stage,
  action,
  icon: Icon,
  cardBg,
  cardBorder,
  iconColor,
  textColor,
  text2Color,
  buttonColor,
  buttonHover,
  ringColor,
  onNextCustomer,
  nextCustomerLabel,
  nextCustomerKey
}: {
  company: string;
  usage: string;
  arr: string;
  renewalLikelihood: string;
  stage: string;
  action: string;
  icon: React.ElementType;
  cardBg: string;
  cardBorder: string;
  iconColor: string;
  textColor: string;
  text2Color: string;
  buttonColor: string;
  buttonHover: string;
  ringColor: string;
  onNextCustomer: (key: string) => void;
  nextCustomerLabel: string;
  nextCustomerKey: string;
}) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{company} Renewal</h1>
      <div className="mb-6 space-y-2">
        <div className="text-gray-700">Usage: <span className="font-semibold">{usage}</span></div>
        <div className="text-gray-700">ARR: <span className="font-semibold">{arr}</span></div>
        <div className="text-gray-700">Renewal Likelihood: <span className="font-semibold">{renewalLikelihood}</span></div>
        <div className="text-gray-700">Stage: <span className="font-semibold">{stage}</span></div>
      </div>
      <div className={`rounded-xl p-4 flex items-center gap-4 shadow-sm border ${cardBg} ${cardBorder}`}>
        <Icon className={`h-7 w-7 ${iconColor}`} aria-hidden="true" />
        <div className="flex-1">
          <div className={`text-sm font-semibold ${textColor}`}>Recommended Action</div>
          <div className={`text-sm ${text2Color} mb-2`}>{action}</div>
          <button
            className={`${buttonColor} text-white px-4 py-2 rounded-lg font-bold text-sm hover:${buttonHover} focus:outline-none focus:ring-2 focus:ring-${ringColor}`}
            tabIndex={0}
            aria-label={`Go to next customer`}
            onClick={() => {
              console.log('DEBUG: Next customer button clicked', nextCustomerKey);
              onNextCustomer(nextCustomerKey);
            }}
          >
            Go to next customer – {nextCustomerLabel}
          </button>
        </div>
      </div>
    </div>
  );
} 