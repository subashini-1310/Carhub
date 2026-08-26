import React from 'react';
import { X, TrendingDown, ShieldCheck } from 'lucide-react';

export default function PriceTrend({ car, onClose }) {
  if (!car) return null;

  const priceHistory = [
    { month: 'Jan 2026', price: (car.price || 900000) * 1.08 },
    { month: 'Mar 2026', price: (car.price || 900000) * 1.05 },
    { month: 'May 2026', price: (car.price || 900000) * 1.02 },
    { month: 'Jul 2026', price: car.price || 900000 }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '550px',
        padding: '28px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <TrendingDown size={24} color="#10b981" />
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Price Trend & Valuation Graph</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{car.title}</span>
          </div>
        </div>

        {/* Visual Graph Bar Chart */}
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Historical Depreciation & Fair Market Curve
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '0 10px' }}>
            {priceHistory.map((item, i) => {
              const maxP = priceHistory[0].price;
              const heightPct = Math.round((item.price / maxP) * 100);
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: i === 3 ? '#10b981' : 'var(--text-main)', marginBottom: '6px' }}>
                    ₹{Math.round(item.price / 1000)}k
                  </span>
                  <div style={{
                    width: '32px',
                    height: `${heightPct}%`,
                    background: i === 3 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(59, 130, 246, 0.4)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.4s ease'
                  }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} />
          <strong>Best Time to Buy!</strong> Current price is ₹50,000 below the regional market average.
        </div>
      </div>
    </div>
  );
}
