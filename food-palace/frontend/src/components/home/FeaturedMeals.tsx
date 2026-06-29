'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { productsApi } from '@/lib/api';
import FoodCard from '@/components/FoodCard';

export default function FeaturedMeals() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsApi.getAll({ featured: 'true' }).then(r => r.data),
  });

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-title">Featured Meals</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Our most loved dishes</p>
          </div>
          <Link href="/menu" className="hidden sm:flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-sm hover:gap-3 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((p: any) => <FoodCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="text-center mt-8 sm:hidden">
          <Link href="/menu" className="btn-outline inline-flex items-center gap-2">View Full Menu <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </section>
  );
}
