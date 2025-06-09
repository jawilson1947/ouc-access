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
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setEmailError('');
      console.log('Attempting to authenticate with email:', email);
      
      // Store the email in localStorage for use in the access-request form
      localStorage.setItem('nonGmailEmail', email);
      
      // Use fetch to call NextAuth directly, avoiding client-side URL construction
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          redirect: 'false',
          callbackUrl: '/access-request'
        }),
      });
      
      console.log('Auth response status:', response.status);
      
      if (response.ok) {
        console.log('Authentication successful, redirecting to access-request');
        // Force a full page redirect to ensure session is properly loaded
        window.location.href = '/access-request?t=' + Date.now();
      } else {
        console.error('Authentication failed:', response.statusText);
        setEmailError('Authentication failed. Please try again.');
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Email submit error:', error);
      // If the direct fetch fails, fall back to the original method
      console.log('Falling back to signIn method...');
      
      try {
        const result = await signIn('credentials', {
          email: email,
          redirect: false,
          callbackUrl: '/access-request'
        });
        
        if (result?.ok && !result?.error) {
          console.log('Fallback authentication successful');
          window.location.href = '/access-request?t=' + Date.now();
        } else {
          setEmailError('Authentication failed. Please try again.');
          setIsLoading(false);
        }
      } catch (fallbackError) {
        console.error('Fallback authentication also failed:', fallbackError);
        setEmailError('An error occurred. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', {
        callbackUrl: '/access-request',
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

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
        src="/ouc-logo2.png"
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

  const EmailIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24"
      style={{ display: 'inline-block' }}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="m22 7-10 5L2 7" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000033', paddingBottom: '80px' }}>
      <div className="rounded-lg p-8 shadow-lg" style={{ backgroundColor: '#000033', border: '2px solid white' }}>
        <table style={{ width: '400px', margin: '0 auto' }}>
          <tbody>
            {/* Row 1: Logo - Using local ouc-logo.png */}
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
                  <Image
                    src="/ouc-logo.png"
                    alt="OUC Logo"
                    width={200}
                    height={200}
                    style={{ 
                      objectFit: 'contain'
                    }}
                    onLoad={() => console.log('OUC Logo loaded successfully!')}
                    onError={(e) => console.error('OUC Logo failed to load:', e)}
                  />
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
                    padding: '12px 16px',
                    backgroundColor: '#000033',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    border: '2px solid white',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    height: '52px',
                    boxSizing: 'border-box'
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

            {/* Row 5: Email Submit Button */}
            <tr>
              <td className="p-4" style={{ textAlign: 'center' }}>
                <button
                  onClick={handleEmailSubmit}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#1d4ed8',
                    color: '#FFFFFF',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    height: '52px',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <EmailIcon />
                  Continue with Email
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

            {/* Row 8: Welcome Message - Enhanced */}
            <tr>
              <td className="p-4" style={{ textAlign: 'left', paddingTop: '20px', paddingBottom: '40px' }}>
                <div style={{ 
                  backgroundColor: 'rgba(0, 0, 51, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'left',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
                }}>
                  <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px', color: '#60a5fa' }}>
                    🏛️ Welcome to OUC Facility Access
                  </p>
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500' }}>
                    Request secure access to Oakwood University Church facilities in just a few simple steps.
                  </p>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>📝 What you'll need:</strong> Full name, phone number, email, and a recent photo
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>🔐 Login options:</strong> Use your Gmail account or any email address
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>📱 Digital Key:</strong> Follow the mobile app guide for device access
                    </p>
                    <p style={{ margin: '0 0 12px 0' }}>
                      <strong>💡 Easy updates:</strong> Return anytime to modify your request
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#b3b3b3' }}>
                      <strong>Need help?</strong> Call (256) 837-1255 x199 or email ouc-it@oucsda.org
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Footer - Enhanced */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(0, 0, 51, 0.95)',
        borderTop: '2px solid rgba(255, 255, 255, 0.8)',
        padding: '18px 20px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 1000
      }}>
        <p style={{
          color: '#FFFFFF',
          fontSize: '13px',
          margin: '0',
          fontFamily: 'Arial, sans-serif',
          fontWeight: '500',
          letterSpacing: '0.5px'
        }}>
          Copyright Oakwood University Church 2024 Developed by OUC Information Technology Dept
        </p>
      </div>
    </div>
  );
}