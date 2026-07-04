'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => ordersApi.getAll({ paymentStatus: 'AWAITING_CONFIRMATION', limit: 50 }).then(r => r.data),
    refetchInterval: 15000,
  });

  const orders = data?.orders || [];

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      ordersApi.updatePayment(id, { status, notes }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'CONFIRMED' ? '✅ Payment confirmed! Order is now being prepared.' : '❌ Payment rejected.');
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setSelectedOrder(null);
      setRejectionNote('');
    },
    onError: () => toast.error('Failed to update payment'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Verification</h2>
          {orders.length > 0 && (
            <span className="badge bg-yellow-100 text-yellow-700 animate-pulse">{orders.length} pending</span>
          )}
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {orders.length === 0 && !isLoading ? (
        <div className="card p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">All caught up!</h3>
          <p className="text-gray-500 text-sm">No pending payment verifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />) :
            orders.map((order: any) => (
              <div key={order.id} className="card p-5 border-l-4 border-yellow-400">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
                      <span className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</span>
                      <span className="badge bg-yellow-100 text-yellow-700">Awaiting Verification</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.user?.name} · {order.user?.phone}</p>
                    <p className="text-lg font-black text-blue-700 dark:text-blue-400 mt-1">₦{order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Ordered: {new Date(order.createdAt).toLocaleString('en-NG')}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedOrder(order); setRejectionNote(''); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
                      <Eye className="w-4 h-4" /> View & Verify
                    </button>
                    <button onClick={() => updatePaymentMutation.mutate({ id: order.id, status: 'CONFIRMED' })}
                      disabled={updatePaymentMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
                      <CheckCircle className="w-4 h-4" /> Quick Confirm
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify Payment</h2>
              <p className="text-sm text-gray-500 mt-0.5">Order #{selectedOrder.orderNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Customer Details</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.user?.name}</p>
                <p className="text-sm text-gray-500">{selectedOrder.user?.phone}</p>
                <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Order Items</p>
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 dark:text-gray-400">{item.name} ×{item.quantity}</span>
                    <span className="font-medium">₦{item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-blue-700 border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <span>Total</span><span>₦{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-1">⚠️ Verification Required</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Please check your Moniepoint account to confirm that ₦{selectedOrder.total.toLocaleString()} has been received before confirming.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rejection Reason (if rejecting)</label>
                <input value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} placeholder="e.g. Payment not received" className="input text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: 'CONFIRMED' })}
                  disabled={updatePaymentMutation.isPending}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors">
                  {updatePaymentMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Confirm ✅
                </button>
                <button onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: 'REJECTED', notes: rejectionNote })}
                  disabled={updatePaymentMutation.isPending}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors">
                  {updatePaymentMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Reject ❌
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
