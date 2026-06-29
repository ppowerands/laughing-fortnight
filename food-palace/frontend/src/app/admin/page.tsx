'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ShoppingBag, TrendingUp, Users, Package, AlertCircle, ArrowRight, DollarSign } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  });

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];
  const revenueChart = data?.revenueChart || [];
  const topProducts = data?.topProducts || [];
  const maxRevenue = Math.max(...revenueChart.map((d: any) => d.revenue), 1);

  const statCards = [
    { label: "Today's Revenue", value: stats ? `₦${stats.todayRevenue.toLocaleString()}` : '—', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Total Revenue', value: stats ? `₦${stats.totalRevenue.toLocaleString()}` : '—', icon: TrendingUp, color: 'bg-blue-700' },
    { label: "Today's Orders", value: stats?.todayOrders ?? '—', icon: ShoppingBag, color: 'bg-purple-600' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: Package, color: 'bg-orange-500' },
    { label: 'Customers', value: stats?.totalUsers ?? '—', icon: Users, color: 'bg-teal-600' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? '—', icon: AlertCircle, color: 'bg-red-500' },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700', PREPARING: 'bg-blue-100 text-blue-700',
    OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            {isLoading ? <div className="skeleton h-6 w-20 rounded mb-1" /> : <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{value}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-6">Revenue — Last 7 Days</h2>
          <div className="flex items-end gap-2 h-40">
            {revenueChart.map((day: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">₦{day.revenue >= 1000 ? `${(day.revenue/1000).toFixed(0)}k` : day.revenue}</span>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden" style={{ height: '100px' }}>
                  <div className="w-full bg-blue-700 rounded-t-lg transition-all duration-500" style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? '4px' : '0' }} />
                </div>
                <span className="text-xs text-gray-400 text-center leading-tight">{day.date.split(',')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Top Selling Items</h2>
          {topProducts.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data yet</p> : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 text-xs font-black flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p._sum.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No orders yet</div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-2 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">#{order.orderNumber}</td>
                    <td className="px-2 py-3 text-gray-700 dark:text-gray-300">{order.user?.name}</td>
                    <td className="px-2 py-3 text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-2 py-3 font-bold text-gray-900 dark:text-white">₦{order.total.toLocaleString()}</td>
                    <td className="px-2 py-3"><span className={`badge ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status.replace(/_/g, ' ')}</span></td>
                    <td className="px-2 py-3"><Link href={`/admin/orders`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
