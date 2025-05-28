'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

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
}

export default function AccessRequestForm() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>({
    empId: 0,
    lastname: '',
    firstname: '',
    phone: '',
    email: '',
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
    if (session?.user?.email === 'jawilson1947@gmail.com') {
      setIsSearchEnabled(true);
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
    // Implement search logic based on the requirements
  };

  const handleSave = async () => {
    // Implement save logic
  };

  const handleNew = () => {
    setFormData({
      empId: 0,
      lastname: '',
      firstname: '',
      phone: '',
      email: '',
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
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
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
          className={`px-4 py-2 text-white rounded ${
            isSearchEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Search
        </button>
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