import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/customers?customer=acme');
  return null;
} 