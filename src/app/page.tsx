'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
    } else {
      // Check if profile exists
      const profile = localStorage.getItem(`path_profile_${user.uid}`);
      if (profile) {
        router.push('/chat');
      } else {
        router.push('/profile-setup');
      }
    }
  }, [user, loading, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            backgroundColor: '#000',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #333',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>पथ</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>
          Path
        </h1>
        <p style={{ color: '#888', fontSize: 14 }}>Loading your journey...</p>
      </div>
    </div>
  );
}
