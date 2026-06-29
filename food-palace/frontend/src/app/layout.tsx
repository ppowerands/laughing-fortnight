import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Food Palace Restaurant – Order Nigerian Food Online',
  description: 'Order delicious Nigerian food online. Jollof Rice, Shawarma, Burgers, Soups & more. Fast delivery in Kaduna.',
  keywords: 'Nigerian food, Kaduna restaurant, jollof rice, shawarma, food delivery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#1e40af', color: '#fff', borderRadius: '10px', fontSize: '14px' },
              success: { style: { background: '#059669' } },
              error: { style: { background: '#dc2626' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
