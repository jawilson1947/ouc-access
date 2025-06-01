'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AccessRequestForm from '@/components/AccessRequestForm';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const nonGmailEmail = localStorage.getItem('nonGmailEmail');
    
    if (status === 'unauthenticated' && !nonGmailEmail) {
      router.push('/login');
      return;
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Allow access if user has either a valid session or a non-Gmail email
  const nonGmailEmail = localStorage.getItem('nonGmailEmail');
  if (!session && !nonGmailEmail) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AccessRequestForm />
      </div>
    </main>
  );
} 