"use client";
import CustomerPageContainer from '@/components/customers/CustomerPageContainer';
import { redirect, useSearchParams } from 'next/navigation';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const customerKey = searchParams.get("customer");
  if (customerKey) {
    redirect(`/customers/${customerKey}`);
  }
  // Optionally render a default customers list or message
  return <div>Select a customer</div>;
} 