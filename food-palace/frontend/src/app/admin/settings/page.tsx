'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Clock, CreditCard, Store, Lock, Mail } from 'lucide-react';
import { settingsApi, adminAccountApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const { data: settings, isLoading } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });

  const [form, setForm] = useState({
    name: '', phone: '', whatsapp: '', email: '', address: '',
    openTime: '08:00', closeTime: '22:00', isOpen: true, manualOverride: false,
    bankName: 'MONIEPOINT MFB', accountName: 'USMAN SAMBO MARAFA', accountNumber: '9110064364',
  });

  const [accountForm, setAccountForm] = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (settings) setForm({
      name: settings.name || '', phone: settings.phone || '', whatsapp: settings.whatsapp || '',
      email: settings.email || '', address: settings.address || '',
      openTime: settings.openTime || '08:00', closeTime: settings.closeTime || '22:00',
      isOpen: settings.isOpen ?? true, manualOverride: settings.manualOverride ?? false,
      bankName: settings.bankName || 'MONIEPOINT MFB', accountName: settings.accountName || 'USMAN SAMBO MARAFA', accountNumber: settings.accountNumber || '9110064364',
    });
  }, [settings]);

  useEffect(() => { if (user) setAccountForm(f => ({ ...f, email: user.email })); }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsApi.update(data),
    onSuccess: () => { toast.success('Settings saved!'); queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] }); },
    onError: () => toast.error('Failed to save settings'),
  });

  const accountMutation = useMutation({
    mutationFn: (data: any) => adminAccountApi.update(data),
    onSuccess: (res) => {
      toast.success('Account updated! Please log in again if you changed your password.');
      updateUser({ email: res.data.email });
      setAccountForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update account'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (!accountForm.currentPassword) return toast.error('Please enter your current password to confirm changes');
    const payload: any = { currentPassword: accountForm.currentPassword };
    if (accountForm.email !== user?.email) payload.email = accountForm.email;
    if (accountForm.newPassword) payload.newPassword = accountForm.newPassword;
    accountMutation.mutate(payload);
  };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Admin Account */}
      <div className="card p-6 border-2 border-blue-100 dark:border-blue-900">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-700" /> Your Admin Account
        </h2>
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} className="input pl-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input type="password" value={accountForm.newPassword} onChange={e => setAccountForm(f => ({ ...f, newPassword: e.target.value }))} className="input" placeholder="Leave blank to keep current" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type="password" value={accountForm.confirmPassword} onChange={e => setAccountForm(f => ({ ...f, confirmPassword: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password (required to save) *</label>
            <input type="password" value={accountForm.currentPassword} onChange={e => setAccountForm(f => ({ ...f, currentPassword: e.target.value }))} required className="input" placeholder="Enter current password to confirm" />
          </div>
          <button type="submit" disabled={accountMutation.isPending} className="btn-primary flex items-center gap-2 !py-2.5 text-sm">
            {accountMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Update Account
          </button>
        </form>
      </div>

      <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${settings?.isOpenNow ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-400 bg-red-50 dark:bg-red-900/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${settings?.isOpenNow ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`font-bold ${settings?.isOpenNow ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            Restaurant is currently {settings?.isOpenNow ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Manual Override</span>
          <input type="checkbox" checked={form.manualOverride} onChange={set('manualOverride')} className="rounded" />
        </label>
      </div>

      <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-700" /> Restaurant Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['name','Restaurant Name','Food Palace Restaurant'],['phone','Phone','+234...'],['whatsapp','WhatsApp','+234...'],['email','Email','info@...']].map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <input value={form[key as keyof typeof form] as string} onChange={set(key)} className="input" placeholder={placeholder} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input value={form.address} onChange={set('address')} className="input" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-700" /> Opening Hours</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Time</label>
              <input type="time" value={form.openTime} onChange={set('openTime')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Time</label>
              <input type="time" value={form.closeTime} onChange={set('closeTime')} className="input" />
            </div>
          </div>
          {form.manualOverride && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isOpen} onChange={set('isOpen')} className="rounded" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Open (manual override)</span>
            </label>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-700" /> Bank Transfer Details</h2>
          <div className="space-y-4">
            {[['bankName','Bank Name'],['accountName','Account Name'],['accountNumber','Account Number']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <input value={form[key as keyof typeof form] as string} onChange={set(key)} className={`input ${key === 'accountNumber' ? 'font-mono text-lg tracking-widest' : ''}`} />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
          {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save Settings
        </button>
      </form>
    </div>
  );
}
