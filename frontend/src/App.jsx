import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import RenterDashboard from './pages/RenterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthModal from './components/AuthModal';
import AdminChat from './components/AdminChat';
import AIChatbot from './components/AIChatbot';
import RoleGuard from './components/RoleGuard';

function MainApp() {
  const { user } = useAuth();
  
  // Determine initial active tab based on URL path/hash
  const getInitialTab = () => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('admin') || hash.includes('admin')) return 'admin';
    if (path.includes('seller') || hash.includes('seller')) return 'seller';
    if (path.includes('buyer') || hash.includes('buyer')) return 'buyer';
    if (path.includes('renter') || hash.includes('renter')) return 'renter';
    return 'home';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState('Buyer / Renter');

  const [showAdminChat, setShowAdminChat] = useState(false);
  const [chatTargetCar, setChatTargetCar] = useState(null);

  // Sync URL with active tab
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    try {
      const newPath = tab === 'home' ? '/' : `/${tab}`;
      window.history.pushState(null, '', newPath);
    } catch (e) {}
  };

  const handleOpenAuth = (role = 'Buyer / Renter') => {
    const normalized = (role === 'Buyer' || role === 'Renter') ? 'Buyer / Renter' : role;
    setAuthDefaultRole(normalized);
    setShowAuthModal(true);
  };

  const handleGetStarted = (role) => {
    const norm = (role || '').toLowerCase();
    const userRole = (user?.role || '').toLowerCase();
    if (userRole === 'admin') {
      handleTabChange('admin');
    } else if (user && (userRole === norm || (userRole.includes('buyer') && (norm.includes('buyer') || norm.includes('renter'))))) {
      handleTabChange(norm);
    } else {
      handleOpenAuth(role);
    }
  };

  const handleAuthSuccessRole = (role) => {
    const norm = (role || '').toLowerCase();
    if (norm.includes('admin')) {
      handleTabChange('admin');
    } else if (norm.includes('seller')) {
      handleTabChange('seller');
    } else {
      handleTabChange('buyer');
    }
  };

  const handleEnquireAdmin = (car) => {
    setChatTargetCar(car);
    setShowAdminChat(true);
  };

  const handleNavigateToCar = (car) => {
    handleTabChange('buyer');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('carhub_open_car_details', { detail: { carId: car.id || car._id } }));
    }, 150);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAuth={handleOpenAuth}
        onOpenAdminChat={() => { setChatTargetCar(null); setShowAdminChat(true); }}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomePage onGetStarted={handleGetStarted} onNavigate={handleTabChange} />
        )}
        {activeTab === 'seller' && (
          <RoleGuard allowedRole="Seller" onOpenAuth={handleOpenAuth} setActiveTab={handleTabChange}>
            <SellerDashboard onOpenAdminChat={() => setShowAdminChat(true)} />
          </RoleGuard>
        )}
        {activeTab === 'buyer' && (
          <RoleGuard allowedRole="Buyer / Renter" onOpenAuth={handleOpenAuth} setActiveTab={handleTabChange}>
            <BuyerDashboard onEnquireAdmin={handleEnquireAdmin} />
          </RoleGuard>
        )}
        {activeTab === 'renter' && (
          <RoleGuard allowedRole="Buyer / Renter" onOpenAuth={handleOpenAuth} setActiveTab={handleTabChange}>
            <RenterDashboard onEnquireAdmin={handleEnquireAdmin} />
          </RoleGuard>
        )}
        {activeTab === 'admin' && (
          <RoleGuard allowedRole="Admin" onOpenAuth={handleOpenAuth} setActiveTab={handleTabChange}>
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

      <AIChatbot 
        user={user}
        onNavigateToCar={handleNavigateToCar}
        onOpenAuth={handleOpenAuth}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
