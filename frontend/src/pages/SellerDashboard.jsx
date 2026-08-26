import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  PlusCircle, Clock, CheckCircle2, DollarSign, Car, AlertCircle, 
  Sparkles, ArrowLeft, UploadCloud, Trash2, X, Image as ImageIcon,
  User, MapPin, Gauge, Shield, Camera, Check, ChevronRight, Info
} from 'lucide-react';
import LocationPickerMap from '../components/LocationPickerMap';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my_cars'); // my_cars or post_car
  const [myCars, setMyCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // ── Form State (All fields empty initially - NOT pre-filled) ──
  // 1. Owner & Inspection Details
  const [ownerName, setOwnerName] = useState('');
  const [noOfOwners, setNoOfOwners] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 13.0827, lng: 80.2707 });

  // 2. Vehicle Basic Info
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engineCapacity, setEngineCapacity] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [color, setColor] = useState('');
  const [kmDriven, setKmDriven] = useState('');
  const [mileage, setMileage] = useState('');
  const [condition, setCondition] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [description, setDescription] = useState('');

  // 3. Mandatory 5 Angle Car Photos (front, back, left, right, inside)
  const [photoFront, setPhotoFront] = useState('');
  const [photoBack, setPhotoBack] = useState('');
  const [photoLeft, setPhotoLeft] = useState('');
  const [photoRight, setPhotoRight] = useState('');
  const [photoInside, setPhotoInside] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState([]);

  // 4. Expected Selling Price
  const [expectedPrice, setExpectedPrice] = useState('');

  // 5. AI Price Recommendation State (Given below expected selling price as last question)
  const [aiRec, setAiRec] = useState(null);
  const [loadingAiPrice, setLoadingAiPrice] = useState(false);
  const [aiValidationError, setAiValidationError] = useState('');

  // Refs for photo file inputs
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const leftInputRef = useRef(null);
  const rightInputRef = useRef(null);
  const insideInputRef = useRef(null);
  const additionalInputRef = useRef(null);

  useEffect(() => {
    fetchSellerCars();

    const handleCarDeleted = (e) => {
      const deletedId = String(e?.detail?.id || '');
      if (deletedId) {
        setMyCars(prev => prev.filter(c => (c.id || c._id) !== deletedId && String(c.id) !== deletedId && String(c._id) !== deletedId));
      }
    };

    window.addEventListener('carhub_car_deleted', handleCarDeleted);
    return () => window.removeEventListener('carhub_car_deleted', handleCarDeleted);
  }, [user]);

  const fetchSellerCars = async () => {
    setLoading(true);
    try {
      const sellerId = user ? user.id || user.email : 'seller1';
      const cars = await api.getSellerCars(sellerId);
      setMyCars(cars);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compress and optimize uploaded images on the fly
  const compressImageFile = (file, maxWidth = 1200, maxHeight = 900, quality = 0.75) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Helper to handle single angle file upload with compression
  const handleSinglePhotoUpload = async (e, setter) => {
    const file = e.target.files && e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const compressed = await compressImageFile(file);
      if (compressed) {
        setter(compressed);
      }
    }
  };

  // Helper for additional photos with compression
  const handleAdditionalPhotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        if (compressed) {
          setAdditionalPhotos(prev => [...prev, compressed]);
        }
      }
    }
  };

  // Collect all images together
  const getAllPhotos = () => {
    const mainPhotos = [photoFront, photoBack, photoLeft, photoRight, photoInside].filter(Boolean);
    return [...mainPhotos, ...additionalPhotos];
  };

  // Validate all fields required for calculating AI price and submitting
  const validateAllRequiredFields = () => {
    const missing = [];
    if (!ownerName.trim()) missing.push('Owner Name');
    if (!noOfOwners) missing.push('Number of Owners');
    if (!address.trim()) missing.push('Street Address');
    if (!location.trim()) missing.push('City / Inspection Region');
    if (!brand.trim()) missing.push('Vehicle Brand');
    if (!model.trim()) missing.push('Model Name');
    if (!year) missing.push('Manufacturing Year');
    if (!engineCapacity.trim()) missing.push('Engine Capacity (cc)');
    if (!fuelType) missing.push('Fuel Type');
    if (!transmission) missing.push('Transmission');
    if (!color.trim()) missing.push('Vehicle Color');
    if (!kmDriven) missing.push('KM Driven');
    if (!mileage) missing.push('Mileage / Fuel Efficiency');
    if (!condition) missing.push('Vehicle Condition');
    if (!licensePlate.trim()) missing.push('License Plate Number');

    // Check mandatory 5 angle photos
    if (!photoFront) missing.push('Front View Photo');
    if (!photoBack) missing.push('Back / Rear View Photo');
    if (!photoLeft) missing.push('Left Side Photo');
    if (!photoRight) missing.push('Right Side Photo');
    if (!photoInside) missing.push('Inside / Interior Cabin Photo');

    return missing;
  };

  // AI Price Recommendation Calculation (All fields strictly required)
  const handleCalculateAIPrice = async () => {
    setAiValidationError('');
    setFormError('');

    const missingFields = validateAllRequiredFields();
    if (missingFields.length > 0) {
      setAiValidationError(`All fields are required before calculating AI price! Please complete: ${missingFields.slice(0, 4).join(', ')}${missingFields.length > 4 ? ` and ${missingFields.length - 4} more` : ''}.`);
      return;
    }

    setLoadingAiPrice(true);
    try {
      const data = await api.getAISellerPrice({
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year),
        kmDriven: parseInt(kmDriven),
        mileage: parseFloat(mileage),
        condition,
        fuelType,
        transmission,
        engineCapacity: engineCapacity.trim(),
        noOfOwners
      });
      setAiRec(data);
    } catch (e) {
      setAiValidationError('Failed to calculate AI price: ' + e.message);
    } finally {
      setLoadingAiPrice(false);
    }
  };

  const applyAiPrice = () => {
    if (aiRec && aiRec.recommendedPrice) {
      setExpectedPrice(String(aiRec.recommendedPrice));
    }
  };

  const handleDeleteSellerCar = async (carId) => {
    if (!window.confirm('Are you sure you want to permanently delete this vehicle from the system?')) return;
    try {
      const res = await api.deleteSellerCar(carId);
      setMyCars(prev => prev.filter(c => (c.id || c._id) !== carId && String(c.id) !== String(carId) && String(c._id) !== String(carId)));
      setSubmitSuccess(res.message || 'Vehicle permanently deleted from database.');
    } catch (e) {
      alert('Failed to delete car: ' + e.message);
    }
  };

  const handlePostCar = async (e) => {
    e.preventDefault();
    setSubmitSuccess('');
    setFormError('');
    setAiValidationError('');

    const missingFields = validateAllRequiredFields();
    if (!expectedPrice) missingFields.push('Expected Selling Price');

    if (missingFields.length > 0) {
      setFormError(`Please fill in all required fields before submitting: ${missingFields.join(', ')}.`);
      return;
    }

    const allImages = getAllPhotos();
    if (allImages.length < 5) {
      setFormError('At least 5 required angle photos (Front, Back, Left, Right, Inside) must be uploaded.');
      return;
    }

    const newCar = {
      title: `${brand.trim()} ${model.trim()} ${year}`,
      brand: brand.trim(),
      model: model.trim(),
      year: parseInt(year),
      sellerExpectedPrice: parseInt(expectedPrice),
      kmDriven: parseInt(kmDriven),
      mileage: parseFloat(mileage) || 16,
      engineCapacity: engineCapacity.trim(),
      ownerName: ownerName.trim(),
      noOfOwners,
      address: address.trim(),
      coordinates,
      condition,
      fuelType,
      transmission,
      color: color.trim(),
      location: location.trim() || 'Chennai',
      vin: vin.trim() || `VIN${Date.now()}`,
      licensePlate: licensePlate.trim(),
      images: allImages,
      description: description.trim() || `${noOfOwners}, ${engineCapacity} engine, regular authorized service history.`,
      sellerId: user ? user.id || user.email : 'seller1',
      sellerName: ownerName.trim() || (user ? user.name : 'Seller User'),
      sellerPhone: user?.phone || '+91 9876543210'
    };

    try {
      const res = await api.postSellerCar(newCar);
      setSubmitSuccess(res.message || 'Vehicle submitted successfully for inspection!');
      setActiveTab('my_cars');
      fetchSellerCars();
      
      // Reset form fields
      setOwnerName('');
      setNoOfOwners('');
      setAddress('');
      setLocation('');
      setBrand('');
      setModel('');
      setYear('');
      setEngineCapacity('');
      setFuelType('');
      setTransmission('');
      setColor('');
      setKmDriven('');
      setMileage('');
      setCondition('');
      setLicensePlate('');
      setVin('');
      setExpectedPrice('');
      setDescription('');
      setPhotoFront('');
      setPhotoBack('');
      setPhotoLeft('');
      setPhotoRight('');
      setPhotoInside('');
      setAdditionalPhotos([]);
      setAiRec(null);
    } catch (err) {
      setFormError("Error posting car: " + err.message);
    }
  };

  const photoSlots = [
    { id: 'front', label: '1. Front View Photo', state: photoFront, setter: setPhotoFront, ref: frontInputRef },
    { id: 'back', label: '2. Back / Rear View Photo', state: photoBack, setter: setPhotoBack, ref: backInputRef },
    { id: 'left', label: '3. Left Side Photo', state: photoLeft, setter: setPhotoLeft, ref: leftInputRef },
    { id: 'right', label: '4. Right Side Photo', state: photoRight, setter: setPhotoRight, ref: rightInputRef },
    { id: 'inside', label: '5. Inside / Interior Cabin Photo', state: photoInside, setter: setPhotoInside, ref: insideInputRef }
  ];

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 20px)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Seller Header */}
      <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', fontWeight: '800' }}>Seller Dashboard</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Welcome, <strong>{user?.name || 'Seller'}</strong>. Manage your vehicles & request CarHub doorstep inspection buyouts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          <button 
            onClick={() => setActiveTab('my_cars')}
            className={activeTab === 'my_cars' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 12px', fontSize: '0.8rem', minHeight: '36px' }}
          >
            <Car size={16} /> My Cars ({myCars.length})
          </button>

          <button 
            onClick={() => {
              setActiveTab('post_car');
              setFormError('');
              setAiValidationError('');
            }}
            className={activeTab === 'post_car' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 12px', fontSize: '0.8rem', minHeight: '36px' }}
          >
            <PlusCircle size={16} /> Post Vehicle
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* ── TAB 1: MY CARS & INSPECTION STATUS ── */}
      {activeTab === 'my_cars' && (
        <div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.82rem', lineHeight: 1.4 }}>
            🔒 <strong>Security Guarantee:</strong> Your submitted vehicle is sent directly to CarHub Admin for verified doorstep inspection. It is never displayed to buyers until CarHub inspects and purchases the vehicle from you.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading your cars...</div>
          ) : myCars.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px' }}>
              <Car size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h3>No Vehicles Posted Yet</h3>
              <p style={{ color: 'var(--text-muted)', margin: '8px 0 20px 0', fontSize: '0.88rem' }}>Post your vehicle with clean photos to get an instant buyout quote from CarHub Admin.</p>
              <button onClick={() => setActiveTab('post_car')} className="btn-primary" style={{ padding: '10px 20px' }}>
                <PlusCircle size={16} /> Post Your Vehicle Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '20px' }}>
              {myCars.map(c => (
                <div key={c.id || c._id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                  <img 
                    src={(c.images && c.images[0]) || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'} 
                    alt={c.title} 
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }} 
                  />
                  
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{c.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 8px 0' }}>
                    Plate: {c.licensePlate} • Engine: {c.engineCapacity || '1.5L'} • {c.noOfOwners || '1st Owner'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    📍 Inspection Point: {c.location} ({c.address || 'Chennai'})
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <span>Your Expected Price:</span>
                    <strong style={{ color: '#3b82f6' }}>₹{c.sellerExpectedPrice?.toLocaleString()}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inspection Status:</span>
                    {c.status === 'seller_posted' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Pending Inspection
                        </span>
                        <button
                          onClick={() => handleDeleteSellerCar(c.id || c._id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Withdraw & Delete Listing"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    ) : (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Purchased by CarHub (₹{c.purchasePriceByAdmin?.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: POST VEHICLE FORM ── */}
      {activeTab === 'post_car' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', maxWidth: '920px', margin: '0 auto', position: 'relative' }}>
          {/* Back Navigation Button */}
          <button 
            type="button"
            onClick={() => setActiveTab('my_cars')}
            className="btn-secondary"
            style={{ marginBottom: '20px', padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Back to My Cars
          </button>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>Post Vehicle for Inspection</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fill in all mandatory vehicle details, upload required 5 angle photos, and mark your location on the map.
            </p>
          </div>

          {formError && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid #ef4444', 
              color: '#ef4444', 
              padding: '14px', 
              borderRadius: '12px', 
              marginBottom: '20px', 
              fontSize: '0.85rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handlePostCar} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* ── SECTION 1: OWNER & DOORSTEP INSPECTION LOCATION ── */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <User size={18} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
                  1. Owner & Inspection Location Details
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Owner Full Name *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Subashini S / Ramesh Kumar" 
                    value={ownerName} 
                    onChange={e => setOwnerName(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Number of Owners *
                  </label>
                  <select 
                    value={noOfOwners} 
                    onChange={e => setNoOfOwners(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                  >
                    <option value="">Select Ownership Count</option>
                    <option value="1st Owner">1st Owner (Single Owner)</option>
                    <option value="2nd Owner">2nd Owner</option>
                    <option value="3rd Owner">3rd Owner</option>
                    <option value="4th+ Owner">4th Owner or Above</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Doorstep Street Address & Landmark *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Flat 402, Green Meadows Apartment, Gandhi Road, Anna Nagar" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }} 
                  />
                </div>
              </div>

              {/* Interactive Location Marking Map */}
              <LocationPickerMap
                location={location}
                onLocationChange={setLocation}
                address={address}
                onAddressChange={setAddress}
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
              />
            </div>

            {/* ── SECTION 2: VEHICLE SPECIFICATIONS ── */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Car size={18} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
                  2. Vehicle Specifications & Engine
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Vehicle Brand *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hyundai, Toyota, Tata" 
                    value={brand} 
                    onChange={e => setBrand(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Model Name *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Creta SX, Innova Crysta" 
                    value={model} 
                    onChange={e => setModel(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Manufacturing Year *
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 2023" 
                    min="2000" 
                    max="2027" 
                    value={year} 
                    onChange={e => setYear(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Engine Capacity (cc) *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1498 cc or 1.5L" 
                    value={engineCapacity} 
                    onChange={e => setEngineCapacity(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Fuel Type *
                  </label>
                  <select 
                    value={fuelType} 
                    onChange={e => setFuelType(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="EV">EV (Electric)</option>
                    <option value="CNG">CNG</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Transmission *
                  </label>
                  <select 
                    value={transmission} 
                    onChange={e => setTransmission(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  >
                    <option value="">Select Transmission</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic (AMT / CVT / DCT / AT)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Color *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Polar White, Phantom Black" 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    KM Driven *
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 24000" 
                    value={kmDriven} 
                    onChange={e => setKmDriven(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Fuel Mileage (KM/L) *
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 17.5" 
                    value={mileage} 
                    onChange={e => setMileage(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Vehicle Condition *
                  </label>
                  <select 
                    value={condition} 
                    onChange={e => setCondition(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  >
                    <option value="">Select Condition</option>
                    <option value="Flawless">Flawless (Showroom Condition)</option>
                    <option value="Very Good">Very Good (Clean, minor wear)</option>
                    <option value="Good">Good (Normal usage)</option>
                    <option value="Fair">Fair (Some scratches)</option>
                    <option value="Needs Work">Needs Work</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    License Plate Number *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. TN 09 BX 4589" 
                    value={licensePlate} 
                    onChange={e => setLicensePlate(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    VIN / Chassis Number (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. MAL1122334455HY" 
                    value={vin} 
                    onChange={e => setVin(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 3: AT LEAST 5 MANDATORY CAR PHOTOS (Front, Back, Left, Right, Inside) ── */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="var(--accent-primary)" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
                    3. Mandatory 5 Angle Photos (Front, Back, Left, Right, Inside) *
                  </h4>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  All 5 angles are strictly required for inspection verification.
                </span>
              </div>

              {/* 5 Distinct Photo Upload Slots */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                {photoSlots.map(slot => (
                  <div 
                    key={slot.id}
                    onClick={() => !slot.state && slot.ref.current && slot.ref.current.click()}
                    style={{
                      border: slot.state ? '2px solid #10b981' : '2px dashed var(--border-color)',
                      background: slot.state ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                      cursor: slot.state ? 'default' : 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '150px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="file" 
                      ref={slot.ref} 
                      accept="image/*" 
                      onChange={(e) => handleSinglePhotoUpload(e, slot.setter)} 
                      style={{ display: 'none' }} 
                    />

                    {slot.state ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img 
                          src={slot.state} 
                          alt={slot.label} 
                          style={{ width: '100%', height: '105px', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            slot.setter('');
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove Photo"
                        >
                          <X size={14} />
                        </button>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Check size={12} /> {slot.label.split('.')[1]}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)',
                          marginBottom: '8px'
                        }}>
                          <UploadCloud size={20} />
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                          {slot.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '600' }}>
                          * Required
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Optional Additional Photos */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                    Additional Extra Photos (Optional):
                  </span>
                  <button
                    type="button"
                    onClick={() => additionalInputRef.current && additionalInputRef.current.click()}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-primary)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + Add More Photos
                  </button>
                  <input 
                    type="file" 
                    ref={additionalInputRef} 
                    accept="image/*" 
                    multiple 
                    onChange={handleAdditionalPhotos} 
                    style={{ display: 'none' }} 
                  />
                </div>

                {additionalPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {additionalPhotos.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={img} alt={`Extra ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setAdditionalPhotos(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 4: EXPECTED SELLING PRICE & AI VALUATION (GIVEN BELOW AS LAST QUESTION) ── */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <DollarSign size={20} color="#10b981" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
                  4. Expected Selling Price & AI Valuation
                </h4>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                  Your Expected Selling Price (₹) *
                </label>
                <div style={{ position: 'relative', maxWidth: '380px' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '1.1rem' }}>₹</span>
                  <input 
                    type="number" 
                    placeholder="e.g. 850000" 
                    value={expectedPrice} 
                    onChange={e => setExpectedPrice(e.target.value)} 
                    required 
                    style={{ 
                      width: '100%', 
                      padding: '12px 14px 12px 34px', 
                      borderRadius: '10px', 
                      border: '1.5px solid var(--border-color)', 
                      background: 'var(--bg-main)', 
                      color: 'var(--text-main)',
                      fontSize: '1.1rem',
                      fontWeight: '800'
                    }} 
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Enter your target price or use the AI calculation below to receive the exact current market estimate.
                </span>
              </div>

              {/* ── AI PRICE CALCULATION WIDGET (Positioned below Expected Price as requested) ── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                border: '1.5px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                        ✨ AI Fair Market Price Calculator
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        Analyzes Brand, Engine Capacity, KM Driven, Mileage, Ownership & Condition
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculateAIPrice}
                    disabled={loadingAiPrice}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Sparkles size={16} />
                    {loadingAiPrice ? 'Calculating Market Value...' : 'Calculate AI Price'}
                  </button>
                </div>

                {/* Validation message if fields are missing */}
                {aiValidationError && (
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid #ef4444', 
                    color: '#ef4444', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    marginTop: '16px', 
                    fontSize: '0.82rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    <AlertCircle size={16} />
                    <span>{aiValidationError}</span>
                  </div>
                )}

                {/* AI Price Calculation Results */}
                {aiRec && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Recommended Price</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                          ₹{aiRec.recommendedPrice?.toLocaleString()}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fair Market Valuation Range</div>
                        <div style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                          ₹{aiRec.minPrice?.toLocaleString()} - ₹{aiRec.maxPrice?.toLocaleString()}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Rating</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3b82f6', marginTop: '4px' }}>
                          {aiRec.confidenceScore}% High Accuracy
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                      💡 {aiRec.marketInsights}
                    </p>

                    <button
                      type="button"
                      onClick={applyAiPrice}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle2 size={16} /> Apply Recommended Price (₹{aiRec.recommendedPrice?.toLocaleString()})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                type="button" 
                onClick={() => setActiveTab('my_cars')}
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}
              >
                Cancel
              </button>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ flex: 2, justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}
              >
                <PlusCircle size={18} /> Submit Vehicle for Doorstep Inspection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

