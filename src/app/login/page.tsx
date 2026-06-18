'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithGithub } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed profile setup
      const profile = localStorage.getItem(`path_profile_${user.uid}`);
      if (profile) {
        router.push('/chat');
      } else {
        router.push('/profile-setup');
      }
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setSigningIn(true);
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        const profile = localStorage.getItem(`path_profile_${signedInUser.uid}`);
        if (profile) {
          router.push('/chat');
        } else {
          router.push('/profile-setup');
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else {
        setError(error.message || 'Failed to sign in with Google. Please try again.');
      }
      setSigningIn(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setError(null);
      setSigningIn(true);
      const signedInUser = await signInWithGithub();
      if (signedInUser) {
        const profile = localStorage.getItem(`path_profile_${signedInUser.uid}`);
        if (profile) {
          router.push('/chat');
        } else {
          router.push('/profile-setup');
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Try signing in with a different method.');
      } else {
        setError(error.message || 'Failed to sign in with GitHub. Please try again.');
      }
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <p style={styles.loadingText}>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <span style={styles.logoText}>पथ</span>
          </div>
          <h1 style={styles.appName}>Path</h1>
          <p style={styles.tagline}>Your AI Career Guidance Mentor</p>
        </div>

        {/* Description */}
        <div style={styles.description}>
          <p>Confused about your career path? Don&apos;t worry.</p>
          <p>Path is your personal AI mentor who guides you with practical, honest advice — like a wise elder brother.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* Sign In Buttons */}
        <div style={styles.buttonGroup}>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            style={{
              ...styles.button,
              ...styles.googleButton,
              ...(signingIn ? styles.buttonDisabled : {}),
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {signingIn ? 'Signing in...' : 'Continue with Google'}
          </button>

          <button
            onClick={handleGithubSignIn}
            disabled={signingIn}
            style={{
              ...styles.button,
              ...styles.githubButton,
              ...(signingIn ? styles.buttonDisabled : {}),
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginRight: 12 }}>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {signingIn ? 'Signing in...' : 'Continue with GitHub'}
          </button>

          {/* Coming Soon buttons */}
          <button style={{ ...styles.button, ...styles.disabledButton }} disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#999" style={{ marginRight: 12 }}>
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            Phone — Coming Soon
          </button>

          <button style={{ ...styles.button, ...styles.disabledButton }} disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#999" style={{ marginRight: 12 }}>
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
            LinkedIn — Coming Soon
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>Free forever. Built by students, for students.</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: '40px 36px',
    maxWidth: 440,
    width: '100%',
    border: '1px solid #222',
  },
  logoContainer: {
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#000',
    borderRadius: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #333',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 700,
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 4px 0',
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    margin: 0,
  },
  description: {
    textAlign: 'center' as const,
    marginBottom: 28,
    color: '#aaa',
    fontSize: 14,
    lineHeight: 1.6,
  },
  errorBox: {
    backgroundColor: '#2d1b1b',
    border: '1px solid #5c2626',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
  },
  githubButton: {
    backgroundColor: '#24292e',
    color: '#fff',
    border: '1px solid #444',
  },
  disabledButton: {
    backgroundColor: '#1a1a1a',
    color: '#666',
    border: '1px solid #2a2a2a',
    cursor: 'not-allowed',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#555',
    fontSize: 12,
    margin: 0,
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #333',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
};
