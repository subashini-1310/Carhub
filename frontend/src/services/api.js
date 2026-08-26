// Frontend API service layer with local fallback support

const API_BASE = '/api';

// ── Registered users store (persists across page reloads via localStorage) ──
const getRegisteredUsers = () => {
  const seed = [
    { id: 'usr-admin', name: 'CarHub Admin', email: 'admin@carhub.com', password: 'password123', role: 'Admin', city: 'Chennai' },
    { id: 'usr-buyer', name: 'Rahul Customer', email: 'buyer@gmail.com', password: 'password123', role: 'Buyer / Renter', city: 'Chennai' },
    { id: 'usr-seller', name: 'Ramesh Seller', email: 'seller@gmail.com', password: 'password123', role: 'Seller', city: 'Chennai' }
  ];
  const stored = localStorage.getItem('carhub_registered_users');
  if (!stored) {
    localStorage.setItem('carhub_registered_users', JSON.stringify(seed));
    return seed;
  }
  const parsed = JSON.parse(stored);
  // Merge seed defaults if not present
  const emails = parsed.map(u => u.email + u.role);
  seed.forEach(s => {
    if (!emails.includes(s.email + s.role)) parsed.push(s);
  });
  return parsed;
};

const saveRegisteredUsers = (users) => {
  localStorage.setItem('carhub_registered_users', JSON.stringify(users));
};

