'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Tags, Truck,
  Settings, Users, LogOut, Menu, X, Bell, ChefHat, BarChart3,
  FileText, UserCircle, CreditCard, History, Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { adminApi, ordersApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/order-history', label: 'Order History', icon: History },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/products', label: 'Products', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/users', label: 'Customers', icon: Users },
  { href: '/admin/delivery', label: 'Delivery Zones', icon: Truck },
  { href: '/admin/content', label: 'Website Content', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/profile', label: 'My Profile', icon: UserCircle },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isSuperAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role === 'CUSTOMER') { router.push('/'); return; }
  }, [isAuthenticated, user]);

  const { data: notifData } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminApi.getNotifications().then(r => r.data),
    refetchInterval: 15000,
    enabled: isAuthenticated && user?.role !== 'CUSTOMER',
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pending-payments-count'],
    queryFn: () => ordersApi.getAll({ paymentStatus: 'AWAITING_CONFIRMATION', limit: 1 }).then(r => r.data),
    refetchInterval: 15000,
    enabled: isAuthenticated && user?.role !== 'CUSTOMER',
  });

  const unreadCount = notifData?.unreadCount || 0;
  const pendingPayments = pendingData?.total || 0;
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);
  const allNavItems = adminNavItems;

  if (!isAuthenticated || user?.role === 'CUSTOMER') return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-none flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5 cursor-pointer" onDoubleClick={() => window.location.href = '/admin/developer'}>
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">FOOD PALACE</p>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <Link href="/admin/profile" onClick={() => setSidebarOpen(false)} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{user?.name?.[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                {isSuperAdmin && <Shield className="w-3 h-3 text-blue-500" />}
              </div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {allNavItems.map(({ href, label, icon: Icon, exact, superAdminOnly }: any) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(href, exact)
                  ? 'bg-blue-700 text-white shadow-md'
                  : superAdminOnly
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </div>
              {href === '/admin/payments' && pendingPayments > 0 && (
                <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingPayments > 9 ? '9+' : pendingPayments}</span>
              )}
              {href === '/admin/developer' && (
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">DEV</span>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <BarChart3 className="w-5 h-5" /> View Website
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {allNavItems.find((n: any) => isActive(n.href, n.exact))?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {pendingPayments > 0 && (
              <Link href="/admin/payments" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-100 text-yellow-700 text-xs font-semibold hover:bg-yellow-200 transition-colors animate-pulse">
                <CreditCard className="w-4 h-4" /> {pendingPayments} pending
              </div>
            )}
            <Link href="/admin/orders" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
