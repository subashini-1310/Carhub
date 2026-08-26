import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, ShieldCheck, Lock, User, Mail, Building, AlertCircle, Eye, EyeOff, Minus, Square, ChevronDown, Trash2 } from 'lucide-react';

const GOOGLE_PALETTE = ['#2e7d32', '#d81b60', '#00897b', '#1a73e8', '#e37400', '#7b1fa2', '#c2185b', '#0288d1'];

const getAvatarBg = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GOOGLE_PALETTE[Math.abs(hash) % GOOGLE_PALETTE.length];
};

const formatGoogleAccount = (email, name) => {
  const cleanEmail = email.trim().toLowerCase();
  let cleanName = name ? name.trim() : '';
  if (!cleanName) {
    const userPart = cleanEmail.split('@')[0];
    cleanName = userPart.charAt(0).toUpperCase() + userPart.slice(1);
  }
  const initial = cleanName.charAt(0).toUpperCase();
  const avatarBg = getAvatarBg(cleanEmail);
  return {
    name: cleanName,
    email: cleanEmail,
    initial,
    avatarBg,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${avatarBg.replace('#', '')}&color=fff`
  };
};

const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: 'Subashini Subashini',
    email: 'subashinisakthivel2020@gmail.com',
    avatarBg: '#2e7d32',
    initial: 'S',
    avatar: 'https://ui-avatars.com/api/?name=Subashini+Subashini&background=2e7d32&color=fff'
  },
  {
    name: 'SUBASHINI S 24CSR307',
    email: 'subashinis.24cse@kongu.edu',
    avatarBg: '#d81b60',
    initial: 'S',
    avatar: 'https://ui-avatars.com/api/?name=SUBASHINI+S&background=d81b60&color=fff'
  },
  {
    name: 'Subashini',
    email: 'subashinis2028@gmail.com',
    avatarBg: '#00897b',
    initial: 'S',
    avatar: 'https://ui-avatars.com/api/?name=Subashini&background=00897b&color=fff'
  }
];

export default function AuthModal({ isOpen, onClose, defaultRole = 'Buyer / Renter', onSuccessRole }) {
  const { loginUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Normalize initial role so public modal only allows Buyer / Renter or Seller
  const normalizedDefaultRole = (defaultRole === 'Seller') ? 'Seller' : 'Buyer / Renter';
  const [selectedRole, setSelectedRole] = useState(normalizedDefaultRole);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [city, setCity] = useState('Chennai');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google Chooser states
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Dynamically managed Google accounts list
  const [userAccounts, setUserAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem('carhub_saved_google_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_GOOGLE_ACCOUNTS;
  });

  useEffect(() => {
    const norm = (defaultRole === 'Seller') ? 'Seller' : 'Buyer / Renter';
    setSelectedRole(norm);
  }, [defaultRole]);

  // Persist accounts when modified
  const saveAccounts = (newList) => {
    setUserAccounts(newList);
    try {
      localStorage.setItem('carhub_saved_google_accounts', JSON.stringify(newList));
    } catch (e) {}
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setError('');
    setShowCustomGoogleInput(false);

    // If user has typed an email in the main form, dynamically include it in the chooser
    if (email && email.includes('@')) {
      const trimmed = email.trim().toLowerCase();
      const alreadyExists = userAccounts.some(a => a.email.toLowerCase() === trimmed);
      if (!alreadyExists) {
        const dynamicAcc = formatGoogleAccount(trimmed, name);
        const updated = [dynamicAcc, ...userAccounts];
        saveAccounts(updated);
      }
    }

    setShowGooglePicker(true);
  };

  const executeGoogleAuth = async (googleAccount) => {
    setLoading(true);
    setError('');
    try {
      // Save this account into user's remembered accounts
      const exists = userAccounts.some(a => a.email.toLowerCase() === googleAccount.email.toLowerCase());
      if (!exists) {
        const newAcc = formatGoogleAccount(googleAccount.email, googleAccount.name);
        saveAccounts([newAcc, ...userAccounts]);
      }

      const res = await api.googleLogin({
        email: googleAccount.email,
        name: googleAccount.name,
        avatar: googleAccount.avatar || '',
        role: selectedRole,
        googleId: 'g_' + Date.now()
      });

      loginUser(res.user, rememberMe);
      setShowGooglePicker(false);
      onSuccessRole(res.user.role);
      onClose();
    } catch (err) {
      setError(err.message || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const acc = formatGoogleAccount(customGoogleEmail, customGoogleName);
    const updated = [acc, ...userAccounts.filter(a => a.email.toLowerCase() !== acc.email.toLowerCase())];
    saveAccounts(updated);
    executeGoogleAuth(acc);
  };

  const removeAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = userAccounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    saveAccounts(updated.length > 0 ? updated : DEFAULT_GOOGLE_ACCOUNTS);
  };

  const roleSentences = {
    'Buyer / Renter': "Single customer account with access to BOTH buying certified cars & renting self-drive vehicles.",
    'Seller': "Post your vehicle for doorstep inspection. Receive instant cash buyout offer from CarHub team."
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !email.trim()) {
        throw new Error('Please enter your email address.');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }

      if (isLogin) {
        const res = await api.login(email.trim(), password);
        loginUser(res.user, rememberMe);
        if (onSuccessRole) onSuccessRole(res.user.role);
        onClose();
      } else {
        if (!name || !name.trim()) {
          throw new Error('Please enter your full name.');
        }
        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password: password,
          role: selectedRole,
          city
        });
        loginUser(res.user, rememberMe);
        onSuccessRole(res.user.role);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90dvh',
        overflowY: 'auto',
        padding: 'clamp(20px, 4vw, 32px)',
        borderRadius: '24px',
        position: 'relative',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
        animation: 'fadeIn 0.2s ease-out',
        overscrollBehavior: 'contain'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isLogin ? 'Sign in with your email and password' : 'Fill in your details to create an account'}
          </p>
        </div>

        {/* Role Selector Tabs (Only displayed during Sign Up) */}
        {!isLogin && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              background: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              {['Buyer / Renter', 'Seller'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    setError('');
                  }}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: selectedRole === r ? 'var(--accent-primary)' : 'transparent',
                    color: selectedRole === r ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedRole === r ? '0 2px 8px rgba(59, 130, 246, 0.4)' : 'none'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              lineHeight: '1.4'
            }}>
              💡 <strong>{selectedRole}:</strong> {roleSentences[selectedRole]}
            </div>
          </>
        )}

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid #ef4444', 
            color: '#ef4444', 
            padding: '12px', 
            borderRadius: '10px', 
            marginBottom: '16px', 
            fontSize: '0.85rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Rahul Sharma" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem' }} 
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="your.email@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 40px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
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

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Remember me on this device
            </label>
          </div>

          {!isLogin && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>City</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Chennai" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem' }} 
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {/* Google OAuth 2.0 Divider & Continue with Google Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 6px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>

        {/* ── GOOGLE ACCOUNT CHOOSER WINDOW MODAL ── */}
        {showGooglePicker && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '440px',
              background: '#131314',
              borderRadius: '24px',
              border: '1px solid #303134',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              color: '#e8eaed',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}>
              {/* Chrome Browser Window Header */}
              <div style={{
                background: '#1f1f20',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #303134',
                fontSize: '0.8rem',
                color: '#9aa0a6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span style={{ fontSize: '0.78rem', color: '#c4c7c5' }}>Sign in - Google Accounts - Google Chrome</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Minus size={13} style={{ cursor: 'pointer' }} />
                  <Square size={11} style={{ cursor: 'pointer' }} />
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => setShowGooglePicker(false)} />
                </div>
              </div>

              {/* URL address bar */}
              <div style={{
                background: '#191a1a',
                padding: '6px 16px',
                borderBottom: '1px solid #303134',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.72rem',
                color: '#8e918f'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  accounts.google.com/v3/signin/accountchooser?continue=carhub
                </span>
              </div>

              {/* Chooser Body */}
              <div style={{ padding: '36px 32px 24px 32px' }}>
                {/* Google Logo & Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#e8eaed' }}>Sign in with Google</span>
                </div>

                {/* Main Heading */}
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: '500',
                  color: '#f8fafc',
                  margin: '0 0 6px 0',
                  lineHeight: '1.2'
                }}>
                  Choose an account
                </h1>

                <p style={{
                  fontSize: '0.95rem',
                  color: '#9aa0a6',
                  margin: '0 0 28px 0'
                }}>
                  to continue to <span style={{ color: '#8ab4f8', fontWeight: '500' }}>CarHub</span>
                </p>

                {/* Account Rows */}
                {!showCustomGoogleInput ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {userAccounts.map((acc, idx) => (
                      <div
                        key={acc.email}
                        onClick={() => executeGoogleAuth(acc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '14px 12px',
                          cursor: 'pointer',
                          borderRadius: '12px',
                          transition: 'background 0.15s ease',
                          borderBottom: idx < userAccounts.length - 1 ? '1px solid #282a2c' : 'none',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1e1f20'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Circle Initial Avatar */}
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: acc.avatarBg || '#1a73e8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          flexShrink: 0
                        }}>
                          {acc.initial || (acc.name ? acc.name.charAt(0).toUpperCase() : 'G')}
                        </div>

                        {/* Account Name & Email */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: '#e8eaed',
                            fontSize: '0.92rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {acc.name}
                          </div>
                          <div style={{
                            color: '#9aa0a6',
                            fontSize: '0.82rem',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {acc.email}
                          </div>
                        </div>

                        {/* Delete single account button if multiple */}
                        {userAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => removeAccount(e, acc.email)}
                            title="Remove from this list"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#5f6368',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              opacity: 0.6
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = '#5f6368'; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}

                    <div style={{ height: '1px', background: '#282a2c', margin: '4px 0' }} />

                    {/* Use another account option */}
                    <div
                      onClick={() => {
                        setCustomGoogleEmail('');
                        setCustomGoogleName('');
                        setShowCustomGoogleInput(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '14px 12px',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.15s ease',
                        borderBottom: '1px solid #282a2c'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#1e1f20'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9aa0a6',
                        flexShrink: 0
                      }}>
                        <User size={22} />
                      </div>
                      <div style={{ color: '#e8eaed', fontSize: '0.92rem', fontWeight: '500' }}>
                        Use another account
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Custom Google Account Input Form */
                  <form onSubmit={handleCustomGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#9aa0a6', display: 'block', marginBottom: '6px' }}>Your Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Subashini S"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #3c4043',
                          background: '#1e1f20',
                          color: '#e8eaed',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#9aa0a6', display: 'block', marginBottom: '6px' }}>Google Email Address</label>
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="yourname@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #3c4043',
                          background: '#1e1f20',
                          color: '#e8eaed',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowCustomGoogleInput(false)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #3c4043',
                          background: 'transparent',
                          color: '#9aa0a6',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#8ab4f8',
                          color: '#131314',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        {loading ? 'Signing in...' : 'Sign in & Remember'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Footer bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '36px',
                  fontSize: '0.75rem',
                  color: '#9aa0a6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <span>English (United States)</span>
                    <ChevronDown size={13} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ cursor: 'pointer' }}>Help</span>
                    <span style={{ cursor: 'pointer' }}>Privacy</span>
                    <span style={{ cursor: 'pointer' }}>Terms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
