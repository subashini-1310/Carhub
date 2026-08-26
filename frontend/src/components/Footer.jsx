import React from 'react';
import { Car, ShieldCheck, MapPin, Phone, Mail, Clock, Award, CheckCircle2 } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="glass-panel" style={{ 
      margin: 'clamp(24px, 4vw, 40px) clamp(12px, 3vw, 20px) clamp(76px, 12vh, 24px) clamp(12px, 3vw, 20px)', 
      padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 30px)', 
      borderRadius: '24px' 
    }}>
      {/* Trust & Certification Banner */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        marginBottom: '36px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
            <Award size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>140+ Point Inspection</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Verified personally by CarHub engineers</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>7-Day Money Back</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>100% full refund guarantee</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>Direct Admin Buyout</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No third-party sellers or buyers</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Contact Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '30px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '30px'
      }}>
        {/* About Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#3b82f6', padding: '6px', borderRadius: '8px', color: '#fff' }}>
              <Car size={20} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>CarHub</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            CarHub is the trusted platform for buying, selling, and renting pre-owned cars. We inspect and purchase every vehicle using our own funds before listing them to ensure 100% quality and transparency.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '12px', color: '#3b82f6' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <li style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home Overview</li>
            <li style={{ cursor: 'pointer' }} onClick={() => onNavigate('buyer')}>Browse Certified Cars</li>
            <li style={{ cursor: 'pointer' }} onClick={() => onNavigate('seller')}>Sell Your Vehicle</li>
            <li style={{ cursor: 'pointer' }} onClick={() => onNavigate('renter')}>Self-Drive Rentals</li>
          </ul>
        </div>

        {/* Contact Details in Last */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '12px', color: '#10b981' }}>Contact Details</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#3b82f6" />
              <span>CarHub Corporate Tower, Anna Salai, Chennai 600002</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#10b981" />
              <span>+91 98765 43210 / 1800 123 4567 (Toll-Free)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="#f59e0b" />
              <span>support@carhub.com / admin@carhub.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#60a5fa" />
              <span>Working Hours: Mon - Sun (9:00 AM - 9:00 PM)</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        © 2026 CarHub Platforms Inc. All Rights Reserved. Inspired by Cars24 & OLX best practices.
      </div>
    </footer>
  );
}
