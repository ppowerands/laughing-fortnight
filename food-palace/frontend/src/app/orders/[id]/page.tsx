'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import Navbar from '@/components/Navbar';
import { toast } from 'react-hot-toast';
import { CheckCircle, Clock, Truck, XCircle, Package, MapPin, CreditCard, ArrowLeft } from 'lucide-react';

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  PREPARING: { label: 'Preparing', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  PICKED_UP: { label: 'Picked Up', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600' },
  PAID: { label: 'Paid', color: 'text-green-600' },
  FAILED: { label: 'Failed', color: 'text-red-600' },
  REFUNDED: { label: 'Refunded', color: 'text-gray-600' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Confirmation', color: 'text-orange-600' },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orderId = params.id as string;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOne(orderId),
    enabled: !!orderId && !!user,
  });

  const order = response?.data;

  const cancelOrderMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Order Not Found</h2>
            <p className="text-red-600 mt-2">We couldn't find this order. It may have been removed.</p>
            <button
              onClick={() => router.push('/orders')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View All Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusInfo = statusConfig[order.status] || statusConfig.PENDING;
  const paymentInfo = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
  const isCancellable = ['PENDING', 'PREPARING'].includes(order.status) && order.paymentStatus !== 'PAID';

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber || order.id}</h1>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className={`font-medium ${paymentInfo.color}`}>{paymentInfo.label}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fulfillment</p>
              <p className="font-medium">{order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6 border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Items
          </h2>
          <div className="divide-y">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.variant && (
                      <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                    )}
                  </div>
                </div>
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-blue-600">${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.fulfillmentType === 'DELIVERY' && order.deliveryAddress ? (
          <div className="bg-white shadow rounded-lg p-6 mb-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </h2>
            <p>{order.deliveryAddress.street}</p>
            <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zip}</p>
            <p>{order.deliveryAddress.country}</p>
          </div>
        ) : order.fulfillmentType === 'PICKUP' && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pickup Information
            </h2>
            <p className="text-gray-600">Order ready for pickup at our store location.</p>
            <p className="text-sm text-gray-500 mt-2">Please bring your order confirmation.</p>
          </div>
        )}

        {order.payment && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">Method</p>
              <p className="font-medium">{order.payment.method || 'N/A'}</p>
              <p className="text-gray-500">Status</p>
              <p className={`font-medium ${paymentInfo.color}`}>{paymentInfo.label}</p>
              {order.payment.transactionId && (
                <>
                  <p className="text-gray-500">Transaction ID</p>
                  <p className="font-mono text-sm">{order.payment.transactionId}</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-6">
          {isCancellable && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this order?')) {
                  cancelOrderMutation.mutate();
                }
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          
          <button
            onClick={() => window.print()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Print Receipt
          </button>
          
          <Link href="/orders" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Back to Orders
          </Link>
        </div>
      </div>
    </>
  );
}
