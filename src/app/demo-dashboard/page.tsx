import { redirect } from 'next/navigation';

/**
 * Demo Dashboard - Deprecated
 * Redirects to /dashboard (modernized zen dashboard with Phase 3F features)
 */
export default function DemoDashboardPage() {
  redirect('/dashboard');
}
