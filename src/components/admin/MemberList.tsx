'use client';

import { ChurchMember } from '@/types/database';

interface MemberListProps {
  members: ChurchMember[];
  onDelete: (empId: number) => void;
  onEdit: (member: ChurchMember) => void;
}

export function MemberList({ members, onDelete, onEdit }: MemberListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Request Date
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {members.map((member) => (
            <tr key={member.EmpId}>
              <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {member.Firstname} {member.Lastname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {member.Email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {member.Phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {new Date(member.RequestDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                <button
                  onClick={() => onEdit(member)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(member.EmpId)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}