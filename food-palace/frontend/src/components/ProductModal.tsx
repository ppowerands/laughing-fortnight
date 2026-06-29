'use client';
import { useState } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import toast from 'react-hot-toast';

interface Variant { id: string; name: string; price: number; }
interface Addon { id: string; name: string; price: number; }
interface Product {
  id: string; name: string; description?: string; price: number;
  image?: string; hasVariants: boolean; variants: Variant[]; addons: Addon[];
}

export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(product.variants.length > 0 ? product.variants[0] : null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev => prev.find(a => a.id === addon.id) ? prev.filter(a => a.id !== addon.id) : [...prev, addon]);
  };

  const handleAdd = () => {
    addItem({ productId: product.id, variantId: selectedVariant?.id, name: product.name, variantName: selectedVariant?.name, price: unitPrice, image: product.image, quantity, addons: selectedAddons });
    toast.success(`${product.name} added to cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
              {product.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.description}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {product.variants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Choose Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedVariant?.id === v.id ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{v.name}</div>
                    <div className="text-blue-700 dark:text-blue-400 text-sm font-bold">₦{v.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.addons.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Extras & Add-ons</h3>
              <div className="space-y-2">
                {product.addons.map((addon) => {
                  const checked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <label key={addon.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={checked} onChange={() => toggleAddon(addon)} className="sr-only" />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'border-blue-700 bg-blue-700' : 'border-gray-300'}`}>
                          {checked && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-sm text-gray-800 dark:text-gray-200">{addon.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{addon.price > 0 ? `+₦${addon.price.toLocaleString()}` : 'Free'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Quantity</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl border-2 border-blue-700 bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4">
          <button onClick={handleAdd} className="w-full btn-primary flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart — ₦{totalPrice.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}
