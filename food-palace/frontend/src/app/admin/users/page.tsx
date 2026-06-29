'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700', STAFF: 'bg-purple-100 text-purple-700',
  KITCHEN: 'bg-orange-100 text-orange-700', CUSTOMER: 'bg-blue-100 text-blue-700',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.getUsers().then(r => r.data) });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => { toast.success('User status updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const filtered = users.filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input pl-9 !py-2 text-sm" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{users.filter((u: any) => u.role === 'CUSTOMER').length} customers</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['User','Phone','Role','Joined','Status','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-4"><div className="skeleton h-8 rounded-xl" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : filtered.map((user: any) => (
                <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{user.name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-xs">{user.name}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{user.phone || '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString('en-NG')}</td>
                  <td className="px-4 py-3"><span className={`badge ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    {user.role === 'CUSTOMER' && (
                      <button onClick={() => toggleMutation.mutate(user.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                        {user.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
