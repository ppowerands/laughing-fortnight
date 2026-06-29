'use client';
import { useCartStore } from '@/lib/cart-store';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const cartTotal = total();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Your Cart</h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add some delicious meals to get started</p>
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">Browse Menu <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="card p-4 flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🍽️</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h3>
                    {item.variantName && <p className="text-xs text-gray-500 dark:text-gray-400">{item.variantName}</p>}
                    {item.addons.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">+ {item.addons.map(a => a.name).join(', ')}</p>}
                    <p className="text-blue-700 dark:text-blue-400 font-bold text-sm mt-1">₦{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="ml-2 p-1 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-6 h-fit sticky top-24">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate pr-2">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900 dark:text-white shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white">
                  <span>Subtotal</span>
                  <span className="text-blue-700 dark:text-blue-400">₦{cartTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Delivery fee calculated at checkout</p>
              </div>
              <Link href="/checkout" className="btn-primary w-full text-center block">Proceed to Checkout</Link>
              <Link href="/menu" className="mt-3 block text-center text-sm text-blue-700 dark:text-blue-400 hover:underline">+ Add more items</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
