import { useState } from 'react';
import { ChurchMember, CreateChurchMemberInput, UpdateChurchMemberInput } from '@/types/database';

interface UseChurchMembersState {
  members: ChurchMember[];
  loading: boolean;
  error: string | null;
  totalMembers: number;
  currentPage: number;
  itemsPerPage: number;
  searchParams: Record<string, string> | null;
}

export function useChurchMembers() {
  const [state, setState] = useState<UseChurchMembersState>({
    members: [],
    loading: false,
    error: null,
    totalMembers: 0,
    currentPage: 1,
    itemsPerPage: 10,
    searchParams: null
  });

  const getAllMembers = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/church-members');
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setState(prev => ({ ...prev, members: data.data }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'An error occurred' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const getPaginatedMembers = async (page: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      if (state.searchParams) {
        const response = await fetch(
          `/api/church-members/search?${new URLSearchParams({
            ...state.searchParams,
            page: page.toString(),
            limit: state.itemsPerPage.toString()
          })}`
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        setState(prev => ({
          ...prev,
          members: data.data.members,
          totalMembers: data.data.total,
          currentPage: page
        }));
      } else {
        const response = await fetch(`/api/church-members?page=${page}&limit=${state.itemsPerPage}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        setState(prev => ({
          ...prev,
          members: data.data.members,
          totalMembers: data.data.total,
          currentPage: page
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const searchMembers = async (searchParams: {
    email?: string;
    phone?: string;
    lastname?: string;
    firstname?: string;
  }) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      searchParams: Object.keys(searchParams).length > 0 ? searchParams : null,
      currentPage: 1
    }));

    try {
      const response = await fetch(
        `/api/church-members/search?${new URLSearchParams({
          ...searchParams,
          page: '1',
          limit: state.itemsPerPage.toString()
        })}`
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      setState(prev => ({
        ...prev,
        members: data.data.members,
        totalMembers: data.data.total,
        currentPage: 1
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const createMember = async (memberData: CreateChurchMemberInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/church-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.EmpID;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateMember = async (memberData: UpdateChurchMemberInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/church-members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const deleteMember = async (EmpID: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`/api/church-members?EmpID=${EmpID}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const clearSearch = () => {
    setState(prev => ({ ...prev, searchParams: null }));
    getPaginatedMembers(1);
  };

  return {
    members: state.members,
    loading: state.loading,
    error: state.error,
    currentPage: state.currentPage,
    totalPages: Math.ceil(state.totalMembers / state.itemsPerPage),
    isSearchActive: !!state.searchParams,
    getPaginatedMembers,
    searchMembers,
    createMember,
    updateMember,
    deleteMember,
    clearSearch,
    totalMembers: state.totalMembers,
    getAllMembers,
  };
}