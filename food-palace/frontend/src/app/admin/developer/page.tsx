'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function DeveloperPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('User email:', user?.email);
    console.log('User role:', user?.role);
    console.log('Full user:', user);
    
    if (user && user.email !== 'admin@foodpalace.ng') {
      console.log('Email mismatch! Redirecting...');
      router.push('/admin');
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.email !== 'admin@foodpalace.ng') {
    return <div>Access Denied - Wrong Email</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-600">Developer Panel - Access Granted!</h1>
      <p className="mt-4">Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
