'use client';
import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { productsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import ProductModal from './ProductModal';

interface Product {
  id: string; name: string; description?: string; price: number;
  image?: string; inStock: boolean; hasVariants: boolean;
  category: { name: string; slug: string };
  variants: { id: string; name: string; price: number }[];
  addons: { id: string; name: string; price: number }[];
}

export default function FoodCard({ product }: { product: Product }) {
  const [showModal, setShowModal] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const imageUrl = product.image ? (product.image.startsWith('http') ? product.image : `${API_URL}${product.image}`) : null;

  const handleAddToCart = () => {
    if (!product.inStock) return;
    if (product.hasVariants || product.addons.length > 0) { setShowModal(true); return; }
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, addons: [] });
    toast.success(`${product.name} added to cart!`);
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) return toast.error('Please login to save favorites');
    try {
      const res = await productsApi.toggleFavorite(product.id);
      setFavorited(res.data.favorited);
      toast.success(res.data.favorited ? 'Added to favorites!' : 'Removed from favorites');
    } catch { toast.error('Failed to update favorites'); }
  };

  return (
    <>
      <div className={`card group overflow-hidden flex flex-col ${!product.inStock ? 'opacity-75' : ''}`}>
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl">🍽️</span></div>
          )}
          {!product.inStock && (
            <div className="absolute top-3 left-3"><span className="badge bg-red-100 text-red-700">Out of Stock</span></div>
          )}
          <button onClick={handleFavorite} className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow transition-all hover:scale-110">
            <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="mb-1"><span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{product.category.name}</span></div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">{product.name}</h3>
          {product.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">{product.description}</p>}

          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg font-black text-blue-700 dark:text-blue-400">
              ₦{(product.hasVariants && product.variants.length > 0 ? Math.min(...product.variants.map(v => v.price)) : product.price).toLocaleString()}
            </span>
            <button onClick={handleAddToCart} disabled={!product.inStock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${product.inStock ? 'bg-blue-700 hover:bg-blue-800 text-white active:scale-95' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
              <Plus className="w-4 h-4" />
              {product.hasVariants ? 'Customize' : 'Add'}
            </button>
          </div>
        </div>
      </div>
      {showModal && <ProductModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
}