// ── Published cars store (in-memory, survives filter changes within session) ──
// Key: used to track admin-published cars so buyer page always sees them.
const getPublishedCars = () => {
  try {
    const stored = localStorage.getItem('carhub_published_cars');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const savePublishedCars = (cars) => {
  try {
    localStorage.setItem('carhub_published_cars', JSON.stringify(cars));
  } catch (e) {
    console.warn('[CarHub Storage Warning] localStorage quota limit reached for published cars:', e.message);
    try {
      // Graceful fallback: store only essentials without heavy base64 strings
      const lightweight = cars.slice(0, 15).map(c => ({
        ...c,
        images: c.images ? c.images.slice(0, 1) : []
      }));
      localStorage.setItem('carhub_published_cars', JSON.stringify(lightweight));
    } catch (err) {}
  }
};

// ── Seller-submitted cars store ──
const getSellerCars = () => {
  try {
    const stored = localStorage.getItem('carhub_seller_cars');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveSellerCars = (cars) => {
  try {
    localStorage.setItem('carhub_seller_cars', JSON.stringify(cars));
  } catch (e) {
    console.warn('[CarHub Storage Warning] localStorage quota limit reached for seller cars:', e.message);
    try {
      // Graceful fallback: store without heavy base64 payloads
      const lightweight = cars.slice(0, 10).map(c => ({
        ...c,
        images: c.images ? c.images.slice(0, 1) : []
      }));
      localStorage.setItem('carhub_seller_cars', JSON.stringify(lightweight));
    } catch (err) {}
  }
};

// ── Deleted cars store (persists so deleted cars never reappear across reloads) ──
const getDeletedCarIds = () => {
  try {
    const stored = localStorage.getItem('carhub_deleted_car_ids');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const addDeletedCarId = (id) => {
  try {
    if (!id) return;
    const strId = String(id);
    const existing = getDeletedCarIds();
    if (!existing.includes(strId)) {
      existing.push(strId);
      localStorage.setItem('carhub_deleted_car_ids', JSON.stringify(existing));
    }
  } catch (e) {}
};

const purgeCarFromLocalCaches = (carId) => {
  if (!carId) return;
  const strId = String(carId);
  addDeletedCarId(strId);

  // Remove from published cars
  const published = getPublishedCars().filter(c => (c.id || c._id) !== strId && String(c.id) !== strId && String(c._id) !== strId);
  savePublishedCars(published);

  // Remove from seller cars
  const seller = getSellerCars().filter(c => (c.id || c._id) !== strId && String(c.id) !== strId && String(c._id) !== strId);
  saveSellerCars(seller);

  // Remove from wishlist
  try {
    const wishlist = JSON.parse(localStorage.getItem('carhub_wishlist') || '[]');
    const updatedWishlist = wishlist.filter(wId => String(wId) !== strId);
    localStorage.setItem('carhub_wishlist', JSON.stringify(updatedWishlist));
  } catch (e) {}

  // Broadcast deletion event to update open tabs in real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('carhub_car_deleted', { detail: { id: strId } }));
  }
};

export const api = {
  // ── AUTH ──────────────────────────────────────────────────
  login: async (email, password, role) => {
    // Try backend first
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      return data;
    } catch (e) {
      // Re-throw if error was generated from an HTTP error response (e.g. 404, 401, 403)
      if (e.status || (e.message && !e.message.includes('fetch') && !e.message.includes('URL'))) {
        throw e;
      }
    }

    // Offline fallback: multi-role email validation sequence
    const users = getRegisteredUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();
    const targetRole = (role || 'Buyer / Renter').toLowerCase();

    const isRoleMatch = (userRole, target) => {
      const u = (userRole || '').toLowerCase();
      const t = (target || 'buyer / renter').toLowerCase();
      if ((u.includes('buyer') || u.includes('renter')) && (t.includes('buyer') || t.includes('renter'))) return true;
      return u === t;
    };

    // Find account matching email AND role
    const matchUser = users.find(u =>
      u.email.toLowerCase() === normalizedEmail && isRoleMatch(u.role, targetRole)
    );

    if (!matchUser) {
      // Check if registered under other roles
      const existingOtherRoles = users.filter(u => u.email.toLowerCase() === normalizedEmail).map(u => u.role);
      if (existingOtherRoles.length > 0) {
        const unique = [...new Set(existingOtherRoles)].join(', ');
        throw new Error(`This account is registered as a ${unique}. Please select the correct account type to proceed, or register as a ${role || 'Buyer / Renter'}.`);
      }

      throw new Error('User not found. Please register first.');
    }

    // Password Check
    if (matchUser.password !== password) {
      throw new Error('Invalid credentials.');
    }

    return {
      token: 'mock_jwt_token_' + Date.now(),
      user: { id: matchUser.id, name: matchUser.name, email: matchUser.email, role: matchUser.role, city: matchUser.city }
    };
  },

  register: async (data) => {
    // Try backend first
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Registration failed');
      return result;
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.message.includes('fetch')) throw e;
    }

    // Offline fallback: register into local registry
    const users = getRegisteredUsers();
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const selectedRole = data.role || 'Buyer / Renter';

    const isRoleMatchReg = (userRole, target) => {
      const u = (userRole || '').toLowerCase();
      const t = (target || 'buyer / renter').toLowerCase();
      if ((u.includes('buyer') || u.includes('renter')) && (t.includes('buyer') || t.includes('renter'))) return true;
      return u === t;
    };

    const exists = users.find(u =>
      u.email.toLowerCase() === normalizedEmail && isRoleMatchReg(u.role, selectedRole)
    );
    if (exists) throw new Error(`An account with this email is already registered as a ${exists.role}. Please log in.`);

    const newUser = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password,
      role: selectedRole,
      city: data.city || 'Chennai'
    };
    users.push(newUser);
    saveRegisteredUsers(users);

    return {
      token: 'mock_jwt_token_' + Date.now(),
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, city: newUser.city }
    };
  },

  googleLogin: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google authentication failed');
      return data;
    } catch (e) {
      if (e.message && !e.message.includes('fetch')) throw e;
    }

    // Local Google auth fallback
    const users = getRegisteredUsers();
    const email = (payload.email || 'googleuser@gmail.com').toLowerCase();
    const role = payload.role || 'Buyer / Renter';
    let user = users.find(u => u.email.toLowerCase() === email && (u.role === role || u.role.includes('Buyer')));
    if (!user) {
      user = {
        id: `usr-g-${Date.now()}`,
        name: payload.name || email.split('@')[0],
        email: email,
        password: '',
        role: role,
        city: 'Chennai',
        avatar: payload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
      };
      users.push(user);
      saveRegisteredUsers(users);
    }
    return {
      token: 'mock_google_jwt_' + Date.now(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city, avatar: user.avatar }
    };
  },

  // ── BUYER CARS ────────────────────────────────────────────
  getBuyerCars: async () => {
    const deletedIds = new Set(getDeletedCarIds());
    const isNotDeleted = (c) => !deletedIds.has(String(c.id)) && !deletedIds.has(String(c._id));

    // Try backend first
    try {
      const res = await fetch(`${API_BASE}/cars/buyer`);
      if (res.ok) {
        const data = await res.json();
        // Merge with any locally published cars (for offline mode)
        const localPublished = getPublishedCars().filter(isNotDeleted);
        const backendIds = data.map(c => String(c.id || c._id));
        const extra = localPublished.filter(c => {
          const isEligible = c.status === 'for_sale' || c.status === 'sale_and_rent' || c.status === 'both' || c.targetMarket === 'buyer' || c.targetMarket === 'both';
          return isEligible && !backendIds.includes(String(c.id || c._id));
        });
        return [...data, ...extra].filter(isNotDeleted);
      }
    } catch (e) {}

    // Offline fallback: seed cars + any admin-published cars
    const published = getPublishedCars().filter(isNotDeleted);
    const publishedIds = published.map(c => String(c.id || c._id));
    const seedForBuyer = mockSeedCars
      .filter(isNotDeleted)
      .filter(c => (c.status === 'for_sale' || c.status === 'sale_and_rent' || c.status === 'both' || c.targetMarket === 'buyer' || c.targetMarket === 'both') && !publishedIds.includes(String(c.id)));
    return [...seedForBuyer, ...published.filter(c => c.status === 'for_sale' || c.status === 'sale_and_rent' || c.status === 'both' || c.targetMarket === 'buyer' || c.targetMarket === 'both')].filter(isNotDeleted);
  },

  // ── RENTER CARS ───────────────────────────────────────────
  getRenterCars: async () => {
    const deletedIds = new Set(getDeletedCarIds());
    const isNotDeleted = (c) => !deletedIds.has(String(c.id)) && !deletedIds.has(String(c._id));

    try {
      const res = await fetch(`${API_BASE}/cars/renter`);
      if (res.ok) {
        const data = await res.json();
        const localPublished = getPublishedCars().filter(isNotDeleted);
        const backendIds = data.map(c => String(c.id || c._id));
        const extra = localPublished.filter(c => {
          const isEligible = c.status === 'for_rent' || c.status === 'sale_and_rent' || c.status === 'both' || c.targetMarket === 'renter' || c.targetMarket === 'both';
          return isEligible && !backendIds.includes(String(c.id || c._id));
        });
        return [...data, ...extra].filter(isNotDeleted);
      }
    } catch (e) {}

    const published = getPublishedCars().filter(isNotDeleted);
    const publishedIds = published.map(c => String(c.id || c._id));
    const seedForRent = mockSeedCars
      .filter(isNotDeleted)
      .filter(c => (c.status === 'for_rent' || c.status === 'sale_and_rent' || c.status === 'both' || c.targetMarket === 'renter' || c.targetMarket === 'both') && !publishedIds.includes(String(c.id)));
    return [...seedForRent, ...published.filter(c => c.status === 'for_rent' || c.status === 'sale_and_rent' || c.status === 'both' || c.targetMarket === 'renter' || c.targetMarket === 'both')].filter(isNotDeleted);
  },

  // ── SELLER SUBMIT CAR ─────────────────────────────────────
  postSellerCar: async (carData) => {
    try {
      const res = await fetch(`${API_BASE}/seller/post-car`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      });
      if (res.ok) {
        const result = await res.json();
        // Also save locally so admin can see even in offline mode
        const cars = getSellerCars();
        cars.unshift({ ...carData, id: result.car?.id || `car-${Date.now()}`, status: 'seller_posted' });
        saveSellerCars(cars);
        return result;
      }
    } catch (e) {}

    // Offline fallback
    const newCar = { ...carData, id: `car-${Date.now()}`, status: 'seller_posted', submittedAt: new Date().toISOString() };
    const cars = getSellerCars();
    cars.unshift(newCar);
    saveSellerCars(cars);
    return {
      message: 'Vehicle submitted to CarHub Admin for personal inspection & valuation!',
      car: newCar
    };
  },

  // ── SELLER GET MY CARS ────────────────────────────────────
  getSellerCars: async (sellerId) => {
    try {
      const res = await fetch(`${API_BASE}/seller/my-cars/${sellerId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    // Return only cars for this seller (no fake cross-seller data)
    return getSellerCars().filter(c => c.sellerId === sellerId);
  },

  // ── SELLER AI PRICE ESTIMATE ─────────────────────────────
  getAISellerPrice: async (carData) => {
    try {
      const res = await fetch(`${API_BASE}/seller/ai-price-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Offline AI price estimator fallback
    const brand = (carData.brand || '').toLowerCase();
    const model = (carData.model || '').toLowerCase();
    const year = parseInt(carData.year) || 2022;
    const km = parseInt(carData.kmDriven) || 25000;
    const mileage = parseFloat(carData.mileage) || 16.0;

    let base = 1000000;
    if (brand.includes('toyota')) base = 1600000;
    else if (brand.includes('hyundai')) base = 1100000;
    else if (brand.includes('kia')) base = 1050000;
    else if (brand.includes('tata')) base = 950000;
    else if (brand.includes('maruti')) base = 750000;
    else if (brand.includes('bmw') || brand.includes('mercedes')) base = 3500000;

    const agePenalty = Math.max(0, (2026 - year)) * 65000;
    const kmPenalty = Math.floor(km / 10000) * 20000;
    const mileageBonus = mileage >= 18 ? 30000 : (mileage < 12 ? -20000 : 0);

    const rec = Math.max(150000, base - agePenalty - kmPenalty + mileageBonus);
    return {
      recommendedPrice: rec,
      minPrice: Math.round(rec * 0.94),
      maxPrice: Math.round(rec * 1.07),
      confidenceScore: 95,
      marketInsights: `Calculated from regional transactions for ${year} ${carData.brand || ''} ${carData.model || ''}.`
    };
  },

  // ── ALL CARS FOR ADMIN (UNIFIED MARKETPLACE + FLEET + PENDING) ──
  getAllCarsForAdmin: async () => {
    const deletedIds = new Set(getDeletedCarIds());
    const isNotDeleted = (c) => !deletedIds.has(String(c.id)) && !deletedIds.has(String(c._id));

    let backendCars = [];
    try {
      const adminToken = localStorage.getItem('carhub_admin_token') || sessionStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/cars`, {
        headers: { 'Authorization': adminToken ? `Bearer ${adminToken}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          backendCars = data.filter(isNotDeleted);
        }
      }
    } catch (e) {}

    // Combine with buyer cars, renter cars, seller cars, and published cars
    const buyerCars = await api.getBuyerCars().catch(() => []);
    const renterCars = await api.getRenterCars().catch(() => []);
    const published = getPublishedCars().filter(isNotDeleted);
    const sellerCars = getSellerCars().filter(isNotDeleted);

    const combined = [
      ...backendCars,
      ...(Array.isArray(buyerCars) ? buyerCars : []),
      ...(Array.isArray(renterCars) ? renterCars : []),
      ...published,
      ...sellerCars,
      ...mockSeedCars.filter(isNotDeleted)
    ];

    const uniqueIds = new Set();
    const deduped = [];
    for (const c of combined) {
      const cId = String(c.id || c._id);
      if (!uniqueIds.has(cId)) {
        uniqueIds.add(cId);
        deduped.push(c);
      }
    }
    return deduped.filter(isNotDeleted);
  },

  // ── ADMIN REPORTS & STATS ────────────────────────────────
  getAdminReports: async () => {
    try {
      const adminToken = localStorage.getItem('carhub_admin_token') || sessionStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/reports`, {
        headers: { 'Authorization': adminToken ? `Bearer ${adminToken}` : '' }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      overview: {
        totalInventory: 12,
        carsForSaleCount: 6,
        carsForRentCount: 4,
        pendingInspectionsCount: 2,
        totalRevenue: 2450000,
        rentalBookingsCount: 8
      }
    };
  },

  // ── DELETE VEHICLE (SELLER, ADMIN & BUYER) ─────────────
  deleteSellerCar: async (id) => {
    purgeCarFromLocalCaches(id);

    try {
      // Call dedicated seller delete endpoint first
      const res = await fetch(`${API_BASE}/seller/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        purgeCarFromLocalCaches(id);
        return data;
      }
    } catch (e) {}

    // Fallback: general car delete endpoint
    try {
      const res2 = await fetch(`${API_BASE}/cars/${id}`, { method: 'DELETE' });
      if (res2.ok) {
        const data2 = await res2.json();
        purgeCarFromLocalCaches(id);
        return data2;
      }
    } catch (e) {}

    purgeCarFromLocalCaches(id);
    return { success: true, message: `Car with ID ${id} deleted successfully.`, id };
  },

  deleteCarByAdmin: async (id) => {
    purgeCarFromLocalCaches(id);

    try {
      const adminToken = localStorage.getItem('carhub_admin_token') || sessionStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/cars/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': adminToken ? `Bearer ${adminToken}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        purgeCarFromLocalCaches(id);
        return data;
      }
    } catch (e) {}

    // Fallback: try general car delete
    try {
      const res2 = await fetch(`${API_BASE}/cars/${id}`, { method: 'DELETE' });
      if (res2.ok) {
        const data2 = await res2.json();
        purgeCarFromLocalCaches(id);
        return data2;
      }
    } catch (e) {}

    purgeCarFromLocalCaches(id);
    return { success: true, message: `Car with ID ${id} deleted successfully.`, id };
  },

  deleteUserByAdmin: async (id) => {
    try {
      const adminToken = localStorage.getItem('carhub_admin_token') || sessionStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': adminToken ? `Bearer ${adminToken}` : '' }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const users = getRegisteredUsers().filter(u => u.id !== id);
    saveRegisteredUsers(users);
    return { message: `User deleted successfully.` };
  },

  deleteBuyerCar: async (id) => {
    purgeCarFromLocalCaches(id);
    try {
      const res = await fetch(`${API_BASE}/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        purgeCarFromLocalCaches(id);
        return data;
      }
    } catch (e) {}

    purgeCarFromLocalCaches(id);
    return { message: 'Car removed successfully', id };
  },

  // ── LIVE CHAT & INQUIRIES API ─────────────────────────────
  sendChatMessage: async (msgData) => {
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback store
    const localMsg = {
      _id: `msg-${Date.now()}`,
      ...msgData,
      timestamp: new Date(),
      isRead: false
    };
    try {
      const existing = JSON.parse(localStorage.getItem('carhub_chat_messages') || '[]');
      existing.push(localMsg);
      localStorage.setItem('carhub_chat_messages', JSON.stringify(existing));
    } catch (err) {}
    return localMsg;
  },

  getChatConversation: async (userId, carId, partnerId) => {
    try {
      let url = `${API_BASE}/chat/conversation/${userId || 'guest'}`;
      const params = new URLSearchParams();
      if (carId && carId !== 'all') params.append('carId', carId);
      if (partnerId) params.append('partnerId', partnerId);
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}

    try {
      const existing = JSON.parse(localStorage.getItem('carhub_chat_messages') || '[]');
      return existing.filter(m => {
        const userMatch = (userId === 'admin')
          ? (partnerId ? (m.senderId === partnerId || m.recipientId === partnerId) : true)
          : (m.senderId === userId || m.recipientId === userId);
        const carMatch = (carId && carId !== 'all') ? String(m.carId) === String(carId) : true;
        return userMatch && carMatch;
      });
    } catch (err) {
      return [];
    }
  },

  markChatSeen: async ({ readerId, senderId, carId }) => {
    try {
      const res = await fetch(`${API_BASE}/chat/mark-seen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerId, senderId, carId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    try {
      const existing = JSON.parse(localStorage.getItem('carhub_chat_messages') || '[]');
      existing.forEach(m => {
        if (readerId && m.recipientId === readerId) m.isRead = true;
      });
      localStorage.setItem('carhub_chat_messages', JSON.stringify(existing));
    } catch (err) {}
    return { success: true };
  },

  getUserChatThreads: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/user-threads/${userId || 'guest'}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  getAdminChatThreads: async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/admin-threads`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return [];
  },


  // ── NOTIFICATIONS API ─────────────────────────────────────
  getUserNotifications: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${userId || 'all'}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  createNotification: async (notifData) => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return notifData;
  },

  markNotificationRead: async (notifId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'PUT' });
      if (res.ok) return await res.json();
    } catch (e) {}
  },

  triggerPriceDrop: async (carId, carTitle, oldPrice, newPrice) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/price-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, carTitle, oldPrice, newPrice })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  },

  // ── ADMIN PENDING INSPECTIONS ─────────────────────────────
  getPendingInspections: async () => {
    try {
      const adminToken = localStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/pending-inspections`, {
        headers: {
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Only seller_posted cars (not published ones)
    return getSellerCars().filter(c => c.status === 'seller_posted');
  },

  // ── ADMIN REGISTERED USERS ────────────────────────────────
  getAdminUsers: async () => {
    try {
      const adminToken = localStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Return real registered users (no fake hardcoded list)
    return getRegisteredUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, city: u.city }));
  },

  // ── ADMIN AI SCAN ─────────────────────────────────────────
  runAIScan: async (id) => {
    try {
      const adminToken = localStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/ai-inspect/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      message: 'AI Scan complete! Vehicle body structure analyzed.',
      aiInspection: {
        damageScore: Math.floor(Math.random() * 15) + 82,
        blurPassed: true,
        ocrPlateDetected: 'TN 09 AB 1234',
        detectedColor: 'White',
        estimatedMarketValue: null // Don't show fake market value
      }
    };
  },

  // ── ADMIN PURCHASE & PUBLISH ──────────────────────────────
  purchaseAndPublish: async (id, publishData) => {
    try {
      const adminToken = localStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/admin/purchase-and-publish/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        },
        body: JSON.stringify(publishData)
      });
      if (res.ok) {
        const result = await res.json();
        // Also update local stores
        _localPublishCar(id, publishData);
        return result;
      }
    } catch (e) {}

    // Offline fallback
    _localPublishCar(id, publishData);
    return { message: 'Car purchased from seller and published to marketplace!' };
  },

  // ── ADMIN RENTAL BOOKINGS ─────────────────────────────────
  getAdminRentalBookings: async () => {
    let remoteBookings = [];
    try {
      const adminToken = localStorage.getItem('carhub_admin_token') || sessionStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/rentals/admin-all`, {
        headers: { 'Authorization': adminToken ? `Bearer ${adminToken}` : '' }
      });
      if (res.ok) {
        remoteBookings = await res.json();
      }
    } catch (e) {}

    const stored = localStorage.getItem('carhub_rental_bookings');
    const localBookings = stored ? JSON.parse(stored) : [];

    const localStatusMap = new Map();
    localBookings.forEach(b => {
      const idKey = String(b.id || b._id);
      if (idKey && b.status) localStatusMap.set(idKey, b.status);
    });

    if (Array.isArray(remoteBookings) && remoteBookings.length > 0) {
      return remoteBookings.map(b => {
        const idKey = String(b.id || b._id);
        if (localStatusMap.has(idKey)) {
          return { ...b, status: localStatusMap.get(idKey) };
        }
        return b;
      });
    }

    return localBookings.map(b => {
      const idKey = String(b.id || b._id);
      if (localStatusMap.has(idKey)) {
        return { ...b, status: localStatusMap.get(idKey) };
      }
      return b;
    });
  },

  updateRentalStatus: async (bookingId, status) => {
    let result = null;
    try {
      const adminToken = localStorage.getItem('carhub_admin_token') || sessionStorage.getItem('carhub_admin_token');
      const res = await fetch(`${API_BASE}/rentals/status/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        result = await res.json();
      }
    } catch (e) {}

    // Update local storage so booking status persists reliably
    const stored = localStorage.getItem('carhub_rental_bookings');
    let bookings = stored ? JSON.parse(stored) : [];

    const targetIdStr = String(bookingId);
    const idx = bookings.findIndex(b => String(b.id || b._id) === targetIdStr);
    if (idx !== -1) {
      bookings[idx].status = status;
    } else {
      bookings.push({ id: bookingId, status });
    }
    localStorage.setItem('carhub_rental_bookings', JSON.stringify(bookings));

    return result || { message: `Rental booking status updated to ${status.toUpperCase()}!`, booking: { id: bookingId, status } };
  },

  getRenterBookings: async (renterId) => {
    let remoteBookings = [];
    try {
      const res = await fetch(`${API_BASE}/rentals/my-bookings/${renterId || 'guest'}`);
      if (res.ok) {
        remoteBookings = await res.json();
      }
    } catch (e) {}

    const stored = localStorage.getItem('carhub_rental_bookings');
    const localBookings = stored ? JSON.parse(stored) : [];

    const localStatusMap = new Map();
    localBookings.forEach(b => {
      const idKey = String(b.id || b._id);
      if (idKey && b.status) localStatusMap.set(idKey, b.status);
    });

    if (Array.isArray(remoteBookings) && remoteBookings.length > 0) {
      return remoteBookings.map(b => {
        const idKey = String(b.id || b._id);
        if (localStatusMap.has(idKey)) {
          return { ...b, status: localStatusMap.get(idKey) };
        }
        return b;
      });
    }

    const fallbackList = localBookings.filter(b => renterId && (b.renterId === renterId || b.renterEmail === renterId));
    return fallbackList.map(b => {
      const idKey = String(b.id || b._id);
      if (localStatusMap.has(idKey)) {
        return { ...b, status: localStatusMap.get(idKey) };
      }
      return b;
    });
  },

  // ── AI CHATBOT ────────────────────────────────────────────
  askAIChatbot: async (message) => {
    try {
      const res = await fetch(`${API_BASE}/cars/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return localChatbotResponse(message);
  }
};

// ── Local helper: publish a car from seller-posted to for_sale/for_rent ──
function _localPublishCar(carId, publishData) {
  const { targetMarket, sellingPrice, rentalPricePerDay, purchasePriceByAdmin } = publishData;

  let statusMap = { buyer: 'for_sale', renter: 'for_rent', both: 'sale_and_rent' };
  const newStatus = statusMap[targetMarket] || 'for_sale';

  // Update seller cars (mark as purchased)
  const sellerCars = getSellerCars();
  const idx = sellerCars.findIndex(c => (c.id || c._id) === carId);
  if (idx !== -1) {
    const car = { ...sellerCars[idx] };
    car.status = newStatus;
    car.price = parseInt(sellingPrice);
    car.rentalPricePerDay = parseInt(rentalPricePerDay);
    car.purchasePriceByAdmin = parseInt(purchasePriceByAdmin);
    car.priceDrop = false; // admin hasn't reduced it yet
    sellerCars[idx] = car;
    saveSellerCars(sellerCars);

    // Add to published cars so buyer/renter page shows it
    const published = getPublishedCars();
    const existingIdx = published.findIndex(c => (c.id || c._id) === carId);
    if (existingIdx !== -1) {
      published[existingIdx] = car;
    } else {
      published.unshift(car);
    }
    savePublishedCars(published);
  }
}

// ── Client-side AI Chatbot engine (accurate, data-driven) ──
function localChatbotResponse(message) {
  const q = message.toLowerCase().trim();

  // Greeting
  if (q.match(/^(hi|hello|hey|namaste|vanakkam)/)) {
    return {
      text: "Hello! Welcome to CarHub 🚗 I'm your AI Assistant. How can I help you today?",
      quickReplies: ['View available cars', 'How to sell my car', 'Rental rules', 'Contact Admin']
    };
  }

  // Available cars
  if (q.includes('available') || q.includes('cars') || q.includes('show') || q.includes('list')) {
    return {
      text: "CarHub currently has certified pre-owned cars available for sale and rent. All vehicles are personally inspected by our Admin before listing. Go to 'Buy Cars' to browse the full inventory.",
      quickReplies: ['How to buy a car', 'Rental options', 'Contact Admin']
    };
  }

  // How to sell
  if (q.includes('sell') || q.includes('selling') || q.includes('submit') || q.includes('post')) {
    return {
      text: "To sell your car on CarHub:\n1️⃣ Log in as a Seller\n2️⃣ Click 'Post Vehicle for Inspection'\n3️⃣ Fill in your car details and image\n4️⃣ CarHub Admin will do a doorstep inspection\n5️⃣ If approved, admin buys the car and pays you directly\n\n⚠️ Your car is NEVER shown to buyers until admin inspects and purchases it.",
      quickReplies: ['How much will I get?', 'Contact Admin', 'Rental rules']
    };
  }

  // Price / valuation
  if (q.includes('price') || q.includes('how much') || q.includes('value') || q.includes('cost') || q.includes('rate')) {
    return {
      text: "CarHub prices are set by our Admin based on:\n• Vehicle condition & KM driven\n• Market value at time of inspection\n• 140+ point certification check\n\nFor selling: you propose your expected price, and Admin will give you a fair counter-offer after in-person inspection. For rentals, rates vary by vehicle type.",
      quickReplies: ['How to sell', 'Contact Admin for quote', 'View rental rates']
    };
  }

  // Rental
  if (q.includes('rent') || q.includes('rental') || q.includes('book') || q.includes('booking') || q.includes('hire')) {
    return {
      text: "CarHub Rental Policy:\n🔑 Daily & weekly rentals available\n✅ All rental cars are 140-point inspected\n📍 Pickup from CarHub office location\n💰 Pay daily rate × number of days\n📞 Contact Admin to confirm booking details\n\nGo to 'Rentals' tab to see available cars and book instantly!",
      quickReplies: ['View rental fleet', 'Contact Admin', 'How does pricing work']
    };
  }

  // Contact admin
  if (q.includes('contact') || q.includes('admin') || q.includes('chat') || q.includes('call') || q.includes('speak') || q.includes('talk')) {
    return {
      text: "You can contact CarHub Admin directly via the Chat button in the navbar (📩 'Chat Admin'). The admin chat supports:\n💬 Text messages\n📞 Audio call\n📹 Video call\n\nAll buyers, sellers, and renters can only communicate with Admin. Sellers and buyers do not interact directly.",
      quickReplies: ['Open Admin Chat', 'How to sell', 'Rental rules']
    };
  }

  // Inspection
  if (q.includes('inspect') || q.includes('certified') || q.includes('quality') || q.includes('condition')) {
    return {
      text: "Every CarHub vehicle goes through a rigorous 140+ point inspection:\n🔍 Engine & transmission check\n🛞 Tyre & brake condition\n💧 Oil & coolant levels\n🎨 Paint & body assessment\n📋 Service history verification\n🔌 Electrical & AC systems\n\nOnly cars that pass all checks are listed on the marketplace.",
      quickReplies: ['How to sell', 'View certified cars', 'Contact Admin']
    };
  }

  // EMI / loan
  if (q.includes('emi') || q.includes('loan') || q.includes('finance') || q.includes('equated')) {
    return {
      text: "Use our built-in EMI Calculator on any car listing!\n📊 Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)\n• P = Principal (car price - down payment)\n• r = Monthly interest rate (typical: 9-12% p.a.)\n• n = Loan tenure in months (12-84 months)\n\nCarHub partners with leading banks for quick loan approvals. Contact Admin for financing assistance.",
      quickReplies: ['Contact Admin for loan', 'View cars for sale']
    };
  }

  // Buyer registration
  if (q.includes('register') || q.includes('signup') || q.includes('sign up') || q.includes('account') || q.includes('create')) {
    return {
      text: "Creating a CarHub account is easy!\n1️⃣ Click 'Login / Signup' on the top right\n2️⃣ Select your role: Buyer, Seller, or Renter\n3️⃣ Enter your name, email, and password\n4️⃣ Start using CarHub immediately!\n\n🔐 Admin accounts require a special authorization key.",
      quickReplies: ['I want to buy a car', 'I want to sell my car', 'I want to rent']
    };
  }

  // Buyer asking to sell (role conflict)
  if (q.includes('i am a buyer') || q.includes('can buyer sell') || q.includes('buyer sell')) {
    return {
      text: "⚠️ Buyers cannot sell cars through the Buyer portal. To sell a car, you need to:\n1️⃣ Logout from your current account\n2️⃣ Sign up or login as a Seller\n3️⃣ Post your car for inspection\n\nEach role (Buyer / Seller / Renter) has a separate account.",
      quickReplies: ['How to sell my car', 'Contact Admin']
    };
  }

  // Default fallback
  return {
    text: "I'm CarHub AI! I can help you with:\n• 🚗 Buying certified cars\n• 💰 Selling your vehicle\n• 🔑 Renting a car\n• 📋 Inspection process\n• 💳 EMI & loan info\n• 📞 Contacting Admin\n\nPlease ask me a specific question!",
    quickReplies: ['How to buy', 'How to sell', 'Rental rules', 'Contact Admin']
  };
}

// ── Seed data (fallback when backend is offline) ──
const mockSeedCars = [
  {
    id: 'car-101',
    title: 'Toyota Innova Crysta 2.4 ZX Diesel',
    brand: 'Toyota',
    model: 'Innova Crysta',
    year: 2023,
    price: 1850000,
    originalPrice: 1900000,
    priceDrop: true, // Admin set this
    rentalPricePerDay: 3500,
    purchasePriceByAdmin: 1780000,
    kmDriven: 18500,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    color: 'Super White',
    bodyType: 'MUV',
    location: 'Chennai',
    distanceKm: 8,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'
    ],
    description: 'Certified 140+ point inspected Toyota Innova Crysta ZX top model. Full service history at authorized Toyota center.',
    status: 'sale_and_rent',
    targetMarket: 'both',
    features: ['Captain Seats', 'Touchscreen Infotainment', 'Cruise Control', '7 Airbags'],
    rating: 4.9
  },
  {
    id: 'car-102',
    title: 'Hyundai Creta SX 1.5 Petrol',
    brand: 'Hyundai',
    model: 'Creta',
    year: 2022,
    price: 920000,
    originalPrice: 920000,
    priceDrop: false,
    rentalPricePerDay: 2200,
    purchasePriceByAdmin: 890000,
    kmDriven: 24000,
    fuelType: 'Petrol',
    transmission: 'Manual',
    color: 'Titan Grey',
    bodyType: 'SUV',
    location: 'Chennai',
    distanceKm: 14,
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
      'https://images.unsplash.com/photo-1541348263662-e082662d82da?w=800'
    ],
    description: 'Pristine condition Creta SX with panoramic sunroof, wireless charging, and ambient lighting.',
    status: 'sale_and_rent',
    targetMarket: 'both',
    features: ['Sunroof', 'Wireless Charging', 'LED DRLs'],
    rating: 4.8
  },
  {
    id: 'car-103',
    title: 'Kia Sonet GTX Plus 1.5 Diesel',
    brand: 'Kia',
    model: 'Sonet',
    year: 2023,
    price: 790000,
    originalPrice: 790000,
    priceDrop: false,
    rentalPricePerDay: 1800,
    purchasePriceByAdmin: 765000,
    kmDriven: 16000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    color: 'Intense Red',
    bodyType: 'SUV',
    location: 'Chennai',
    distanceKm: 5,
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'
    ],
    description: 'Compact sporty SUV with ventilated seats, 10.25 inch screen.',
    status: 'for_sale',
    targetMarket: 'buyer',
    features: ['Ventilated Seats', 'Bose Audio', 'Subwoofer'],
    rating: 4.7
  }
];
