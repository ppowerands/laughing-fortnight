'use client';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { settingsApi } from '@/lib/api';

export default function OpenStatus() {
  const { data: settings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => settingsApi.get().then(r => r.data),
    refetchInterval: 60000,
  });

  if (!settings) return null;

  return (
    <div className={`py-3 ${settings.isOpenNow ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
        {settings.isOpenNow
          ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
        <span className={`text-sm font-semibold ${settings.isOpenNow ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
          {settings.isOpenNow ? "We're Open!" : 'Currently Closed'}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" /> Hours: {settings.openTime} – {settings.closeTime}
        </span>
      </div>
    </div>
  );
}
