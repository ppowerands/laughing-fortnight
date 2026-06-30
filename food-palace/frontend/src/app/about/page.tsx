'use client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { settingsApi } from '@/lib/api';
import { ChefHat, Heart, Award, Users } from 'lucide-react';

export default function AboutPage() {
  const { data: settings } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">About {settings?.name || 'Food Palace Restaurant'}</h1>
          <p className="text-blue-200 max-w-2xl mx-auto">Bringing authentic Nigerian flavors to your doorstep, one meal at a time.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Story</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            {settings?.name || 'Food Palace Restaurant'} was born from a passion for authentic Nigerian cuisine and a desire to share the rich flavors of our culture with our community. From smoky Jollof Rice cooked the traditional way, to fresh Shawarmas wrapped with love, every dish tells a story of heritage and care.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Heart, title: 'Made with Love', desc: 'Every meal prepared with care and authentic recipes' },
            { icon: Award, title: 'Quality First', desc: 'Only the freshest ingredients make it to your plate' },
            { icon: Users, title: 'Community Focused', desc: 'Proudly serving Kaduna and surrounding areas' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 text-center">
              <Icon className="w-8 h-8 text-blue-700 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="card p-8 text-center bg-blue-50 dark:bg-blue-900/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ready to Taste the Difference?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Order now and experience authentic Nigerian cuisine delivered hot to your door.</p>
          <a href="/menu" className="btn-primary inline-block">Browse Our Menu</a>
        </div>
      </div>
      <Footer />
    </main>
  );
}
