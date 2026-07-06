'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Truck, Package, XCircle, MessageCircle, Copy, Store } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600', icon: Clock, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  PREPARING: { label: 'Preparing', color: 'text-blue-600', icon: Package, bg: 'bg-blue-50 dark:bg-blue-900/20' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-600', icon: Truck, bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DELIVERED: { label: 'Delivered', color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Awaiting Payment', color: 'text-yellow-600' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Admin Verification', color: 'text-blue-600' },
  CONFIRMED: { label: 'Confirmed ✓', color: 'text-green-600' },
  REJECTED: { label: 'Rejected', color: 'text-red-600' },
};

function CountdownTimer({ autoCancelAt, onExpired }: { autoCancelAt: string; onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const cancelTime = new Date(autoCancelAt).getTime();
    const totalTime = 30 * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = cancelTime - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('00:00');
        setPercentage(0);
        clearInterval(interval);
        onExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      setPercentage(Math.max(0, (diff / totalTime) * 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCancelAt, onExpired]);

  const color = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

  if (expired) return (
    <div className="mt-3 p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20">
      <p className="text-sm font-bold text-red-600 text-center">⏰ Payment time expired — order has been cancelled</p>
    </div>
  );

  return (
    <div className="mt-3 p-4 rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-900/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Time remaining to pay:</span>
        </div>
        <span className="text-2xl font-black text-orange-700 dark:text-orange-400 font-mono">{timeLeft}</span>
      </div>
      <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">Order will be automatically cancelled if payment is not completed</p>
    </div>
  );
}

function OrderContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isBankTransfer = searchParams.get('payment') === 'bank-transfer';
  const fulfillmentType = searchParams.get('type') || 'DELIVERY';
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOne(id as string).then(r => r.data),
    refetchInterval: 10000,
  });

  const markPaidMutation = useMutation({
    mutationFn: () => ordersApi.markPaymentMade(id as string),
    onSuccess: () => {
      toast.success('✅ Payment confirmation sent! Admin will verify shortly.');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to send confirmation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(id as string),
    onSuccess: () => { 
      toast.success('Order cancelled'); 
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Cannot cancel this order'),
  });

  const handleTimerExpired = () => {
    setTimerExpired(true);
    toast.error('⏰ Payment time has expired! Order cancelled.');
    setTimeout(() => refetch(), 3000);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 max-w-2xl mx-auto px-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return null;

  // Helper function to get the correct status label based on order type
  const getStatusLabel = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupLabels: Record<string, string> = {
        'PENDING': 'Pending',
        'PREPARING': 'Preparing',
        'OUT_FOR_DELIVERY': 'Ready for Pickup',
        'DELIVERED': 'Picked Up',
        'CANCELLED': 'Cancelled',
      };
      return pickupLabels[status] || status;
    }
    
    return statusConfig[status]?.label || status;
  };

  const getStatusColor = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupColors: Record<string, string> = {
        'PENDING': 'text-yellow-600',
        'PREPARING': 'text-blue-600',
        'OUT_FOR_DELIVERY': 'text-orange-600',
        'DELIVERED': 'text-green-600',
        'CANCELLED': 'text-red-600',
      };
      return pickupColors[status] || 'text-gray-600';
    }
    
    return statusConfig[status]?.color || 'text-gray-600';
  };

  const getStatusBg = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupBg: Record<string, string> = {
        'PENDING': 'bg-yellow-50 dark:bg-yellow-900/20',
        'PREPARING': 'bg-blue-50 dark:bg-blue-900/20',
        'OUT_FOR_DELIVERY': 'bg-orange-50 dark:bg-orange-900/20',
        'DELIVERED': 'bg-green-50 dark:bg-green-900/20',
        'CANCELLED': 'bg-red-50 dark:bg-red-900/20',
      };
      return pickupBg[status] || 'bg-gray-50 dark:bg-gray-900/20';
    }
    
    return statusConfig[status]?.bg || 'bg-gray-50 dark:bg-gray-900/20';
  };

  const getStatusIcon = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupIcons: Record<string, any> = {
        'PENDING': Clock,
        'PREPARING': Package,
        'OUT_FOR_DELIVERY': Store,
        'DELIVERED': CheckCircle,
        'CANCELLED': XCircle,
      };
      return pickupIcons[status] || Package;
    }
    
    return statusConfig[status]?.icon || Package;
  };

  const statusLabel = getStatusLabel(order);
  const statusColor = getStatusColor(order);
  const statusBg = getStatusBg(order);
  const StatusIcon = getStatusIcon(order);
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
  const isPickup = order.fulfillmentType === 'PICKUP' || order.deliveryAddress?.includes('PICKUP');
  const canCancel = !['DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'CONFIRMED';
  
  const showTimer = order.paymentMethod === 'BANK_TRANSFER' && 
    order.autoCancelAt && 
    order.paymentStatus === 'PENDING' && 
    order.status !== 'CANCELLED' && 
    !isPickup;

  const showPayButton = order.paymentMethod === 'BANK_TRANSFER' && 
    order.paymentStatus === 'PENDING' && 
    order.status !== 'CANCELLED';

  const whatsappText = encodeURIComponent(`Hi Food Palace! Order #${order.orderNumber} for ₦${order.total.toLocaleString()}. Items: ${order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}.`);
  const whatsappLink = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP || '+2348000000000').replace(/[^0-9]/g, '')}?text=${whatsappText}`;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {isBankTransfer && order.status !== 'CANCELLED' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h2 className="font-bold text-green-800 dark:text-green-300 text-lg">Order Placed Successfully!</h2>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              {isPickup ? 'Transfer payment then come pick up your order' : 'You have 30 minutes to complete your bank transfer'}
            </p>
          </div>
        )}

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white">#{order.orderNumber}</h1>
                <button 
                  onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Copied!'); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('en-NG')}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${statusBg}`}>
                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
              </div>
              <span className={`badge ${isPickup ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {isPickup ? '🏪 Pickup' : '🚚 Delivery'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                  {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">₦{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span>{isPickup ? <span className="text-green-600 font-medium">FREE</span> : `₦${order.deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-black text-blue-700 dark:text-blue-400 text-lg border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span>Total</span><span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            {isPickup ? <><Store className="w-4 h-4" /> Pickup Details</> : <><Truck className="w-4 h-4" /> Delivery Details</>}
          </h3>
          {isPickup ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">Come pick up your order from our restaurant when it's ready. We'll notify you!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">📍 {order.deliveryAddress}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryAddress}</p>
              {order.deliveryArea && <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryArea}</p>}
              {order.deliveryNotes && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">Note: {order.deliveryNotes}</p>}
            </>
          )}
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Payment</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Method</span>
            <span className="font-medium">Bank Transfer</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${paymentStatus.color}`}>{paymentStatus.label}</span>
          </div>

          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'CONFIRMED' && order.status !== 'CANCELLED' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-3">Transfer Details</p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bank:</span>
                  <span className="font-bold">MONIEPOINT MFB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-bold">USMAN SAMBO MARAFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account:</span>
                  <span className="font-black text-blue-700 text-lg tracking-widest">9110064364</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-black text-blue-700">₦{order.total.toLocaleString()}</span>
                </div>
              </div>

              {showTimer && (
                <CountdownTimer autoCancelAt={order.autoCancelAt} onExpired={handleTimerExpired} />
              )}

              {order.paymentStatus === 'PENDING' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                    ⏳ Please complete your transfer and tap the button below
                  </p>
                </div>
              )}

              {order.paymentStatus === 'AWAITING_CONFIRMATION' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 dark:text-blue-400 text-center font-semibold animate-pulse">
                    ⏳ Waiting for admin to verify your payment...
                  </p>
                </div>
              )}

              {order.paymentStatus === 'REJECTED' && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200">
                  <p className="text-red-600 font-bold text-sm text-center">❌ Payment was rejected</p>
                  <p className="text-xs text-red-500 text-center mt-1">Please contact us via WhatsApp for assistance</p>
                </div>
              )}

              {showPayButton && (
                <div className="mt-3">
                  <button 
                    onClick={() => markPaidMutation.mutate()} 
                    disabled={markPaidMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center gap-2 !py-3"
                  >
                    {markPaidMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    I Have Made the Transfer
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">
                    Tap after completing your bank transfer
                  </p>
                </div>
              )}
            </div>
          )}

          {order.paymentStatus === 'CONFIRMED' && (
            <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-green-700 dark:text-green-400 font-bold text-lg">Payment Confirmed! ✅</p>
                  <p className="text-sm text-green-600 dark:text-green-300">Your order is now being prepared</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-500">
              <div className="flex items-center justify-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-red-700 dark:text-red-400 font-bold text-lg">Order Cancelled ❌</p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {order.paymentStatus === 'REJECTED' ? 'Payment was rejected' : 'Order was cancelled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Support
          </a>
          {canCancel && (
            <button 
              onClick={() => { if (confirm('Cancel this order?')) cancelMutation.mutate(); }}
              disabled={cancelMutation.isPending}
              className="flex-1 py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
          <Link href="/orders" className="flex-1 btn-outline text-center text-sm py-3">My Orders</Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return <Suspense><OrderContent /></Suspense>;
}
EOFcat > food-palace/frontend/src/app/orders/[id]/page.tsx << 'EOF'
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Truck, Package, XCircle, MessageCircle, Copy, Store } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600', icon: Clock, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  PREPARING: { label: 'Preparing', color: 'text-blue-600', icon: Package, bg: 'bg-blue-50 dark:bg-blue-900/20' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-600', icon: Truck, bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DELIVERED: { label: 'Delivered', color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Awaiting Payment', color: 'text-yellow-600' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Admin Verification', color: 'text-blue-600' },
  CONFIRMED: { label: 'Confirmed ✓', color: 'text-green-600' },
  REJECTED: { label: 'Rejected', color: 'text-red-600' },
};

function CountdownTimer({ autoCancelAt, onExpired }: { autoCancelAt: string; onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const cancelTime = new Date(autoCancelAt).getTime();
    const totalTime = 30 * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = cancelTime - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('00:00');
        setPercentage(0);
        clearInterval(interval);
        onExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      setPercentage(Math.max(0, (diff / totalTime) * 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCancelAt, onExpired]);

  const color = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

  if (expired) return (
    <div className="mt-3 p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20">
      <p className="text-sm font-bold text-red-600 text-center">⏰ Payment time expired — order has been cancelled</p>
    </div>
  );

  return (
    <div className="mt-3 p-4 rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-900/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Time remaining to pay:</span>
        </div>
        <span className="text-2xl font-black text-orange-700 dark:text-orange-400 font-mono">{timeLeft}</span>
      </div>
      <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">Order will be automatically cancelled if payment is not completed</p>
    </div>
  );
}

function OrderContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isBankTransfer = searchParams.get('payment') === 'bank-transfer';
  const fulfillmentType = searchParams.get('type') || 'DELIVERY';
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOne(id as string).then(r => r.data),
    refetchInterval: 10000,
  });

  const markPaidMutation = useMutation({
    mutationFn: () => ordersApi.markPaymentMade(id as string),
    onSuccess: () => {
      toast.success('✅ Payment confirmation sent! Admin will verify shortly.');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to send confirmation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(id as string),
    onSuccess: () => { 
      toast.success('Order cancelled'); 
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Cannot cancel this order'),
  });

  const handleTimerExpired = () => {
    setTimerExpired(true);
    toast.error('⏰ Payment time has expired! Order cancelled.');
    setTimeout(() => refetch(), 3000);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 max-w-2xl mx-auto px-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return null;

  // Helper function to get the correct status label based on order type
  const getStatusLabel = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupLabels: Record<string, string> = {
        'PENDING': 'Pending',
        'PREPARING': 'Preparing',
        'OUT_FOR_DELIVERY': 'Ready for Pickup',
        'DELIVERED': 'Picked Up',
        'CANCELLED': 'Cancelled',
      };
      return pickupLabels[status] || status;
    }
    
    return statusConfig[status]?.label || status;
  };

  const getStatusColor = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupColors: Record<string, string> = {
        'PENDING': 'text-yellow-600',
        'PREPARING': 'text-blue-600',
        'OUT_FOR_DELIVERY': 'text-orange-600',
        'DELIVERED': 'text-green-600',
        'CANCELLED': 'text-red-600',
      };
      return pickupColors[status] || 'text-gray-600';
    }
    
    return statusConfig[status]?.color || 'text-gray-600';
  };

  const getStatusBg = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupBg: Record<string, string> = {
        'PENDING': 'bg-yellow-50 dark:bg-yellow-900/20',
        'PREPARING': 'bg-blue-50 dark:bg-blue-900/20',
        'OUT_FOR_DELIVERY': 'bg-orange-50 dark:bg-orange-900/20',
        'DELIVERED': 'bg-green-50 dark:bg-green-900/20',
        'CANCELLED': 'bg-red-50 dark:bg-red-900/20',
      };
      return pickupBg[status] || 'bg-gray-50 dark:bg-gray-900/20';
    }
    
    return statusConfig[status]?.bg || 'bg-gray-50 dark:bg-gray-900/20';
  };

  const getStatusIcon = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupIcons: Record<string, any> = {
        'PENDING': Clock,
        'PREPARING': Package,
        'OUT_FOR_DELIVERY': Store,
        'DELIVERED': CheckCircle,
        'CANCELLED': XCircle,
      };
      return pickupIcons[status] || Package;
    }
    
    return statusConfig[status]?.icon || Package;
  };

  const statusLabel = getStatusLabel(order);
  const statusColor = getStatusColor(order);
  const statusBg = getStatusBg(order);
  const StatusIcon = getStatusIcon(order);
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
  const isPickup = order.fulfillmentType === 'PICKUP' || order.deliveryAddress?.includes('PICKUP');
  const canCancel = !['DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'CONFIRMED';
  
  const showTimer = order.paymentMethod === 'BANK_TRANSFER' && 
    order.autoCancelAt && 
    order.paymentStatus === 'PENDING' && 
    order.status !== 'CANCELLED' && 
    !isPickup;

  const showPayButton = order.paymentMethod === 'BANK_TRANSFER' && 
    order.paymentStatus === 'PENDING' && 
    order.status !== 'CANCELLED';

  const whatsappText = encodeURIComponent(`Hi Food Palace! Order #${order.orderNumber} for ₦${order.total.toLocaleString()}. Items: ${order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}.`);
  const whatsappLink = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP || '+2348000000000').replace(/[^0-9]/g, '')}?text=${whatsappText}`;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {isBankTransfer && order.status !== 'CANCELLED' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h2 className="font-bold text-green-800 dark:text-green-300 text-lg">Order Placed Successfully!</h2>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              {isPickup ? 'Transfer payment then come pick up your order' : 'You have 30 minutes to complete your bank transfer'}
            </p>
          </div>
        )}

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white">#{order.orderNumber}</h1>
                <button 
                  onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Copied!'); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('en-NG')}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${statusBg}`}>
                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
              </div>
              <span className={`badge ${isPickup ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {isPickup ? '🏪 Pickup' : '🚚 Delivery'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                  {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">₦{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span>{isPickup ? <span className="text-green-600 font-medium">FREE</span> : `₦${order.deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-black text-blue-700 dark:text-blue-400 text-lg border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span>Total</span><span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            {isPickup ? <><Store className="w-4 h-4" /> Pickup Details</> : <><Truck className="w-4 h-4" /> Delivery Details</>}
          </h3>
          {isPickup ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">Come pick up your order from our restaurant when it's ready. We'll notify you!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">📍 {order.deliveryAddress}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryAddress}</p>
              {order.deliveryArea && <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryArea}</p>}
              {order.deliveryNotes && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">Note: {order.deliveryNotes}</p>}
            </>
          )}
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Payment</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Method</span>
            <span className="font-medium">Bank Transfer</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${paymentStatus.color}`}>{paymentStatus.label}</span>
          </div>

          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'CONFIRMED' && order.status !== 'CANCELLED' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-3">Transfer Details</p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bank:</span>
                  <span className="font-bold">MONIEPOINT MFB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-bold">USMAN SAMBO MARAFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account:</span>
                  <span className="font-black text-blue-700 text-lg tracking-widest">9110064364</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-black text-blue-700">₦{order.total.toLocaleString()}</span>
                </div>
              </div>

              {showTimer && (
                <CountdownTimer autoCancelAt={order.autoCancelAt} onExpired={handleTimerExpired} />
              )}

              {order.paymentStatus === 'PENDING' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                    ⏳ Please complete your transfer and tap the button below
                  </p>
                </div>
              )}

              {order.paymentStatus === 'AWAITING_CONFIRMATION' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 dark:text-blue-400 text-center font-semibold animate-pulse">
                    ⏳ Waiting for admin to verify your payment...
                  </p>
                </div>
              )}

              {order.paymentStatus === 'REJECTED' && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200">
                  <p className="text-red-600 font-bold text-sm text-center">❌ Payment was rejected</p>
                  <p className="text-xs text-red-500 text-center mt-1">Please contact us via WhatsApp for assistance</p>
                </div>
              )}

              {showPayButton && (
                <div className="mt-3">
                  <button 
                    onClick={() => markPaidMutation.mutate()} 
                    disabled={markPaidMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center gap-2 !py-3"
                  >
                    {markPaidMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    I Have Made the Transfer
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">
                    Tap after completing your bank transfer
                  </p>
                </div>
              )}
            </div>
          )}

          {order.paymentStatus === 'CONFIRMED' && (
            <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-green-700 dark:text-green-400 font-bold text-lg">Payment Confirmed! ✅</p>
                  <p className="text-sm text-green-600 dark:text-green-300">Your order is now being prepared</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-500">
              <div className="flex items-center justify-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-red-700 dark:text-red-400 font-bold text-lg">Order Cancelled ❌</p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {order.paymentStatus === 'REJECTED' ? 'Payment was rejected' : 'Order was cancelled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Support
          </a>
          {canCancel && (
            <button 
              onClick={() => { if (confirm('Cancel this order?')) cancelMutation.mutate(); }}
              disabled={cancelMutation.isPending}
              className="flex-1 py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
          <Link href="/orders" className="flex-1 btn-outline text-center text-sm py-3">My Orders</Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return <Suspense><OrderContent /></Suspense>;
}
EOFcat > food-palace/frontend/src/app/orders/[id]/page.tsx << 'EOF'
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Truck, Package, XCircle, MessageCircle, Copy, Store } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600', icon: Clock, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  PREPARING: { label: 'Preparing', color: 'text-blue-600', icon: Package, bg: 'bg-blue-50 dark:bg-blue-900/20' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-600', icon: Truck, bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DELIVERED: { label: 'Delivered', color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Awaiting Payment', color: 'text-yellow-600' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Admin Verification', color: 'text-blue-600' },
  CONFIRMED: { label: 'Confirmed ✓', color: 'text-green-600' },
  REJECTED: { label: 'Rejected', color: 'text-red-600' },
};

function CountdownTimer({ autoCancelAt, onExpired }: { autoCancelAt: string; onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const cancelTime = new Date(autoCancelAt).getTime();
    const totalTime = 30 * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = cancelTime - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('00:00');
        setPercentage(0);
        clearInterval(interval);
        onExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      setPercentage(Math.max(0, (diff / totalTime) * 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCancelAt, onExpired]);

  const color = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

  if (expired) return (
    <div className="mt-3 p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20">
      <p className="text-sm font-bold text-red-600 text-center">⏰ Payment time expired — order has been cancelled</p>
    </div>
  );

  return (
    <div className="mt-3 p-4 rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-900/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Time remaining to pay:</span>
        </div>
        <span className="text-2xl font-black text-orange-700 dark:text-orange-400 font-mono">{timeLeft}</span>
      </div>
      <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">Order will be automatically cancelled if payment is not completed</p>
    </div>
  );
}

function OrderContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isBankTransfer = searchParams.get('payment') === 'bank-transfer';
  const fulfillmentType = searchParams.get('type') || 'DELIVERY';
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOne(id as string).then(r => r.data),
    refetchInterval: 10000,
  });

  const markPaidMutation = useMutation({
    mutationFn: () => ordersApi.markPaymentMade(id as string),
    onSuccess: () => {
      toast.success('✅ Payment confirmation sent! Admin will verify shortly.');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to send confirmation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(id as string),
    onSuccess: () => { 
      toast.success('Order cancelled'); 
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Cannot cancel this order'),
  });

  const handleTimerExpired = () => {
    setTimerExpired(true);
    toast.error('⏰ Payment time has expired! Order cancelled.');
    setTimeout(() => refetch(), 3000);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 max-w-2xl mx-auto px-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return null;

  // Helper function to get the correct status label based on order type
  const getStatusLabel = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupLabels: Record<string, string> = {
        'PENDING': 'Pending',
        'PREPARING': 'Preparing',
        'OUT_FOR_DELIVERY': 'Ready for Pickup',
        'DELIVERED': 'Picked Up',
        'CANCELLED': 'Cancelled',
      };
      return pickupLabels[status] || status;
    }
    
    return statusConfig[status]?.label || status;
  };

  const getStatusColor = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupColors: Record<string, string> = {
        'PENDING': 'text-yellow-600',
        'PREPARING': 'text-blue-600',
        'OUT_FOR_DELIVERY': 'text-orange-600',
        'DELIVERED': 'text-green-600',
        'CANCELLED': 'text-red-600',
      };
      return pickupColors[status] || 'text-gray-600';
    }
    
    return statusConfig[status]?.color || 'text-gray-600';
  };

  const getStatusBg = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupBg: Record<string, string> = {
        'PENDING': 'bg-yellow-50 dark:bg-yellow-900/20',
        'PREPARING': 'bg-blue-50 dark:bg-blue-900/20',
        'OUT_FOR_DELIVERY': 'bg-orange-50 dark:bg-orange-900/20',
        'DELIVERED': 'bg-green-50 dark:bg-green-900/20',
        'CANCELLED': 'bg-red-50 dark:bg-red-900/20',
      };
      return pickupBg[status] || 'bg-gray-50 dark:bg-gray-900/20';
    }
    
    return statusConfig[status]?.bg || 'bg-gray-50 dark:bg-gray-900/20';
  };

  const getStatusIcon = (order: any) => {
    const isPickup = order.fulfillmentType === 'PICKUP';
    const status = order.status;
    
    if (isPickup) {
      const pickupIcons: Record<string, any> = {
        'PENDING': Clock,
        'PREPARING': Package,
        'OUT_FOR_DELIVERY': Store,
        'DELIVERED': CheckCircle,
        'CANCELLED': XCircle,
      };
      return pickupIcons[status] || Package;
    }
    
    return statusConfig[status]?.icon || Package;
  };

  const statusLabel = getStatusLabel(order);
  const statusColor = getStatusColor(order);
  const statusBg = getStatusBg(order);
  const StatusIcon = getStatusIcon(order);
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
  const isPickup = order.fulfillmentType === 'PICKUP' || order.deliveryAddress?.includes('PICKUP');
  const canCancel = !['DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'CONFIRMED';
  
  const showTimer = order.paymentMethod === 'BANK_TRANSFER' && 
    order.autoCancelAt && 
    order.paymentStatus === 'PENDING' && 
    order.status !== 'CANCELLED' && 
    !isPickup;

  const showPayButton = order.paymentMethod === 'BANK_TRANSFER' && 
    order.paymentStatus === 'PENDING' && 
    order.status !== 'CANCELLED';

  const whatsappText = encodeURIComponent(`Hi Food Palace! Order #${order.orderNumber} for ₦${order.total.toLocaleString()}. Items: ${order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}.`);
  const whatsappLink = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP || '+2348000000000').replace(/[^0-9]/g, '')}?text=${whatsappText}`;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {isBankTransfer && order.status !== 'CANCELLED' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h2 className="font-bold text-green-800 dark:text-green-300 text-lg">Order Placed Successfully!</h2>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              {isPickup ? 'Transfer payment then come pick up your order' : 'You have 30 minutes to complete your bank transfer'}
            </p>
          </div>
        )}

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white">#{order.orderNumber}</h1>
                <button 
                  onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Copied!'); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('en-NG')}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${statusBg}`}>
                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
              </div>
              <span className={`badge ${isPickup ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {isPickup ? '🏪 Pickup' : '🚚 Delivery'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                  {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">₦{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span>{isPickup ? <span className="text-green-600 font-medium">FREE</span> : `₦${order.deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-black text-blue-700 dark:text-blue-400 text-lg border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span>Total</span><span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            {isPickup ? <><Store className="w-4 h-4" /> Pickup Details</> : <><Truck className="w-4 h-4" /> Delivery Details</>}
          </h3>
          {isPickup ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">Come pick up your order from our restaurant when it's ready. We'll notify you!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">📍 {order.deliveryAddress}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryAddress}</p>
              {order.deliveryArea && <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryArea}</p>}
              {order.deliveryNotes && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">Note: {order.deliveryNotes}</p>}
            </>
          )}
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Payment</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Method</span>
            <span className="font-medium">Bank Transfer</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${paymentStatus.color}`}>{paymentStatus.label}</span>
          </div>

          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'CONFIRMED' && order.status !== 'CANCELLED' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-3">Transfer Details</p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bank:</span>
                  <span className="font-bold">MONIEPOINT MFB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-bold">USMAN SAMBO MARAFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account:</span>
                  <span className="font-black text-blue-700 text-lg tracking-widest">9110064364</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-black text-blue-700">₦{order.total.toLocaleString()}</span>
                </div>
              </div>

              {showTimer && (
                <CountdownTimer autoCancelAt={order.autoCancelAt} onExpired={handleTimerExpired} />
              )}

              {order.paymentStatus === 'PENDING' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                    ⏳ Please complete your transfer and tap the button below
                  </p>
                </div>
              )}

              {order.paymentStatus === 'AWAITING_CONFIRMATION' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 dark:text-blue-400 text-center font-semibold animate-pulse">
                    ⏳ Waiting for admin to verify your payment...
                  </p>
                </div>
              )}

              {order.paymentStatus === 'REJECTED' && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200">
                  <p className="text-red-600 font-bold text-sm text-center">❌ Payment was rejected</p>
                  <p className="text-xs text-red-500 text-center mt-1">Please contact us via WhatsApp for assistance</p>
                </div>
              )}

              {showPayButton && (
                <div className="mt-3">
                  <button 
                    onClick={() => markPaidMutation.mutate()} 
                    disabled={markPaidMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center gap-2 !py-3"
                  >
                    {markPaidMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    I Have Made the Transfer
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">
                    Tap after completing your bank transfer
                  </p>
                </div>
              )}
            </div>
          )}

          {order.paymentStatus === 'CONFIRMED' && (
            <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-green-700 dark:text-green-400 font-bold text-lg">Payment Confirmed! ✅</p>
                  <p className="text-sm text-green-600 dark:text-green-300">Your order is now being prepared</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-500">
              <div className="flex items-center justify-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-red-700 dark:text-red-400 font-bold text-lg">Order Cancelled ❌</p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {order.paymentStatus === 'REJECTED' ? 'Payment was rejected' : 'Order was cancelled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Support
          </a>
          {canCancel && (
            <button 
              onClick={() => { if (confirm('Cancel this order?')) cancelMutation.mutate(); }}
              disabled={cancelMutation.isPending}
              className="flex-1 py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
          <Link href="/orders" className="flex-1 btn-outline text-center text-sm py-3">My Orders</Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return <Suspense><OrderContent /></Suspense>;
}
