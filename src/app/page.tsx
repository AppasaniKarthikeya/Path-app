'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import React from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      const profile = localStorage.getItem(`path_profile_${user.uid}`);
      if (profile) router.push('/chat?new=true');
      else router.push('/profile-setup');
    } else {
      router.push('/login');
    }
  };

  if (loading) return null; // Prevent hydration flash

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, backgroundColor: 'var(--brand-burgundy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800 }}>
            पथ
          </div>
          <span className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-burgundy)' }}>Path</span>
        </div>
        <button 
          onClick={handleStart}
          style={{ background: 'none', border: 'none', fontSize: 16, fontWeight: 600, color: 'var(--brand-burgundy)', cursor: 'pointer' }}
        >
          {user ? 'GO TO DASHBOARD' : 'LOGIN'}
        </button>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        
        <h1 className="font-display" style={{ 
          fontSize: 'clamp(3rem, 10vw, 8rem)', 
          fontWeight: 800, 
          color: 'var(--brand-burgundy)',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          margin: '0 0 24px 0'
        }}>
          FIND YOUR<br/>WAY FORWARD.
        </h1>
        
        <p style={{ 
          fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
          color: 'var(--brand-dark-purple)', 
          maxWidth: 600, 
          margin: '0 auto 40px auto',
          fontWeight: 500,
          lineHeight: 1.5
        }}>
          We're putting the final touches on something fresh, bold, and built to give you an edge. 
          Your personal AI career mentor, right in your pocket.
        </p>

        <button 
          onClick={handleStart}
          className="btn-primary"
          style={{
            padding: '16px 40px',
            fontSize: 18,
            borderRadius: 50,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(107, 15, 73, 0.2)'
          }}
        >
          {user ? 'CONTINUE YOUR JOURNEY' : 'START YOUR JOURNEY NOW'}
        </button>

        {/* Feature Cards (Glassmorphism) */}
        <div style={{ display: 'flex', gap: 24, marginTop: 80, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1000 }}>
          {[
            { icon: '🗺️', title: 'Personalized Roadmaps', desc: 'No more generic advice. Get a step-by-step path tailored to your exact situation.' },
            { icon: '💡', title: 'Honest Mentorship', desc: 'We won\'t sugarcoat it. Real, actionable advice from the perspective of an industry senior.' },
            { icon: '🎯', title: 'Free Resources', desc: 'Why pay when the best knowledge is free? We curate the exact free resources you need.' }
          ].map(feature => (
            <div key={feature.title} className="glass-panel" style={{ flex: '1 1 300px', padding: 32, textAlign: 'left' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{feature.icon}</div>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-burgundy)', marginBottom: 8 }}>{feature.title}</h3>
              <p style={{ color: 'var(--brand-dark-purple)', opacity: 0.8, fontSize: 14, lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 40px', textAlign: 'center', fontSize: 13, color: 'var(--brand-dark-purple)', opacity: 0.6 }}>
        © 2026 Path AI Mentor
      </footer>
    </div>
  );
}
