import React, { useState } from 'react';
import { Calculator, DollarSign, Calendar, Percent, CheckCircle2 } from 'lucide-react';

export default function EmiCalculator({ defaultCarPrice = 1000000 }) {
  const [carPrice, setCarPrice] = useState(defaultCarPrice);
  const [downPayment, setDownPayment] = useState(carPrice * 0.2); // 20% default
  const [interestRate, setInterestRate] = useState(8.5); // 8.5% default
  const [loanYears, setLoanYears] = useState(5); // 5 years default

  // Calculate EMI Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const principal = Math.max(0, carPrice - downPayment);
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = loanYears * 12;

  let monthlyEMI = 0;
  if (principal > 0 && monthlyRate > 0 && totalMonths > 0) {
    monthlyEMI = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
  }

  const totalPayable = monthlyEMI * totalMonths;
  const totalInterest = Math.max(0, totalPayable - principal);

  return (
    <div className="glass-panel" style={{ padding: '24px', margin: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Calculator size={24} color="#3b82f6" />
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>CarHub Loan EMI Calculator</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* Input Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vehicle Price:</span>
              <strong style={{ color: '#10b981' }}>₹{carPrice.toLocaleString()}</strong>
            </div>
            <input 
              type="range"
              min={200000}
              max={5000000}
              step={50000}
              value={carPrice}
              onChange={e => {
                const val = parseInt(e.target.value);
                setCarPrice(val);
                setDownPayment(Math.round(val * 0.2));
              }}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Down Payment:</span>
              <strong style={{ color: '#3b82f6' }}>₹{downPayment.toLocaleString()}</strong>
            </div>
            <input 
              type="range"
              min={0}
              max={carPrice * 0.8}
              step={25000}
              value={downPayment}
              onChange={e => setDownPayment(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Interest Rate (% p.a.):</span>
              <strong style={{ color: '#f59e0b' }}>{interestRate}%</strong>
            </div>
            <input 
              type="range"
              min={6}
              max={16}
              step={0.25}
              value={interestRate}
              onChange={e => setInterestRate(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Loan Tenure (Years):</span>
              <strong>{loanYears} Years ({totalMonths} Months)</strong>
            </div>
            <input 
              type="range"
              min={1}
              max={7}
              step={1}
              value={loanYears}
              onChange={e => setLoanYears(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Results Output Cards */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Monthly EMI Payment
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#3b82f6', margin: '8px 0 16px 0' }}>
              ₹{monthlyEMI.toLocaleString()} / mo
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loan Principal Amount:</span>
                <strong>₹{principal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Interest Payable:</span>
                <strong style={{ color: '#ef4444' }}>₹{totalInterest.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                <span>Total Amount Payable:</span>
                <strong style={{ color: '#10b981' }}>₹{totalPayable.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
            <CheckCircle2 size={14} color="#10b981" /> Instant pre-approved financing available with zero processing fee.
          </div>
        </div>
      </div>
    </div>
  );
}
