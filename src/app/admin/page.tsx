'use client';

import { useSession } from 'next-auth/react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { redirect } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Protect the admin route - only allow specific email(s)
  if (!session?.user?.email || session.user.email !== 'jawilson1947@gmail.com') {
    redirect('/');
  }

  return <AdminDashboard />;
}