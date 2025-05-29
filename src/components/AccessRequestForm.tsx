'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { PhotoFrame } from '@/components/PhotoFrame';

interface FormData {
  empId: number;
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  picture: File | null;
  emailValidationDate: string | null;
  requestDate: string;
  deviceId: string;
  userId: string;
  gmail: string;
  pictureUrl?: string;
  id?: number;
}

export default function AccessRequestForm() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<FormData>({
    empId: 0,
    lastname: '',
    firstname: '',
    phone: '',
    email: session?.user?.email || '',
    picture: null,
    emailValidationDate: null,
    requestDate: new Date().toISOString(),
    deviceId: '',
    userId: '',
    gmail: session?.user?.email || ''
  });

  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('/PhotoID.jpeg');
  const pictureFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Auth Status:', status);
    console.log('Session:', session);
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
    }
  }, [session]);

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
      const searchEmail = formData.email;
      const searchUserId = formData.userId;
      
      const params = new URLSearchParams();
      if (searchEmail) params.append('email', searchEmail);
      if (searchUserId) params.append('userId', searchUserId);
      
      const response = await fetch(`/api/access-requests?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const { data } = await response.json();
      if (data && data.length > 0) {
        const record = data[0];
        setFormData({
          empId: record.emp_id,
          lastname: record.lastname,
          firstname: record.firstname,
          phone: record.phone,
          email: record.email,
          picture: null,
          pictureUrl: record.picture_url,
          emailValidationDate: record.email_validation_date,
          requestDate: record.request_date,
          deviceId: record.device_id,
          userId: record.user_id,
          gmail: record.gmail
        });
        
        if (record.picture_url) {
          setCurrentImage(record.picture_url);
        }
      } else {
        alert('No records found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search records');
    }
  };

  const handleSave = async () => {
    try {
      // Upload picture if exists
      let pictureUrl = null;
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
        pictureUrl = url;
      }

      const requestData = {
        ...formData,
        pictureUrl
      };

      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      alert('Record saved successfully');
      handleNew(); // Reset form after successful save
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save record');
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !session?.user?.isAdmin) {
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/access-requests?id=${formData.id}`, {
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
    setFormData({
      empId: 0,
      lastname: '',
      firstname: '',
      phone: '',
      email: session?.user?.email || '',
      picture: null,
      emailValidationDate: null,
      requestDate: new Date().toISOString(),
      deviceId: '',
      userId: '',
      gmail: session?.user?.email || ''
    });
    setCurrentImage('/PhotoID.jpeg');
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">OUC Access Control Request</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name:</label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">First Name:</label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneInput}
              placeholder="(XXX) XXX-XXXX"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email:</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                readOnly={!session?.user?.isAdmin}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  !session?.user?.isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              {session?.user?.email && !session?.user?.isAdmin && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg 
                    className="h-5 w-5 text-green-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
              )}
            </div>
            {session?.user?.email && !session?.user?.isAdmin && (
              <p className="mt-1 text-sm text-gray-500">
                Email is set from your Google account
              </p>
            )}
            {session?.user?.isAdmin && (
              <p className="mt-1 text-sm text-blue-500">
                Admin mode: Email field is editable
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User ID:</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Device ID:</label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Validated on:</label>
            <input
              type="text"
              value={formData.emailValidationDate || 'Not validated'}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Request:</label>
            <input
              type="text"
              value={new Date(formData.requestDate).toLocaleDateString()}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
          </div>
        </div>
      </div>

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
        {session?.user?.isAdmin && formData.id && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            title="Delete this record"
          >
            Delete
          </button>
        )}
        <button
          disabled={true}
          className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
        >
          {'<<'}
        </button>
        <button
          disabled={true}
          className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );
} 