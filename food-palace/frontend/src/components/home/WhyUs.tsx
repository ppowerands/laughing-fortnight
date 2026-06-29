'use client';
import { Clock, Shield, Truck, Star } from 'lucide-react';

export default function WhyUs() {
  const features = [
    { icon: Clock, title: 'Fast Delivery', desc: 'Hot food delivered in 30-45 minutes', color: 'text-blue-600' },
    { icon: Star, title: 'Quality Food', desc: 'Freshly prepared with the finest Nigerian ingredients', color: 'text-yellow-500' },
    { icon: Truck, title: 'Wide Coverage', desc: 'Delivering across all major areas in Kaduna', color: 'text-green-600' },
    { icon: Shield, title: 'Secure Payment', desc: 'Pay safely via bank transfer or cash on delivery', color: 'text-purple-600' },
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-title">Why Choose Food Palace?</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">Committed to the best Nigerian food experience</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-6 text-center hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
