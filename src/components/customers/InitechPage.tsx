import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import CustomerLayout from './CustomerLayout';

export default function InitechPage({ onNextCustomer }: { onNextCustomer: (key: string) => void }) {
  return (
    <CustomerLayout
      company="Initech"
      usage="78%"
      arr="$320k"
      renewalLikelihood="Medium"
      stage="Outreach"
      action="Notify the Customer"
      icon={PaperAirplaneIcon}
      cardBg="bg-yellow-50"
      cardBorder="border-yellow-200"
      iconColor="text-yellow-600"
      textColor="text-yellow-800"
      text2Color="text-yellow-700"
      buttonColor="bg-yellow-600"
      buttonHover="bg-yellow-700"
      ringColor="yellow-500"
      onNextCustomer={onNextCustomer}
      nextCustomerLabel="Acme"
      nextCustomerKey="acme"
    />
  );
} 