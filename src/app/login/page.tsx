'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Login page - Session status:', status);
    console.log('Login page - Session data:', session);

    if (status === 'authenticated' && session) {
      console.log('Redirecting to home page - authenticated session found');
      router.replace('/');
    }
  }, [status, session, router]);

  const handleSignIn = async () => {
    try {
      console.log('Initiating Google sign-in...');
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });
      console.log('Sign-in result:', result);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          OUC Access Control
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in with your Google account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div>
            <button
              onClick={handleSignIn}
              className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Image
                src="/google.svg"
                alt="Google logo"
                width={20}
                height={20}
              />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 