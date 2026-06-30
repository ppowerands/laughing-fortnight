'use client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { settingsApi } from '@/lib/api';
import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';

export default function ContactPage() {
  const { data: settings } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '+2348000000000';
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Get In Touch</h1>
          <p className="text-blue-200">We would love to hear from you</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="card p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Phone</h3>
              <a href={`tel:${settings?.phone || '+2348000000000'}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700">{settings?.phone || '+234 800 000 0000'}</a>
            </div>
          </div>

          <div className="card p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">WhatsApp</h3>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600">Chat with us</a>
            </div>
          </div>

          <div className="card p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email</h3>
              <a href={`mailto:${settings?.email || 'info@foodpalace.ng'}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-700">{settings?.email || 'info@foodpalace.ng'}</a>
            </div>
          </div>

          <div className="card p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Opening Hours</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{settings?.openTime || '08:00'} – {settings?.closeTime || '22:00'} Daily</p>
            </div>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Address</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{settings?.address || 'Kaduna, Nigeria'}</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
