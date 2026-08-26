import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Key, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  SlidersHorizontal, 
  MessageSquare, 
  X, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Fuel, 
  Gauge, 
  ShieldCheck, 
  Phone, 
  Car as CarIcon, 
  Award,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';

// Helper for safe string normalization
const norm = (v) => String(v ?? '').toLowerCase().trim();

export default function RenterDashboard({ onEnquireAdmin }) {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'history'

  // Raw data
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── 9 Filter UI States ───────────────────────────────────────────────────
  const [brand, setBrand] = useState('All');
  const [model, setModel] = useState('All');
  const [color, setColor] = useState('All');
  const [year, setYear] = useState('All');
  const [maxRate, setMaxRate] = useState('25000');
  const [fuelType, setFuelType] = useState('All');
  const [noOfOwners, setNoOfOwners] = useState('All');
  const [maxKm, setMaxKm] = useState('all');
  const [transmission, setTransmission] = useState('All');
  const [search, setSearch] = useState('');

  // ── View Details Modal state ─────────────────────────────────────────────
  const [viewingCar, setViewingCar] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // ── Booking modal state ──────────────────────────────────────────────────
  const [bookingCar, setBookingCar] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [renterPhone, setRenterPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('CarHub Central Hub, Guindy');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // ── Rental History State ─────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [allConfirmedBookings, setAllConfirmedBookings] = useState([]);

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchRentalCars = async () => {
    setLoading(true);
    try {
      const data = await api.getRenterCars();
      setAllCars(Array.isArray(data) ? data : []);
    } catch (e) {
      setAllCars([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const renterId = user ? (user.id || user._id || user.email) : 'usr-renter';
      const data = await api.getRenterBookings(renterId);
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setBookings([]);
    }
  };

  const fetchAllConfirmedBookings = async () => {
    try {
      const all = await api.getAdminRentalBookings();
      if (Array.isArray(all)) {
        setAllConfirmedBookings(all.filter(b => (b.status || '').toLowerCase() === 'confirmed'));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchRentalCars();
    fetchBookings();
    fetchAllConfirmedBookings();

    // Live deletion listener - removes deleted vehicle across tabs in real-time
    const handleCarDeleted = (e) => {
      const deletedId = String(e?.detail?.id || '');
      if (deletedId) {
        setAllCars(prev => prev.filter(c => (c.id || c._id) !== deletedId && String(c.id) !== deletedId && String(c._id) !== deletedId));
        setViewingCar(prev => (prev && ((prev.id || prev._id) === deletedId || String(prev.id) === deletedId || String(prev._id) === deletedId)) ? null : prev);
        setBookingCar(prev => (prev && ((prev.id || prev._id) === deletedId || String(prev.id) === deletedId || String(prev._id) === deletedId)) ? null : prev);
      }
    };

    window.addEventListener('carhub_car_deleted', handleCarDeleted);
    return () => window.removeEventListener('carhub_car_deleted', handleCarDeleted);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBookings();
    }
  }, [activeTab]);

  // Reset active photo index on modal open
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [viewingCar]);

  // ── Cascading & Dynamic Filter Options Generator ─────────────────────────
  // 1. Brands available in total fleet
  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(allCars.map(c => c.brand).filter(Boolean))).sort();
    return ['All', ...brands];
  }, [allCars]);

  // 2. Models: dependent on selected Brand
  const modelOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') {
      pool = pool.filter(c => norm(c.brand) === norm(brand));
    }
    const models = Array.from(new Set(pool.map(c => c.model).filter(Boolean))).sort();
    return ['All', ...models];
  }, [allCars, brand]);

  // 3. Colors: dependent on Brand and Model
  const colorOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const colors = Array.from(new Set(pool.map(c => (c.color || '').trim()).filter(Boolean))).sort();
    return ['All', ...colors];
  }, [allCars, brand, model]);

  // 4. Fuel Types: dependent on Brand and Model
  const fuelOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const fuels = Array.from(new Set(pool.map(c => c.fuelType).filter(Boolean))).sort();
    return ['All', ...fuels];
  }, [allCars, brand, model]);

  // 5. Years: dependent on Brand and Model
  const yearOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const years = Array.from(new Set(pool.map(c => c.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    return ['All', ...years];
  }, [allCars, brand, model]);

  // 6. Owners: dependent on Brand and Model
  const ownerOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const owners = Array.from(new Set(pool.map(c => c.noOfOwners || c.owners).filter(Boolean))).sort();
    return ['All', ...owners];
  }, [allCars, brand, model]);

  // 7. Transmissions: dependent on Brand and Model
  const transmissionOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const trans = Array.from(new Set(pool.map(c => c.transmission).filter(Boolean))).sort();
    return ['All', ...trans];
  }, [allCars, brand, model]);

  // Reset downstream filters if they become invalid when brand/model changes
  useEffect(() => {
    if (model !== 'All' && !modelOptions.includes(model)) setModel('All');
    if (color !== 'All' && !colorOptions.includes(color)) setColor('All');
    if (fuelType !== 'All' && !fuelOptions.includes(fuelType)) setFuelType('All');
    if (year !== 'All' && !yearOptions.includes(year)) setYear('All');
    if (noOfOwners !== 'All' && !ownerOptions.includes(noOfOwners)) setNoOfOwners('All');
    if (transmission !== 'All' && !transmissionOptions.includes(transmission)) setTransmission('All');
  }, [brand, model, modelOptions, colorOptions, fuelOptions, yearOptions, ownerOptions, transmissionOptions]);

  // Helper to check if a car is actively rented out
  const isCarRented = (c) => {
    if (c.rentalStatus === 'RENTED' || c.isAvailable === false) return true;
    const cId = String(c.id || c._id);
    return allConfirmedBookings.some(b => String(b.carId) === cId);
  };

  // ── 9 Filter Evaluation on Fleet ─────────────────────────────────────────
  const filteredFleet = useMemo(() => {
    return allCars.filter(c => {
      // 1. Text Search
      if (search.trim()) {
        const q = norm(search);
        const inTitle = norm(c.title).includes(q);
        const inBrand = norm(c.brand).includes(q);
        const inModel = norm(c.model).includes(q);
        if (!inTitle && !inBrand && !inModel) return false;
      }

      // 2. Brand
      if (brand !== 'All' && norm(c.brand) !== norm(brand)) return false;

      // 3. Model
      if (model !== 'All' && norm(c.model) !== norm(model)) return false;

      // 4. Color
      if (color !== 'All' && !norm(c.color).includes(norm(color))) return false;

      // 5. Year
      if (year !== 'All' && String(c.year) !== String(year)) return false;

      // 6. Max Daily Rate Slider
      const rate = Number(c.rentalPricePerDay || c.rentalRate || 0);
      if (rate > Number(maxRate)) return false;

      // 7. Fuel Type
      if (fuelType !== 'All' && norm(c.fuelType) !== norm(fuelType)) return false;

      // 8. No of Owners
      if (noOfOwners !== 'All') {
        const carOwners = String(c.noOfOwners || c.owners || '').toLowerCase();
        if (!carOwners.includes(norm(noOfOwners))) return false;
      }

      // 9. KM Driven Bracket
      const km = Number(c.kmDriven || 0);
      if (maxKm === '<20k' && km >= 20000) return false;
      if (maxKm === '<50k' && km >= 50000) return false;
      if (maxKm === '<80k' && km >= 80000) return false;
      if (maxKm === '80k+' && km < 80000) return false;

      // 10. Transmission
      if (transmission !== 'All' && norm(c.transmission) !== norm(transmission)) return false;

      return true;
    });
  }, [allCars, search, brand, model, color, year, maxRate, fuelType, noOfOwners, maxKm, transmission]);

  // Reset all 9 filters
  const resetFilters = () => {
    setBrand('All');
    setModel('All');
    setColor('All');
    setYear('All');
    setMaxRate('25000');
    setFuelType('All');
    setNoOfOwners('All');
    setMaxKm('all');
    setTransmission('All');
    setSearch('');
  };

  const isAnyFilterActive = 
    brand !== 'All' || 
    model !== 'All' || 
    color !== 'All' || 
    year !== 'All' || 
    Number(maxRate) < 25000 || 
    fuelType !== 'All' || 
    noOfOwners !== 'All' || 
    maxKm !== 'all' || 
    transmission !== 'All' || 
    search.trim();

  // Dynamic available fleet count
  const availableCarsCount = useMemo(() => {
    return filteredFleet.filter(c => !isCarRented(c)).length;
  }, [filteredFleet, allConfirmedBookings]);

  // ── Booking Cost Calculation ─────────────────────────────────────────────
  const calculateDays = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.abs(e - s);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingCar) return;
    setBookingSubmitting(true);
    const days = calculateDays();
    const dailyRate = Number(bookingCar.rentalPricePerDay || bookingCar.rentalRate || 2500);
    const totalCost = days * dailyRate;

    const bookingData = {
      carId: String(bookingCar.id || bookingCar._id),
      carTitle: bookingCar.title,
      carImage: bookingCar.images && bookingCar.images[0] ? bookingCar.images[0] : (bookingCar.image || ''),
      renterId: user ? (user.id || user._id || user.email) : 'usr-renter',
      renterName: user ? user.name : 'Subashini Sakthivel',
      renterEmail: user ? user.email : 'subashini@gmail.com',
      renterPhone: renterPhone || '9876543210',
      pickupLocation,
      startDate,
      endDate,
      days,
      dailyRate,
      totalCost,
    };

    try {
      const res = await fetch('/api/rentals/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      setBookingSuccess(data.message || 'Rental booking requested successfully!');
      setBookingCar(null);
      fetchBookings(); // refresh history immediately
      fetchAllConfirmedBookings();
      setActiveTab('history');
    } catch (err) {
      alert('Error requesting rental: ' + err.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-main)',
    fontSize: '0.82rem',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
              SELF-DRIVE RENTALS
            </span>
            <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '700' }}>
              • Zero Security Deposit for Verified Users
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', margin: 0 }}>CarHub Self-Drive Rental Fleet</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            140-point inspected, sanitised vehicles ready for daily or weekly self-drive rental.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('fleet')}
            className={activeTab === 'fleet' ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Key size={16} /> Available Fleet ({availableCarsCount})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={16} /> My Rental History ({bookings.length})
          </button>
        </div>
      </div>

      {bookingSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} />
            <span>{bookingSuccess}</span>
          </div>
          <button onClick={() => setBookingSuccess('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 9 DYNAMIC CASCADING FILTERS (FLEET VIEW) ───────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.96rem', fontWeight: '800' }}>
              <SlidersHorizontal size={18} color="#3b82f6" />
              <span>Filter Rental Vehicles (9 Criteria)</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                — Showing {filteredFleet.length} vehicles
              </span>
            </div>

            {isAnyFilterActive && (
              <button
                onClick={resetFilters}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <X size={14} /> Reset All Filters
              </button>
            )}
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search rental fleet by brand, model or car title (e.g. Innova, Creta, Mahindra XUV)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, padding: '10px 14px 10px 38px', fontSize: '0.88rem' }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }}>🔍</span>
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* 9 Filter Dropdowns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            
            {/* 1. Brand (Cascading Parent) */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                1. Brand / Make
              </label>
              <select value={brand} onChange={e => setBrand(e.target.value)} style={selectStyle}>
                {brandOptions.map(b => (
                  <option key={b} value={b}>{b === 'All' ? '🚗 All Brands' : b}</option>
                ))}
              </select>
            </div>

            {/* 2. Model (Dependent on Brand) */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                2. Model {brand !== 'All' && `(${brand})`}
              </label>
              <select value={model} onChange={e => setModel(e.target.value)} style={selectStyle}>
                {modelOptions.map(m => (
                  <option key={m} value={m}>{m === 'All' ? 'All Models' : m}</option>
                ))}
              </select>
            </div>

            {/* 3. Color (Dependent on Brand/Model) */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                3. Exterior Color
              </label>
              <select value={color} onChange={e => setColor(e.target.value)} style={selectStyle}>
                {colorOptions.map(c => (
                  <option key={c} value={c}>{c === 'All' ? '🎨 All Colors' : c}</option>
                ))}
              </select>
            </div>

            {/* 4. Year (Dependent on Brand/Model) */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                4. Model Year
              </label>
              <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y === 'All' ? '📅 All Years' : y}</option>
                ))}
              </select>
            </div>

            {/* 5. Max Rental Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  5. Max Price / Day:
                </label>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10b981' }}>
                  ₹{Number(maxRate).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={maxRate}
                onChange={e => setMaxRate(e.target.value)}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

            {/* 6. Fuel Type */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                6. Fuel Type
              </label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={selectStyle}>
                {fuelOptions.map(f => (
                  <option key={f} value={f}>{f === 'All' ? '⛽ All Fuel Types' : f}</option>
                ))}
              </select>
            </div>

            {/* 7. No of Owners */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                7. No. of Owners
              </label>
              <select value={noOfOwners} onChange={e => setNoOfOwners(e.target.value)} style={selectStyle}>
                {ownerOptions.map(o => (
                  <option key={o} value={o}>{o === 'All' ? '👤 All Owners' : o}</option>
                ))}
              </select>
            </div>

            {/* 8. KM Driven */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                8. KM Driven
              </label>
              <select value={maxKm} onChange={e => setMaxKm(e.target.value)} style={selectStyle}>
                <option value="all">🛣️ All Kilometres</option>
                <option value="<20k">&lt; 20,000 km</option>
                <option value="<50k">&lt; 50,000 km</option>
                <option value="<80k">&lt; 80,000 km</option>
                <option value="80k+">80,000+ km</option>
              </select>
            </div>

            {/* 9. Transmission */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                9. Transmission
              </label>
              <select value={transmission} onChange={e => setTransmission(e.target.value)} style={selectStyle}>
                {transmissionOptions.map(t => (
                  <option key={t} value={t}>{t === 'All' ? '⚙️ All Transmission' : t}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── FLEET CARDS GRID WITH VIEW DETAILS & BOOK ACTIONS ──────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <>
          {loading ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <h3>Loading Verified Rental Fleet…</h3>
            </div>
          ) : filteredFleet.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <CarIcon size={52} color="#3b82f6" style={{ marginBottom: '14px', opacity: 0.7 }} />
              <h3 style={{ fontWeight: '800', marginBottom: '8px' }}>No rental vehicles match your filter criteria</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                Try relaxing the brand, color, or price filters to view all available rental cars.
              </p>
              {isAnyFilterActive && (
                <button onClick={resetFilters} className="btn-secondary" style={{ marginTop: '16px' }}>
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {filteredFleet.map(c => {
                const rented = isCarRented(c);
                const dailyPrice = Number(c.rentalPricePerDay || c.rentalRate || 2500);
                const firstImg = (c.images && c.images[0]) ? c.images[0] : (c.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800');

                return (
                  <div
                    key={c.id || c._id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: rented ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Thumbnail Container (Clickable for View Details) */}
                      <div
                        onClick={() => setViewingCar(c)}
                        style={{ position: 'relative', height: '185px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', marginBottom: '14px' }}
                        title="Click to view full vehicle images & inspection details"
                      >
                        <img
                          src={firstImg}
                          alt={c.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                            filter: rented ? 'brightness(0.85)' : 'none'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />

                        {/* Status Badge */}
                        {rented ? (
                          <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.95)', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                            🔒 CURRENTLY RENTED
                          </span>
                        ) : (
                          <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(16, 185, 129, 0.95)', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                            ✅ AVAILABLE NOW
                          </span>
                        )}

                        {/* Image count pill */}
                        {c.images && c.images.length > 1 && (
                          <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.8)', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                            📷 {c.images.length} Photos
                          </span>
                        )}
                      </div>

                      {/* Title & Core Subtitle */}
                      <h4
                        onClick={() => setViewingCar(c)}
                        style={{ fontSize: '1.18rem', fontWeight: '800', margin: '0 0 6px 0', cursor: 'pointer' }}
                        title={c.title}
                      >
                        {c.title}
                      </h4>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <span>📅 {c.year}</span>
                        <span>•</span>
                        <span>🎨 {c.color || 'White'}</span>
                        <span>•</span>
                        <span>⛽ {c.fuelType}</span>
                        <span>•</span>
                        <span>⚙️ {c.transmission}</span>
                        {c.engineCapacity && (
                          <>
                            <span>•</span>
                            <span>⚡ {c.engineCapacity} cc</span>
                          </>
                        )}
                      </div>

                      {/* Certified Specs Snippet */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.78rem', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Gauge size={14} color="#3b82f6" />
                          <span>{Number(c.kmDriven || 0).toLocaleString()} km</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Fuel size={14} color="#10b981" />
                          <span>{c.mileage ? `${c.mileage} km/l` : 'Certified Mileage'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} color="#8b5cf6" />
                          <span>140-Pt Inspected</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#f59e0b" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.location || 'Chennai Central'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Pricing & Action Buttons */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Daily Rental Rate:</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10b981', lineHeight: '1.1' }}>
                            ₹{dailyPrice.toLocaleString()}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}> / day</span>
                          </div>
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          Zero Deposit
                        </span>
                      </div>

                      {/* Buttons: View Details, Book Now, WhatsApp Chat */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setViewingCar(c)}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '9px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}
                          title="View Full Vehicle Details & All 5 Photos"
                        >
                          <Eye size={15} /> View Details
                        </button>

                        {rented ? (
                          <button
                            disabled
                            className="btn-secondary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '9px 10px', opacity: 0.6, cursor: 'not-allowed', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '700' }}
                          >
                            🔒 Rented
                          </button>
                        ) : (
                          <button
                            onClick={() => setBookingCar(c)}
                            className="btn-primary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '9px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                          >
                            <Key size={15} /> Book Car
                          </button>
                        )}

                        <button
                          onClick={() => onEnquireAdmin(c)}
                          className="btn-secondary"
                          style={{ padding: '9px 12px', background: '#00a884', borderColor: '#00a884', color: '#fff' }}
                          title="Chat with Admin on WhatsApp"
                        >
                          <MessageSquare size={16} />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const carId = c.id || c._id;
                              if (window.confirm(`Admin: Permanently delete rental vehicle "${c.title}"?`)) {
                                try {
                                  await api.deleteCarByAdmin(carId);
                                } catch (err) {
                                  alert('Failed to delete car: ' + err.message);
                                }
                              }
                            }}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#ef4444',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Admin: Permanently delete rental vehicle"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── ACCURATE RENTAL HISTORY TAB ────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>My Rental Bookings & History</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                All self-drive reservations booked through CarHub platform.
              </p>
            </div>
            <button onClick={fetchBookings} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              🔄 Refresh History
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <Clock size={48} color="#3b82f6" style={{ marginBottom: '14px', opacity: 0.7 }} />
              <h3 style={{ fontWeight: '800', marginBottom: '6px' }}>No Rental History Found</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                You have not booked any rental cars yet. Browse our verified fleet and book your self-drive vehicle with zero deposit.
              </p>
              <button onClick={() => setActiveTab('fleet')} className="btn-primary">
                <Key size={16} /> Explore Available Fleet
              </button>
            </div>
          ) : (
            bookings.map(b => {
              const statusNorm = (b.status || 'pending').toLowerCase();
              const badgeBg = 
                statusNorm === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' :
                statusNorm === 'completed' ? 'rgba(139, 92, 246, 0.15)' :
                statusNorm === 'cancelled' || statusNorm === 'rejected' ? 'rgba(239, 68, 68, 0.15)' :
                'rgba(245, 158, 11, 0.15)';
              const badgeColor = 
                statusNorm === 'confirmed' ? '#10b981' :
                statusNorm === 'completed' ? '#a78bfa' :
                statusNorm === 'cancelled' || statusNorm === 'rejected' ? '#ef4444' :
                '#f59e0b';

              return (
                <div
                  key={b.id || b._id}
                  className="glass-panel"
                  style={{
                    padding: '20px 24px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img
                      src={b.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200'}
                      alt={b.carTitle}
                      style={{ width: '90px', height: '68px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Booking ID: {b.id || b._id}
                        </span>
                        <span style={{ background: badgeBg, color: badgeColor, fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                          {statusNorm.toUpperCase()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                        {b.carTitle}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span>📅 <strong>{b.startDate}</strong> to <strong>{b.endDate}</strong> ({b.days} Days)</span>
                        <span>📍 {b.pickupLocation || 'CarHub Central Hub'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>
                        ₹{Number(b.totalCost || 0).toLocaleString()}
                      </div>
                      {b.dailyRate ? (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          (₹{b.dailyRate?.toLocaleString()}/day)
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={() => onEnquireAdmin({ id: b.carId, title: b.carTitle })}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#00a884', borderColor: '#00a884', color: '#fff', fontWeight: '700' }}
                    >
                      <MessageSquare size={14} /> WhatsApp Support
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── RENTAL VEHICLE VIEW DETAILS MODAL (ALL IMAGES & SPECS) ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewingCar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '940px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                    140-POINT CERTIFIED RENTAL FLEET
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ID: {viewingCar.id || viewingCar._id}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '4px' }}>
                  {viewingCar.title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10b981' }}>
                    ₹{Number(viewingCar.rentalPricePerDay || viewingCar.rentalRate || 2500).toLocaleString()}/day
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#60a5fa' }}>
                    Zero Security Deposit
                  </div>
                </div>

                <button
                  onClick={() => setViewingCar(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: 'var(--text-main)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

              {/* 1. Multi-Angle Photo Gallery */}
              {(() => {
                const photos = (viewingCar.images && viewingCar.images.length > 0)
                  ? viewingCar.images
                  : [viewingCar.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'];

                const photoLabels = ['Front View', 'Back View', 'Left Side', 'Right Side', 'Interior Dashboard', 'Rear Seats', 'Engine Bay'];

                return (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative', height: '360px', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '12px' }}>
                      <img
                        src={photos[activePhotoIndex] || photos[0]}
                        alt={`${viewingCar.title} - Photo ${activePhotoIndex + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />

                      {/* Navigation arrows */}
                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={() => setActivePhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
                            style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <ChevronLeft size={22} />
                          </button>
                          <button
                            onClick={() => setActivePhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <ChevronRight size={22} />
                          </button>
                        </>
                      )}

                      {/* Photo Badge */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: '700'
                      }}>
                        📷 {activePhotoIndex + 1} / {photos.length} • {photoLabels[activePhotoIndex] || `Angle ${activePhotoIndex + 1}`}
                      </div>
                    </div>

                    {/* Thumbnails */}
                    {photos.length > 1 && (
                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                        {photos.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActivePhotoIndex(idx)}
                            style={{
                              width: '80px',
                              height: '60px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: activePhotoIndex === idx ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                              opacity: activePhotoIndex === idx ? 1 : 0.6,
                              flexShrink: 0,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. Core Vehicle Specifications Grid */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CarIcon size={18} color="#3b82f6" /> Vehicle Overview & Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Brand / Make', value: viewingCar.brand },
                    { label: 'Model', value: viewingCar.model },
                    { label: 'Year', value: viewingCar.year },
                    { label: 'Engine Capacity', value: viewingCar.engineCapacity ? `${viewingCar.engineCapacity} cc` : 'N/A' },
                    { label: 'Kilometres Driven', value: `${Number(viewingCar.kmDriven || 0).toLocaleString()} km` },
                    { label: 'Fuel Type', value: viewingCar.fuelType },
                    { label: 'Transmission', value: viewingCar.transmission },
                    { label: 'Color', value: viewingCar.color || 'White' },
                    { label: 'No. of Owners', value: viewingCar.noOfOwners || viewingCar.owners || '1st Owner' },
                    { label: 'Certified Mileage', value: viewingCar.mileage ? `${viewingCar.mileage} km/l` : '18.5 km/l' },
                    { label: 'Pickup Location', value: viewingCar.location || 'CarHub Central Hub, Guindy' },
                    { label: 'Security Deposit', value: '₹0 (Zero Deposit)' },
                  ].map((spec, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600' }}>{spec.label}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', marginTop: '2px', color: 'var(--text-main)' }}>{spec.value || 'Verified'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. All 20 Additional Vehicle Information Attributes */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="#10b981" /> Additional Vehicle Information & Features (20 Parameters)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'ABS', value: viewingCar.additionalInfo?.abs || 'Yes' },
                    { label: 'Adjustable Steering', value: viewingCar.additionalInfo?.adjustableSteering || 'Yes' },
                    { label: 'Alloy Wheels', value: viewingCar.additionalInfo?.alloyWheels || 'Yes' },
                    { label: 'Anti Theft Device', value: viewingCar.additionalInfo?.antiTheftDevice || 'Yes' },
                    { label: 'Aux Compatibility', value: viewingCar.additionalInfo?.auxCompatibility || 'Yes' },
                    { label: 'Bluetooth', value: viewingCar.additionalInfo?.bluetooth || 'Yes' },
                    { label: 'Color', value: viewingCar.additionalInfo?.color || viewingCar.color || 'Blue' },
                    { label: 'Cruise Control', value: viewingCar.additionalInfo?.cruiseControl || 'Yes' },
                    { label: 'Insurance Type', value: viewingCar.additionalInfo?.insuranceType || 'Comprehensive' },
                    { label: 'Make Month', value: viewingCar.additionalInfo?.makeMonth || 'April' },
                    { label: 'Navigation System', value: viewingCar.additionalInfo?.navigationSystem || 'Yes' },
                    { label: 'Parking Sensors', value: viewingCar.additionalInfo?.parkingSensors || 'Yes' },
                    { label: 'Power Steering', value: viewingCar.additionalInfo?.powerSteering || 'Yes' },
                    { label: 'AM/FM Radio', value: viewingCar.additionalInfo?.amFmRadio || 'Yes' },
                    { label: 'Rear Parking Camera', value: viewingCar.additionalInfo?.rearParkingCamera || 'Yes' },
                    { label: 'Registration Place', value: viewingCar.additionalInfo?.registrationPlace || 'TS / TN' },
                    { label: 'Exchange', value: viewingCar.additionalInfo?.exchange || 'Yes' },
                    { label: 'Finance', value: viewingCar.additionalInfo?.finance || 'Yes' },
                    { label: 'Sunroof', value: viewingCar.additionalInfo?.sunroof || 'Yes' },
                    { label: 'USB Compatibility', value: viewingCar.additionalInfo?.usbCompatibility || 'Yes' }
                  ].map((attr, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{attr.label}:</span>
                      <span style={{ fontWeight: '800', color: attr.value === 'Yes' || attr.value === 'Comprehensive' ? '#10b981' : 'var(--text-main)' }}>
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Description & 140-Point Inspection Details */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '10px' }}>
                  Official Description & Inspection Notes
                </h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '12px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                  {viewingCar.description || 'Certified 140-point inspected rental vehicle. Includes roadside assistance, insurance, and regular maintenance.'}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '16px 24px',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Questions about this car? Chat directly with CarHub Admin.
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      const carToDelete = viewingCar;
                      if (window.confirm(`Admin Action: Permanently delete rental vehicle "${carToDelete.title}"?`)) {
                        setViewingCar(null);
                        try {
                          await api.deleteCarByAdmin(carToDelete.id || carToDelete._id);
                        } catch (err) {
                          alert('Failed to delete car: ' + err.message);
                        }
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#ef4444',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={16} /> Delete Car (Admin)
                  </button>
                )}

                <button
                  onClick={() => {
                    const car = viewingCar;
                    setViewingCar(null);
                    onEnquireAdmin(car);
                  }}
                  className="btn-secondary"
                  style={{ background: '#00a884', borderColor: '#00a884', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={16} /> Chat on WhatsApp
                </button>

                <button
                  onClick={() => {
                    const car = viewingCar;
                    setViewingCar(null);
                    setBookingCar(car);
                  }}
                  className="btn-primary"
                  style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Key size={16} /> Book This Car
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── BOOKING MODAL ──────────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {bookingCar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase' }}>Confirm Reservation</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '2px 0 0 0' }}>
                  {bookingCar.title}
                </h3>
              </div>
              <button onClick={() => setBookingCar(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Pickup & Drop Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Start Date (Pickup)
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={selectStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    End Date (Return)
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={selectStyle}
                  />
                </div>
              </div>

              {/* Contact Phone & Pickup Hub */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={renterPhone}
                  onChange={e => setRenterPhone(e.target.value)}
                  style={selectStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Pickup & Drop Hub Location
                </label>
                <select value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} style={selectStyle}>
                  <option value="CarHub Central Hub, Guindy">📍 CarHub Central Hub, Guindy (Main Hub)</option>
                  <option value="CarHub Airport Hub, Meenambakkam">📍 CarHub Airport Hub, Meenambakkam</option>
                  <option value="CarHub OMR IT Expressway Hub, Sholinganallur">📍 CarHub OMR IT Expressway Hub, Sholinganallur</option>
                  <option value="CarHub Anna Nagar Hub">📍 CarHub Anna Nagar Hub</option>
                </select>
              </div>

              {/* Pricing Breakdown Summary */}
              {(() => {
                const days = calculateDays();
                const dailyRate = Number(bookingCar.rentalPricePerDay || bookingCar.rentalRate || 2500);
                const total = days * dailyRate;

                return (
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{days} Days</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Daily Rate:</span>
                      <strong style={{ color: 'var(--text-main)' }}>₹{dailyRate.toLocaleString()} / day</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Security Deposit:</span>
                      <strong style={{ color: '#10b981' }}>₹0 (Zero Deposit)</strong>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Estimated Total:</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10b981' }}>
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setBookingCar(null)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: 'center', fontWeight: '700' }}
                >
                  {bookingSubmitting ? 'Confirming…' : 'Confirm & Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
