import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Car, 
  Sun, 
  Moon, 
  Heart, 
  Bell, 
  User, 
  LogOut, 
  ArrowLeft, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth, onOpenAdminChat }) {
  const { user, logoutUser, wishlist, notifications } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.length;

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      margin: '10px 20px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Brand & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {activeTab !== 'home' && (
          <button 
            onClick={() => setActiveTab('home')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            title="Back to Homepage"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        
        <div 
          onClick={() => setActiveTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            color: 'white',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <Car size={22} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Car<span style={{ color: 'var(--accent-primary)' }}>Hub</span>
            </span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Buy • Sell • Rent
            </div>
          </div>
        </div>
      </div>

      {/* Center Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('home')}
          style={{
            background: activeTab === 'home' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'home' ? 'var(--accent-primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'home' ? '700' : '500',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.88rem',
            transition: 'all 0.2s'
          }}
        >
          Explore
        </button>

        <button 
          onClick={() => {
            if (!user) onOpenAuth('Seller');
            else setActiveTab('seller');
          }}
          style={{
            background: activeTab === 'seller' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'seller' ? 'var(--accent-primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'seller' ? '700' : '500',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.88rem',
            transition: 'all 0.2s'
          }}
        >
          Sell Car
        </button>

        <button 
          onClick={() => {
            if (!user) onOpenAuth('Buyer');
            else setActiveTab('buyer');
          }}
          style={{
            background: activeTab === 'buyer' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'buyer' ? 'var(--accent-primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'buyer' ? '700' : '500',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.88rem',
            transition: 'all 0.2s'
          }}
        >
          Buy Car
        </button>

        <button 
          onClick={() => {
            if (!user) onOpenAuth('Renter');
            else setActiveTab('renter');
          }}
          style={{
            background: activeTab === 'renter' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'renter' ? 'var(--accent-primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'renter' ? '700' : '500',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.88rem',
            transition: 'all 0.2s'
          }}
        >
          Rentals
        </button>

        <button 
          onClick={() => {
            if (!user) {
              onOpenAuth('Admin');
            } else if (user.role === 'Admin') {
              setActiveTab('admin');
            } else {
              onOpenAuth('Admin');
            }
          }}
          style={{ 
            background: activeTab === 'admin' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.1)', 
            border: activeTab === 'admin' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)', 
            color: '#f59e0b', 
            fontWeight: '700', 
            padding: '6px 12px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontSize: '0.82rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginLeft: '4px',
            boxShadow: activeTab === 'admin' ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none'
          }}
          title="Admin Control Center"
        >
          <ShieldCheck size={14} /> Admin
        </button>
      </div>

      {/* Action Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Dark/Light Mode */}
        <button 
          onClick={toggleTheme}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '6px', display: 'flex' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Wishlist Indicator */}
        {user && (
          <div 
            onClick={() => setActiveTab('buyer')}
            style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', padding: '6px' }}
            title="View Wishlist"
          >
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlist.length}
              </span>
            )}
          </div>
        )}

        {/* Live Admin Chat Launcher */}
        <button
          onClick={onOpenAdminChat}
          style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent-primary)',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Open Live Chat with CarHub Admin"
        >
          <MessageSquare size={15} /> Support
        </button>

        {/* Notifications Icon with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '6px', display: 'flex', position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: 'var(--accent-primary)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '40px',
              width: '320px',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200
            }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No new notifications
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ fontSize: '0.8rem', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                      <div style={{ fontWeight: '600' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Account Controls */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.1 }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}</span>
              </div>
            </div>
            <button 
              onClick={logoutUser}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onOpenAuth('Buyer')}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <User size={15} /> Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
