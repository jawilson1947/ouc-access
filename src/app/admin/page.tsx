'use client';

import { useSession } from 'next-auth/react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { redirect } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Protect the admin route - only allow admin users
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  return <AdminDashboard />;
}