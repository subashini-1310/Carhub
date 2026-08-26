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
  ShieldCheck,
  Compass,
  ShoppingBag,
  DollarSign,
  Key
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth, onOpenAdminChat }) {
  const { user, logoutUser, wishlist, notifications } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.length;

  return (
    <>
      {/* Top Navbar */}
      <nav className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        margin: '10px 20px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-lg)',
        gap: '12px'
      }}>
        {/* Brand & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {activeTab !== 'home' && (
            <button 
              onClick={() => setActiveTab('home')}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem', minHeight: '36px' }}
              title="Back to Homepage"
            >
              <ArrowLeft size={16} /> <span className="desktop-only">Back</span>
            </button>
          )}
          
          <div 
            onClick={() => setActiveTab('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0 }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              color: 'white',
              padding: '7px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              flexShrink: 0
            }}>
              <Car size={20} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.18rem', fontWeight: '800', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                Car<span style={{ color: 'var(--accent-primary)' }}>Hub</span>
              </span>
              <div className="desktop-only" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Buy • Sell • Rent
              </div>
            </div>
          </div>
        </div>

        {/* Center Nav Links (Desktop Only) */}
        <div className="desktop-only" style={{ alignItems: 'center', gap: '6px' }}>
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

          {user && user.role === 'Admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
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
          )}
        </div>

        {/* Action Utilities (Theme, Wishlist, Notifications, Account) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Dark/Light Mode */}
          <button 
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', display: 'flex', minHeight: '38px', minWidth: '38px', alignItems: 'center', justifyContent: 'center' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Wishlist Indicator */}
          {user && (
            <div 
              onClick={() => setActiveTab('buyer')}
              style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', padding: '8px', minHeight: '38px', minWidth: '38px', alignItems: 'center', justifyContent: 'center' }}
              title="View Wishlist"
            >
              <Heart size={18} />
              {wishlist.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.62rem',
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

          {/* Live Admin Chat Launcher (Desktop) */}
          <button
            onClick={onOpenAdminChat}
            className="desktop-only"
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--accent-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: '600',
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
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', display: 'flex', position: 'relative', minHeight: '38px', minWidth: '38px', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  fontSize: '0.62rem',
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
                top: '42px',
                width: 'min(90vw, 320px)',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="desktop-only" style={{ flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', lineHeight: 1.1 }}>{user.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user.role}</span>
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
              style={{ padding: '6px 12px', fontSize: '0.82rem', minHeight: '36px' }}
            >
              <User size={14} /> <span className="desktop-only">Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Fixed for Phones) */}
      <div className="mobile-bottom-nav">
        <button 
          onClick={() => setActiveTab('home')}
          className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        >
          <Compass size={19} />
          <span>Explore</span>
        </button>

        <button 
          onClick={() => {
            if (!user) onOpenAuth('Buyer');
            else setActiveTab('buyer');
          }}
          className={`mobile-nav-btn ${activeTab === 'buyer' ? 'active' : ''}`}
        >
          <ShoppingBag size={19} />
          <span>Buy</span>
        </button>

        <button 
          onClick={() => {
            if (!user) onOpenAuth('Seller');
            else setActiveTab('seller');
          }}
          className={`mobile-nav-btn ${activeTab === 'seller' ? 'active' : ''}`}
        >
          <DollarSign size={19} />
          <span>Sell</span>
        </button>

        <button 
          onClick={() => {
            if (!user) onOpenAuth('Renter');
            else setActiveTab('renter');
          }}
          className={`mobile-nav-btn ${activeTab === 'renter' ? 'active' : ''}`}
        >
          <Key size={19} />
          <span>Rent</span>
        </button>

        <button 
          onClick={onOpenAdminChat}
          className="mobile-nav-btn"
        >
          <MessageSquare size={19} />
          <span>Support</span>
        </button>

        {user && user.role === 'Admin' && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`mobile-nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
            style={{ color: activeTab === 'admin' ? '#f59e0b' : 'var(--text-muted)' }}
          >
            <ShieldCheck size={19} />
            <span>Admin</span>
          </button>
        )}
      </div>
    </>
  );
}
