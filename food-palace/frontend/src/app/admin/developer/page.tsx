'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { maintenanceApi } from '@/lib/api';
import { Shield, Database, Activity, Trash2, Bell, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeveloperPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // Only allow YOUR email to access this page
  useEffect(() => {
    if (user && user.email !== 'admin@foodpalace.ng') {
      router.push('/admin');
    }
  }, [user]);

  if (!user || user.email !== 'admin@foodpalace.ng') {
    return null;
  }

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => maintenanceApi.getHealth().then(r => r.data),
    refetchInterval: 30000,
  });

  const clearOrdersMutation = useMutation({
    mutationFn: () => maintenanceApi.clearTestOrders(),
    onSuccess: (res) => { toast.success(res.data.message); queryClient.invalidateQueries({ queryKey: ['system-health'] }); setConfirmAction(null); },
    onError: () => toast.error('Failed to clear orders'),
  });

  const clearNotifsMutation = useMutation({
    mutationFn: () => maintenanceApi.clearNotifications(),
    onSuccess: (res) => { toast.success(res.data.message); setConfirmAction(null); },
    onError: () => toast.error('Failed to clear notifications'),
  });

  const handleAction = (action: string) => {
    if (action === 'clear-orders') clearOrdersMutation.mutate();
    if (action === 'clear-notifications') clearNotifsMutation.mutate();
  };

  const db = health?.database;
  const sys = health?.system;

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`flex items-center gap-1.5 text-sm font-semibold ${status === 'operational' || status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
      {status === 'operational' || status === 'connected'
        ? <CheckCircle className="w-4 h-4" />
        : <XCircle className="w-4 h-4" />}
      {status}
    </span>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Super Admin Warning */}
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-700 dark:text-red-400 text-sm">Super Admin — Developer Section</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">This section is only visible to super admins. Be careful with destructive actions.</p>
        </div>
      </div>

      {/* System Health */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-700" /> System Health
          </h2>
          <button onClick={() => refetch()} className="text-xs text-blue-700 hover:underline">Refresh</button>
        </div>
        {isLoading ? <div className="skeleton h-20 rounded-xl" /> : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Backend API', status: sys?.backend || 'unknown' },
              { label: 'Database', status: sys?.database || 'unknown' },
              { label: 'API Endpoints', status: sys?.api || 'unknown' },
            ].map(({ label, status }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">{label}</p>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        )}
        {sys?.timestamp && <p className="text-xs text-gray-400 mt-3">Last checked: {new Date(sys.timestamp).toLocaleString('en-NG')}</p>}
      </div>

      {/* Database Stats */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-700" /> Database Information
        </h2>
        {isLoading ? <div className="skeleton h-32 rounded-xl" /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Orders', value: db?.totalOrders ?? '—', color: 'text-blue-700' },
              { label: 'Total Customers', value: db?.totalCustomers ?? '—', color: 'text-purple-700' },
              { label: 'Total Products', value: db?.totalProducts ?? '—', color: 'text-green-700' },
              { label: 'Total Categories', value: db?.totalCategories ?? '—', color: 'text-orange-700' },
              { label: 'Total Revenue', value: db?.totalRevenue ? `₦${db.totalRevenue.toLocaleString()}` : '₦0', color: 'text-green-700' },
              { label: 'Pending Payments', value: db?.pendingPayments ?? '—', color: 'text-yellow-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Actions */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5 text-red-600" /> Maintenance Actions
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">These actions are irreversible. Products, categories, and settings are never deleted.</p>

        <div className="space-y-3">
          {[
            {
              id: 'clear-orders',
              title: 'Clear Test Orders',
              desc: 'Removes cancelled orders with rejected/pending payments. Real confirmed orders are never touched.',
              icon: Trash2,
              color: 'border-red-200 dark:border-red-800',
              btnColor: 'bg-red-600 hover:bg-red-700',
              loading: clearOrdersMutation.isPending,
            },
            {
              id: 'clear-notifications',
              title: 'Clear Read Notifications',
              desc: 'Removes all notifications that have already been read by admins.',
              icon: Bell,
              color: 'border-orange-200 dark:border-orange-800',
              btnColor: 'bg-orange-600 hover:bg-orange-700',
              loading: clearNotifsMutation.isPending,
            },
          ].map(({ id, title, desc, icon: Icon, color, btnColor, loading }) => (
            <div key={id} className={`border-2 ${color} rounded-xl p-4 flex items-center justify-between gap-4`}>
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <button onClick={() => setConfirmAction(id)} className={`shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold ${btnColor} transition-colors`}>
                Run
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone. Make sure you know what you are doing.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={() => handleAction(confirmAction)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors">
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
