import React from 'react';
import { X, Check, Minus, Layers } from 'lucide-react';

export default function CompareModal({ selectedCars, onClose, onRemoveCar }) {
  if (!selectedCars || selectedCars.length === 0) return null;

  const compareRows = [
    { label: 'Selling Price', key: c => `₹${c.price?.toLocaleString()}` },
    { label: 'Year', key: c => c.year },
    { label: 'KM Driven', key: c => `${c.kmDriven?.toLocaleString()} km` },
    { label: 'Fuel Type', key: c => c.fuelType },
    { label: 'Transmission', key: c => c.transmission },
    { label: 'Color', key: c => c.color },
    { label: 'Body Type', key: c => c.bodyType || 'SUV' },
    { label: 'Distance', key: c => `${c.distanceKm || 10} km away` },
    { label: 'CarHub Inspection Score', key: c => `${c.aiInspection?.damageScore || 95}/100` },
    { label: 'Rating', key: c => `⭐ ${c.rating || 4.8}` }
  ];

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90dvh',
        overflowY: 'auto',
        padding: 'clamp(18px, 3vw, 30px)',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        overscrollBehavior: 'contain'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Layers size={24} color="#3b82f6" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Car Comparison ({selectedCars.length}/3 Cars)</h2>
        </div>

        {/* Comparison Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', width: '220px', color: 'var(--text-muted)' }}>Specification</th>
                {selectedCars.map(c => (
                  <th key={c.id || c._id} style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', minWidth: '200px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <img src={c.images && c.images[0]} alt={c.title} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{c.title}</div>
                      <button 
                        onClick={() => onRemoveCar(c)}
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', alignSelf: 'flex-start' }}
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '12px', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    {row.label}
                  </td>
                  {selectedCars.map(c => (
                    <td key={c.id || c._id} style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', borderBottom: '1px solid var(--border-color)' }}>
                      {row.key(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
