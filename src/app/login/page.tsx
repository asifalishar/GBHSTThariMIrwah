'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      if (data.requiresPasswordChange) {
        router.push('/change-password');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #080f1f;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .login-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(26, 58, 92, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(200, 151, 58, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(15, 39, 68, 0.8) 0%, transparent 60%),
            linear-gradient(135deg, #080f1f 0%, #0d1a30 50%, #080f1f 100%);
          z-index: 0;
        }

        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(200, 151, 58, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 151, 58, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: rgba(200, 151, 58, 0.08);
          top: -100px; right: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: rgba(26, 58, 92, 0.4);
          bottom: -80px; left: -80px;
          animation-delay: 4s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 20px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(200, 151, 58, 0.2);
          border-radius: 24px;
          padding: 48px 44px 44px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 32px 80px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(200, 151, 58, 0.06);
          animation: cardIn 0.5s ease;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-area {
          text-align: center;
          margin-bottom: 36px;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #c8973a, #f0c060);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
          box-shadow: 0 8px 32px rgba(200, 151, 58, 0.4);
          animation: iconPulse 3s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(200, 151, 58, 0.4); }
          50% { box-shadow: 0 8px 48px rgba(200, 151, 58, 0.7); }
        }

        .logo-area h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: #fff;
          line-height: 1.3;
          margin-bottom: 6px;
        }

        .logo-area p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200,151,58,0.3), transparent);
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #fff;
          outline: none;
          transition: all 0.2s;
        }
        .form-input::placeholder { color: rgba(255,255,255,0.2); }
        .form-input:focus {
          border-color: rgba(200,151,58,0.6);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(200,151,58,0.1);
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          font-size: 1rem;
          padding: 4px;
          transition: color 0.2s;
        }
        .password-toggle:hover { color: rgba(200,151,58,0.8); }

        .error-box {
          background: rgba(192, 57, 43, 0.15);
          border: 1px solid rgba(192, 57, 43, 0.4);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: #ff8a80;
          animation: shakeX 0.4s ease;
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .btn-login {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #c8973a, #f0c060);
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f2744;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.02em;
          margin-top: 8px;
          box-shadow: 0 4px 20px rgba(200, 151, 58, 0.3);
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(200, 151, 58, 0.5);
        }
        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(15,39,68,0.3);
          border-top-color: #0f2744;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-text {
          text-align: center;
          margin-top: 28px;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.04em;
        }

        .secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 10px;
          font-size: 0.7rem;
          color: rgba(200,151,58,0.5);
        }
      `}</style>

      <div className="login-bg" />
      <div className="grid-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="login-card">
        <div className="logo-area">
          <div className="logo-icon">🎓</div>
          <h1>Govt. High School<br />Thari Mirwah</h1>
          <p>Student Management System</p>
        </div>

        <div className="divider" />

        <form onSubmit={handleLogin} noValidate>
          {error && (
            <div className="error-box">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" id="btn-login-submit" disabled={loading}>
            {loading ? (
              <><div className="spinner" /> Signing in…</>
            ) : (
              <>🔑 Sign In</>
            )}
          </button>
        </form>

        <div className="footer-text">
          Govt. H/S Thari Mirwah · Academic Year 2025–26
        </div>
        <div className="secure-badge">
          🛡️ Secured · Admin Access Only
        </div>
      </div>
    </>
  );
}
