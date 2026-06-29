'use client';
import { useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Truck, Package, XCircle, MessageCircle, Copy } from 'lucide-react';
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
  PENDING: { label: 'Pending', color: 'text-yellow-600' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Confirmation', color: 'text-blue-600' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-600' },
  REJECTED: { label: 'Rejected', color: 'text-red-600' },
};

function OrderContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isBankTransfer = searchParams.get('payment') === 'bank-transfer';
  const isSuccess = searchParams.get('success') === 'true';
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOne(id as string).then(r => r.data),
    refetchInterval: 30000,
  });

  const markPaidMutation = useMutation({
    mutationFn: () => ordersApi.markPaymentMade(id as string),
    onSuccess: () => { toast.success('Payment confirmation sent!'); queryClient.invalidateQueries({ queryKey: ['order', id] }); },
    onError: () => toast.error('Failed to confirm payment'),
  });

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

  const status = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
  const whatsappText = encodeURIComponent(`Hi Food Palace! Order #${order.orderNumber} for ₦${order.total.toLocaleString()}. Items: ${order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}. Delivery: ${order.deliveryAddress}`);
  const whatsappLink = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP || '+2348000000000').replace(/[^0-9]/g, '')}?text=${whatsappText}`;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {(isSuccess || isBankTransfer) && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h2 className="font-bold text-green-800 dark:text-green-300 text-lg">Order Placed Successfully!</h2>
            {isBankTransfer && <p className="text-green-700 dark:text-green-400 text-sm mt-1">Please complete your bank transfer then tap I Have Made Payment</p>}
          </div>
        )}

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white">#{order.orderNumber}</h1>
                <button onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Copied!'); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('en-NG')}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${status.bg}`}>
              <StatusIcon className={`w-4 h-4 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
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
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Delivery Fee</span><span>₦{order.deliveryFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-black text-blue-700 dark:text-blue-400 text-lg border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span>Total</span><span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Payment</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Method</span>
            <span className="font-medium">{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Bank Transfer'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${paymentStatus.color}`}>{paymentStatus.label}</span>
          </div>

          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'CONFIRMED' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="font-bold text-gray-900 dark:text-white">MONIEPOINT MFB</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">USMAN SAMBO MARAFA</p>
              <p className="text-xl font-black text-blue-700 dark:text-blue-400 tracking-widest">9110064364</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-bold mt-1">Amount: ₦{order.total.toLocaleString()}</p>
              {order.paymentStatus === 'PENDING' && (
                <button onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending}
                  className="mt-3 w-full btn-primary flex items-center justify-center gap-2 !py-2.5 text-sm">
                  {markPaidMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  I Have Made Payment
                </button>
              )}
              {order.paymentStatus === 'AWAITING_CONFIRMATION' && (
                <div className="mt-3 text-center text-sm text-blue-700 dark:text-blue-400 font-medium">Payment confirmation sent — awaiting admin review</div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm">
            <MessageCircle className="w-4 h-4" /> WhatsApp Support
          </a>
          <Link href="/orders" className="flex-1 btn-outline text-center text-sm py-3">My Orders</Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return <Suspense><OrderContent /></Suspense>;
}
