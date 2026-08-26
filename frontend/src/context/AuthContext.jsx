import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const sessionSaved = sessionStorage.getItem('carhub_user');
      if (sessionSaved) return JSON.parse(sessionSaved);
      const localSaved = localStorage.getItem('carhub_user');
      if (localSaved) return JSON.parse(localSaved);
    } catch (e) {}
    return null;
  });

  // Wishlist starts EMPTY — no fake pre-filled cars
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('carhub_wishlist') || sessionStorage.getItem('carhub_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Only real notifications — no fake "Price Drop Alert"
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Welcome to CarHub! 🚗',
      message: 'Browse certified cars, rent a vehicle, or post yours for inspection.',
      type: 'info',
      time: 'Just now'
    }
  ]);

  // Track unread chat messages for notification badge
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('carhub_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const fetchDbNotifications = async () => {
      try {
        const userId = user?.id || user?._id || 'all';
        const res = await fetch(`/api/notifications/${userId}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setNotifications(list.map(n => ({
              id: n.id || n._id,
              title: n.title,
              message: n.message,
              type: n.type || 'info',
              time: new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          }
        }
      } catch (e) {}
    };

    fetchDbNotifications();
    const interval = setInterval(fetchDbNotifications, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const loginUser = (userData, rememberMe = false) => {
    setUser(userData);
    setUnreadChatCount(0);

    if (userData) {
      sessionStorage.setItem('carhub_user', JSON.stringify(userData));
      if (rememberMe) {
        localStorage.setItem('carhub_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('carhub_user');
      }
    }

    // Role-specific welcome notification
    const roleMessages = {
      'Buyer / Renter': 'You can browse certified cars to buy or book self-drive rental vehicles.',
      Buyer: 'You can browse and buy all CarHub certified vehicles.',
      Seller: 'Post your vehicle and get a doorstep inspection from CarHub Admin.',
      Renter: 'Browse available cars and book a self-drive rental.',
      Admin: 'Access your full command center to manage the platform.'
    };

    if (userData && roleMessages[userData.role]) {
      setNotifications(prev => [
        {
          id: Date.now(),
          title: `Logged in as ${userData.role}`,
          message: roleMessages[userData.role],
          type: 'info',
          time: 'Just now'
        },
        prev[0]
      ]);
    }
  };

  const logoutUser = () => {
    setUser(null);
    sessionStorage.removeItem('carhub_user');
    localStorage.removeItem('carhub_user');
    localStorage.removeItem('carhub_wishlist');
    sessionStorage.removeItem('carhub_wishlist');
    setWishlist([]);
    setNotifications([
      {
        id: 1,
        title: 'Welcome to CarHub! 🚗',
        message: 'Browse certified cars, rent a vehicle, or post yours for inspection.',
        type: 'info',
        time: 'Just now'
      }
    ]);
    setUnreadChatCount(0);
  };

  const toggleWishlist = (carId) => {
    setWishlist(prev =>
      prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
    );
  };

  const addNotification = (notification) => {
    setNotifications(prev => [
      { ...notification, id: Date.now(), time: 'Just now' },
      ...prev
    ]);
  };

  const incrementUnreadChat = () => {
    setUnreadChatCount(prev => prev + 1);
  };

  const clearUnreadChat = () => {
    setUnreadChatCount(0);
  };

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifs = async () => {
      if (!user) return;
      try {
        const userId = user.id || user._id || user.email;
        const list = await api.getUserNotifications(userId);
        if (Array.isArray(list) && list.length > 0) {
          setNotifications(list);
        }
      } catch (e) {}
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationAsRead = async (notifId) => {
    try {
      await api.markNotificationRead(notifId);
    } catch (e) {}
    setNotifications(prev => prev.map(n => (n.id === notifId || n._id === notifId ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginUser,
      logoutUser,
      wishlist,
      toggleWishlist,
      notifications,
      setNotifications,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      unreadChatCount,
      incrementUnreadChat,
      clearUnreadChat
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
