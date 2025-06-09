'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PhotoFrame } from '@/components/PhotoFrame';

interface FormData {
  EmpID: number;
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  picture: File | null;
  EmailValidationDate: string | null;
  RequestDate: string; // MySQL DATETIME format: YYYY-MM-DD HH:mm:ss
  DeviceID: string;
  userid: string;
  gmail: string;
  PictureUrl?: string;
}

interface RequestData {
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  PictureUrl?: string | null;
  EmailValidationDate: string | null;
  RequestDate: string; // MySQL DATETIME format: YYYY-MM-DD HH:mm:ss
  DeviceID: string;
  userid: string;
  gmail: string;
  EmpID?: number;
}

function formatMySQLDateTime(date: Date | string | null): string | null {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null; // Invalid date
    
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
}

export default function AccessRequestForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<FormData>({
    EmpID: 0,
    lastname: '',
    firstname: '',
    phone: '',
    email: session?.user?.email || '',
    picture: null,
    EmailValidationDate: null,
    RequestDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    DeviceID: '',
    userid: '',
    gmail: session?.user?.email || ''
  });

  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('/PhotoID.jpeg');
  const pictureFrameRef = useRef<HTMLDivElement>(null);

  // Add state for handling multiple records
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(-1);
  const [canNavigate, setCanNavigate] = useState(false);

  // Add a loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Add state for initial data loading
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [userDataStatus, setUserDataStatus] = useState<'loading' | 'found' | 'new' | 'error'>('loading');

  // Add state for handling image errors
  const [imageError, setImageError] = useState(false);

  // Debug currentImage changes
  useEffect(() => {
    console.log('🖼️ Current image state changed to:', currentImage);
    // Reset image error state when image source changes
    setImageError(false);
  }, [currentImage]);

  useEffect(() => {
    const adminEmail = 'jawilson1947@gmail.com';
    const userEmail = session?.user?.email?.toLowerCase().trim();
    
    if (userEmail === adminEmail.toLowerCase()) {
      setIsSearchEnabled(true);
    } else {
      setIsSearchEnabled(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
        gmail: session.user.email || ''
      }));
      // Search for the user's record when the component mounts
      handleInitialSearch(session.user.email);
    } else {
      // Check for non-Gmail email from localStorage
      const nonGmailEmail = localStorage.getItem('nonGmailEmail');
      if (nonGmailEmail) {
        setFormData(prev => ({
          ...prev,
          email: nonGmailEmail,
          gmail: ''  // Clear Gmail since this is a non-Gmail email
        }));
        // Search for the user's record when the component mounts
        handleInitialSearch(nonGmailEmail);
      } else {
        // No email found at all - set as new user
        setIsLoadingUserData(false);
        setUserDataStatus('new');
      }
    }
  }, [session]);

  const handleInitialSearch = async (email: string) => {
    try {
      console.log('🔍 Starting initial search for email:', email);
      setIsLoadingUserData(true);
      setUserDataStatus('loading');
      
      const params = new URLSearchParams();
      params.append('email', email);
      
      console.log('📡 Making API request to:', `/api/church-members/search?${params.toString()}`);
      
      const response = await fetch(`/api/church-members/search?${params.toString()}`);
      
      console.log('📨 API Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️ Authentication issue - continuing as new user');
          setUserDataStatus('new');
          // If unauthorized, just continue without showing an error
          // This happens for new users who don't have a record yet
          return;
        }
        console.error('❌ Search failed with status:', response.status);
        setUserDataStatus('error');
        throw new Error('Search failed');
      }
      
      const result = await response.json();
      console.log('📋 Search result:', result);
      console.log('📋 Result.data type:', typeof result.data);
      console.log('📋 Result.data length:', result.data ? result.data.length : 'undefined');
      
      if (result.data && result.data.length > 0) {
        const record = result.data[0];
        console.log('✅ Found existing record for user:', record.firstname, record.lastname);
        console.log('🔍 Full record data:', record);
        
        // Debug individual field values
        console.log('🔍 Record field values:');
        console.log('  - lastname:', record.lastname);
        console.log('  - firstname:', record.firstname);
        console.log('  - phone:', record.phone);
        console.log('  - email:', record.email);
        console.log('  - EmpID:', record.EmpID);
        console.log('  - userid:', record.userid);
        console.log('  - DeviceID:', record.DeviceID);
        console.log('  - PictureUrl:', record.PictureUrl);
        console.log('  - EmailValidationDate:', record.EmailValidationDate);
        console.log('  - RequestDate:', record.RequestDate);
        
        setUserDataStatus('found');
        
        try {
          if (record.PictureUrl) {
            console.log('🖼️ Loading user photo:', record.PictureUrl);
            // Validate the PictureUrl before setting it
            if (typeof record.PictureUrl === 'string' && record.PictureUrl.length > 0) {
              setCurrentImage(record.PictureUrl);
            } else {
              console.log('🖼️ Invalid PictureUrl, using default');
              setCurrentImage('/PhotoID.jpeg');
            }
            setImageError(false);
          } else {
            console.log('🖼️ No photo URL, using default');
            setCurrentImage('/PhotoID.jpeg');
            setImageError(false);
          }
          
          console.log('🗓️ Processing dates...');
          const emailValidationDate = formatMySQLDateTime(record.EmailValidationDate);
          const requestDate = formatMySQLDateTime(record.RequestDate) || 
            formatMySQLDateTime(new Date());
          console.log('🗓️ Processed dates:', { emailValidationDate, requestDate });

          console.log('📝 Setting form data...');
          const newFormData = {
            EmpID: record.EmpID || 0,
            lastname: record.lastname || '',
            firstname: record.firstname || '',
            phone: record.phone || '',
            email: record.email || email,
            picture: null,
            PictureUrl: record.PictureUrl || undefined,
            EmailValidationDate: emailValidationDate || null,
            RequestDate: requestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
            DeviceID: record.DeviceID || '',
            userid: record.userid || '',
            gmail: record.gmail || (email.endsWith('@gmail.com') ? email : '')
          };
          
          console.log('📝 New form data being set:', newFormData);
          
          setFormData(prevData => ({
            ...prevData,
            ...newFormData
          }));
          
          console.log('✅ Form populated with existing data successfully');
          
          // Verify the form data was set correctly after a brief delay
          setTimeout(() => {
            console.log('🔍 Verifying form data after setState:', {
              lastname: formData.lastname,
              firstname: formData.firstname,
              phone: formData.phone
            });
          }, 100);
          
        } catch (formError) {
          console.error('❌ Error during form population:', formError);
          setUserDataStatus('error');
        }
      } else {
        console.log('🆕 No existing record found - user will create new record');
        setUserDataStatus('new');
      }
      // If no records found, the form will stay empty for new user registration
    } catch (error) {
      console.error('❌ Initial search error:', error);
      setUserDataStatus('error');
      // Don't show error to user, just let them fill out the form as a new user
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      setFormData(prev => ({
        ...prev,
        phone: formatted
      }));
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setFormData(prev => ({
        ...prev,
        picture: file
      }));
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCurrentImage(e.target.result as string);
          setImageError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true); // Set loading state at start
      
      const searchEmail = formData.email;
      const searchUserId = formData.userid;
      const searchLastname = formData.lastname;
      const isWildcardSearch = searchLastname === '*';
      
      // Clear the lastname field immediately after getting its search value
      setFormData(prev => ({
        ...prev,
        lastname: ''
      }));

      const params = new URLSearchParams();
      if (searchEmail) params.append('email', searchEmail);
      if (searchUserId) params.append('userId', searchUserId);
      // Only add lastname to params if it's not an asterisk
      if (searchLastname && !isWildcardSearch) {
        params.append('lastname', searchLastname);
      } else if (isWildcardSearch) {
        // If it's an asterisk, we don't need to add it to params
        // but we'll use it to trigger the full recordset search
        params.append('lastname', '*');
      }
      
      const response = await fetch(`/api/church-members/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        // If searching with '*', show the total number of records found
        if (isWildcardSearch) {
          alert(`Found ${result.data.length} records. Displaying the first record.`);
        }

        const record = result.data[0];

        // First update the image if it exists
        if (record.PictureUrl) {
          setCurrentImage(record.PictureUrl);
          setImageError(false);
        } else {
          setCurrentImage('/PhotoID.jpeg');
          setImageError(false);
        }

        // Update form data with the actual record data
        setFormData(prevData => ({
          ...prevData,
          EmpID: record.EmpID || 0,
          lastname: record.lastname || '', // Set to actual lastname from record
          firstname: record.firstname || '',
          phone: record.phone || '',
          email: record.email || '',
          picture: null,
          PictureUrl: record.PictureUrl || undefined,
          EmailValidationDate: record.EmailValidationDate || null,
          RequestDate: record.RequestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
          DeviceID: record.DeviceID || '',
          userid: record.userid || '',
          gmail: record.gmail || ''
        }));

        // Store all records in state if we have multiple results
        if (result.data.length > 1) {
          setAllRecords(result.data);
          setCurrentRecordIndex(0);
        } else {
          setAllRecords([]);
          setCurrentRecordIndex(-1);
        }

        // Enable navigation buttons if we have multiple records
        setCanNavigate(result.data.length > 1);
      } else {
        alert('No records found');
        setAllRecords([]);
        setCurrentRecordIndex(-1);
        setCanNavigate(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search records');
    } finally {
      setIsLoading(false); // Clear loading state when done
    }
  };

  // Add navigation functions
  const handlePrevious = () => {
    if (currentRecordIndex > 0) {
      const newIndex = currentRecordIndex - 1;
      const record = allRecords[newIndex];
      
      if (record.PictureUrl) {
        setCurrentImage(record.PictureUrl);
        setImageError(false);
      } else {
        setCurrentImage('/PhotoID.jpeg');
        setImageError(false);
      }

      setFormData(prevData => ({
        ...prevData,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '', // Always use the actual lastname
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: record.email || '',
        picture: null,
        PictureUrl: record.PictureUrl || undefined,
        EmailValidationDate: record.EmailValidationDate || null,
        RequestDate: record.RequestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        DeviceID: record.DeviceID || '',
        userid: record.userid || '',
        gmail: record.gmail || ''
      }));

      setCurrentRecordIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (currentRecordIndex < allRecords.length - 1) {
      const newIndex = currentRecordIndex + 1;
      const record = allRecords[newIndex];
      
      if (record.PictureUrl) {
        setCurrentImage(record.PictureUrl);
        setImageError(false);
      } else {
        setCurrentImage('/PhotoID.jpeg');
        setImageError(false);
      }

      setFormData(prevData => ({
        ...prevData,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '', // Always use the actual lastname
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: record.email || '',
        picture: null,
        PictureUrl: record.PictureUrl || undefined,
        EmailValidationDate: record.EmailValidationDate || null,
        RequestDate: record.RequestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        DeviceID: record.DeviceID || '',
        userid: record.userid || '',
        gmail: record.gmail || ''
      }));

      setCurrentRecordIndex(newIndex);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Upload picture if exists
      let PictureUrl = formData.PictureUrl;
      if (formData.picture) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.picture);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload picture');
        }
        const { url } = await uploadResponse.json();
        PictureUrl = url;
      }

      // Format the date in MySQL format if it's in ISO format
      let formattedRequestDate = formData.RequestDate;
      if (formData.RequestDate.includes('T') || formData.RequestDate.includes('Z')) {
        const date = new Date(formData.RequestDate);
        formattedRequestDate = date.getFullYear() + '-' +
          String(date.getMonth() + 1).padStart(2, '0') + '-' +
          String(date.getDate()).padStart(2, '0') + ' ' +
          String(date.getHours()).padStart(2, '0') + ':' +
          String(date.getMinutes()).padStart(2, '0') + ':' +
          String(date.getSeconds()).padStart(2, '0');
      }

      const requestData: RequestData = {
        lastname: formData.lastname,
        firstname: formData.firstname,
        phone: formData.phone,
        email: formData.email,
        PictureUrl,
        EmailValidationDate: formData.EmailValidationDate,
        RequestDate: formattedRequestDate,
        DeviceID: formData.DeviceID,
        userid: formData.userid,
        gmail: formData.gmail
      };

      // Only include EmpID for updates
      if (formData.EmpID !== 0) {
        requestData.EmpID = formData.EmpID;
      }

      const method = formData.EmpID === 0 ? 'POST' : 'PUT';
      const response = await fetch('/api/church-members', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const result = await response.json();
      if (method === 'POST' && result.EmpID) {
        setFormData(prev => ({
          ...prev,
          EmpID: result.EmpID
        }));
      }

      // Determine if this is an update or new record
      const action = formData.EmpID ? 'update' : 'create';
      
      // Send email notification with enhanced feedback
      let emailStatus = 'unknown';
      try {
        console.log('Attempting to send email notification...');
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastname: formData.lastname,
            firstname: formData.firstname,
            email: formData.email,
            phone: formData.phone,
            action: action
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResponse.ok) {
          emailStatus = 'sent';
          console.log('✅ Email notification sent successfully:', emailResult.message);
        } else {
          emailStatus = 'failed';
          console.warn('⚠️ Email notification failed:', emailResult.error);
          if (emailResult.configIssues) {
            console.warn('📧 Email configuration issues:', emailResult.configIssues);
          }
        }
      } catch (emailError: any) {
        emailStatus = 'error';
        console.error('❌ Email notification error:', emailError.message || emailError);
      }

      // Enhanced success message based on email status
      let successMessage = 'Record saved successfully!';
      if (emailStatus === 'sent') {
        successMessage += '\n\n✅ Email notification sent to OUC IT.';
      } else if (emailStatus === 'failed') {
        successMessage += '\n\n⚠️ Record saved but email notification failed.\nPlease contact OUC IT directly if urgent.';
      } else if (emailStatus === 'error') {
        successMessage += '\n\n❌ Record saved but email service unavailable.\nPlease contact OUC IT to confirm your request.';
      }

      alert(successMessage);
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.EmpID || !session?.user?.isAdmin) {
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/church-members?EmpID=${formData.EmpID}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      alert('Record deleted successfully');
      handleNew(); // Reset form after successful delete
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete record');
    }
  };

  const handleNew = () => {
    const now = new Date();
    const mysqlDatetime = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    setFormData({
      EmpID: 0,
      lastname: '',
      firstname: '',
      phone: '',
      email: session?.user?.email || '',
      picture: null,
      EmailValidationDate: null,
      RequestDate: mysqlDatetime,
      DeviceID: '',
      userid: '',
      gmail: session?.user?.email || ''
    });
    setCurrentImage('/PhotoID.jpeg');
    setImageError(false);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    // Validate that the string is actually a date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // Return empty string if invalid date
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Update the exit handler to properly handle both Google and non-Google sessions
  const handleExit = async () => {
    // Clear the non-Gmail email from localStorage if it exists
    localStorage.removeItem('nonGmailEmail');
    
    // Clear any potential cache
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      } catch (error) {
        console.log('Cache clearing not supported or failed:', error);
      }
    }
    
    // If there's a session (Google login), sign out properly
    if (session) {
      await signOut({ 
        redirect: true,
        callbackUrl: '/login?refreshed=' + Date.now()
      });
    } else {
      // If no session (non-Google login), force a fresh redirect with cache busting
      window.location.href = '/login?refreshed=' + Date.now();
    }
  };

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: '#000033',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3px'
    }}>
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            border: '3px solid transparent',
            borderTop: '3px solid #60a5fa',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}
      
      <div style={{ width: '100%', maxWidth: '481px' }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          boxShadow: '0 8px 18px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(0, 0, 51, 0.3)',
          padding: '12px'
        }}>
          {/* Header with OUC Branding */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #60a5fa, #1a1a5c)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '3px'
            }}>
              🏛️ OUC Access Control
            </h1>
            <p style={{
              fontSize: '8px',
              color: '#000033',
              fontWeight: '600'
            }}>
              Facility Access Request System
            </p>
            
            {/* User Data Status Indicator */}
            {isLoadingUserData ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                marginTop: '3px',
                padding: '3px 8px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '3px',
                color: '#1d4ed8',
                fontSize: '8px',
                fontWeight: '600'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  border: '1px solid transparent',
                  borderTop: '1px solid #60a5fa',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                🔍 Searching for your existing data...
              </div>
            ) : userDataStatus === 'found' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                marginTop: '3px',
                padding: '3px 8px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '3px',
                color: '#15803d',
                fontSize: '8px',
                fontWeight: '600'
              }}>
                ✅ Welcome back! Your existing data has been loaded.
              </div>
            ) : userDataStatus === 'new' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                marginTop: '3px',
                padding: '3px 8px',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '3px',
                color: '#7c3aed',
                fontSize: '8px',
                fontWeight: '600'
              }}>
                🆕 Welcome! Please fill out your information below.
              </div>
            ) : null}
            
            <div style={{
              width: '35px',
              height: '3px',
              background: 'linear-gradient(135deg, #60a5fa, #1a1a5c)',
              margin: '3px auto',
              borderRadius: '3px'
            }}></div>
          </div>
        
          {/* Photo Section - KEEP ORIGINAL SIZE */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <div 
                ref={pictureFrameRef}
                style={{
                  width: '85px',
                  height: '85px',
                  border: '2px solid #60a5fa',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 5px 12px rgba(0, 0, 0, 0.15)'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Image
                  src={imageError ? '/default-profile.png' : (currentImage || '/PhotoID.jpeg')}
                  alt="User photo"
                  width={79}
                  height={79}
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    borderRadius: '7px'
                  }}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', currentImage);
                    if (!imageError) {
                      // Only set error state once to prevent infinite loops
                      setImageError(true);
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', currentImage);
                    // Reset error state when image loads successfully
                    setImageError(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Photo Upload Instruction */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '8px',
            fontSize: '10px',
            color: '#666666',
            fontStyle: 'italic'
          }}>
            💡 Drag & drop your photo above or click to select
          </div>

          {/* Form Section */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 51, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 51, 0.3)',
            borderRadius: '3px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                maxWidth: '321px',
                margin: '0 auto',
                borderCollapse: 'collapse'
              }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>👤</span>Last Name:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        placeholder="Enter your last name"
                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 51, 0.3)'}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>👤</span>First Name:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        placeholder="Enter your first name"
                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 51, 0.3)'}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>📞</span>Phone:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneInput}
                        placeholder="(XXX) XXX-XXXX"
                        required
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 51, 0.3)'}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#ffffff',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>📧</span>Email:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        readOnly={!session?.user?.isAdmin}
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: !session?.user?.isAdmin ? 'rgba(240, 240, 240, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        placeholder="your.email@example.com"
                        onFocus={(e) => session?.user?.isAdmin && (e.target.style.borderColor = '#60a5fa')}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 51, 0.3)'}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>🆔</span>User ID:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="userid"
                        value={formData.userid}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        placeholder="Create a unique user ID"
                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 51, 0.3)'}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>📱</span>Device ID:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="DeviceID"
                        value={formData.DeviceID}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        placeholder="Enter your mobile device ID"
                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 51, 0.3)'}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>📖</span>Digital Key Guide:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '3px',
                        padding: '8px'
                      }}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(
                              '/IsonasMobileAppGuide.pdf',
                              'pdf-popup',
                              'width=900,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
                            );
                          }}
                          style={{
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          <span>📱</span>
                          Download Mobile App Setup Guide (PDF)
                          <span>↗️</span>
                        </a>
                        <p style={{
                          fontSize: '8px',
                          marginTop: '3px',
                          color: 'rgba(29, 78, 216, 0.75)',
                          margin: '3px 0 0 0'
                        }}>
                          📋 Step-by-step instructions for obtaining your Device ID
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 51, 0.1)' }}>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>✅</span>Email Validated:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="EmailValidationDate"
                        value={formData.EmailValidationDate ? formatDate(formData.EmailValidationDate) : ''}
                        disabled
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(240, 240, 240, 0.9)',
                          color: '#666'
                        }}
                        placeholder="Not yet validated"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td style={{
                      width: '72px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#000033',
                      padding: '3px 8px',
                      fontSize: '9px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>📅</span>Request Date:
                      </div>
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <input
                        type="text"
                        name="RequestDate"
                        value={formatDate(formData.RequestDate)}
                        disabled
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(240, 240, 240, 0.9)',
                          color: '#666'
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Button Section */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 51, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 51, 0.3)',
            borderRadius: '3px',
            padding: '8px'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '3px'
            }}>
              <button
                onClick={handleNew}
                style={{
                  padding: '5px 9px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>🆕</span>New
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '5px 9px',
                  backgroundColor: '#000033',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a5c';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#000033';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>💾</span>Save
              </button>
              {session?.user?.isAdmin && formData.EmpID && (
                <button
                  onClick={handleDelete}
                  title="Delete this record"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#b91c1c';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>🗑️</span>Delete
                </button>
              )}
              <button
                onClick={handlePrevious}
                disabled={!canNavigate || currentRecordIndex <= 0}
                style={{
                  padding: '8px 18px',
                  backgroundColor: (canNavigate && currentRecordIndex > 0) ? '#1a1a5c' : '#d1d5db',
                  color: (canNavigate && currentRecordIndex > 0) ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: (canNavigate && currentRecordIndex > 0) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (canNavigate && currentRecordIndex > 0) {
                    e.currentTarget.style.backgroundColor = '#000033';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (canNavigate && currentRecordIndex > 0) {
                    e.currentTarget.style.backgroundColor = '#1a1a5c';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>⬅️</span>Prev
              </button>
              <button
                onClick={handleNext}
                disabled={!canNavigate || currentRecordIndex >= allRecords.length - 1}
                style={{
                  padding: '8px 18px',
                  backgroundColor: (canNavigate && currentRecordIndex < allRecords.length - 1) ? '#1a1a5c' : '#d1d5db',
                  color: (canNavigate && currentRecordIndex < allRecords.length - 1) ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: (canNavigate && currentRecordIndex < allRecords.length - 1) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (canNavigate && currentRecordIndex < allRecords.length - 1) {
                    e.currentTarget.style.backgroundColor = '#000033';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (canNavigate && currentRecordIndex < allRecords.length - 1) {
                    e.currentTarget.style.backgroundColor = '#1a1a5c';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Next<span>➡️</span>
              </button>
              <button
                onClick={handleSearch}
                disabled={!isSearchEnabled}
                title={!isSearchEnabled ? "Only available for admin users" : "Search records"}
                style={{
                  padding: '5px 9px',
                  backgroundColor: isSearchEnabled ? '#059669' : '#d1d5db',
                  color: isSearchEnabled ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isSearchEnabled ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                onMouseOver={(e) => {
                  if (isSearchEnabled) {
                    e.currentTarget.style.backgroundColor = '#047857';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (isSearchEnabled) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>🔍</span>
                {isSearchEnabled ? 'Search' : 'Admin Only'}
              </button>
              <button
                onClick={handleExit}
                type="button"
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#d97706';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f59e0b';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>🚪</span>Exit
              </button>
            </div>

            {/* Record Counter */}
            {allRecords.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <div style={{
                  backgroundColor: '#60a5fa',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <span>📊</span>
                  Record {currentRecordIndex + 1} of {allRecords.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}