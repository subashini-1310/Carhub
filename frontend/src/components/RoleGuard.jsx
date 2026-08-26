import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft, LogIn, UserCheck } from 'lucide-react';

export default function RoleGuard({ allowedRole, children, onOpenAuth, setActiveTab }) {
  const { user } = useAuth();

  const targetRole = allowedRole || 'Buyer / Renter';

  useEffect(() => {
    if (!user && onOpenAuth) {
      onOpenAuth(targetRole);
    }
  }, [user, targetRole, onOpenAuth]);

  // 1. Unauthenticated state
  if (!user) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '60px auto',
        padding: '60px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="glass-panel" style={{
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          width: '100%',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <Lock size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '10px' }}>
            Authentication Required
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Please log in or create an account to access the <strong>{targetRole}</strong> dashboard.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenAuth(targetRole)}
              className="btn-primary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LogIn size={18} /> Open Login Modal
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="btn-secondary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={18} /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Role Mismatch state
  const uRole = (user.role || '').toLowerCase();
  const tRole = targetRole.toLowerCase();

  let isRoleAllowed = false;

  // Admin has full unrestricted access to ALL pages (Buyer, Seller, Renter, Admin, etc.)
  if (uRole === 'admin') {
    isRoleAllowed = true;
  } else if (tRole.includes('buyer') || tRole.includes('renter')) {
    isRoleAllowed = uRole.includes('buyer') || uRole.includes('renter');
  } else {
    isRoleAllowed = uRole === tRole;
  }

  if (!isRoleAllowed) {
    return (
      <div style={{
        maxWidth: '640px',
        margin: '60px auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="glass-panel" style={{
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          width: '100%',
          borderLeft: '5px solid #ef4444',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <ShieldAlert size={34} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginBottom: '10px' }}>
            Access Restricted: Role Mismatch
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '12px', lineHeight: 1.5 }}>
            This section is restricted to <strong>{targetRole}</strong> accounts.
          </p>
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            marginBottom: '28px'
          }}>
            You are currently logged in as a <strong>{user.role}</strong> ({user.email}).
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenAuth(targetRole)}
              className="btn-primary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LogIn size={18} /> Switch / Login as {targetRole}
            </button>
            <button
              onClick={() => setActiveTab(uRole.includes('seller') ? 'seller' : 'buyer')}
              className="btn-secondary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <UserCheck size={18} /> Go to My Dashboard
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="btn-secondary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={18} /> Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized access
  return children;
}
