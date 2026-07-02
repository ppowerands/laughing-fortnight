'use client';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, User, Lock, Mail, Phone } from 'lucide-react';
import { authApi, adminAccountApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

export default function AdminProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [accountForm, setAccountForm] = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
      setAccountForm(f => ({ ...f, email: user.email || '' }));
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (res) => { toast.success('Profile updated!'); updateUser(res.data); },
    onError: () => toast.error('Failed to update profile'),
  });

  const accountMutation = useMutation({
    mutationFn: (data: any) => adminAccountApi.update(data),
    onSuccess: (res) => {
      toast.success('Account updated!');
      updateUser({ email: res.data.email });
      setAccountForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update account'),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileForm);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (!accountForm.currentPassword) return toast.error('Please enter your current password');
    const payload: any = { currentPassword: accountForm.currentPassword };
    if (accountForm.email !== user?.email) payload.email = accountForm.email;
    if (accountForm.newPassword) payload.newPassword = accountForm.newPassword;
    accountMutation.mutate(payload);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="text-center mb-2">
        <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <span className="text-white text-3xl font-black">{user.name?.[0]}</span>
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">{user.name}</h1>
        <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mt-2">{user.role}</span>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-700" /> Profile Information
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="input pl-10" placeholder="Your full name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className="input pl-10" placeholder="+234..." />
            </div>
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary flex items-center gap-2 !py-2.5 text-sm">
            {profileMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>

      <div className="card p-6 border-2 border-blue-100 dark:border-blue-900">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-700" /> Account & Security
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password (required) *</label>
            <input type="password" value={accountForm.currentPassword} onChange={e => setAccountForm(f => ({ ...f, currentPassword: e.target.value }))} required className="input" placeholder="Enter current password to confirm changes" />
          </div>
          <button type="submit" disabled={accountMutation.isPending} className="btn-primary flex items-center gap-2 !py-2.5 text-sm">
            {accountMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Update Account
          </button>
        </form>
      </div>
    </div>
  );
}
