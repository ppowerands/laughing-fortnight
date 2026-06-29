'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MapPin, CreditCard, Banknote, CheckCircle, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { deliveryApi, ordersApi, settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'BANK_TRANSFER'>('CASH_ON_DELIVERY');
  const [loading, setLoading] = useState(false);
  const cartTotal = total();

  const { data: zones = [] } = useQuery({ queryKey: ['delivery-zones'], queryFn: () => deliveryApi.getZones().then(r => r.data) });
  const { data: settings } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });

  useEffect(() => { if (!isAuthenticated) router.push('/login?redirect=/checkout'); }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  if (items.length === 0) return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 text-center py-16">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Link href="/menu" className="btn-primary">Browse Menu</Link>
      </div>
    </main>
  );

  const deliveryFee = selectedZone?.deliveryFee || 0;
  const orderTotal = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!address.trim()) return toast.error('Please enter your delivery address');
    if (!selectedZone) return toast.error('Please select your delivery area');
    if (!settings?.isOpenNow) return toast.error('Sorry, we are currently closed.');
    setLoading(true);
    try {
      const res = await ordersApi.place({
        items: items.map(item => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, addons: item.addons })),
        deliveryAddress: address, deliveryArea: selectedArea, zoneId: selectedZone.id, paymentMethod, deliveryNotes,
      });
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${res.data.id}?${paymentMethod === 'BANK_TRANSFER' ? 'payment=bank-transfer' : 'success=true'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-8">Checkout</h1>

        {settings && !settings.isOpenNow && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">We are currently closed. Orders can be placed during {settings.openTime}–{settings.closeTime}.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-700" /> Delivery Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Address *</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="House number, Street name..." className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Area *</label>
                  <div className="space-y-2">
                    {zones.map((zone: any) => (
                      <div key={zone.id} className={`border-2 rounded-xl transition-all ${selectedZone?.id === zone.id ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                        <button type="button" onClick={() => { setSelectedZone(zone); setSelectedArea(''); }} className="w-full p-3 text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">{zone.name}</span>
                              <span className="ml-2 text-xs text-gray-500">· ₦{zone.deliveryFee.toLocaleString()} · {zone.estimatedTime}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${selectedZone?.id === zone.id ? 'border-blue-700 bg-blue-700' : 'border-gray-300'}`} />
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {zone.areas.map((a: any) => <span key={a.id} className="text-xs text-gray-500 dark:text-gray-400">{a.name},</span>)}
                          </div>
                        </button>
                        {selectedZone?.id === zone.id && (
                          <div className="px-3 pb-3">
                            <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="input text-sm">
                              <option value="">Select nearest area</option>
                              {zone.areas.map((a: any) => <option key={a.id} value={a.name}>{a.name}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Notes (optional)</label>
                  <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder='e.g. "Call when outside gate"' rows={2} className="input resize-none" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-700" /> Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: Banknote },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer', desc: 'Transfer to our Moniepoint account', icon: CreditCard },
                ].map(({ value, label, desc, icon: Icon }) => (
                  <label key={value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === value ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                    <input type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value as any)} className="sr-only" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === value ? 'bg-blue-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Icon className={`w-5 h-5 ${paymentMethod === value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === value ? 'border-blue-700 bg-blue-700' : 'border-gray-300'}`}>
                      {paymentMethod === value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3 uppercase tracking-wide">Bank Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Bank Name:</span><span className="font-bold text-gray-900 dark:text-white">MONIEPOINT MFB</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Account Name:</span><span className="font-bold text-gray-900 dark:text-white">USMAN SAMBO MARAFA</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Account Number:</span><span className="font-bold text-blue-700 dark:text-blue-400 text-lg tracking-widest">9110064364</span></div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">After placing order, transfer the exact amount then tap I Have Made Payment</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 h-fit sticky top-24">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto scrollbar-hide">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 truncate pr-2">{item.name}{item.variantName ? ` (${item.variantName})` : ''} ×{item.quantity}</span>
                  <span className="shrink-0 font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span>₦{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-gray-400' : 'font-medium'}>{deliveryFee === 0 ? 'Select area' : `₦${deliveryFee.toLocaleString()}`}</span>
              </div>
              {selectedZone && <div className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> Est: {selectedZone.estimatedTime}</div>}
              <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                <span>Total</span><span className="text-blue-700 dark:text-blue-400">₦{orderTotal.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading || !settings?.isOpenNow}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Place Order</>}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
