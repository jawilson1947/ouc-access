'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (params: {
    email?: string;
    phone?: string;
    lastname?: string;
    firstname?: string;
  }) => void;
  onClear: () => void;
  isSearchActive: boolean;
}

export function SearchBar({ onSearch, onClear, isSearchActive }: SearchBarProps) {
  const [searchParams, setSearchParams] = useState({
    email: '',
    phone: '',
    lastname: '',
    firstname: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== '')
    );
    onSearch(filteredParams);
  };

  const handleReset = () => {
    setSearchParams({
      email: '',
      phone: '',
      lastname: '',
      firstname: '',
    });
    onClear();
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      {isSearchActive && (
        <div className="mb-4 bg-blue-50 p-2 rounded flex justify-between items-center">
          <span className="text-blue-700">Search results are being shown</span>
          <button
            onClick={handleReset}
            className="text-blue-700 hover:text-blue-900 underline"
          >
            Clear Search
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={searchParams.email}
            onChange={(e) => setSearchParams(prev => ({ ...prev, email: e.target.value }))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={searchParams.phone}
            onChange={(e) => setSearchParams(prev => ({ ...prev, phone: e.target.value }))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={searchParams.lastname}
            onChange={(e) => setSearchParams(prev => ({ ...prev, lastname: e.target.value }))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            First Name
          </label>
          <input
            type="text"
            value={searchParams.firstname}
            onChange={(e) => setSearchParams(prev => ({ ...prev, firstname: e.target.value }))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      </form>
      <div className="flex items-center justify-end mt-4 space-x-2">
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Reset
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Search
        </button>
      </div>
    </div>
  );
}