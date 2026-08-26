import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, AlertTriangle, Eye, CheckCircle2, Scan, Sparkles, RefreshCw } from 'lucide-react';

export default function AIInspector({ car, onInspectionComplete }) {
  const [scanning, setScanning] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(car.aiInspection || null);

  const triggerAIScan = async () => {
    setScanning(true);
    try {
      const res = await api.runAIScan(car.id || car._id);
      setInspectionResult(res.aiInspection);
      if (onInspectionComplete) onInspectionComplete(res.aiInspection);
    } catch (e) {
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="#3b82f6" />
          <h4 style={{ fontSize: '1rem', fontWeight: '800' }}>CarHub AI Inspection & Diagnostic Suite</h4>
        </div>
        <button 
          onClick={triggerAIScan}
          disabled={scanning}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <RefreshCw size={14} className={scanning ? 'pulse-active' : ''} />
          {scanning ? 'Scanning Vehicle Image...' : 'Re-Run AI Diagnostics'}
        </button>
      </div>

      {/* Canvas bounding box image preview */}
      <div style={{ position: 'relative', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <img 
          src={car.images && car.images[0] ? car.images[0] : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'} 
          alt="AI Scan"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Bounding box AI canvas overlays */}
        {inspectionResult && inspectionResult.damagePoints && inspectionResult.damagePoints.map((pt, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${pt.x}%`,
            top: `${pt.y}%`,
            border: '2px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.25)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.65rem',
            color: '#fff',
            fontWeight: '700',
            boxShadow: '0 0 8px rgba(239,68,68,0.8)'
          }}>
            AI Scratch: {pt.label}
          </div>
        ))}

        {scanning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(59, 130, 246, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            gap: '8px'
          }}>
            <Scan size={24} className="pulse-active" /> AI Computer Vision Analysis in Progress...
          </div>
        )}
      </div>

      {/* Results Grid */}
      {inspectionResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)' }}>AI Structure Score</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{inspectionResult.damageScore}/100</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Blur & Quality Test</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: inspectionResult.blurPassed ? '#10b981' : '#ef4444' }}>
              {inspectionResult.blurPassed ? 'PASSED (HD Clean)' : 'FAILED (Blurry)'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Plate OCR Detected</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#3b82f6' }}>
              {inspectionResult.ocrPlateDetected || car.licensePlate}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Detected Color</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>
              {inspectionResult.detectedColor || car.color}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
