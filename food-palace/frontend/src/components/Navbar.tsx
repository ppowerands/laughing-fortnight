'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, Heart, Search, ChefHat } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const count = itemCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-black text-blue-700">FOOD PALACE</span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase">Restaurant</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300 hover:text-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-700 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {user?.role !== 'CUSTOMER' && (
                  <Link href="/admin" className="px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors">Admin</Link>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-colors">
                    <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-xl">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <ShoppingCart className="w-4 h-4" /> My Orders
                    </Link>
                    <button onClick={logout} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-xl">
                      <X className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-700 transition-colors">Login</Link>
                <Link href="/register" className="btn-primary !py-2 !px-4 !text-sm">Sign Up</Link>
              </div>
            )}

            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 shadow-lg animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === link.href ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300'}`}>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">Profile</Link>
                  <Link href="/orders" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">My Orders</Link>
                  {user?.role !== 'CUSTOMER' && <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-blue-700">Admin Dashboard</Link>}
                  <button onClick={() => { logout(); setOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">Login</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-bold text-blue-700">Create Account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
