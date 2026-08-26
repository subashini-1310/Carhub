import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CarCard from '../components/CarCard';
import CompareModal from '../components/CompareModal';
import PriceTrend from '../components/PriceTrend';
import { 
  Heart, 
  Layers, 
  MapPin, 
  SlidersHorizontal, 
  RefreshCw, 
  X, 
  Eye, 
  MessageSquare, 
  ShieldCheck, 
  Gauge, 
  Fuel, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  UserCheck, 
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

const norm = (v) => String(v ?? '').toLowerCase().trim();

export default function BuyerDashboard({ onEnquireAdmin }) {
  const { user, wishlist } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  // ── Raw data ─────────────────────────────────────────────────────────────
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [brand, setBrand] = useState('All');
  const [model, setModel] = useState('All');
  const [color, setColor] = useState('All');
  const [year, setYear] = useState('All');
  const [maxPrice, setMaxPrice] = useState('5000000');
  const [fuelType, setFuelType] = useState('All');
  const [noOfOwners, setNoOfOwners] = useState('All');
  const [maxKm, setMaxKm] = useState('all');
  const [transmission, setTransmission] = useState('All');
  const [search, setSearch] = useState('');

  // ── Modal view state ─────────────────────────────────────────────────────
  const [viewingCar, setViewingCar] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedTrendCar, setSelectedTrendCar] = useState(null);
  const [compareCars, setCompareCars] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // ── Fetch eligible cars ──────────────────────────────────────────────────
  const fetchCars = async () => {
    setLoading(true);
    try {
      const data = await api.getBuyerCars();
      setAllCars(Array.isArray(data) ? data : []);
    } catch (e) {
      setAllCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCars(); 

    // Live deletion listener - removes deleted vehicle across tabs in real-time
    const handleCarDeleted = (e) => {
      const deletedId = String(e?.detail?.id || '');
      if (deletedId) {
        setAllCars(prev => prev.filter(c => (c.id || c._id) !== deletedId && String(c.id) !== deletedId && String(c._id) !== deletedId));
        setCompareCars(prev => prev.filter(c => (c.id || c._id) !== deletedId && String(c.id) !== deletedId && String(c._id) !== deletedId));
        setViewingCar(prev => (prev && ((prev.id || prev._id) === deletedId || String(prev.id) === deletedId || String(prev._id) === deletedId)) ? null : prev);
      }
    };

    window.addEventListener('carhub_car_deleted', handleCarDeleted);
    return () => window.removeEventListener('carhub_car_deleted', handleCarDeleted);
  }, []);

  // Reset photo index on modal open
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [viewingCar]);

  // ── Cascading / Dynamic Filter Option Generators ─────────────────────────
  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(allCars.map(c => c.brand).filter(Boolean))).sort();
    return ['All', ...brands];
  }, [allCars]);

  const modelOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') {
      pool = pool.filter(c => norm(c.brand) === norm(brand));
    }
    const models = Array.from(new Set(pool.map(c => c.model).filter(Boolean))).sort();
    return ['All', ...models];
  }, [allCars, brand]);

  const colorOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const colors = Array.from(new Set(pool.map(c => (c.color || '').trim()).filter(Boolean))).sort();
    return ['All', ...colors];
  }, [allCars, brand, model]);

  const fuelOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const fuels = Array.from(new Set(pool.map(c => c.fuelType).filter(Boolean))).sort();
    return ['All', ...fuels];
  }, [allCars, brand, model]);

  const yearOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const years = Array.from(new Set(pool.map(c => c.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    return ['All', ...years];
  }, [allCars, brand, model]);

  const ownerOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const owners = Array.from(new Set(pool.map(c => c.noOfOwners).filter(Boolean))).sort();
    return ['All', ...owners];
  }, [allCars, brand, model]);

  const transmissionOptions = useMemo(() => {
    let pool = allCars;
    if (brand !== 'All') pool = pool.filter(c => norm(c.brand) === norm(brand));
    if (model !== 'All') pool = pool.filter(c => norm(c.model) === norm(model));
    const transmissions = Array.from(new Set(pool.map(c => c.transmission).filter(Boolean))).sort();
    return ['All', ...transmissions];
  }, [allCars, brand, model]);

  // ── Unified Filtering ────────────────────────────────────────────────────
  const filteredCars = useMemo(() => {
    return allCars.filter(c => {
      // Search
      if (search.trim()) {
        const q = norm(search);
        const inTitle = norm(c.title).includes(q);
        const inBrand = norm(c.brand).includes(q);
        const inModel = norm(c.model).includes(q);
        const inDesc = norm(c.description).includes(q);
        if (!inTitle && !inBrand && !inModel && !inDesc) return false;
      }

      // Brand
      if (brand !== 'All') {
        if (norm(c.brand) !== norm(brand)) return false;
      }

      // Model
      if (model !== 'All') {
        if (norm(c.model) !== norm(model)) return false;
      }

      // Color
      if (color !== 'All') {
        if (!norm(c.color).includes(norm(color))) return false;
      }

      // Year
      if (year !== 'All') {
        if (String(c.year) !== String(year)) return false;
      }

      // Price
      const price = Number(c.sellingPrice || c.price || 0);
      if (price > Number(maxPrice)) return false;

      // Fuel Type
      if (fuelType !== 'All') {
        if (norm(c.fuelType) !== norm(fuelType)) return false;
      }

      // No. of Owners
      if (noOfOwners !== 'All') {
        if (norm(c.noOfOwners) !== norm(noOfOwners)) return false;
      }

      // KM Driven
      if (maxKm !== 'all') {
        const km = Number(c.kmDriven ?? 0);
        if (km > Number(maxKm)) return false;
      }

      // Transmission
      if (transmission !== 'All') {
        if (norm(c.transmission) !== norm(transmission)) return false;
      }

      return true;
    });
  }, [allCars, search, brand, model, color, year, maxPrice, fuelType, noOfOwners, maxKm, transmission]);

  // ── Reset All Filters ────────────────────────────────────────────────────
  const resetFilters = () => {
    setBrand('All');
    setModel('All');
    setColor('All');
    setYear('All');
    setMaxPrice('5000000');
    setFuelType('All');
    setNoOfOwners('All');
    setMaxKm('all');
    setTransmission('All');
    setSearch('');
  };

  const anyFilterActive = brand !== 'All' || model !== 'All' || color !== 'All' || year !== 'All' 
    || Number(maxPrice) < 5000000 || fuelType !== 'All' || noOfOwners !== 'All' || maxKm !== 'all' 
    || transmission !== 'All' || search.trim();

  // ── Compare helpers ──────────────────────────────────────────────────────
  const toggleCompareCar = (car) => {
    setCompareCars(prev => {
      const id = car.id || car._id;
      if (prev.find(c => (c.id || c._id) === id)) {
        return prev.filter(c => (c.id || c._id) !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, car];
    });
  };

  const wishlistedCars = allCars.filter(c => wishlist.includes(c.id || c._id));

  // ── Styles ───────────────────────────────────────────────────────────────
  const selectStyle = {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-main)',
    fontSize: '0.84rem',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1380px', margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🚗 Certified Buyer Marketplace</span>
            <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
              140+ Inspected
            </span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Verified CarHub inventory · 100% Doorstep inspected · Zero direct seller risk · Direct Admin support
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchCars} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => setActiveTab('browse')} className={activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}>
            Browse Cars ({filteredCars.length})
          </button>
          <button onClick={() => setActiveTab('wishlist')} className={activeTab === 'wishlist' ? 'btn-primary' : 'btn-secondary'}>
            <Heart size={16} color="#ef4444" /> Wishlist ({wishlist.length})
          </button>
          {compareCars.length > 0 && (
            <button onClick={() => setShowCompareModal(true)} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Layers size={16} /> Compare ({compareCars.length})
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Multi-Parameter Filtering Bar ───────────────────────────────── */}
      {activeTab === 'browse' && (
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px', marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '800' }}>
              <SlidersHorizontal size={19} color="#3b82f6" />
              <span>Multi-Parameter Filters</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                ({filteredCars.length} matches found)
              </span>
            </div>
            {anyFilterActive && (
              <button onClick={resetFilters} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                <X size={14} /> Reset All Filters
              </button>
            )}
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by brand, model, features, or certified description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, paddingLeft: '40px', padding: '11px 14px 11px 40px', fontSize: '0.9rem' }}
            />
            <span style={{ position: 'absolute', left: '13px', top: '11px', color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
          </div>

          {/* 9 Filter Selectors Grid (Dynamic & Linked) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>

            {/* 1 — Brand */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                Brand / Make
              </label>
              <select value={brand} onChange={e => { setBrand(e.target.value); setModel('All'); }} style={selectStyle}>
                {brandOptions.map(b => (
                  <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>
                ))}
              </select>
            </div>

            {/* 2 — Model */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                Car Model
              </label>
              <select value={model} onChange={e => setModel(e.target.value)} style={selectStyle}>
                {modelOptions.map(m => (
                  <option key={m} value={m}>{m === 'All' ? 'All Models' : m}</option>
                ))}
              </select>
            </div>

            {/* 3 — Vehicle Color */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                Color
              </label>
              <select value={color} onChange={e => setColor(e.target.value)} style={selectStyle}>
                {colorOptions.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Colors' : c}</option>
                ))}
              </select>
            </div>

            {/* 4 — Manufacturing Year */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                Year
              </label>
              <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>
                ))}
              </select>
            </div>

            {/* 5 — Max Selling Price Slider */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Max Price:</span>
                <span style={{ color: '#10b981', fontWeight: '800' }}>₹{(Number(maxPrice) / 100000).toFixed(1)}L</span>
              </label>
              <input 
                type="range" 
                min="300000" 
                max="5000000" 
                step="100000" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
                style={{ width: '100%', marginTop: '6px', cursor: 'pointer' }} 
              />
            </div>

            {/* 6 — Fuel Type */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                Fuel Type
              </label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={selectStyle}>
                {fuelOptions.map(f => (
                  <option key={f} value={f}>{f === 'All' ? 'All Fuel Types' : f}</option>
                ))}
              </select>
            </div>

            {/* 7 — Number of Owners */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                No. of Owners
              </label>
              <select value={noOfOwners} onChange={e => setNoOfOwners(e.target.value)} style={selectStyle}>
                {ownerOptions.map(o => (
                  <option key={o} value={o}>{o === 'All' ? 'All Ownerships' : o}</option>
                ))}
              </select>
            </div>

            {/* 8 — KM Driven Range */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                KM Driven
              </label>
              <select value={maxKm} onChange={e => setMaxKm(e.target.value)} style={selectStyle}>
                <option value="all">All KM Readings</option>
                <option value="15000">Under 15,000 km</option>
                <option value="30000">Under 30,000 km</option>
                <option value="50000">Under 50,000 km</option>
                <option value="75000">Under 75,000 km</option>
                <option value="100000">Under 1,00,000 km</option>
              </select>
            </div>

            {/* 9 — Transmission */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px', display: 'block' }}>
                Transmission
              </label>
              <select value={transmission} onChange={e => setTransmission(e.target.value)} style={selectStyle}>
                {transmissionOptions.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'All Transmissions' : t}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}

      {/* ── Browse Grid ──────────────────────────────────────────────────── */}
      {activeTab === 'browse' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <RefreshCw size={34} style={{ animation: 'spin 1s linear infinite', marginBottom: '14px', color: '#3b82f6' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>Loading certified vehicle inventory from database…</p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>No Cars Match Your Filters</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '18px', maxWidth: '500px', margin: '0 auto 18px auto' }}>
                {anyFilterActive
                  ? 'Try selecting "All" on specific filters or adjusting the price slider to see more available certified cars.'
                  : 'No cars are available in the marketplace yet.'}
              </p>
              {anyFilterActive && (
                <button onClick={resetFilters} className="btn-primary">Reset All Filters</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredCars.map(c => (
                <CarCard
                  key={c.id || c._id}
                  car={c}
                  mode="buy"
                  onViewDetails={setViewingCar}
                  onOpenTrend={setSelectedTrendCar}
                  onToggleCompare={toggleCompareCar}
                  isCompared={!!compareCars.find(item => (item.id || item._id) === (c.id || c._id))}
                  onEnquireAdmin={onEnquireAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Wishlist Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'wishlist' && (
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '18px' }}>
            Your Saved Wishlist ({wishlistedCars.length})
          </h3>
          {wishlistedCars.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '20px' }}>
              <Heart size={44} color="#ef4444" style={{ marginBottom: '14px' }} />
              <h4>No Wishlisted Cars Yet</h4>
              <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
                Click the heart icon on any vehicle card to save it and receive instant Price Drop alerts!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {wishlistedCars.map(c => (
                <CarCard
                  key={c.id || c._id}
                  car={c}
                  mode="buy"
                  onViewDetails={setViewingCar}
                  onOpenTrend={setSelectedTrendCar}
                  onToggleCompare={toggleCompareCar}
                  isCompared={!!compareCars.find(item => (item.id || item._id) === (c.id || c._id))}
                  onEnquireAdmin={onEnquireAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── BUYER COMPLETE VEHICLE DETAILS MODAL ──────────────────────────── */}
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
            maxWidth: '920px',
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
                    140-POINT CERTIFIED
                  </span>
                  {viewingCar.priceDrop && (
                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                      🔥 PRICE REDUCED
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ID: {viewingCar.id || viewingCar._id}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '4px' }}>
                  {viewingCar.title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10b981' }}>
                    ₹{(viewingCar.sellingPrice || viewingCar.price)?.toLocaleString()}
                  </div>
                  {viewingCar.rentalPricePerDay && (
                    <div style={{ fontSize: '0.78rem', color: '#60a5fa' }}>
                      or ₹{viewingCar.rentalPricePerDay?.toLocaleString()}/day rent
                    </div>
                  )}
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

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* 1. Full Interactive Multi-Angle Gallery */}
              <div>
                <div style={{
                  position: 'relative',
                  height: '340px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#0f172a'
                }}>
                  {viewingCar.images && viewingCar.images.length > 0 ? (
                    <img
                      src={viewingCar.images[activePhotoIndex] || viewingCar.images[0]}
                      alt={viewingCar.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      No photos available
                    </div>
                  )}

                  {/* Photo Navigation arrows */}
                  {viewingCar.images && viewingCar.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActivePhotoIndex(prev => (prev === 0 ? viewingCar.images.length - 1 : prev - 1))}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.65)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        onClick={() => setActivePhotoIndex(prev => (prev === viewingCar.images.length - 1 ? 0 : prev + 1))}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.65)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <ChevronRight size={22} />
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}>
                        Photo {activePhotoIndex + 1} of {viewingCar.images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                {viewingCar.images && viewingCar.images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {viewingCar.images.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`thumbnail-${idx}`}
                        onClick={() => setActivePhotoIndex(idx)}
                        style={{
                          width: '74px',
                          height: '52px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: activePhotoIndex === idx ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                          opacity: activePhotoIndex === idx ? 1 : 0.6
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Core Specifications Highlights */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} /> Essential Specifications
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Brand & Model</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.brand} {viewingCar.model}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Manufacturing Year</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.year}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Engine Capacity</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#10b981' }}>
                      {viewingCar.engineCapacity || '2.0L Turbo / Standard'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Fuel Type</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.fuelType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Transmission</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.transmission}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>KM Driven</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.kmDriven?.toLocaleString()} km</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ownership History</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.noOfOwners || '1st Owner'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Body Color</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.color || 'Standard'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Certified Mileage</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.mileage || '16.5'} KM/L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registration Place</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.additionalInfo?.registrationPlace || viewingCar.location || 'TS / TN'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Insurance Type</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.additionalInfo?.insuranceType || 'Comprehensive Valid'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Location Hub</div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{viewingCar.location || 'Chennai Hub'}</div>
                  </div>
                </div>
              </div>

              {/* 3. Additional Vehicle Information (All 20 Structured Attributes) */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} /> Additional Vehicle Features & Inspection Checklist
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'ABS', val: viewingCar.additionalInfo?.abs || 'Yes' },
                    { label: 'Adjustable Steering', val: viewingCar.additionalInfo?.adjustableSteering || 'Yes' },
                    { label: 'Alloy Wheels', val: viewingCar.additionalInfo?.alloyWheels || 'Yes' },
                    { label: 'Anti Theft Device', val: viewingCar.additionalInfo?.antiTheftDevice || 'Yes' },
                    { label: 'Aux Compatibility', val: viewingCar.additionalInfo?.auxCompatibility || 'Yes' },
                    { label: 'Bluetooth', val: viewingCar.additionalInfo?.bluetooth || 'Yes' },
                    { label: 'Cruise Control', val: viewingCar.additionalInfo?.cruiseControl || 'Yes' },
                    { label: 'Navigation System', val: viewingCar.additionalInfo?.navigationSystem || 'Yes' },
                    { label: 'Parking Sensors', val: viewingCar.additionalInfo?.parkingSensors || 'Yes' },
                    { label: 'Power Steering', val: viewingCar.additionalInfo?.powerSteering || 'Yes' },
                    { label: 'AM/FM Radio', val: viewingCar.additionalInfo?.amFmRadio || 'Yes' },
                    { label: 'Rear Parking Camera', val: viewingCar.additionalInfo?.rearParkingCamera || 'Yes' },
                    { label: 'Sunroof', val: viewingCar.additionalInfo?.sunroof || 'Yes' },
                    { label: 'USB Compatibility', val: viewingCar.additionalInfo?.usbCompatibility || 'Yes' },
                    { label: 'Exchange Facility', val: viewingCar.additionalInfo?.exchange || 'Yes' },
                    { label: 'Finance / Loan Available', val: viewingCar.additionalInfo?.finance || 'Yes' },
                    { label: 'Make Month', val: viewingCar.additionalInfo?.makeMonth || 'April' },
                    { label: 'Registration Place', val: viewingCar.additionalInfo?.registrationPlace || 'TS' }
                  ].map((feat, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{feat.label}:</span>
                      <span style={{ fontWeight: '700', color: feat.val === 'Yes' ? '#10b981' : 'var(--text-main)' }}>
                        {feat.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Certified Description Posted by Admin */}
              {viewingCar.description && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '18px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} /> Official Certified Description
                  </h4>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                    color: 'var(--text-main)',
                    margin: 0
                  }}>
                    {viewingCar.description}
                  </pre>
                </div>
              )}

              {/* 5. 140-Point AI Diagnostics Report */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                padding: '16px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={28} color="#3b82f6" />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>140-Point CarHub Inspected & Verified</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Damage Integrity: 95/100 · OCR Plate Verified · Engine Checked · 7-Day Money Back Guarantee
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedTrendCar(viewingCar)}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    📈 Price Trend Analysis
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
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
                Have questions or need a home test drive?
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      const carToDelete = viewingCar;
                      if (window.confirm(`Admin Action: Permanently delete "${carToDelete.title}" from the platform?`)) {
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
                  onClick={() => setViewingCar(null)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    const carToChat = viewingCar;
                    setViewingCar(null);
                    onEnquireAdmin(carToChat);
                  }}
                  className="btn-primary"
                  style={{
                    background: '#00a884',
                    borderColor: '#00a884',
                    padding: '10px 22px',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <MessageSquare size={17} /> Chat with Admin on WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Auxiliary Modals (Trend, Compare) ─────────────────────────────── */}
      {selectedTrendCar && <PriceTrend car={selectedTrendCar} onClose={() => setSelectedTrendCar(null)} />}
      {showCompareModal && (
        <CompareModal
          selectedCars={compareCars}
          onClose={() => setShowCompareModal(false)}
          onRemoveCar={toggleCompareCar}
        />
      )}
    </div>
  );
}
