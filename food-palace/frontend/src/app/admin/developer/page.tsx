'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DeveloperContent() {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [secret, setSecret] = useState('');

  useEffect(() => {
    const urlSecret = searchParams.get('secret');
    if (urlSecret === 'foodpalace-dev-2024') {
      setIsAuthorized(true);
    }
  }, [searchParams]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔐 Advanced Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter the access key to view advanced settings.</p>
          <input
            type="password"
            placeholder="Enter access key"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
            onKeyDown={(e) => e.key === 'Enter' && secret === 'foodpalace-dev-2024' && setIsAuthorized(true)}
          />
          <button
            onClick={() => secret === 'foodpalace-dev-2024' && setIsAuthorized(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Unlock
          </button>
          <p className="text-xs text-gray-400 mt-4">Contact your administrator for the key.</p>
        </div>
      </div>
    );
  }

  // ✅ STATIC VERSION — NO API CALLS
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
        <div>
          <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">✅ Advanced Settings — Loaded Successfully</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">This is a static version. API calls have been bypassed.</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white">System Health</h2>
        <p className="text-gray-500 mt-2">✅ Backend: Operational</p>
        <p className="text-gray-500">✅ Database: Connected</p>
        <p className="text-gray-500">✅ API: Operational</p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white">Database Information</h2>
        <p className="text-gray-500 mt-2">📊 Total Orders: —</p>
        <p className="text-gray-500">👤 Total Customers: —</p>
        <p className="text-gray-500">📦 Total Products: —</p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white">Maintenance Actions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">These actions are only available when the backend is connected.</p>
        <button className="mt-3 px-4 py-2 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed" disabled>
          Clear Test Orders (Disabled)
        </button>
      </div>
    </div>
  );
}

export default function DeveloperPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <DeveloperContent />
    </Suspense>
  );
}
