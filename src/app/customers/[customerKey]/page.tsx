"use client";

import { useRouter } from 'next/navigation';
import { customers } from '../../../data/customers';
import CustomerRenewalDashboard from '../../../components/customers/CustomerRenewalDashboard';
import { use } from 'react';

export default function CustomerPage({ params }: { params: Promise<{ customerKey: string }> }) {
  const router = useRouter();
  const { customerKey } = use(params);
  const customer = customers[customerKey];
  if (!customer) return <div className="p-8 text-red-600">Customer not found</div>;
  return (
    <CustomerRenewalDashboard
      customer={customer}
      onNextCustomer={key => router.push(`/customers/${key}`)}
    />
  );
} 