'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Clock, CreditCard, Store } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });

  const [form, setForm] = useState({
    name: '', phone: '', whatsapp: '', email: '', address: '',
    openTime: '08:00', closeTime: '22:00', isOpen: true, manualOverride: false,
    bankName: 'MONIEPOINT MFB', accountName: 'USMAN SAMBO MARAFA', accountNumber: '9110064364',
  });

  useEffect(() => {
    if (settings) setForm({
      name: settings.name || '', phone: settings.phone || '', whatsapp: settings.whatsapp || '',
      email: settings.email || '', address: settings.address || '',
      openTime: settings.openTime || '08:00', closeTime: settings.closeTime || '22:00',
      isOpen: settings.isOpen ?? true, manualOverride: settings.manualOverride ?? false,
      bankName: settings.bankName || 'MONIEPOINT MFB', accountName: settings.accountName || 'USMAN SAMBO MARAFA', accountNumber: settings.accountNumber || '9110064364',
    });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsApi.update(data),
    onSuccess: () => { toast.success('Settings saved!'); queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] }); },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>;

  return (
    <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-6 max-w-2xl">
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
  );
}
