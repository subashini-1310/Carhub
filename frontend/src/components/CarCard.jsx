import React from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Heart, 
  MapPin, 
  Gauge, 
  Fuel, 
  TrendingDown, 
  CheckCircle2, 
  MessageSquare,
  Layers,
  Sparkles,
  Eye,
  Trash2
} from 'lucide-react';

export default function CarCard({ 
  car, 
  onSelectCar, 
  onViewDetails,
  onOpenTrend, 
  onToggleCompare, 
  isCompared,
  mode = 'buy', // buy or rent
  onEnquireAdmin
}) {
  const { user, wishlist, toggleWishlist } = useAuth();
  const isWishlisted = wishlist.includes(car.id || car._id);
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const handleDeleteAsAdmin = async (e) => {
    e.stopPropagation();
    const carId = car.id || car._id;
    if (window.confirm(`Admin: Are you sure you want to permanently delete "${car.title}" from the platform?`)) {
      try {
        await api.deleteCarByAdmin(carId);
      } catch (err) {
        alert('Failed to delete car: ' + err.message);
      }
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      {/* Top Media & Badges */}
      <div 
        onClick={() => onViewDetails && onViewDetails(car)}
        style={{ position: 'relative', height: '200px', overflow: 'hidden', cursor: onViewDetails ? 'pointer' : 'default' }}
        title="Click to view full vehicle details & images"
      >
        <img 
          src={car.images && car.images[0] ? car.images[0] : (car.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800')} 
          alt={car.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        
        {/* Dark overlay gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 50%)'
        }} />

        {/* Wishlist Heart Toggle */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(car.id || car._id);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            zIndex: 2
          }}
          title="Save to Wishlist"
        >
          <Heart size={18} color={isWishlisted ? '#ef4444' : '#fff'} fill={isWishlisted ? '#ef4444' : 'none'} />
        </button>

        {/* Price Reduced Alert Badge */}
        {car.priceDrop && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: '#10b981',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: '800',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            zIndex: 2
          }}>
            <TrendingDown size={14} /> Price Dropped!
          </div>
        )}

        {/* 140 Point Certified Badge */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: '#fff',
          fontSize: '0.68rem',
          fontWeight: '700',
          padding: '3px 8px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 2
        }}>
          <CheckCircle2 size={12} /> CarHub Certified
        </div>

        {/* Photos count badge */}
        {car.images && car.images.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 2
          }}>
            📷 {car.images.length} Photos
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 
              onClick={() => onViewDetails && onViewDetails(car)}
              style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: 1.3, cursor: onViewDetails ? 'pointer' : 'default' }}
            >
              {car.title}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span>{car.year}</span> • <span>{car.color}</span> • 
              <span>{car.noOfOwners || '1st Owner'}</span> •
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#60a5fa' }}>
                <MapPin size={12} /> {car.location || 'Chennai Hub'}
              </span>
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '8px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={14} color="#3b82f6" /> {car.kmDriven?.toLocaleString()} km
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Fuel size={14} color="#f59e0b" /> {car.fuelType}
          </div>
          <div style={{ textAlign: 'right', fontWeight: '600' }}>
            {car.transmission}
          </div>
        </div>

        {/* Interactive Feature Buttons (View Details, Price Trend, Compare) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {onViewDetails && (
              <button 
                onClick={() => onViewDetails(car)}
                style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                title="View Full Inspection & Specs"
              >
                <Eye size={14} /> View Details
              </button>
            )}

            <button 
              onClick={() => onOpenTrend(car)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#10b981', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              title="Price Trend Analysis"
            >
              <TrendingDown size={14} /> Price Trend
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer', color: isCompared ? '#3b82f6' : 'var(--text-muted)' }}>
            <input 
              type="checkbox"
              checked={isCompared}
              onChange={() => onToggleCompare(car)}
            />
            Compare
          </label>
        </div>

        {/* Pricing & Enquire Admin Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>
              {mode === 'rent' ? `₹${car.rentalPricePerDay?.toLocaleString()}/day` : `₹${(car.sellingPrice || car.price)?.toLocaleString()}`}
            </div>
            {car.originalPrice > (car.sellingPrice || car.price) && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ₹{car.originalPrice.toLocaleString()}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {isAdmin && (
              <button
                onClick={handleDeleteAsAdmin}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Admin: Permanently delete car from system"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}

            {isWishlisted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(car.id || car._id);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}
                title="Remove from saved wishlist"
              >
                Remove
              </button>
            )}

            <button 
              onClick={() => onEnquireAdmin(car)}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.82rem', background: '#00a884', borderColor: '#00a884', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Chat with Admin on WhatsApp"
            >
              <MessageSquare size={14} /> Enquire Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

