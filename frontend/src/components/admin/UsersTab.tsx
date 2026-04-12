import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from './Pagination';
import { formatDate } from '../../utils/format';
import { getUsers, updateUserRole, type User } from '../../api/users';

const PAGE_SIZE = 15;

export function UsersTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-400 py-8 text-center">Loading users...</p>;
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-800 text-sm font-semibold">
            <th className="py-3 w-[35%]">Email</th>
            <th className="px-5 py-3 w-[25%]">Display Name</th>
            <th className="px-5 py-3 w-[20%]">Role</th>
            <th className="px-5 py-3 w-[20%]">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((u) => (
            <tr key={u.id} className="border-b border-gray-100 last:border-b-0 odd:bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <td className="py-3 text-gray-900 text-[13px]">{u.email}</td>
              <td className="px-5 py-3 text-gray-600">{u.displayName}</td>
              <td className="px-5 py-3">
                <select
                  value={u.role}
                  onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value as User['role'] })}
                  className="h-8 px-2 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-900 font-medium outline-none cursor-pointer focus:border-teal-400 transition-colors"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="RESOLVER">RESOLVER</option>
                </select>
              </td>
              <td className="px-5 py-3 text-gray-500 text-[13px]">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination current={page} total={Math.ceil(users.length / PAGE_SIZE)} onChange={setPage} />
    </div>
  );
}
