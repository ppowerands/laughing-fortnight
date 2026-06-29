'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/lib/auth-store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Save, ShoppingBag, Heart, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white text-3xl font-black">{user.name?.[0]}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mt-2">{user.role}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link href="/orders" className="card p-4 text-center hover:border-blue-300 transition-colors">
            <ShoppingBag className="w-6 h-6 text-blue-700 dark:text-blue-400 mx-auto mb-2" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">My Orders</span>
          </Link>
          <Link href="/favorites" className="card p-4 text-center hover:border-blue-300 transition-colors">
            <Heart className="w-6 h-6 text-blue-700 dark:text-blue-400 mx-auto mb-2" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Favorites</span>
          </Link>
          <button onClick={logout} className="card p-4 text-center hover:border-red-300 transition-colors">
            <LogOut className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <span className="text-xs font-medium text-red-500">Logout</span>
          </button>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input pl-10" placeholder="+234..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={user.email} disabled className="input pl-10 opacity-60 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
