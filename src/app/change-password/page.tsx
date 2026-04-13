'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a letter (a–z or A–Z)', test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number (0–9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Contains a special character (!@#$…)', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const allRulesPassed = rules.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('New password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Get username from session cookie (decoded client-side for display only)
      let username = 'superadmin';
      try {
        const raw = document.cookie.split(';').find(c => c.trim().startsWith('session='));
        if (raw) {
          const val = raw.split('=')[1];
          const decoded = JSON.parse(atob(val));
          username = decoded.username || 'superadmin';
        }
      } catch { /* ignore */ }

      const res = await fetch('/api/auth/first-login-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

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

        .bg {
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse at 30% 40%, rgba(192,57,43,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 70%, rgba(26,58,92,0.5) 0%, transparent 60%),
            linear-gradient(135deg, #080f1f 0%, #0d1a30 100%);
          z-index: 0;
        }
        .grid-overlay {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(200,151,58,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,151,58,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .card {
          position: relative; z-index: 10;
          width: 100%; max-width: 480px; margin: 20px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(200,151,58,0.2);
          border-radius: 24px;
          padding: 48px 44px 44px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 80px rgba(200,151,58,0.05);
          animation: cardIn 0.5s ease;
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(20px); }
          to { opacity:1; transform:translateY(0); }
        }

        .header { text-align: center; margin-bottom: 32px; }
        .header-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          font-size: 26px;
          box-shadow: 0 8px 32px rgba(192,57,43,0.4);
        }
        .header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem; color: #fff; margin-bottom: 8px;
        }
        .header p { font-size: 0.82rem; color: rgba(255,255,255,0.4); line-height: 1.5; }

        .alert-banner {
          background: rgba(200,151,58,0.1);
          border: 1px solid rgba(200,151,58,0.3);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 0.82rem;
          color: rgba(200,151,58,0.9);
          display: flex; align-items: flex-start; gap: 10px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200,151,58,0.25), transparent);
          margin-bottom: 28px;
        }

        .form-group { margin-bottom: 18px; }
        .form-label {
          display: block;
          font-size: 0.72rem; font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 8px;
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 16px; top: 50%;
          transform: translateY(-50%);
          font-size: 1rem; color: rgba(255,255,255,0.2); pointer-events: none;
        }
        .form-input {
          width: 100%;
          padding: 13px 44px 13px 46px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; color: #fff; outline: none; transition: all 0.2s;
        }
        .form-input::placeholder { color: rgba(255,255,255,0.18); }
        .form-input:focus {
          border-color: rgba(200,151,58,0.5);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(200,151,58,0.08);
        }
        .toggle-btn {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25); font-size: 1rem; padding: 4px;
          transition: color 0.2s;
        }
        .toggle-btn:hover { color: rgba(200,151,58,0.7); }

        .rules-list {
          margin-top: 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .rule-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 0.8rem; transition: all 0.2s;
        }
        .rule-item.pass { color: #4caf81; }
        .rule-item.fail { color: rgba(255,255,255,0.3); }
        .rule-dot {
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; flex-shrink: 0; transition: all 0.2s;
        }
        .rule-item.pass .rule-dot {
          background: rgba(76,175,129,0.2);
          color: #4caf81;
        }
        .rule-item.fail .rule-dot {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.2);
        }

        .match-hint {
          margin-top: 6px; font-size: 0.75rem;
        }
        .match-hint.ok { color: #4caf81; }
        .match-hint.no { color: #ff8a80; }

        .error-box {
          background: rgba(192,57,43,0.15);
          border: 1px solid rgba(192,57,43,0.4);
          border-radius: 10px;
          padding: 12px 16px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 0.84rem; color: #ff8a80;
          animation: shakeX 0.4s ease;
        }
        @keyframes shakeX {
          0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)}
        }

        .success-box {
          text-align: center; padding: 28px;
          animation: cardIn 0.4s ease;
        }
        .success-icon {
          font-size: 3.5rem; margin-bottom: 16px;
          animation: bounceIn 0.5s ease;
        }
        @keyframes bounceIn {
          0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)}
        }
        .success-box h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem; color: #4caf81; margin-bottom: 8px;
        }
        .success-box p { font-size: 0.85rem; color: rgba(255,255,255,0.45); }

        .btn-submit {
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, #c8973a, #f0c060);
          border: none; border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem; font-weight: 700;
          color: #0f2744; cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
          box-shadow: 0 4px 20px rgba(200,151,58,0.25);
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(200,151,58,0.45);
        }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(15,39,68,0.3);
          border-top-color: #0f2744;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer { text-align: center; margin-top: 24px; font-size: 0.7rem; color: rgba(255,255,255,0.18); }
      `}</style>

      <div className="bg" />
      <div className="grid-overlay" />

      <div className="card">
        {success ? (
          <div className="success-box">
            <div className="success-icon">✅</div>
            <h2>Password Changed!</h2>
            <p>Your new password has been saved.<br />Redirecting to dashboard…</p>
          </div>
        ) : (
          <>
            <div className="header">
              <div className="header-icon">🔐</div>
              <h1>Change Your Password</h1>
              <p>For security, you must set a new password<br />before continuing to the dashboard.</p>
            </div>

            <div className="alert-banner">
              <span>⚠️</span>
              <span>This is a <strong>mandatory</strong> first-login password change. Your new password will replace the default credentials.</span>
            </div>

            <div className="divider" />

            {error && (
              <div className="error-box">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="old-password">Current Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔑</span>
                  <input
                    id="old-password"
                    type={showOld ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="toggle-btn" onClick={() => setShowOld(!showOld)}>
                    {showOld ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Create a strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="toggle-btn" onClick={() => setShowNew(!showNew)}>
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <div className="rules-list">
                    {rules.map((rule, i) => {
                      const passed = rule.test(newPassword);
                      return (
                        <div key={i} className={`rule-item ${passed ? 'pass' : 'fail'}`}>
                          <div className="rule-dot">{passed ? '✓' : '○'}</div>
                          <span>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="toggle-btn" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className={`match-hint ${passwordsMatch ? 'ok' : 'no'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>

              <button
                type="submit"
                id="btn-change-password"
                className="btn-submit"
                disabled={loading || !allRulesPassed || !passwordsMatch || !oldPassword}
              >
                {loading ? (
                  <><div className="spinner" /> Updating…</>
                ) : (
                  <>🔐 Change Password & Continue</>
                )}
              </button>
            </form>

            <div className="footer">Govt. H/S Thari Mirwah · Admin Security Policy</div>
          </>
        )}
      </div>
    </>
  );
}
