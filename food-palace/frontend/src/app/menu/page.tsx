'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FoodCard from '@/components/FoodCard';
import { productsApi, categoriesApi } from '@/lib/api';

const categoryEmojis: Record<string, string> = {
  'main-meals': '🍛', 'burgers-shawarma': '🌯', 'soups-swallow': '🍲',
  'sides': '🍟', 'drinks': '🥤', 'desserts': '🍦',
};

function MenuContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState('');

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll().then(r => r.data) });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory, search],
    queryFn: () => productsApi.getAll({ ...(selectedCategory && { category: selectedCategory }), ...(search && { search }) }).then(r => r.data),
    staleTime: 30000,
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Our Menu</h1>
          <p className="text-blue-200">Explore our full range of Nigerian cuisine</p>
          <div className="mt-6 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals..."
              className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-800 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-8">
          <button onClick={() => setSelectedCategory('')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!selectedCategory ? 'bg-blue-700 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-blue-500'}`}>
            All Items
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${selectedCategory === cat.slug ? 'bg-blue-700 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-blue-500'}`}>
              <span>{categoryEmojis[cat.slug] || '🍽️'}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {!isLoading && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{products.length} item{products.length !== 1 ? 's' : ''} found</p>}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No meals found</h3>
            <button onClick={() => { setSearch(''); setSelectedCategory(''); }} className="mt-4 btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p: any) => <FoodCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function MenuPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-32 h-8 rounded-xl" /></div>}><MenuContent /></Suspense>;
}
