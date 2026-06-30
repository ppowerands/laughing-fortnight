'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { contentApi, settingsApi } from '@/lib/api';

export default function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '+2348000000000';
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Food%20Palace%2C%20I%20need%20help.`;

  const { data: content } = useQuery({
    queryKey: ['site-content'],
    queryFn: () => contentApi.get().then(r => r.data),
    staleTime: 0,
  });
  const { data: settings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.get().then(r => r.data),
    staleTime: 0,
  });

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="block text-base font-black text-white">{settings?.name?.toUpperCase() || 'FOOD PALACE'}</span>
                <span className="block text-xs text-gray-400 tracking-widest uppercase">Restaurant</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-4">
              {content?.footer_description || 'Bringing you the finest Nigerian cuisine with love and dedication. Every meal crafted to perfection.'}
            </p>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
            </a>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[['/', 'Home'], ['/menu', 'Our Menu'], ['/orders', 'My Orders'], ['/profile', 'Profile']].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>{settings?.address || 'Kaduna, Nigeria'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`tel:${settings?.phone || '+2348000000000'}`} className="hover:text-white transition-colors">{settings?.phone || '+234 800 000 0000'}</a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`mailto:${settings?.email || 'info@foodpalace.ng'}`} className="hover:text-white transition-colors">{settings?.email || 'info@foodpalace.ng'}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {settings?.name || 'Food Palace Restaurant'}. All rights reserved.</p>
        </div>
      </div>

      <a href={waLink} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 group">
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute right-16 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Chat on WhatsApp</span>
      </a>
    </footer>
  );
}
