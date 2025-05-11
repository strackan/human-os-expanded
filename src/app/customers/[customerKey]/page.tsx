"use client";

import { useRouter } from 'next/navigation';
import { customers } from '../../../data/customers';
import CustomerRenewalDashboard from '../../../components/customers/CustomerRenewalDashboard';

export default function CustomerPage({ params }: { params: { customerKey: string } }) {
  const router = useRouter();
  const customer = customers[params.customerKey];
  if (!customer) return <div className="p-8 text-red-600">Customer not found</div>;
  return (
    <CustomerRenewalDashboard
      customer={customer}
      onNextCustomer={key => router.push(`/customers/${key}`)}
    />
  );
} 