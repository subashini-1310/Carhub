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
      margin: 'clamp(10px, 2.5vw, 20px)',
      minHeight: '360px',
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
            filter: 'brightness(0.45)'
          }} />
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 60%, rgba(15, 23, 42, 0.3) 100%)',
            padding: 'clamp(24px, 5vw, 60px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '680px'
          }}>
            <span className="badge badge-info" style={{ alignSelf: 'flex-start', marginBottom: '12px', fontSize: '0.75rem', padding: '5px 12px' }}>
              <ShieldCheck size={13} style={{ display: 'inline', marginRight: '5px' }} />
              {slide.badge}
            </span>

            <h2 style={{ fontSize: 'clamp(1.35rem, 3.8vw, 2.2rem)', fontWeight: '800', lineHeight: 1.25, marginBottom: '12px', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {slide.title}
            </h2>

            <p style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1rem)', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '18px' }}>
              {slide.subtitle}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>
                <Wrench size={14} /> 140+ Points Checked
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>
                <RefreshCw size={14} /> 7-Day Guarantee
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Controls */}
      <button 
        onClick={prevSlide}
        aria-label="Previous slide"
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-color)',
          color: '#fff',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          zIndex: 10
        }}
      >
        <ChevronLeft size={20} />
      </button>

      <button 
        onClick={nextSlide}
        aria-label="Next slide"
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-color)',
          color: '#fff',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          zIndex: 10
        }}
      >
        <ChevronRight size={20} />
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
