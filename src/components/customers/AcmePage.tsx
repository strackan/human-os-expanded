import { HandRaisedIcon } from '@heroicons/react/24/outline';
import CustomerLayout from './CustomerLayout';

export default function AcmePage({ onNextCustomer }: { onNextCustomer: (key: string) => void }) {
  return (
    <CustomerLayout
      company="Acme Corp"
      usage="92%"
      arr="$450k"
      renewalLikelihood="High"
      stage="Renewal Planning"
      action="Prepare for Renewal"
      icon={HandRaisedIcon}
      cardBg="bg-green-50"
      cardBorder="border-green-200"
      iconColor="text-green-600"
      textColor="text-green-800"
      text2Color="text-green-700"
      buttonColor="bg-green-600"
      buttonHover="bg-green-700"
      ringColor="green-500"
      onNextCustomer={onNextCustomer}
      nextCustomerLabel="Initech"
      nextCustomerKey="initech"
    />
  );
} 