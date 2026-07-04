'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { categoriesApi } from '@/lib/api';

const categoryEmojis: Record<string, string> = {
  'main-meals': '🍛', 'burgers-shawarma': '🌯', 'soups-swallow': '🍲',
  'sides': '🍟', 'drinks': '🥤', 'desserts': '🍦', 'cake': '🍰', 'snack & pastries': '🥐', 'hot tea': '🫖',
};

export default function CategorySection() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(r => r.data),
  });

  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">Browse by Category</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Find exactly what you are craving</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />) : (
            categories.map((cat: any) => (
              <Link key={cat.id} href={`/menu?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-200">{categoryEmojis[cat.slug] || '🍽️'}</div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight">{cat.name}</span>
                <span className="text-xs text-gray-400">{cat._count?.products || 0} items</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
