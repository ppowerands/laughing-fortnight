'use client';
import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Eye, Filter, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const payColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  AWAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState('');
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
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => ordersApi.updatePayment(id, { status, notes }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'CONFIRMED' ? '✅ Payment confirmed! Order is now being prepared.' : '❌ Payment rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
      setRejectionNote('');
    },
    onError: () => toast.error('Failed to update payment'),
  });

  const pendingPayments = orders.filter((o: any) => o.paymentStatus === 'AWAITING_CONFIRMATION').length;

  return (
    <div className="space-y-4">
      {pendingPayments > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-yellow-700 dark:text-yellow-400 font-semibold text-sm">
            {pendingPayments} order{pendingPayments !== 1 ? 's' : ''} awaiting payment confirmation!
          </p>
          <button onClick={() => setPaymentFilter('AWAITING_CONFIRMATION')} className="ml-auto text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700">View</button>
        </div>
      )}

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
        <span className="text-sm text-gray-400 ml-auto">{data?.total || 0} orders</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Order #','Customer','Total','Type','Payment','Status','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-5 w-full rounded" /></td></tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : orders.map((order: any) => (
                <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${order.paymentStatus === 'AWAITING_CONFIRMATION' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">#{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white text-xs">{order.user?.name || 'Unknown'}</p>
                    <p className="text-gray-400 text-xs">{order.user?.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₦{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${order.fulfillmentType === 'PICKUP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${payColors[order.paymentStatus] || ''}`}>{order.paymentStatus?.replace(/_/g,' ')}</span>
                    {order.paymentStatus === 'AWAITING_CONFIRMATION' && <Clock className="w-3 h-3 text-yellow-500 inline ml-1 animate-pulse" />}
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[order.status] || ''}`}>{order.status?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-NG')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelectedOrder(order); setRejectionNote(''); }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${order.paymentStatus === 'AWAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100'}`}>
                      <Eye className="w-3.5 h-3.5" /> {order.paymentStatus === 'AWAITING_CONFIRMATION' ? 'Confirm' : 'Manage'}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order #{selectedOrder.orderNumber}</h2>
                <span className={`badge ${selectedOrder.fulfillmentType === 'PICKUP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedOrder.fulfillmentType === 'PICKUP' ? '🏪 Pickup' : '🚚 Delivery'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedOrder.user?.name} · {selectedOrder.user?.phone}</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Items</h3>
                <div className="space-y-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.name}{item.variantName ? ` (${item.variantName})` : ''} ×{item.quantity}</span>
                      <span className="font-medium">₦{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400 border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <span>Total (incl. delivery)</span>
                    <span>₦{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {selectedOrder.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery Address'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.deliveryAddress}</p>
                {selectedOrder.deliveryNotes && <p className="text-xs text-gray-400 italic mt-1">"{selectedOrder.deliveryNotes}"</p>}
              </div>

              {/* Payment Confirmation Section */}
              {selectedOrder.paymentStatus === 'AWAITING_CONFIRMATION' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Payment Awaiting Confirmation</h3>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                    Customer claims to have transferred <strong>₦{selectedOrder.total.toLocaleString()}</strong> to your Moniepoint account. Please verify in your bank app before confirming.
                  </p>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rejection reason (optional)</label>
                    <input value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} placeholder="e.g. Payment not received" className="input text-sm !py-2" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: 'CONFIRMED' })}
                      disabled={updatePaymentMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors">
                      {updatePaymentMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      ✅ Confirm Payment
                    </button>
                    <button onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: 'REJECTED', notes: rejectionNote })}
                      disabled={updatePaymentMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors">
                      {updatePaymentMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                      ❌ Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.paymentStatus === 'CONFIRMED' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Payment confirmed ✓</p>
                </div>
              )}

              {selectedOrder.paymentStatus === 'REJECTED' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 rounded-xl p-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Payment rejected</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Update Order Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s => (
                    <button key={s} onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: s })}
                      disabled={selectedOrder.status === s || updateStatusMutation.isPending}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${selectedOrder.status === s ? 'bg-blue-700 text-white' : 'border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400'}`}>
                      {s.replace(/_/g,' ')}
                    </button>
                  ))}
                </div>
              </div>
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
