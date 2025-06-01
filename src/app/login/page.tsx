'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      localStorage.setItem('nonGmailEmail', email);
      await signIn('credentials', {
        email: email,
        redirect: true,
        callbackUrl: '/access-request'
      });
    } catch (error) {
      console.error('Email submit error:', error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', {
        callbackUrl: 'http://localhost:3000/access-request',
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/ouc-logo.png');
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setLogoSrc(url);
        }
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };
    loadLogo();
  }, []);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000033' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    router.push('/access-request');
    return null;
  }

  // First, let's create an OUC Logo component similar to the Google icon
  const OUCLogo = () => (
    <div style={{ 
      width: '150px', 
      height: '150px', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <img
        src="/ouc-logo.svg"
        alt="OUC Logo"
        style={{ 
          width: '150px', 
          height: '150px', 
          objectFit: 'contain'
        }}
        onLoad={() => console.log('SVG Logo loaded successfully!')}
        onError={(e) => console.error('SVG Logo failed:', e)}
      />
    </div>
  );

  // Inline Google SVG
  const GoogleIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24"
      style={{ display: 'inline-block' }}
    >
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000033' }}>
      <div className="rounded-lg p-8 shadow-lg" style={{ backgroundColor: '#000033', border: '2px solid white' }}>
        <table style={{ width: '400px', margin: '0 auto' }}>
          <tbody>
            {/* Row 1: Logo - Using converted SVG */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '150px', 
                  height: '150px', 
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                    <img
                      src="https://i1.wp.com/oucsda.org/wp-content/uploads/logo.png?fit=358%2C100&ssl=1"
                      alt="OUC Logo"
                      style={{ 
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'contain'
                      }}
                      onLoad={() => console.log('Dynamic logo loaded!')}
                    />
                  ) : (
                    <div style={{ color: '#000033' }}>Loading logo...</div>
                  )}
                </div>
              </td>
            </tr>

            {/* Row 2: Title */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '24pt', color: '#FFFFFF', margin: '10px 0' }}>
                  Facility Access Request
                </h1>
              </td>
            </tr>

            {/* Row 3: Email Label */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18pt', color: '#FFFFFF', margin: '10px 0' }}>
                  Enter your Email Address
                </p>
              </td>
            </tr>

            {/* Row 4: Email Input */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  style={{ 
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#000033',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    border: '1px solid white',
                    borderRadius: '4px'
                  }}
                  placeholder="your.email@example.com"
                />
                {emailError && (
                  <p style={{ color: '#ff6b6b', textAlign: 'center', fontSize: '14px', margin: '5px 0' }}>
                    {emailError}
                  </p>
                )}
              </td>
            </tr>

            {/* Row 5: Submit Button */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <button
                  onClick={handleEmailSubmit}
                  style={{ 
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: '#000033',
                    color: '#FFFFFF',
                    border: '1px solid white',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Submit
                </button>
              </td>
            </tr>

            {/* Row 6: Or */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <p style={{ color: '#FFFFFF', margin: '10px 0' }}>or</p>
              </td>
            </tr>

            {/* Row 7: Google Button - Using inline SVG */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <button
                  onClick={handleGoogleSignIn}
                  style={{ 
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: '#000033',
                    color: '#FFFFFF',
                    border: '1px solid white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}