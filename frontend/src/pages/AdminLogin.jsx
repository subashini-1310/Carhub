import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Key, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export default function AdminLogin({ onLoginSuccess, onGoToPublicPortal }) {
  const [email, setEmail] = useState('admin@carhub.com');
  const [password, setPassword] = useState('password123');
  const [adminCode, setAdminCode] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (adminCode !== 'admin123') {
      setError("Invalid Admin Authorization Key. Key must be 'admin123'.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.login(email.trim(), password, 'Admin');
      if (res.user && res.user.role === 'Admin') {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('carhub_admin_token', res.token);
        storage.setItem('carhub_admin_user', JSON.stringify(res.user));
        
        // Clear other storage to avoid session conflict
        if (rememberMe) {
          sessionStorage.removeItem('carhub_admin_token');
          sessionStorage.removeItem('carhub_admin_user');
        } else {
          localStorage.removeItem('carhub_admin_token');
          localStorage.removeItem('carhub_admin_user');
        }

        onLoginSuccess(res.user, res.token);
      } else {
        throw new Error('Access denied. User does not possess Admin privileges.');
      }
    } catch (err) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin({
        email: 'admin@carhub.com',
        name: 'CarHub Admin',
        role: 'Admin',
        adminCode: 'admin123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        googleId: 'g_admin_123'
      });

      if (res.user && res.user.role === 'Admin') {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('carhub_admin_token', res.token);
        storage.setItem('carhub_admin_user', JSON.stringify(res.user));
        onLoginSuccess(res.user, res.token);
      } else {
        throw new Error('Access denied. User does not possess Admin privileges.');
      }
    } catch (err) {
      setError(err.message || 'Google Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#ffffff'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px',
        borderRadius: '24px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShieldCheck size={36} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            CarHub Admin Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>
            Isolated Executive Management & Inspection Hub
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Administrator Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="admin@carhub.com"
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input 
                type={showPassword ? "text" : "password"}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 40px 12px 40px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Admin Security Key</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#f59e0b' }} />
              <input 
                type={showAdminCode ? "text" : "password"}
                value={adminCode} 
                onChange={e => setAdminCode(e.target.value)} 
                required 
                placeholder="Enter admin123"
                style={{ width: '100%', padding: '12px 40px 12px 40px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.5)', background: '#0f172a', color: '#fff' }}
              />
              <button
                type="button"
                onClick={() => setShowAdminCode(!showAdminCode)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showAdminCode ? "Hide key" : "Show key"}
              >
                {showAdminCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#94a3b8' }}>
            <input
              type="checkbox"
              id="adminRememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#f59e0b' }}
            />
            <label htmlFor="adminRememberMe" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Remember me on this browser (stay logged in across tab close)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Authenticating Admin Access...' : 'Login to Admin Control Center'}
          </button>

          {/* Google Sign-in for Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0 4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>OR SIGN IN WITH</span>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#f8fafc',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google Admin OAuth Sign-In</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onGoToPublicPortal}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={16} /> Return to Public User Portal
          </button>
        </div>
      </div>
    </div>
  );
}
