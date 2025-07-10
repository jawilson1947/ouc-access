'use client';

import { useState, useEffect } from 'react';
import { useChurchMembers } from '@/hooks/useChurchMembers';
import { MemberList } from './MemberList';
import { SearchBar } from './SearchBar';
import { Pagination } from './Pagination';
import { EditMemberModal } from './EditMemberModal';
import { ChurchMember } from '@/types/database';

export function AdminDashboard() {
  const {
    members,
    loading,
    error,
    currentPage,
    totalPages,
    isSearchActive,
    getPaginatedMembers,
    searchMembers,
    clearSearch,
    deleteMember
  } = useChurchMembers();
  const [selectedMember, setSelectedMember] = useState<ChurchMember | null>(null);

  useEffect(() => {
    getPaginatedMembers(1);
  }, []);

  const handlePageChange = (page: number) => {
    getPaginatedMembers(page);
  };

  const handleDelete = async (EmpID: number) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteMember(EmpID);
        await getPaginatedMembers(currentPage); // Refresh current page
      } catch (error) {
        console.error('Failed to delete member:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Church Members Administration</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <SearchBar 
        onSearch={searchMembers} 
        onClear={clearSearch}
        isSearchActive={isSearchActive}
      />

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <MemberList 
            members={members}
            onDelete={handleDelete}
            onEdit={setSelectedMember}
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {selectedMember && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSave={() => {
            getPaginatedMembers(currentPage);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}