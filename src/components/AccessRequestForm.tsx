'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PhotoFrame } from '@/components/PhotoFrame';
import type { Session } from 'next-auth';

interface ChurchMember {
  EmpID: number;
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  PictureUrl?: string;
  EmailValidationDate: string | null;
  RequestDate: string;
  DeviceID: string;
  userid: string;
}

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
  PictureUrl?: string;
  gmail: string;
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
  console.log('🎨 AccessRequestForm component mounting');
  
  const router = useRouter();
  const { data: session } = useSession() as { data: Session | null };
  const [formData, setFormData] = useState<FormData>({
    EmpID: 0,
    lastname: '',
    firstname: '',
    phone: '',
    email: '',
    picture: null,
    EmailValidationDate: null,
    RequestDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    DeviceID: '',
    userid: '',
    gmail: ''
  });

  // Add mount logging
  useEffect(() => {
    console.log('🔄 AccessRequestForm mounted');
    console.log('📧 Current localStorage nonGmailEmail:', localStorage.getItem('nonGmailEmail'));
    console.log('📧 Current formData.email:', formData.email);
  }, []);

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

  // Add ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug currentImage changes
  useEffect(() => {
    console.log('🖼️ Current image state changed to:', currentImage);
    // Reset image error state when image source changes
    setImageError(false);
  }, [currentImage]);

  useEffect(() => {
    // Check all possible sources of admin email
    const sessionEmail = session?.user?.email;
    const userEmailFromForm = formData.email;
    const userEmailFromStorage = localStorage.getItem('nonGmailEmail');
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    // Consider all possible admin email sources
    const isSessionAdmin = sessionEmail === adminEmail;
    const isFormAdmin = userEmailFromForm === adminEmail;
    const isStorageAdmin = userEmailFromStorage === adminEmail;
    
    // User is admin if any of the email sources match admin email
    const isUserAdmin = isSessionAdmin || isFormAdmin || isStorageAdmin;
    
    console.log('🔍 ADMIN STATE CHECK:', {
      sessionEmail,
      userEmailFromForm,
      userEmailFromStorage,
      adminEmail,
      isSessionAdmin,
      isFormAdmin,
      isStorageAdmin,
      isUserAdmin,
      finalDecision: `Admin status: ${isUserAdmin ? 'ENABLED' : 'DISABLED'}`
    });
    
    if (isUserAdmin) {
      console.log('✅ User is admin - enabling search');
      setIsSearchEnabled(true);
    } else {
      console.log('❌ User is not admin - disabling search');
      setIsSearchEnabled(false);
    }
  }, [formData.email, session]); // Add session as a dependency

  useEffect(() => {
    console.log('🔄 Initial search useEffect running');
    // Check for session email (Google login) or non-Gmail email from localStorage (credential login)
    const sessionEmail = session?.user?.email;
    const nonGmailEmail = localStorage.getItem('nonGmailEmail');
    console.log('📧 Session email:', sessionEmail);
    console.log('📧 nonGmailEmail from localStorage:', nonGmailEmail);
    console.log('📧 Current formData.email:', formData.email);
    
    const emailToUse = sessionEmail || nonGmailEmail;
    
    if (emailToUse && !formData.email) {
      console.log('✅ Found email - setting email and searching');
      setFormData(prev => ({
        ...prev,
        email: emailToUse,
        gmail: sessionEmail ? emailToUse : ''  // Set gmail if it's from Google session
      }));
      // Search for the user's record when the component mounts
      handleInitialSearch(emailToUse);
    } else if (!formData.email) {
      console.log('❌ No email found - setting as new user');
      setIsLoadingUserData(false);
      setUserDataStatus('new');
    } else {
      console.log('ℹ️ Email already set in formData:', formData.email);
    }
  }, [session]); // Add session as a dependency

  const handleInitialSearch = async (email: string) => {
    try {
      console.log('🔍 Starting initial search for email:', email);
      setIsLoadingUserData(true);
      setUserDataStatus('loading');

      const response = await fetch(`/api/church-members/search?query=email:${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Search response:', JSON.stringify(data, null, 2));

      if (data.success && data.members && data.members.length > 0) {
        const record = data.members[0];
        console.log('📝 Found record:', JSON.stringify(record, null, 2));

        // Set form data from the database record but preserve the login email
        setFormData(prev => ({
          ...prev,
          EmpID: record.EmpID,
          lastname: record.lastname,
          firstname: record.firstname,
          phone: record.phone,
          // Don't overwrite the email field - keep the login email
          PictureUrl: record.PictureUrl,
          EmailValidationDate: record.EmailValidationDate,
          RequestDate: record.RequestDate,
          DeviceID: record.DeviceID,
          userid: record.userid
        }));

        // Set current image if available
        if (record.PictureUrl) {
          console.log('🖼️ Setting image:', record.PictureUrl);
          setCurrentImage(record.PictureUrl);
        }

        setUserDataStatus('found');
      } else {
        console.log('ℹ️ No existing record found');
        setUserDataStatus('new');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setUserDataStatus('error');
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
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setFormData(prev => ({ ...prev, picture: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCurrentImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo frame click - trigger file input
  const handlePhotoFrameClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setFormData(prev => ({ ...prev, picture: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCurrentImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ChurchMember[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Add useEffect for initial load and admin check
  useEffect(() => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const sessionEmail = session?.user?.email;
    const storedAdminEmail = localStorage.getItem('nonGmailEmail');
    const loginEmail = sessionEmail || storedAdminEmail;

    if (loginEmail) {
      // Check if user is admin
      const isUserAdmin = loginEmail === adminEmail;
      setIsAdmin(isUserAdmin);

      // Always set the email field to the login email
      setFormData(prev => ({
        ...prev,
        email: loginEmail
      }));

      // Search for the user's record using exact email match
      handleSearchByEmail(loginEmail);
    }
  }, [session?.user?.email]); // Only run when session email changes

  // Update handleSearchByEmail to handle exact email matches
  const handleSearchByEmail = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSearchResults([]);
      setCurrentIndex(0);

      console.log('🔍 Searching for email:', email);

      // Use exact match for email search
      const response = await fetch(`/api/church-members/search?query=email:${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Search error:', errorData);
        throw new Error(errorData.error || 'Failed to search members');
      }

      const result = await response.json();
      console.log('🔍 Search response:', result);

      if (result.members && result.members.length > 0) {
        const member = result.members[0];
        setSearchResults([member]); // Only store the exact match
        setCurrentIndex(0);
        setFormData(prev => ({
          ...prev,
          ...member,
          email: prev.email, // Preserve the login email
          PictureUrl: member.PictureUrl || '/default-avatar.png'
        }));
        setCanNavigate(false); // No navigation for single record
      } else {
        // If no record found, clear all fields except email
        setFormData(prev => ({
          ...prev,
          EmpID: 0,
          lastname: '',
          firstname: '',
          phone: '',
          PictureUrl: '/default-avatar.png',
          EmailValidationDate: null,
          RequestDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          DeviceID: '',
          userid: ''
        }));
        setCanNavigate(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleSearch to properly handle wildcard and specific searches
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get the search value from the lastname field
      const searchValue = formData.lastname.trim();
      
      // Check if this is a wildcard search
      const isWildcardSearch = searchValue === '*';
      
      // Only allow wildcard searches for admin users
      if (isWildcardSearch && !isSearchEnabled) {
        setError('Wildcard searches are only allowed for admin users');
        return;
      }

      // Construct the search query
      const query = isWildcardSearch ? '*' : `lastname:${encodeURIComponent(searchValue)}`;
      
      console.log('🔍 Executing search with query:', query);
      
      const response = await fetch(`/api/church-members/search?query=${query}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 Search results:', result);

      if (!result.members || result.members.length === 0) {
        setError('No records found');
        setAllRecords([]);
        setCurrentRecordIndex(-1);
        setCanNavigate(false);
        return;
      }

      // Store all records and enable navigation if there are multiple results
      setAllRecords(result.members);
      setCurrentRecordIndex(0);
      setCanNavigate(result.members.length > 1);

      // Get the first record
      const record = result.members[0];
      
      // Store admin email before updating form
      const adminEmail = formData.email;
      
      // Update form with the record data
      setFormData(prev => ({
        ...prev,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '',
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: record.email || '', // Use the record's email
        PictureUrl: record.PictureUrl || '',
        EmailValidationDate: record.EmailValidationDate || null,
        RequestDate: record.RequestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        DeviceID: record.DeviceID || '',
        userid: record.userid || '',
        gmail: adminEmail // Store admin email in gmail field
      }));

      // Update current image if available
      if (record.PictureUrl) {
        setCurrentImage(record.PictureUrl);
      } else {
        setCurrentImage('/PhotoID.jpeg');
      }

    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during search');
    } finally {
      setIsLoading(false);
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

      // CRITICAL: Preserve admin email during navigation
      const currentUserEmail = formData.email;
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;;
      const isAdminUser = currentUserEmail === adminEmail || localStorage.getItem('nonGmailEmail') === adminEmail;

      setFormData(prevData => ({
        ...prevData,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '', // Always use the actual lastname
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: isAdminUser ? currentUserEmail : (record.email || ''), // Preserve admin email during navigation
        picture: null,
        PictureUrl: record.PictureUrl || undefined,
        EmailValidationDate: record.EmailValidationDate || null,
        RequestDate: record.RequestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        DeviceID: record.DeviceID || '',
        userid: record.userid || ''
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

      // CRITICAL: Preserve admin email during navigation
      const currentUserEmail = formData.email;
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const isAdminUser = currentUserEmail === adminEmail || localStorage.getItem('nonGmailEmail') === adminEmail;

      setFormData(prevData => ({
        ...prevData,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '', // Always use the actual lastname
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: isAdminUser ? currentUserEmail : (record.email || ''), // Preserve admin email during navigation
        picture: null,
        PictureUrl: record.PictureUrl || undefined,
        EmailValidationDate: record.EmailValidationDate || null,
        RequestDate: record.RequestDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        DeviceID: record.DeviceID || '',
        userid: record.userid || ''
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
        console.log('📸 Photo upload detected');
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.picture);
        uploadFormData.append('lastname', formData.lastname);
        uploadFormData.append('firstname', formData.firstname);
        uploadFormData.append('phone', formData.phone);
        
        console.log('📸 Uploading photo...', {
          fileName: formData.picture.name,
          fileSize: formData.picture.size,
          fileType: formData.picture.type,
          lastname: formData.lastname,
          firstname: formData.firstname,
          phone: formData.phone
        });
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown upload error' }));
          console.error('📸 Upload failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorData
          });
          throw new Error(`Failed to upload picture: ${errorData.error || uploadResponse.statusText}`);
        }
        
        const { url } = await uploadResponse.json();
        console.log('📸 Photo uploaded successfully:', url);
        PictureUrl = url;
        
        // Update form state with new picture URL
        setFormData(prev => ({
          ...prev,
          PictureUrl: url,
          picture: null // Clear the file after successful upload
        }));
        
        // Update current image display
        setCurrentImage(url);
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
        userid: formData.userid
      };

      // Only include EmpID for updates
      if (formData.EmpID !== 0) {
        requestData.EmpID = formData.EmpID;
      }

      const method = formData.EmpID === 0 ? 'POST' : 'PUT';
      
      // Retry logic for database operations
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`💾 Attempting to save record (attempt ${retryCount + 1}/${maxRetries})...`);
          response = await fetch('/api/church-members', {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          if (response.ok) {
            console.log('✅ Record saved successfully');
            break; // Success, exit retry loop
          } else {
            throw new Error(`Save failed with status: ${response.status}`);
          }
        } catch (error: any) {
          retryCount++;
          console.warn(`❌ Save attempt ${retryCount} failed:`, error.message);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying in ${retryCount * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          } else {
            throw error; // Final attempt failed, throw the error
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error('All save attempts failed');
      }

      const result = await response.json();
      
      // Update form state with the saved record
      setFormData(prev => ({
        ...prev,
        EmpID: result.EmpID || prev.EmpID,
        PictureUrl: PictureUrl || prev.PictureUrl
      }));

      // Determine if this is an update or new record
      const action = formData.EmpID ? 'update' : 'create';
      
      // Send email notification with enhanced feedback
      let emailStatus = 'unknown';
      try {
        console.log('📧 Attempting to send email notification...');
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
          if (emailResult.success) {
            emailStatus = 'sent';
            console.log('✅ Email notification sent successfully:', emailResult.message);
          } else {
            emailStatus = 'failed';
            console.warn('⚠️ Email notification failed:', emailResult.message || emailResult.details);
          }
        } else {
          emailStatus = 'failed';
          console.warn('⚠️ Email notification failed:', emailResult.error || emailResult.message);
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
      console.error('💥 Save error:', error);
      alert(`Failed to save record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.EmpID || !isSearchEnabled) {
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
      email: '',
      picture: null,
      EmailValidationDate: null,
      RequestDate: mysqlDatetime,
      DeviceID: '',
      userid: '',
      gmail: ''
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

  // Update the exit handler to properly handle signout in NextAuth v5
  const handleExit = async () => {
    try {
      // Clear the non-Gmail email from localStorage if it exists
      localStorage.removeItem('nonGmailEmail');
      
      // Sign out using the new NextAuth v5 syntax
      await signOut({
        redirect: true,
        callbackUrl: '/login'
      });
    } catch (error) {
      console.error('Error during signout:', error);
      // If signout fails, force redirect to login
      window.location.href = '/login';
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
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              
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
                onClick={handlePhotoFrameClick}
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
            💡 Click photo frame to select or drag & drop your image
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
                        readOnly={!isSearchEnabled}
                        style={{
                          width: '100%',
                          padding: '3px',
                          border: '1px solid rgba(0, 0, 51, 0.3)',
                          borderRadius: '3px',
                          fontSize: '12px',
                          backgroundColor: !isSearchEnabled ? 'rgba(240, 240, 240, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          transition: 'border-color 0.3s ease'
                        }}
                        placeholder="your.email@example.com"
                        onFocus={(e) => isSearchEnabled && (e.target.style.borderColor = '#60a5fa')}
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
              {isSearchEnabled && formData.EmpID && (
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
                disabled={!isSearchEnabled || !canNavigate || currentRecordIndex <= 0}
                title={!isSearchEnabled ? "Only available for admin users" : "Previous record"}
                style={{
                  padding: '8px 18px',
                  backgroundColor: (isSearchEnabled && canNavigate && currentRecordIndex > 0) ? '#1a1a5c' : '#d1d5db',
                  color: (isSearchEnabled && canNavigate && currentRecordIndex > 0) ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: (isSearchEnabled && canNavigate && currentRecordIndex > 0) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (isSearchEnabled && canNavigate && currentRecordIndex > 0) {
                    e.currentTarget.style.backgroundColor = '#000033';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (isSearchEnabled && canNavigate && currentRecordIndex > 0) {
                    e.currentTarget.style.backgroundColor = '#1a1a5c';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>⬅️</span>Prev
              </button>
              <button
                onClick={handleNext}
                disabled={!isSearchEnabled || !canNavigate || currentRecordIndex >= allRecords.length - 1}
                title={!isSearchEnabled ? "Only available for admin users" : "Next record"}
                style={{
                  padding: '8px 18px',
                  backgroundColor: (isSearchEnabled && canNavigate && currentRecordIndex < allRecords.length - 1) ? '#1a1a5c' : '#d1d5db',
                  color: (isSearchEnabled && canNavigate && currentRecordIndex < allRecords.length - 1) ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: (isSearchEnabled && canNavigate && currentRecordIndex < allRecords.length - 1) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (isSearchEnabled && canNavigate && currentRecordIndex < allRecords.length - 1) {
                    e.currentTarget.style.backgroundColor = '#000033';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (isSearchEnabled && canNavigate && currentRecordIndex < allRecords.length - 1) {
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
