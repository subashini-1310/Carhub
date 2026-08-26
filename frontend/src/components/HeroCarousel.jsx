import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Wrench, RefreshCw, Car } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "100% Certified Used Cars Purchased & Verified by CarHub",
    subtitle: "We buy cars directly from verified owners after 140+ point technical inspection.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400",
    badge: "140-Point Inspection Guaranteed"
  },
  {
    id: 2,
    title: "Sell Your Car to CarHub at Fair Market Value in 24 Hours",
    subtitle: "Get your vehicle inspected in person. Instant company payment with zero hassle.",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1400",
    badge: "Instant Payment by Admin"
  },
  {
    id: 3,
    title: "Premium Self-Drive Car Rentals From Inspected Fleet",
    subtitle: "Rent certified cars with zero security deposit and 24/7 roadside assistance.",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1400",
    badge: "Sanitized & Verified Rental Fleet"
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => setCurrent(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () => setCurrent(prev => (prev + 1) % slides.length);

  return (
    <div className="glass-panel" style={{
      margin: '20px',
      height: '420px',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '24px',
      border: '1px solid var(--border-color)'
    }}>
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: index === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            pointerEvents: index === current ? 'auto' : 'none'
          }}
        >
          {/* Background Image with Overlay Gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.55)'
          }} />
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(15, 23, 42, 0.4) 100%)',
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '650px'
          }}>
            <span className="badge badge-info" style={{ alignSelf: 'flex-start', marginBottom: '16px', fontSize: '0.8rem', padding: '6px 14px' }}>
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {slide.badge}
            </span>

            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px', color: '#ffffff' }}>
              {slide.title}
            </h2>

            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '24px' }}>
              {slide.subtitle}
            </p>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '0.85rem' }}>
                <Wrench size={16} /> 140+ Points Checked
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '0.85rem' }}>
                <RefreshCw size={16} /> 7-Day Money Back Guarantee
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Controls */}
      <button 
        onClick={prevSlide}
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color)',
          color: '#fff',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        onClick={nextSlide}
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color)',
          color: '#fff',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}
      >
        <ChevronRight size={24} />
      </button>

      {/* Pagination Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px'
      }}>
        {slides.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? '28px' : '10px',
              height: '10px',
              borderRadius: '5px',
              border: 'none',
              background: i === current ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
}
