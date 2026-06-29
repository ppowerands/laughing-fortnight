'use client';
import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Eye, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', PREPARING: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};
const payColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600', AWAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter, paymentFilter, page],
    queryFn: () => ordersApi.getAll({ status: statusFilter || undefined, paymentStatus: paymentFilter || undefined, page, limit: 20 }).then(r => r.data),
    refetchInterval: 20000,
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Order status updated'); queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); setSelectedOrder(null); },
    onError: () => toast.error('Failed to update status'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updatePayment(id, { status }),
    onSuccess: () => { toast.success('Payment updated'); queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); setSelectedOrder(null); },
    onError: () => toast.error('Failed to update payment'),
  });

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Filter className="w-4 h-4" /> Filter:
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm">
          <option value="">All Statuses</option>
          {['PENDING','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm">
          <option value="">All Payments</option>
          {['AWAITING_CONFIRMATION','CONFIRMED','REJECTED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <span className="text-sm text-gray-400 ml-auto">{data?.total || 0} total orders</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Order #','Customer','Total','Payment','Status','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 w-full rounded" /></td></tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">#{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white text-xs">{order.user?.name}</p>
                    <p className="text-gray-400 text-xs">{order.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₦{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-500">{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash' : 'Transfer'}</p>
                    <span className={`badge mt-0.5 ${payColors[order.paymentStatus] || ''}`}>{order.paymentStatus?.replace(/_/g,' ')}</span>
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[order.status] || ''}`}>{order.status?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-NG')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-700 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order #{selectedOrder.orderNumber}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.user?.name} · {selectedOrder.user?.phone}</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Items</h3>
                <div className="space-y-1.5">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.name}{item.variantName ? ` (${item.variantName})` : ''} ×{item.quantity}</span>
                      <span className="font-medium">₦{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400 border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                    <span>Total</span><span>₦{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Delivery Address</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.deliveryAddress}</p>
                {selectedOrder.deliveryNotes && <p className="text-xs text-gray-400 italic mt-1">"{selectedOrder.deliveryNotes}"</p>}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Update Order Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s => (
                    <button key={s} onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: s })}
                      disabled={selectedOrder.status === s || updateStatusMutation.isPending}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${selectedOrder.status === s ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400'}`}>
                      {s.replace(/_/g,' ')}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrder.paymentMethod === 'BANK_TRANSFER' && selectedOrder.paymentStatus === 'AWAITING_CONFIRMATION' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Payment</h3>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 mb-3">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">Customer claims to have paid <strong>₦{selectedOrder.total.toLocaleString()}</strong></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: 'CONFIRMED' })}
                      disabled={updatePaymentMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                      <CheckCircle className="w-4 h-4" /> Confirm Payment
                    </button>
                    <button onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: 'REJECTED' })}
                      disabled={updatePaymentMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return <Suspense><OrdersContent /></Suspense>;
}
