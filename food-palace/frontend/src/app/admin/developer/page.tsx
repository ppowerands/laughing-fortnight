'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield, Database, Activity, Trash2, Bell, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Lock, Server, Wifi, Clock,
  Package, Tags, Users, ShoppingBag, DollarSign, CreditCard
} from 'lucide-react';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('food-palace-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch { return null; }
}

async function apiFetch(path: string, method = 'GET') {
  const token = getToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function StatusBadge({ status }: { status: string }) {
  const ok = ['operational', 'connected'].includes(status);
  return (
    <span className={`flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-green-600' : 'text-red-500'}`}>
      {ok
        ? <CheckCircle className="w-4 h-4" />
        : <XCircle className="w-4 h-4" />}
      {status}
    </span>
  );
}

function DeveloperContent() {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [secret, setSecret] = useState('');
  const [secretError, setSecretError] = useState('');

  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [healthError, setHealthError] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const [confirmAction, setConfirmAction] = useState<null | { id: string; label: string }>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (searchParams.get('secret') === 'foodpalace-dev-2024') setIsAuthorized(true);
  }, [searchParams]);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setHealthError('');
    try {
      const data = await apiFetch('/admin/system-health');
      setHealth(data);
      setLastChecked(new Date());
    } catch (err: any) {
      setHealthError(err.message || 'Failed to fetch health data');
      setHealth({
        system: { backend: 'error', database: 'error', api: 'error' },
        database: null,
      });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchHealth();
    const id = setInterval(fetchHealth, 30000);
    return () => clearInterval(id);
  }, [isAuthorized, fetchHealth]);

  const handleUnlock = () => {
    if (secret === 'foodpalace-dev-2024') {
      setIsAuthorized(true);
      setSecretError('');
    } else {
      setSecretError('Incorrect access key.');
    }
  };

  const runAction = async (actionId: string) => {
    setActionLoading(true);
    setActionResult(null);
    try {
      let result: any;
      if (actionId === 'clear-orders') result = await apiFetch('/admin/maintenance/clear-test-orders', 'DELETE');
      else if (actionId === 'clear-notifications') result = await apiFetch('/admin/maintenance/clear-notifications', 'DELETE');
      setActionResult({ msg: result?.message || 'Action completed!', ok: true });
      fetchHealth();
    } catch (err: any) {
      setActionResult({ msg: err.message || 'Action failed.', ok: false });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── LOCK SCREEN ──────────────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Developer Tools</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter the access key to continue.</p>
          </div>
          <input
            type="password"
            placeholder="Enter access key"
            value={secret}
            onChange={e => { setSecret(e.target.value); setSecretError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {secretError && <p className="text-xs text-red-500 mb-3">{secretError}</p>}
          <button onClick={handleUnlock} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-colors">
            Unlock
          </button>
          <p className="text-xs text-gray-400 text-center mt-4">Contact your administrator for the access key.</p>
        </div>
      </div>
    );
  }

  const db = health?.database;
  const sys = health?.system;

  // ── MAIN DASHBOARD ───────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">

      {/* Warning banner */}
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-700 dark:text-red-400 text-sm">Developer / Maintenance — Restricted Access</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Destructive actions here are permanent. Products, categories, and settings are never affected.</p>
        </div>
      </div>

      {/* Action result toast */}
      {actionResult && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${actionResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {actionResult.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{actionResult.msg}</p>
          <button onClick={() => setActionResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* System Health */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-700" /> System Health
          </h2>
          <button onClick={fetchHealth} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {healthError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Could not reach backend: {healthError}. Check that Render is running and your auth token is valid.</span>
          </div>
        )}

        {loading && !health ? (
          <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { label: 'Backend API', key: 'backend', icon: Server },
              { label: 'Database', key: 'database', icon: Database },
              { label: 'API Endpoints', key: 'api', icon: Wifi },
            ] as const).map(({ label, key, icon: Icon }) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                </div>
                <StatusBadge status={sys?.[key] || 'unknown'} />
              </div>
            ))}
          </div>
        )}

        {lastChecked && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Last checked: {lastChecked.toLocaleString('en-NG')}
          </p>
        )}
      </div>

      {/* Database Stats */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-700" /> Database Information
        </h2>
        {loading && !health ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              { label: 'Total Orders', value: db?.totalOrders, icon: ShoppingBag, color: 'text-blue-700' },
              { label: 'Total Customers', value: db?.totalCustomers, icon: Users, color: 'text-purple-700' },
              { label: 'Total Products', value: db?.totalProducts, icon: Package, color: 'text-green-700' },
              { label: 'Total Categories', value: db?.totalCategories, icon: Tags, color: 'text-orange-700' },
              { label: 'Total Revenue', value: db?.totalRevenue != null ? `₦${db.totalRevenue.toLocaleString()}` : null, icon: DollarSign, color: 'text-green-700' },
              { label: 'Pending Payments', value: db?.pendingPayments, icon: CreditCard, color: 'text-yellow-600' },
            ]).map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
                <p className={`text-2xl font-black ${color}`}>
                  {value != null ? value : healthError ? '—' : <span className="text-gray-300 text-base">loading…</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Actions */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <Trash2 className="w-5 h-5 text-red-600" /> Maintenance Actions
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Products, categories, restaurant settings, and confirmed orders are <strong>never</strong> deleted by these actions.
        </p>

        <div className="space-y-3">
          {([
            {
              id: 'clear-orders',
              title: 'Clear Test Orders',
              desc: 'Permanently deletes cancelled orders where payment was rejected or never made. Confirmed/delivered orders are untouched.',
              danger: 'High',
              dangerColor: 'text-red-600',
              borderColor: 'border-red-200 dark:border-red-800',
              btnColor: 'bg-red-600 hover:bg-red-700',
              icon: Trash2,
            },
            {
              id: 'clear-notifications',
              title: 'Clear Read Notifications',
              desc: 'Removes all admin notifications that have already been marked as read. Unread notifications are kept.',
              danger: 'Medium',
              dangerColor: 'text-orange-600',
              borderColor: 'border-orange-200 dark:border-orange-800',
              btnColor: 'bg-orange-500 hover:bg-orange-600',
              icon: Bell,
            },
          ]).map(({ id, title, desc, danger, dangerColor, borderColor, btnColor, icon: Icon }) => (
            <div key={id} className={`border-2 ${borderColor} rounded-xl p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{title}</p>
                      <span className={`text-xs font-bold ${dangerColor}`}>🔴 {danger}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmAction({ id, label: title })}
                  disabled={actionLoading || !!healthError}
                  className={`shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold ${btnColor} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Run
                </button>
              </div>
            </div>
          ))}
        </div>

        {healthError && (
          <p className="text-xs text-gray-400 mt-3">⚠️ Actions are disabled because the backend is unreachable.</p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You are about to run:</p>
            <p className="font-semibold text-gray-900 dark:text-white mb-4">{confirmAction.label}</p>
            <p className="text-xs text-red-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300">
                Cancel
              </button>
              <button
                onClick={() => runAction(confirmAction.id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Running…' : 'Yes, Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeveloperPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DeveloperContent />
    </Suspense>
  );
}
