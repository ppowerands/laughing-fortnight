'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Shield, Database, Activity, Trash2, Bell, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Lock, Server, Wifi, Clock,
  Package, Tags, Users, ShoppingBag, DollarSign, CreditCard,
  GitBranch, GitCommit, Calendar, Layers, LogOut, Key, Eye,
  EyeOff, Play, Mail, Truck, Store, Home, Settings as SettingsIcon,
  BarChart3, FileText, AlertOctagon, UserCheck, UserX, List,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { logsApi, flagsApi, productionApi, maintenanceApi } from '@/lib/api';

function StatusBadge({ status }: { status: string }) {
  const ok = ['operational', 'connected'].includes(status);
  return (
    <span className={`flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-green-600' : 'text-red-500'}`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {status}
    </span>
  );
}

function FeatureToggle({ label, enabled, onChange, loading }: { label: string; enabled: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {loading ? (
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : enabled ? (
        <ToggleRight className="w-6 h-6 text-green-600" />
      ) : (
        <ToggleLeft className="w-6 h-6 text-gray-400" />
      )}
    </button>
  );
}

function DeveloperContent() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [healthError, setHealthError] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | { id: string; label: string }>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [prodHealth, setProdHealth] = useState<any>(null);
  const [prodHealthLoading, setProdHealthLoading] = useState(false);

  // ── Fetch Health ──────────────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setHealthError('');
    try {
      const data = await maintenanceApi.getHealth().then(r => r.data);
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

  // ── Fetch Flags ──────────────────────────────────────────────────────
  const fetchFlags = useCallback(async () => {
    setFlagsLoading(true);
    try {
      const data = await flagsApi.getFlags().then(r => r.data);
      const flagMap: Record<string, boolean> = {};
      data.forEach((f: any) => { flagMap[f.key] = f.enabled; });
      setFlags(flagMap);
    } catch (err) {
      console.error('Failed to fetch flags:', err);
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  // ── Fetch Production Health ──────────────────────────────────────────
  const fetchProdHealth = useCallback(async () => {
    setProdHealthLoading(true);
    try {
      const data = await productionApi.getHealth().then(r => r.data);
      setProdHealth(data);
    } catch (err) {
      console.error('Failed to fetch production health:', err);
    } finally {
      setProdHealthLoading(false);
    }
  }, []);

  // ── Fetch Logs ───────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await logsApi.getLogs({ limit: 50 }).then(r => r.data);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // ── Initial Load ────────────────────────────────────────────────────
  useEffect(() => {
    fetchHealth();
    fetchFlags();
    fetchProdHealth();
    const id = setInterval(fetchHealth, 30000);
    return () => clearInterval(id);
  }, [fetchHealth, fetchFlags, fetchProdHealth]);

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs, fetchLogs]);

  // ── Actions ──────────────────────────────────────────────────────────
  const runAction = async (actionId: string) => {
    setActionLoading(true);
    setActionResult(null);
    try {
      let result: any;
      const actionMap: Record<string, () => Promise<any>> = {
        'clear-orders': () => maintenanceApi.clearTestOrders().then(r => r.data),
        'clear-notifications': () => maintenanceApi.clearNotifications().then(r => r.data),
        'clear-payments': () => maintenanceApi.clearTestPayments().then(r => r.data),
        'clear-customers': () => maintenanceApi.clearTestCustomers().then(r => r.data),
        'clear-cache': () => maintenanceApi.clearCache().then(r => r.data),
        'recalculate-stats': () => maintenanceApi.recalculateStats().then(r => r.data),
      };
      if (actionMap[actionId]) {
        result = await actionMap[actionId]();
      }
      setActionResult({ msg: result?.message || 'Action completed!', ok: true });
      fetchHealth();
      fetchProdHealth();
    } catch (err: any) {
      setActionResult({ msg: err.message || 'Action failed.', ok: false });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── Toggle Flag ──────────────────────────────────────────────────────
  const toggleFlag = async (key: string) => {
    setFlagsLoading(true);
    try {
      const data = await flagsApi.toggleFlag(key).then(r => r.data);
      setFlags(prev => ({ ...prev, [key]: data.enabled }));
      setActionResult({ msg: `${key} toggled to ${data.enabled ? 'ON' : 'OFF'}`, ok: true });
    } catch (err: any) {
      setActionResult({ msg: err.message || 'Failed to toggle flag', ok: false });
    } finally {
      setFlagsLoading(false);
    }
  };

  const db = health?.database;
  const sys = health?.system;

  // ── Env Info ─────────────────────────────────────────────────────────
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'N/A';
  const commitRef = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'main';
  const lastDeploy = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_AT
    ? new Date(parseInt(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_AT)).toLocaleString('en-NG')
    : 'N/A';
  const appVersion = '1.0.0';

  // ── MAIN ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-700" /> Developer
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {commitRef}</span>
            <span className="flex items-center gap-1"><GitCommit className="w-3 h-3" /> {commitSha}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lastDeploy}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vercelEnv === 'production' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {vercelEnv}
            </span>
            <span className="text-xs text-gray-400">v{appVersion}</span>
          </div>
        </div>
        <button onClick={fetchHealth} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Action result */}
      {actionResult && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${actionResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {actionResult.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{actionResult.msg}</p>
          <button onClick={() => setActionResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* ===== SYSTEM HEALTH ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-700" /> System Health
        </h2>
        {healthError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{healthError}</span>
          </div>
        )}
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
        {lastChecked && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Last checked: {lastChecked.toLocaleString('en-NG')}
          </p>
        )}
      </div>

      {/* ===== DATABASE INFO ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-700" /> Database Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {([
            { label: 'Total Orders', value: db?.totalOrders, icon: ShoppingBag, color: 'text-blue-700' },
            { label: 'Total Products', value: db?.totalProducts, icon: Package, color: 'text-green-700' },
            { label: 'Total Customers', value: db?.totalCustomers, icon: Users, color: 'text-purple-700' },
            { label: 'Total Revenue', value: db?.totalRevenue != null ? `₦${db.totalRevenue.toLocaleString()}` : null, icon: DollarSign, color: 'text-green-700' },
            { label: 'Pending Payments', value: db?.pendingPayments, icon: CreditCard, color: 'text-yellow-600' },
            { label: 'Total Categories', value: db?.totalCategories, icon: Tags, color: 'text-orange-700' },
          ]).map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-xs text-gray-400">{label}</p>
              </div>
              <p className={`text-xl font-black ${color}`}>
                {value != null ? value : healthError ? '—' : '…'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== PRODUCTION HEALTH ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-blue-700" /> Production Health
        </h2>
        {prodHealthLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : prodHealth ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-lg font-bold text-green-600 capitalize">{prodHealth.status || '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Orders</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{prodHealth.stats?.orders || '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₦{prodHealth.stats?.revenue?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs text-gray-400">Uptime</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.floor(prodHealth.uptime || 0)}s</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No production health data available</p>
        )}
      </div>

      {/* ===== MAINTENANCE ACTIONS ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <Trash2 className="w-5 h-5 text-red-600" /> Maintenance
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          These actions are destructive. Confirmed orders, products, and categories are never deleted.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { id: 'clear-orders', label: 'Clear Test Orders', icon: ShoppingBag, danger: 'High', color: 'border-red-200 dark:border-red-800', btn: 'bg-red-600 hover:bg-red-700' },
            { id: 'clear-notifications', label: 'Clear Test Notifications', icon: Bell, danger: 'Medium', color: 'border-orange-200 dark:border-orange-800', btn: 'bg-orange-500 hover:bg-orange-600' },
            { id: 'clear-payments', label: 'Clear Test Payments', icon: CreditCard, danger: 'High', color: 'border-red-200 dark:border-red-800', btn: 'bg-red-600 hover:bg-red-700' },
            { id: 'clear-customers', label: 'Clear Test Customers', icon: Users, danger: 'High', color: 'border-red-200 dark:border-red-800', btn: 'bg-red-600 hover:bg-red-700' },
            { id: 'clear-cache', label: 'Clear Cache', icon: Layers, danger: 'Low', color: 'border-yellow-200 dark:border-yellow-800', btn: 'bg-yellow-500 hover:bg-yellow-600' },
            { id: 'recalculate-stats', label: 'Recalculate Dashboard Stats', icon: BarChart3, danger: 'Low', color: 'border-blue-200 dark:border-blue-800', btn: 'bg-blue-500 hover:bg-blue-600' },
          ]).map(({ id, label, icon: Icon, danger, color, btn }) => (
            <div key={id} className={`border-2 ${color} rounded-xl p-4 flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                  <span className={`text-xs font-bold ${danger === 'High' ? 'text-red-600' : danger === 'Medium' ? 'text-orange-600' : 'text-blue-600'}`}>
                    ⚠️ {danger}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction({ id, label })}
                disabled={actionLoading || !!healthError}
                className={`shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold ${btn} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Run
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===== DEPLOYMENTS ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-blue-700" /> Deployments
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Commit</span><br /><span className="font-mono text-xs">{commitSha}</span></div>
          <div><span className="text-gray-500">Branch</span><br /><span className="font-medium">{commitRef}</span></div>
          <div><span className="text-gray-500">Last Deploy</span><br /><span className="font-medium">{lastDeploy}</span></div>
          <div><span className="text-gray-500">Version</span><br /><span className="font-medium">v{appVersion}</span></div>
        </div>
      </div>

      {/* ===== LOGS ===== */}
      <div className="card p-6">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full"
        >
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" /> Logs
          </h2>
          <span className="text-sm text-blue-600">{showLogs ? 'Hide' : 'Show'}</span>
        </button>
        {showLogs && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {logsLoading ? (
              <div className="text-center text-gray-400 py-4">Loading logs…</div>
            ) : logs.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No logs available</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm flex items-start gap-3 ${log.type === 'error' ? 'bg-red-50 text-red-700' : log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : log.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.createdAt || log.time).toLocaleTimeString('en-NG')}</span>
                  <span>{log.message || log.action}</span>
                </div>
              ))
            )}
            <button onClick={fetchLogs} className="text-xs text-blue-600 hover:underline mt-2">Refresh logs</button>
          </div>
        )}
      </div>

      {/* ===== FEATURE FLAGS ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-blue-700" /> Feature Flags
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            'maintenanceMode',
            'demoMode',
            'onlineOrdering',
            'pickup',
            'delivery',
            'notifications',
          ]).map((key) => (
            <FeatureToggle
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              enabled={flags[key] || false}
              onChange={() => toggleFlag(key)}
              loading={flagsLoading}
            />
          ))}
        </div>
      </div>

      {/* ===== SECURITY ===== */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5 text-blue-700" /> Security
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-gray-500">Active Sessions</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">1</p>
            <p className="text-xs text-gray-400">Current session only</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-gray-500">Admin Login History</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">42</p>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-gray-500">Failed Login Attempts</p>
            <p className="text-2xl font-black text-red-600">3</p>
            <p className="text-xs text-gray-400">Last 24 hours</p>
          </div>
        </div>
      </div>

      {/* ===== CONFIRMATION DIALOG ===== */}
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
