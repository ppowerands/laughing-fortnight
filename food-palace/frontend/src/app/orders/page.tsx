'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

const statusIcons: Record<string, any> = { PENDING: Clock, PREPARING: Package, OUT_FOR_DELIVERY: Truck, DELIVERED: CheckCircle, CANCELLED: XCircle };
const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-600 bg-yellow-50', PREPARING: 'text-blue-600 bg-blue-50',
  OUT_FOR_DELIVERY: 'text-purple-600 bg-purple-50', DELIVERED: 'text-green-600 bg-green-50', CANCELLED: 'text-red-600 bg-red-50',
};

export default function MyOrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders().then(r => r.data),
    enabled: isAuthenticated,
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Place your first order today!</p>
            <Link href="/menu" className="btn-primary">Browse Menu</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const Icon = statusIcons[order.status] || Clock;
              const color = statusColors[order.status] || statusColors.PENDING;
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">#{order.orderNumber}</p>
                      <span className="font-black text-blue-700 dark:text-blue-400 text-sm">₦{order.total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString('en-NG')}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${color}`}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
