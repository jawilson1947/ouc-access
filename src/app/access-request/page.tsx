'use client';

import AccessRequestForm from '@/components/AccessRequestForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccessRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' && !localStorage.getItem('nonGmailEmail')) {
      router.push('/login');
    }
  }, [status, router]);

  // Render the form immediately without any loading state
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <AccessRequestForm />
    </div>
  );
}