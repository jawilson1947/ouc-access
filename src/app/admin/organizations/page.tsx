'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Organization } from '@/types/database';

export default function OrganizationsPage() {
    const { data: session, status } = useSession();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newDepartment, setNewDepartment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingDepartment, setEditingDepartment] = useState('');

    useEffect(() => {
        fetchOrganizations();
    }, [session]);

    const sortOrgs = (orgs: Organization[]) => {
        return [...orgs].sort((a, b) => a.department.localeCompare(b.department));
    };

    const fetchOrganizations = async () => {
        try {
            if (status === 'loading') return;
            if (!session?.user?.isAdmin) {
                // Handle unauthorized access if not redirected by layout/middleware
                return;
            }

            setIsLoading(true);
            const response = await fetch('/api/organizations');
            if (!response.ok) throw new Error('Failed to fetch organizations');
            const data = await response.json();
            // Data is already sorted by SQL, but safe to ensure
            setOrganizations(data);
        } catch (err) {
            setError('Failed to load organizations');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!newDepartment.trim()) {
            setError('Department name cannot be empty');
            return;
        }

        try {
            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department: newDepartment.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add organization');
            }

            setOrganizations(sortOrgs([...organizations, { ID: data.ID, department: data.department }]));
            setNewDepartment('');
            setSuccess('Organization added successfully');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdate = async (id: number) => {
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/organizations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: id, department: editingDepartment.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update organization');
            }

            setOrganizations(sortOrgs(organizations.map(org =>
                org.ID === id ? { ...org, department: editingDepartment.trim() } : org
            )));
            setEditingId(null);
            setEditingDepartment('');
            setSuccess('Organization updated successfully');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this organization?')) return;

        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`/api/organizations?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete organization');
            }

            setOrganizations(organizations.filter(org => org.ID !== id));
            setSuccess('Organization deleted successfully');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (status === 'loading') return <div className="p-8">Loading...</div>;
    if (!session?.user?.isAdmin) {
        redirect('/');
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Organization Management</h1>
                <a href="/admin" className="text-blue-600 hover:underline">Back to Admin</a>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {/* Add New Organization */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Add New Organization</h2>
                <form onSubmit={handleAdd} className="flex gap-4">
                    <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder="Department Name"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Add Organization
                    </button>
                </form>
            </div>

            {/* List Organizations */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={3} className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : organizations.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No organizations found</td></tr>
                        ) : (
                            organizations.map((org) => (
                                <tr key={org.ID}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.ID}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {editingId === org.ID ? (
                                            <input
                                                type="text"
                                                value={editingDepartment}
                                                onChange={(e) => setEditingDepartment(e.target.value)}
                                                className="w-full p-1 border border-gray-300 rounded"
                                                autoFocus
                                            />
                                        ) : (
                                            org.department
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === org.ID ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdate(org.ID)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditingDepartment('');
                                                    }}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(org.ID);
                                                        setEditingDepartment(org.department);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(org.ID)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
