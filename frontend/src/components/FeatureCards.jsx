import React from 'react';
import { ShoppingBag, DollarSign, Key, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function FeatureCards({ onGetStarted }) {
  const cards = [
    {
      targetTab: 'buyer',
      role: 'Buyer',
      title: 'Buy a Car',
      subtitle: 'Browse certified used cars from our verified inventory.',
      description: 'Every vehicle is personally inspected by CarHub engineers. Enjoy 12-month warranty, zero commission fees, and instant home test drive delivery.',
      icon: <ShoppingBag size={28} color="#3b82f6" />,
      highlights: ['140+ Point Inspection', '7-Day Refund Policy', 'Loan EMI & Finance Support'],
      buttonText: 'Get Started as Buyer',
      badge: 'Certified Fleet'
    },
    {
      targetTab: 'seller',
      role: 'Seller',
      title: 'Sell Your Car',
      subtitle: 'Get your car inspected and receive a fair offer.',
      description: 'Post your vehicle in 2 minutes. Our CarHub team will inspect your car in person and purchase it directly using company funds with same-day bank payment.',
      icon: <DollarSign size={28} color="#10b981" />,
      highlights: ['Direct Admin Buyout', 'Zero Middlemen / Commission', 'Free Doorstep Inspection'],
      buttonText: 'Get Started as Seller',
      badge: 'Instant Cash Buyout'
    },
    {
      targetTab: 'renter',
      role: 'Renter',
      title: 'Rent a Car',
      subtitle: 'Choose from our fleet of inspected rental cars.',
      description: 'Drive sanitized, top-condition cars until sold. Choose flexible daily or weekly rentals with zero security deposit and unlimited KM options.',
      icon: <Key size={28} color="#f59e0b" />,
      highlights: ['Zero Security Deposit', 'Sanitized & Inspected Fleet', '24/7 Roadside Assistance'],
      buttonText: 'Get Started as Renter',
      badge: 'Self-Drive Fleet'
    }
  ];

  return (
    <div style={{ margin: 'clamp(20px, 4vw, 40px) clamp(10px, 3vw, 20px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          How Would You Like to Use CarHub?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}>
          Select an option below to explore our verified inventory, sell your vehicle to us, or rent for your next trip.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
        gap: '20px'
      }}>
        {cards.map(card => (
          <div 
            key={card.role}
            className="glass-panel"
            style={{
              padding: 'clamp(20px, 4vw, 30px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)'
                }}>
                  {card.icon}
                </div>
                <span className="badge badge-info">{card.badge}</span>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>
                {card.title}
              </h3>

              <p style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px', lineHeight: 1.4 }}>
                "{card.subtitle}"
              </p>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                {card.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                {card.highlights.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    <CheckCircle size={15} color="#10b981" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => onGetStarted(card.targetTab || card.role)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              <span>{card.buttonText}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
