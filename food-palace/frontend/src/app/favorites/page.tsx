'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FoodCard from '@/components/FoodCard';
import { productsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated]);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => productsApi.getFavorites().then(r => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">My Favorites</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No favorites yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Tap the heart icon on any meal to save it here</p>
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
              Browse Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((p: any) => <FoodCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
