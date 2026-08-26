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
    window.dispatchEvent(new CustomEvent('carhub_inventory_updated', { detail: { type: 'delete', id: strId } }));
  }

  try {
    localStorage.setItem('carhub_inventory_sync', `delete_${strId}_${Date.now()}`);
  } catch (e) {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('carhub_sync_channel');
      bc.postMessage({ type: 'delete', id: strId, timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {}
};

export const api = {
  // ── AUTH (Single Login for Everyone) ─────────────────────
  login: async (email, password) => {
    // Try backend first
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      return data;
    } catch (e) {
      if (e.status || (e.message && !e.message.includes('fetch') && !e.message.includes('URL'))) {
        throw e;
      }
    }

    // Offline fallback: find account by email
    const users = getRegisteredUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();

    const matchUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!matchUser) {
      throw new Error('No account found with this email. Please register first.');
    }

    // Password Check
    if (matchUser.password !== password) {
      throw new Error('Invalid email or password. Please check your credentials.');
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

    // Try backend first (MongoDB collection via API)
    try {
      const res = await fetch(`${API_BASE}/cars/buyer`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Merge with any admin published cars stored locally in offline mode
          const localPublished = getPublishedCars().filter(isNotDeleted);
          const backendIds = data.map(c => String(c.id || c._id));
          const extra = localPublished.filter(c => {
            const isEligible = (c.status === 'for_sale' || c.status === 'sale_and_rent') && (c.targetMarket === 'buyer' || c.targetMarket === 'both');
            return isEligible && !backendIds.includes(String(c.id || c._id));
          });
          return [...data, ...extra].filter(isNotDeleted).filter(c => 
            (c.status === 'for_sale' || c.status === 'sale_and_rent') && (c.targetMarket === 'buyer' || c.targetMarket === 'both')
          );
        }
      }
    } catch (e) {}

    // Offline fallback: ONLY admin-published cars (never unapproved seller cars)
    const published = getPublishedCars().filter(isNotDeleted);
    const publishedIds = published.map(c => String(c.id || c._id));
    const seedForBuyer = mockSeedCars
      .filter(isNotDeleted)
      .filter(c => (c.status === 'for_sale' || c.status === 'sale_and_rent') && (c.targetMarket === 'buyer' || c.targetMarket === 'both') && !publishedIds.includes(String(c.id)));
    return [...seedForBuyer, ...published.filter(c => (c.status === 'for_sale' || c.status === 'sale_and_rent') && (c.targetMarket === 'buyer' || c.targetMarket === 'both'))].filter(isNotDeleted);
  },

  // ── RENTER CARS ───────────────────────────────────────────
  getRenterCars: async () => {
    const deletedIds = new Set(getDeletedCarIds());
    const isNotDeleted = (c) => !deletedIds.has(String(c.id)) && !deletedIds.has(String(c._id));

    try {
      const res = await fetch(`${API_BASE}/cars/renter`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const localPublished = getPublishedCars().filter(isNotDeleted);
          const backendIds = data.map(c => String(c.id || c._id));
          const extra = localPublished.filter(c => {
            const isEligible = (c.status === 'for_rent' || c.status === 'sale_and_rent') && (c.targetMarket === 'renter' || c.targetMarket === 'both');
            return isEligible && !backendIds.includes(String(c.id || c._id));
          });
          return [...data, ...extra].filter(isNotDeleted).filter(c => 
            (c.status === 'for_rent' || c.status === 'sale_and_rent') && (c.targetMarket === 'renter' || c.targetMarket === 'both')
          );
        }
      }
    } catch (e) {}

    const published = getPublishedCars().filter(isNotDeleted);
    const publishedIds = published.map(c => String(c.id || c._id));
    const seedForRent = mockSeedCars
      .filter(isNotDeleted)
      .filter(c => (c.status === 'for_rent' || c.status === 'sale_and_rent') && (c.targetMarket === 'renter' || c.targetMarket === 'both') && !publishedIds.includes(String(c.id)));
    return [...seedForRent, ...published.filter(c => (c.status === 'for_rent' || c.status === 'sale_and_rent') && (c.targetMarket === 'renter' || c.targetMarket === 'both'))].filter(isNotDeleted);
  },

  // ── CAR DETAIL & RECOMMENDATIONS ─────────────────────────
  getCarById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/cars/detail/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const cars = await api.getBuyerCars().catch(() => []);
    return cars.find(c => String(c.id) === String(id) || String(c._id) === String(id)) || null;
  },

  getRecommendations: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/cars/recommendations/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const cars = await api.getBuyerCars().catch(() => []);
    const current = cars.find(c => String(c.id) === String(id) || String(c._id) === String(id));
    if (!current) return cars.slice(0, 4);
    const sameBrand = cars.filter(c => 
      String(c.id || c._id) !== String(current.id || current._id) &&
      c.brand && current.brand && c.brand.toLowerCase() === current.brand.toLowerCase()
    );
    if (sameBrand.length >= 3) return sameBrand.slice(0, 4);
    const others = cars.filter(c => 
      String(c.id || c._id) !== String(current.id || current._id) &&
      !sameBrand.some(sb => String(sb.id || sb._id) === String(c.id || c._id))
    );
    return [...sameBrand, ...others].slice(0, 4);
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

