import React from 'react';
import HeroCarousel from '../components/HeroCarousel';
import FeatureCards from '../components/FeatureCards';
import EmiCalculator from '../components/EmiCalculator';
import Footer from '../components/Footer';
import { ShieldCheck, CheckCircle2, ArrowRight, Car, Wrench, RefreshCw } from 'lucide-react';

export default function HomePage({ onGetStarted, onNavigate }) {
  return (
    <div>
      {/* Hero Banner Carousel */}
      <HeroCarousel />

      {/* Feature Cards (Buy, Sell, Rent) */}
      <FeatureCards onGetStarted={onGetStarted} />

      {/* How CarHub Works Section */}
      <div className="glass-panel" style={{ margin: '40px 20px', padding: '36px 28px', borderRadius: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
            How CarHub Operates (Our Step-by-Step Model)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Zero direct buyer-seller contact. CarHub inspects, buys, and certifies every single vehicle.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          position: 'relative'
        }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '20px', background: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
              STEP 1
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '8px', marginBottom: '8px' }}>Seller Posts Vehicle</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Seller posts car specs and expected price. Vehicle is hidden from public and routed exclusively to Admin.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '20px', background: '#f59e0b', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
              STEP 2
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '8px', marginBottom: '8px' }}>Admin Inspection & Purchase</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              CarHub Admin performs 140+ point AI inspection, buys the vehicle from seller using company funds, and transfers payment.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '20px', background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
              STEP 3
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '8px', marginBottom: '8px' }}>Admin Publishes Listing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Admin edits specs and posts car to Buyer Marketplace, Rental Fleet, or Both with CarHub warranty certificate.
            </p>
          </div>

          {/* Step 4 */}
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '20px', background: '#60a5fa', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
              STEP 4
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '8px', marginBottom: '8px' }}>Buyer / Renter Enquires</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Customers browse certified inventory, calculate EMI, and chat/call Admin directly to close the deal or book rental!
            </p>
          </div>
        </div>
      </div>

      {/* EMI Calculator Section */}
      <div style={{ margin: '0 20px' }}>
        <EmiCalculator />
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
