'use client';

import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AccessRequestForm from '@/components/AccessRequestForm';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.email) {
      // Store the Gmail in localStorage for later use
      localStorage.setItem('gmail', session.user.email);
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {!session ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Welcome to the App</h1>
              <p className="text-xl text-gray-600 mb-8">
                Sign in to access your account and get started with our features and servic.
              </p>
              <button
                onClick={() => signIn('google')}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Image
                  src="/google-icon.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Sign in with Google
              </button>
            </div>
            <div className="w-full max-w-md">
              <AccessRequestForm />
            </div>
          </div>
        ) : (
          <AccessRequestForm />
        )}
      </div>
    </main>
  );
} 