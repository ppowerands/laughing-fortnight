'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ToggleLeft, ToggleRight, Eye, Users } from 'lucide-react';
import { customersApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => customersApi.getAll({ search: search || undefined }).then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => customersApi.toggle(id),
    onSuccess: () => { toast.success('Customer status updated'); queryClient.invalidateQueries({ queryKey: ['admin-customers'] }); },
  });

  const totalRevenue = customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0);
  const activeCustomers = customers.filter((c: any) => c.isActive).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' },
          { label: 'Active', value: activeCustomers, color: 'bg-green-50 dark:bg-green-900/20 text-green-700' },
          { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="input pl-9 !py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" /> {customers.length} customers
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Customer','Phone','Orders','Total Spent','Last Order','Joined','Status',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="p-4"><div className="skeleton h-8 rounded-xl" /></td></tr>
              )) : customers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No customers found</td></tr>
              ) : customers.map((c: any) => (
                <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!c.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{c.name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-gray-400 text-xs">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-100 text-blue-700">{c.totalOrders}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-xs">₦{c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-NG') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-NG')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleMutation.mutate(c.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        {c.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl font-black">{selected.name?.[0]}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h2>
              <p className="text-sm text-gray-500">{selected.email}</p>
              {selected.phone && <p className="text-sm text-gray-500">{selected.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Orders', value: selected.totalOrders },
                { label: 'Total Spent', value: `₦${selected.totalSpent.toLocaleString()}` },
                { label: 'Last Order', value: selected.lastOrderDate ? new Date(selected.lastOrderDate).toLocaleDateString('en-NG') : 'Never' },
                { label: 'Joined', value: new Date(selected.createdAt).toLocaleDateString('en-NG') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
