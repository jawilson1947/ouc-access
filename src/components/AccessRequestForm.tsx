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
  Picture_Url?: string;
}

interface RequestData {
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  Picture_Url?: string | null;
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
      }
    }
  }, [session]);

  const handleInitialSearch = async (email: string) => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      
      const response = await fetch(`/api/church-members?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          // If unauthorized, just continue without showing an error
          // This happens for new users who don't have a record yet
          return;
        }
        throw new Error('Search failed');
      }
      
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        const record = result.data[0];
        if (record.Picture_Url) {
          setCurrentImage(record.Picture_Url);
        }
        
        const emailValidationDate = formatMySQLDateTime(record.EmailValidationDate);
        const requestDate = formatMySQLDateTime(record.RequestDate) || 
          formatMySQLDateTime(new Date());

        setFormData(prevData => ({
          ...prevData,
          EmpID: record.EmpID || 0,
          lastname: record.lastname || '',
          firstname: record.firstname || '',
          phone: record.phone || '',
          email: record.email || email,
          picture: null,
          Picture_Url: record.Picture_Url || null,
          EmailValidationDate: emailValidationDate,
          RequestDate: requestDate,
          DeviceID: record.DeviceID || '',
          userid: record.userid || '',
          gmail: record.gmail || (email.endsWith('@gmail.com') ? email : '')
        }));
      }
      // If no records found, the form will stay empty for new user registration
    } catch (error) {
      console.error('Initial search error:', error);
      // Don't show error to user, just let them fill out the form as a new user
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
      
      const response = await fetch(`/api/church-members?${params.toString()}`);
      
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
        if (record.Picture_Url) {
          setCurrentImage(record.Picture_Url);
        } else {
          setCurrentImage('/PhotoID.jpeg');
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
          Picture_Url: record.Picture_Url || null,
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
      
      if (record.Picture_Url) {
        setCurrentImage(record.Picture_Url);
      } else {
        setCurrentImage('/PhotoID.jpeg');
      }

      setFormData(prevData => ({
        ...prevData,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '', // Always use the actual lastname
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: record.email || '',
        picture: null,
        Picture_Url: record.Picture_Url || null,
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
      
      if (record.Picture_Url) {
        setCurrentImage(record.Picture_Url);
      } else {
        setCurrentImage('/PhotoID.jpeg');
      }

      setFormData(prevData => ({
        ...prevData,
        EmpID: record.EmpID || 0,
        lastname: record.lastname || '', // Always use the actual lastname
        firstname: record.firstname || '',
        phone: record.phone || '',
        email: record.email || '',
        picture: null,
        Picture_Url: record.Picture_Url || null,
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
      let Picture_Url = formData.Picture_Url;
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
        Picture_Url = url;
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
        Picture_Url,
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
      
      // Send email notification
      try {
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

        if (emailResponse.ok) {
          console.log('Email notification sent successfully');
        } else {
          console.warn('Failed to send email notification');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the save if email fails
      }

      alert('Record saved successfully');
      
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
    
    // If there's a session (Google login), sign out properly
    if (session) {
      await signOut({ 
        redirect: true,
        callbackUrl: '/login'
      });
    } else {
      // If no session (non-Google login), just redirect
      router.push('/login');
    }
  };

  return (
    <div className="relative">
      {/* Add a styled loading indicator that's only visible when loading */}
      {isLoading && (
        <div 
          style={{
            display: 'none' // Hide the loading indicator completely
          }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">OUC Access Control Request</h2>
        
        <div className="mb-6 flex justify-center">
          <div 
            ref={pictureFrameRef}
            className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
          >
            <Image
              src={currentImage}
              alt="User photo"
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        <table className="w-full border-separate border-spacing-y-2">
          <tbody>
            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right">Last Name:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">First Name:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">Phone:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneInput}
                  placeholder="(XXX) XXX-XXXX"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">Email:</label>
              </td>
              <td className="pl-2">
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      readOnly={!session?.user?.isAdmin}
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        !session?.user?.isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">User ID:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="userid"
                  value={formData.userid}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">Device ID:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="DeviceID"
                  value={formData.DeviceID}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">Email Validated on:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="EmailValidationDate"
                  value={formData.EmailValidationDate ? formatDate(formData.EmailValidationDate) : ''}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </td>
            </tr>

            <tr>
              <td className="w-[200px] pr-4">
                <label className="block text-sm font-medium text-gray-700 text-right w-full">Date of Request:</label>
              </td>
              <td className="pl-2">
                <input
                  type="text"
                  name="RequestDate"
                  value={formatDate(formData.RequestDate)}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-between space-x-4">
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            New
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={handleSearch}
            disabled={!isSearchEnabled}
            title={!isSearchEnabled ? "Only available for admin users" : "Search records"}
            className={`px-4 py-2 text-white rounded ${
              isSearchEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSearchEnabled ? 'Search' : 'Admin Only'}
          </button>
          {session?.user?.isAdmin && formData.EmpID && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              title="Delete this record"
            >
              Delete
            </button>
          )}
          <button
            onClick={handlePrevious}
            disabled={!canNavigate || currentRecordIndex <= 0}
            className={`px-4 py-2 text-white rounded ${
              canNavigate && currentRecordIndex > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {'<<'}
          </button>
          <button
            onClick={handleNext}
            disabled={!canNavigate || currentRecordIndex >= allRecords.length - 1}
            className={`px-4 py-2 text-white rounded ${
              canNavigate && currentRecordIndex < allRecords.length - 1
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {'>>'}
          </button>
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            type="button"
          >
            Exit
          </button>
        </div>

        {/* Add record counter if we have multiple records */}
        {allRecords.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Record {currentRecordIndex + 1} of {allRecords.length}
          </div>
        )}
      </div>
    </div>
  );
}