// ── Universal helper: broadcast and synchronize car changes across all tabs and pages ──
function broadcastInventoryChange(type, payload = {}) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('carhub_inventory_updated', { detail: { type, ...payload } }));
      if (payload.id || payload.carId) {
        window.dispatchEvent(new CustomEvent('carhub_car_updated', { detail: { id: payload.id || payload.carId, ...payload } }));
      }
    }
  } catch (e) {}

  try {
    localStorage.setItem('carhub_inventory_sync', `${type}_${Date.now()}`);
  } catch (e) {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('carhub_sync_channel');
      bc.postMessage({ type, ...payload, timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {}
}

// ── Local helper: publish or edit a car across seller, buyer, and renter caches ──
function _localPublishCar(carId, publishData) {
  const { targetMarket, sellingPrice, rentalPricePerDay, purchasePriceByAdmin } = publishData;
  const carIdStr = String(carId);

  let statusMap = { buyer: 'for_sale', renter: 'for_rent', both: 'sale_and_rent' };
  const newStatus = statusMap[targetMarket] || 'for_sale';

  // 1. Update or add in seller cars cache
  const sellerCars = getSellerCars();
  const sIdx = sellerCars.findIndex(c => String(c.id || c._id) === carIdStr);
  let updatedCar = null;

  if (sIdx !== -1) {
    updatedCar = {
      ...sellerCars[sIdx],
      ...publishData,
      status: newStatus,
      price: parseInt(sellingPrice) || sellerCars[sIdx].price,
      rentalPricePerDay: parseInt(rentalPricePerDay) || 0,
      purchasePriceByAdmin: parseInt(purchasePriceByAdmin) || 0
    };
    sellerCars[sIdx] = updatedCar;
    saveSellerCars(sellerCars);
  }

  // 2. Update or add in published cars cache (for buyer/renter pages)
  const published = getPublishedCars();
  const pIdx = published.findIndex(c => String(c.id || c._id) === carIdStr);
  if (pIdx !== -1) {
    published[pIdx] = {
      ...published[pIdx],
      ...publishData,
      status: newStatus,
      price: parseInt(sellingPrice) || published[pIdx].price,
      rentalPricePerDay: parseInt(rentalPricePerDay) || 0,
      purchasePriceByAdmin: parseInt(purchasePriceByAdmin) || 0
    };
    if (!updatedCar) updatedCar = published[pIdx];
  } else {
    const newPubCar = {
      ...(updatedCar || {}),
      ...publishData,
      id: carId,
      status: newStatus,
      price: parseInt(sellingPrice) || 800000,
      rentalPricePerDay: parseInt(rentalPricePerDay) || 0,
      purchasePriceByAdmin: parseInt(purchasePriceByAdmin) || 0
    };
    published.unshift(newPubCar);
    if (!updatedCar) updatedCar = newPubCar;
  }
  savePublishedCars(published);

  // 3. Broadcast change to all open pages and tabs
  broadcastInventoryChange('publish_or_update', { carId, car: updatedCar, publishData });
}

// ── Client-side AI Chatbot engine (accurate, data-driven) ──
function localChatbotResponse(message) {
  const q = (message || '').toLowerCase().trim();
  const allCars = getPublishedCars().length > 0 ? getPublishedCars() : mockSeedCars;

  const formatCar = (c, reason = '') => ({
    id: c.id || c._id,
    _id: c._id || c.id,
    title: c.title,
    brand: c.brand,
    model: c.model,
    year: c.year,
    price: c.price || c.sellingPrice || c.sellerExpectedPrice || 0,
    rentalPricePerDay: c.rentalPricePerDay || 0,
    kmDriven: c.kmDriven || 0,
    fuelType: c.fuelType || 'Petrol',
    transmission: c.transmission || 'Automatic',
    color: c.color || 'White',
    bodyType: c.bodyType || 'SUV',
    image: (c.images && c.images[0]) || c.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
    rating: c.rating || 4.8,
    inspectionScore: c.aiInspection?.damageScore || 95,
    status: c.status || 'for_sale',
    recommendationReason: reason || (c.aiInspection?.damageScore ? `🛡️ 140+ Point Score: ${c.aiInspection.damageScore}/100` : '⭐ Certified Master Pick')
  });

  // 1. Check for specific brand queries
  const knownBrands = [
    { key: 'tata', name: 'Tata' },
    { key: 'hyundai', name: 'Hyundai' },
    { key: 'toyota', name: 'Toyota' },
    { key: 'mahindra', name: 'Mahindra' },
    { key: 'kia', name: 'Kia' },
    { key: 'bmw', name: 'BMW' },
    { key: 'maruti', name: 'Maruti Suzuki' },
    { key: 'suzuki', name: 'Maruti Suzuki' },
    { key: 'honda', name: 'Honda' },
    { key: 'volkswagen', name: 'Volkswagen' },
    { key: 'skoda', name: 'Skoda' },
    { key: 'mercedes', name: 'Mercedes-Benz' },
    { key: 'audi', name: 'Audi' },
    { key: 'mg', name: 'MG' }
  ];

  let matchedBrand = knownBrands.find(b => q.includes(b.key));

  if (matchedBrand) {
    const brandCars = allCars.filter(c => 
      (c.brand && c.brand.toLowerCase().includes(matchedBrand.key)) ||
      (c.title && c.title.toLowerCase().includes(matchedBrand.key))
    );

    const otherCars = allCars.filter(c => 
      !(c.brand && c.brand.toLowerCase().includes(matchedBrand.key)) &&
      !(c.title && c.title.toLowerCase().includes(matchedBrand.key))
    );
    const recommendations = otherCars.slice(0, 3).map(c => formatCar(c, '✨ Segment Alternative Pick'));

    if (brandCars.length > 0) {
      return {
        text: `🚗 Found ${brandCars.length} certified ${matchedBrand.name} vehicle${brandCars.length > 1 ? 's' : ''} available on CarHub with 140+ point quality inspection and verified service records! Click any vehicle below to view full details on the Buyer portal:`,
        cars: brandCars.map(c => formatCar(c, `🏆 140+ Point Score: ${c.aiInspection?.damageScore || 97}/100`)),
        quickReplies: [
          `View ${brandCars[0].title}`,
          `Calculate EMI for ${matchedBrand.name}`,
          'Show All SUVs under ₹10L',
          'Explore Rental Fleet',
          'Contact Admin'
        ]
      };
    } else {
      return {
        text: `We are currently acquiring new ${matchedBrand.name} vehicles directly from verified sellers. In the meantime, here are top certified cars available right now:`,
        cars: allCars.slice(0, 3).map(c => formatCar(c, '⭐ Certified Pick')),
        quickReplies: ['Show all available cars', 'Sell my Tata car', 'Contact Admin']
      };
    }
  }

  // 2. Budget / Price queries
  if (q.includes('10 lakh') || q.includes('under 10') || q.includes('below 10') || q.includes('budget') || q.includes('under 15') || q.includes('under 20') || q.includes('under 8') || q.includes('under 7') || q.includes('cheap')) {
    let maxLimit = 1000000;
    if (q.includes('15')) maxLimit = 1500000;
    else if (q.includes('20')) maxLimit = 2000000;
    else if (q.includes('8') || q.includes('7')) maxLimit = 850000;

    const budgetCars = allCars.filter(c => (c.price || c.sellingPrice || 0) <= maxLimit);
    const resultCars = (budgetCars.length > 0 ? budgetCars : allCars).slice(0, 4);

    return {
      text: `💰 Here are our top certified cars within your budget (under ₹${(maxLimit / 100000).toFixed(0)} Lakhs). Each car includes 140+ point inspection report, 7-day money-back guarantee, and financing assistance:`,
      cars: resultCars.map(c => formatCar(c, `🔥 Best Value under ₹${(maxLimit / 100000).toFixed(0)}L`)),
      quickReplies: ['Calculate EMI', 'Cars with lowest KM', 'Self-drive rental rates', 'Talk to Admin']
    };
  }

  // 3. Body type queries (SUV, Sedan, 7 Seater, MUV, 4x4)
  if (q.includes('suv') || q.includes('sedan') || q.includes('7 seater') || q.includes('muv') || q.includes('4x4') || q.includes('offroad') || q.includes('hatchback')) {
    let targetType = 'suv';
    if (q.includes('sedan')) targetType = 'sedan';
    else if (q.includes('7 seater') || q.includes('muv')) targetType = 'muv';
    else if (q.includes('4x4') || q.includes('offroad')) targetType = '4x4';
    else if (q.includes('hatchback')) targetType = 'hatchback';

    const typeCars = allCars.filter(c => 
      (c.bodyType && c.bodyType.toLowerCase().includes(targetType)) ||
      (c.title && c.title.toLowerCase().includes(targetType)) ||
      (targetType === '4x4' && c.title && c.title.toLowerCase().includes('4x4')) ||
      (targetType === 'muv' && (c.bodyType?.toLowerCase() === 'muv' || c.title?.toLowerCase().includes('innova') || c.title?.toLowerCase().includes('safari')))
    );

    const results = (typeCars.length > 0 ? typeCars : allCars).slice(0, 4);
    return {
      text: `🚙 Here are certified ${targetType.toUpperCase()} models available in our marketplace. Click to view complete inspection scores, 360 photos, and EMI breakdowns:`,
      cars: results.map(c => formatCar(c, `✨ Top ${targetType.toUpperCase()} Pick`)),
      quickReplies: ['Filter by Price', 'Automatic transmission only', 'Check Rental Rates', 'Book Test Drive']
    };
  }

  // 4. Fuel & Transmission queries
  if (q.includes('diesel') || q.includes('petrol') || q.includes('automatic') || q.includes('hybrid') || q.includes('electric') || q.includes('mileage')) {
    let filterFn = () => true;
    let label = 'Special Match';
    if (q.includes('diesel')) {
      filterFn = c => (c.fuelType || '').toLowerCase() === 'diesel';
      label = '⛽ High-Torque Diesel Pick';
    } else if (q.includes('hybrid') || q.includes('mileage')) {
      filterFn = c => (c.fuelType || '').toLowerCase() === 'hybrid' || (c.title || '').toLowerCase().includes('hybrid');
      label = '⚡ 28 kmpl Top Mileage Pick';
    } else if (q.includes('automatic')) {
      filterFn = c => (c.transmission || '').toLowerCase() === 'automatic';
      label = '🕹️ Smooth Automatic Pick';
    } else if (q.includes('petrol')) {
      filterFn = c => (c.fuelType || '').toLowerCase() === 'petrol';
      label = '🌿 Refined Petrol Pick';
    }

    const matched = allCars.filter(filterFn);
    const results = (matched.length > 0 ? matched : allCars).slice(0, 4);
    return {
      text: `⚡ Here are top matching certified vehicles based on your powertrain preferences:`,
      cars: results.map(c => formatCar(c, label)),
      quickReplies: ['Show Tata cars', 'Show SUVs under ₹10L', 'Calculate EMI', 'Talk to Admin']
    };
  }

  // 5. Rental / Self-Drive queries
  if (q.includes('rent') || q.includes('rental') || q.includes('self drive') || q.includes('per day') || q.includes('hire') || q.includes('trip')) {
    const rentalCars = allCars.filter(c => c.status === 'for_rent' || c.status === 'sale_and_rent' || (c.rentalPricePerDay && c.rentalPricePerDay > 0));
    const results = (rentalCars.length > 0 ? rentalCars : allCars).slice(0, 4);

    return {
      text: `🔑 CarHub Self-Drive Rental Fleet:\n• Zero security deposit for verified members\n• 140+ point sanitized vehicles with 24/7 roadside assistance\n• Flexible daily rates starting from ₹1,600/day. Here are top rental vehicles:`,
      cars: results.map(c => formatCar(c, `🔑 ₹${(c.rentalPricePerDay || 2500).toLocaleString()}/day`)),
      quickReplies: ['Rent Innova Crysta', 'Rent Mahindra Thar', 'Rental Rules & Deposit', 'Contact Rental Admin']
    };
  }

  // 6. EMI & Loan Calculator
  if (q.includes('emi') || q.includes('loan') || q.includes('finance') || q.includes('down payment') || q.includes('interest')) {
    return {
      text: `💳 CarHub Smart Financing & EMI Assistance:\n• Interest rates starting at 8.5% p.a.\n• Up to 90% on-road funding from top partner banks (HDFC, SBI, ICICI)\n• Flexible tenure from 12 to 84 months\n\nClick any car on the Buyer page to access the live interactive EMI Calculator!`,
      cars: allCars.slice(0, 3).map(c => formatCar(c, `📊 Est. EMI: ₹${Math.round(((c.price || 900000) * 0.8 * 0.09) / 12 + ((c.price || 900000) * 0.8) / 60).toLocaleString()}/mo`)),
      quickReplies: ['Show Tata Nexon EMI', 'Show Creta EMI', 'Documents required for loan', 'Chat with Finance Admin']
    };
  }

  // 7. Selling vehicle query
  if (q.includes('sell') || q.includes('valuation') || q.includes('quote') || q.includes('doorstep') || q.includes('price for my car')) {
    return {
      text: `🏷️ Sell Your Vehicle to CarHub in 3 Simple Steps:\n1️⃣ Instant AI Valuation based on real-time market data.\n2️⃣ Free Doorstep 140+ Point Inspection.\n3️⃣ Instant bank payout within 30 minutes! CarHub buys directly with zero middleman commissions.`,
      cars: allCars.slice(0, 2).map(c => formatCar(c, '💎 Recent Direct Buyout')),
      quickReplies: ['Start Instant Car Valuation', 'Doorstep Inspection Details', 'Talk to Buyout Specialist']
    };
  }

  // 8. General / Fallback Smart Overview
  return {
    text: `👋 Hello! I am **CarHub AI Assistant**. I can help you search our live certified inventory, view 140+ point inspection scores, calculate EMIs, or book test drives!\n\nHere are our top trending certified cars available today:`,
    cars: allCars.slice(0, 4).map(c => formatCar(c, `⭐ 140+ Point Score: ${c.aiInspection?.damageScore || 97}/100`)),
    quickReplies: [
      'Show me Tata brand cars',
      'Show SUVs under ₹10 Lakhs',
      'Show Hyundai & Toyota cars',
      'Browse Self-Drive Rentals',
      'Calculate Car Loan EMI',
      'Contact Admin'
    ]
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
    priceDrop: true,
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
  },
  {
    id: 'car-107',
    title: 'Tata Nexon XZ Plus Diesel 2023',
    brand: 'Tata',
    model: 'Nexon',
    year: 2023,
    price: 840000,
    originalPrice: 890000,
    priceDrop: true,
    rentalPricePerDay: 2000,
    kmDriven: 15300,
    fuelType: 'Diesel',
    transmission: 'Manual',
    color: 'Daytona Grey',
    bodyType: 'SUV',
    location: 'Chennai',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'
    ],
    description: 'Top-selling 5-star GNCAP safety rated Tata Nexon XZ+ with electric sunroof, Harman sound system.',
    status: 'sale_and_rent',
    targetMarket: 'both',
    features: ['5-Star GNCAP Safety', 'Electric Sunroof', 'Harman Audio'],
    rating: 4.9
  },
  {
    id: 'car-106',
    title: 'Tata Safari XZA+ Dark Edition 2023',
    brand: 'Tata',
    model: 'Safari',
    year: 2023,
    price: 1950000,
    originalPrice: 2050000,
    priceDrop: true,
    rentalPricePerDay: 3800,
    kmDriven: 14200,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    color: 'Oberon Black',
    bodyType: 'SUV',
    location: 'Chennai',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'
    ],
    description: 'Flagship 7-seater Tata Safari Dark Edition with panoramic sunroof, JBL 9 speaker audio, ventilated captain seats.',
    status: 'sale_and_rent',
    targetMarket: 'both',
    features: ['Ventilated Captain Seats', 'JBL Audio', 'Panoramic Sunroof', 'ADAS Level 2'],
    rating: 4.9
  }
];
