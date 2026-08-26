import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import RenterDashboard from './pages/RenterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AuthModal from './components/AuthModal';
import AdminChat from './components/AdminChat';
import AIChatbot from './components/AIChatbot';
import RoleGuard from './components/RoleGuard';

// ─── ISOLATED ADMIN PORTAL ───────────────────────────────────────────────────
function AdminPortal() {
  const { user: authContextUser, token: authContextToken } = useAuth();

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const sess = sessionStorage.getItem('carhub_admin_user');
      if (sess) return JSON.parse(sess);
      const loc = localStorage.getItem('carhub_admin_user');
      if (loc) return JSON.parse(loc);
    } catch { return null; }
    return null;
  });
  const [adminToken, setAdminToken] = useState(() => {
    return sessionStorage.getItem('carhub_admin_token') || localStorage.getItem('carhub_admin_token');
  });

  const [adminChatOpen, setAdminChatOpen] = useState(false);
  const [adminChatPartner, setAdminChatPartner] = useState(null);
  const [adminChatCar, setAdminChatCar] = useState(null);
  const [adminChatInitialMode, setAdminChatInitialMode] = useState(null);

  // Allow context admin user if present
  const effectiveUser = adminUser || (authContextUser?.role === 'Admin' ? authContextUser : null);
  const effectiveToken = adminToken || (authContextUser?.role === 'Admin' ? (authContextToken || localStorage.getItem('carhub_token')) : null);

  const handleAdminLogin = (user, token) => {
    setAdminUser(user);
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('carhub_admin_token');
    localStorage.removeItem('carhub_admin_user');
    sessionStorage.removeItem('carhub_admin_token');
    sessionStorage.removeItem('carhub_admin_user');
    setAdminUser(null);
    setAdminToken(null);
  };

  const handleGoToPublicPortal = () => {
    window.location.href = '/';
  };

  const handleOpenAdminChat = (payload) => {
    if (payload) {
      setAdminChatPartner({ buyerId: payload.buyerId, buyerName: payload.buyerName });
      setAdminChatCar(payload.carId ? { id: payload.carId, title: payload.carTitle } : null);
      setAdminChatInitialMode(payload.initialMode || null);
    } else {
      setAdminChatPartner(null);
      setAdminChatCar(null);
      setAdminChatInitialMode(null);
    }
    setAdminChatOpen(true);
  };

  if (!effectiveUser || !effectiveToken) {
    return (
      <AdminLogin
        onLoginSuccess={handleAdminLogin}
        onGoToPublicPortal={handleGoToPublicPortal}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal Admin Topbar */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
        borderBottom: '1px solid rgba(245,158,11,0.25)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#f59e0b',
        fontSize: '0.9rem',
        fontWeight: '700'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🛡️ CarHub Admin Control Center</span>
          <button
            onClick={handleGoToPublicPortal}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#94a3b8',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            ← View Public Site
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.82rem' }}>
            Logged in as <strong style={{ color: '#f8fafc' }}>{effectiveUser.name || effectiveUser.email}</strong>
          </span>
          <button
            onClick={handleAdminLogout}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#ef4444',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.8rem'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <main style={{ flex: 1 }}>
        <AdminDashboard isStandalone adminToken={effectiveToken} onOpenAdminChat={handleOpenAdminChat} />
      </main>

      <AdminChat
        isOpen={adminChatOpen}
        onClose={() => setAdminChatOpen(false)}
        targetCar={adminChatCar}
        chatPartner={adminChatPartner}
        initialMode={adminChatInitialMode}
      />
    </div>
  );
}

// ─── MAIN USER PORTAL ────────────────────────────────────────────────────────
function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState('Buyer / Renter');

  const [showAdminChat, setShowAdminChat] = useState(false);
  const [chatTargetCar, setChatTargetCar] = useState(null);

  const handleOpenAuth = (role = 'Buyer / Renter') => {
    const normalized = (role === 'Buyer' || role === 'Renter') ? 'Buyer / Renter' : role;
    setAuthDefaultRole(normalized);
    setShowAuthModal(true);
  };

  const handleGetStarted = (role) => {
    const norm = (role || '').toLowerCase();
    const userRole = (user?.role || '').toLowerCase();
    if (userRole === 'admin') {
      setActiveTab(norm);
    } else if (user && (userRole === norm || (userRole.includes('buyer') && (norm.includes('buyer') || norm.includes('renter'))))) {
      setActiveTab(norm);
    } else {
      handleOpenAuth(role);
    }
  };

  const handleAuthSuccessRole = (role) => {
    const norm = (role || '').toLowerCase();
    if (norm.includes('admin')) {
      setActiveTab('admin');
    } else if (norm.includes('seller')) {
      setActiveTab('seller');
    } else {
      setActiveTab('buyer');
    }
  };

  const handleEnquireAdmin = (car) => {
    setChatTargetCar(car);
    setShowAdminChat(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onOpenAdminChat={() => { setChatTargetCar(null); setShowAdminChat(true); }}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomePage onGetStarted={handleGetStarted} onNavigate={setActiveTab} />
        )}
        {activeTab === 'seller' && (
          <RoleGuard allowedRole="Seller" onOpenAuth={handleOpenAuth} setActiveTab={setActiveTab}>
            <SellerDashboard onOpenAdminChat={() => setShowAdminChat(true)} />
          </RoleGuard>
        )}
        {activeTab === 'buyer' && (
          <RoleGuard allowedRole="Buyer / Renter" onOpenAuth={handleOpenAuth} setActiveTab={setActiveTab}>
            <BuyerDashboard onEnquireAdmin={handleEnquireAdmin} />
          </RoleGuard>
        )}
        {activeTab === 'renter' && (
          <RoleGuard allowedRole="Buyer / Renter" onOpenAuth={handleOpenAuth} setActiveTab={setActiveTab}>
            <RenterDashboard onEnquireAdmin={handleEnquireAdmin} />
          </RoleGuard>
        )}
        {activeTab === 'admin' && (
          <RoleGuard allowedRole="Admin" onOpenAuth={handleOpenAuth} setActiveTab={setActiveTab}>
            <AdminDashboard isStandalone={false} onOpenAdminChat={handleEnquireAdmin} />
          </RoleGuard>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultRole={authDefaultRole}
        onSuccessRole={handleAuthSuccessRole}
      />

      <AdminChat
        isOpen={showAdminChat}
        onClose={() => setShowAdminChat(false)}
        targetCar={chatTargetCar}
      />

      <AIChatbot />
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
function AppRoot() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isAdminPath = pathname.startsWith('/admin');

  if (isAdminPath) {
    return (
      <ThemeProvider>
        <AuthProvider>
          <AdminPortal />
        </AuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return <AppRoot />;
}
