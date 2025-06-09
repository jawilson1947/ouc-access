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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000033',
      paddingBottom: '80px' 
    }}>
      <div className="py-6">
        <AccessRequestForm />
      </div>
      
      {/* Footer - Same as Login page for consistency */}
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