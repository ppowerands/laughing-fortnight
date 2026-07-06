'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, X } from 'lucide-react';
import { orderHistoryApi } from '@/lib/api';

const statusColors: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-700',
  PICKED_UP: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const payColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  AWAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  PENDING: 'bg-gray-100 text-gray-600',
};

export default function OrderHistoryPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['order-history', search, status, paymentStatus, fulfillmentType, startDate, endDate, page],
    queryFn: () => orderHistoryApi.getAll({ search: search || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, fulfillmentType: fulfillmentType || undefined, startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 20 }).then(r => r.data),
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  const clearFilters = () => { setSearch(''); setStatus(''); setPaymentStatus(''); setFulfillmentType(''); setStartDate(''); setEndDate(''); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order # or customer..." className="input pl-9 !py-2 text-sm" />
          </div>
          <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-gray-200 hover:border-red-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" /> Clear
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm">
            <option value="">All Statuses</option>
            {['DELIVERED','PICKED_UP','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm">
            <option value="">All Payments</option>
            {['CONFIRMED','REJECTED','AWAITING_CONFIRMATION'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select value={fulfillmentType} onChange={e => { setFulfillmentType(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm">
            <option value="">All Types</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
          </select>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm" />
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input !py-1.5 !px-3 !w-auto text-sm" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{data?.total || 0} completed orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Order #','Customer','Type','Payment','Status','Amount','Date & Time',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : orders.map((order: any) => {
                const isPickup = order.fulfillmentType === 'PICKUP' || order.deliveryAddress?.includes('PICKUP');
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">#{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs text-gray-900 dark:text-white">{order.user?.name}</p>
                      <p className="text-gray-400 text-xs">{order.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${isPickup ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isPickup ? '🏪 Pickup' : '🚚 Delivery'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${payColors[order.paymentStatus] || ''}`}>{order.paymentStatus?.replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3"><span className={`badge ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status?.replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₦{order.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(order)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order #{selected.orderNumber}</h2>
              <p className="text-sm text-gray-500">{selected.user?.name} · {selected.user?.email}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`badge ${statusColors[selected.status] || ''}`}>{selected.status?.replace(/_/g,' ')}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Payment</p>
                  <span className={`badge ${payColors[selected.paymentStatus] || ''}`}>{selected.paymentStatus?.replace(/_/g,' ')}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Total</p>
                  <p className="font-black text-blue-700">₦{selected.total.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Date</p>
                  <p className="font-medium text-xs">{new Date(selected.createdAt).toLocaleString('en-NG')}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2">Items</p>
                {selected.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 dark:text-gray-400">{item.name}{item.variantName ? ` (${item.variantName})` : ''} ×{item.quantity}</span>
                    <span className="font-medium">₦{item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {selected.deliveryAddress && !selected.deliveryAddress.includes('PICKUP') && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.deliveryAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
