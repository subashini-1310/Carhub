import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import AIInspector from '../components/AIInspector';
import {
  ShieldCheck,
  Clock,
  ShoppingBag,
  Key,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  RefreshCw,
  X,
  TrendingUp,
  Car,
  AlertCircle,
  Calendar,
  Check,
  XCircle,
  Trash2,
  Phone,
  Video,
  Mail,
  Filter,
  Search,
  Eye,
  MapPin,
  FileText,
  Settings,
  ChevronRight,
  Sliders,
  CheckSquare
} from 'lucide-react';

// ── Inline Toast ──────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#10b981', icon: <CheckCircle2 size={20} /> },
    error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444', icon: <AlertCircle size={20} /> },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
      background: c.bg, border: `1px solid ${c.border}`,
      backdropFilter: 'blur(12px)',
      borderRadius: '14px', padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.3s ease',
      maxWidth: '380px'
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <span style={{ color: c.text }}>{c.icon}</span>
      <span style={{ color: '#f1f5f9', fontSize: '0.88rem', fontWeight: '600', flex: 1 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const adminHeaders = (explicitToken) => {
  const tok = explicitToken || sessionStorage.getItem('carhub_admin_token') || localStorage.getItem('carhub_admin_token') || localStorage.getItem('carhub_token') || sessionStorage.getItem('carhub_token');
  return { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) };
};

const authFetch = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { ...adminHeaders(), ...(opts.headers || {}) } });

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ onOpenAdminChat, adminToken, isStandalone = false }) {
  const [activeTab, setActiveTab] = useState('pending');

  // Unified car list — source of truth for all car tabs
  const [allCars, setAllCars]       = useState([]);
  const [reports, setReports]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [inspectingCar, setInspectingCar] = useState(null);
  const [publishingCar, setPublishingCar] = useState(null);
  const [viewingCar, setViewingCar]       = useState(null);
  const [activeViewImageIdx, setActiveViewImageIdx] = useState(0);

  // Buyout & Publish Form Fields (Core + Structured Additional Info)
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice,  setSellingPrice]  = useState('');
  const [rentalPrice,   setRentalPrice]   = useState('2500');
  const [targetMarket,  setTargetMarket]  = useState('buyer');

  // Editable vehicle core specifications
  const [editTitle, setEditTitle] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editEngineCapacity, setEditEngineCapacity] = useState('');
  const [editKmDriven, setEditKmDriven] = useState('');
  const [editFuelType, setEditFuelType] = useState('Petrol');
  const [editTransmission, setEditTransmission] = useState('Manual');
  const [editColor, setEditColor] = useState('Blue');
  const [editNoOfOwners, setEditNoOfOwners] = useState('1st Owner');
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editVin, setEditVin] = useState('');
  const [editLocation, setEditLocation] = useState('Chennai');
  const [editAddress, setEditAddress] = useState('');

  // Structured Additional Vehicle Information
  const [addAbs, setAddAbs] = useState('Yes');
  const [addAdjustableSteering, setAddAdjustableSteering] = useState('Yes');
  const [addAlloyWheels, setAddAlloyWheels] = useState('Yes');
  const [addAntiTheftDevice, setAddAntiTheftDevice] = useState('Yes');
  const [addAuxCompatibility, setAddAuxCompatibility] = useState('Yes');
  const [addBluetooth, setAddBluetooth] = useState('Yes');
  const [addColor, setAddColor] = useState('Blue');
  const [addCruiseControl, setAddCruiseControl] = useState('Yes');
  const [addInsuranceType, setAddInsuranceType] = useState('Comprehensive');
  const [addMakeMonth, setAddMakeMonth] = useState('April');
  const [addNavigationSystem, setAddNavigationSystem] = useState('Yes');
  const [addParkingSensors, setAddParkingSensors] = useState('Yes');
  const [addPowerSteering, setAddPowerSteering] = useState('Yes');
  const [addAmFmRadio, setAddAmFmRadio] = useState('Yes');
  const [addRearParkingCamera, setAddRearParkingCamera] = useState('Yes');
  const [addRegistrationPlace, setAddRegistrationPlace] = useState('TS');
  const [addExchange, setAddExchange] = useState('Yes');
  const [addFinance, setAddFinance] = useState('Yes');
  const [addSunroof, setAddSunroof] = useState('Yes');
  const [addUsbCompatibility, setAddUsbCompatibility] = useState('Yes');
  const [customDescription, setCustomDescription] = useState('');
  const [publishModalTab, setPublishModalTab] = useState('pricing'); // pricing, specs, additional_info

  // Publish action loading guard
  const [publishing, setPublishing] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Users, Rentals, Chats tab ───────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [rentalBookings, setRentalBookings] = useState([]);
  const [chatThreads, setChatThreads] = useState([]);
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'unread' | 'buyers' | 'renters'
  const [chatSearch, setChatSearch] = useState('');
  const [chatCarSelect, setChatCarSelect] = useState('all');



  // ── Data fetch ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // 1. All cars (unified database + active inventory)
      const loadedCars = await api.getAllCarsForAdmin();
      setAllCars(loadedCars);

      // 2. Reports & analytics
      try {
        const reportsData = await api.getAdminReports();
        if (reportsData) setReports(reportsData);
      } catch (e) {}

      // 3. Users
      try {
        const usersData = await api.getAdminUsers();
        if (Array.isArray(usersData)) setUsers(usersData);
      } catch (e) {}

      // 4. Rental Bookings
      try {
        const rentalsData = await api.getAdminRentalBookings();
        setRentalBookings(Array.isArray(rentalsData) ? rentalsData : []);
      } catch (e) {}

      // 5. Live Chat Threads & Customer Inquiries
      try {
        const threadsData = await api.getAdminChatThreads();
        if (Array.isArray(threadsData)) setChatThreads(threadsData);
      } catch (e) {}
    } catch (e) {
      console.error('Admin fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Permanent Delete Handler ─────────────────────────────────────────────
  const handleDeleteCar = async (carId, carTitle = 'Vehicle') => {
    if (!window.confirm(`Are you sure you want to permanently delete "${carTitle}" from the database? This cannot be undone.`)) return;
    try {
      await api.deleteCarByAdmin(carId);
      setAllCars(prev => prev.filter(c => (c.id || c._id) !== carId && String(c.id) !== String(carId) && String(c._id) !== String(carId)));
      if (viewingCar && (viewingCar.id === carId || viewingCar._id === carId)) {
        setViewingCar(null);
      }
      if (publishingCar && (publishingCar.id === carId || publishingCar._id === carId)) {
        setPublishingCar(null);
      }
      showToast(`✅ "${carTitle}" was permanently deleted from database.`, 'success');
      setTimeout(() => fetchData(true), 1200);
    } catch (err) {
      showToast(`Failed to delete vehicle: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId, userName = 'User') => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"?`)) return;
    try {
      await api.deleteUserByAdmin(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`✅ User "${userName}" deleted.`, 'success');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // ── Rental Action Handler ───────────────────────────────────────────────
  const handleUpdateRentalStatus = async (bookingId, newStatus) => {
    try {
      await api.updateRentalStatus(bookingId, newStatus);
      setRentalBookings(prev => prev.map(b => {
        if (String(b.id || b._id) === String(bookingId)) {
          return { ...b, status: newStatus };
        }
        return b;
      }));

      const targetBooking = rentalBookings.find(b => String(b.id || b._id) === String(bookingId));
      if (targetBooking && targetBooking.carId) {
        const carIdStr = String(targetBooking.carId);
        const isRented = (newStatus === 'confirmed');
        setAllCars(prev => prev.map(c => {
          if (String(c.id || c._id) === carIdStr) {
            return {
              ...c,
              rentalStatus: isRented ? 'RENTED' : 'AVAILABLE',
              isAvailable: !isRented
            };
          }
          return c;
        }));
      }

      if (newStatus === 'confirmed') {
        showToast('✅ Rental Request Approved! Vehicle marked as RENTED.', 'success');
      } else {
        showToast('Rental Request Rejected', 'error');
      }

      fetchData(true);
    } catch (err) {
      showToast(`Error updating rental: ${err.message}`, 'error');
    }
  };

  // ── Derived lists (Resilient matching for buying, rental, and pending) ────
  const isSaleCar = (c) => {
    const s = String(c.status || '').toLowerCase();
    const tm = String(c.targetMarket || '').toLowerCase();
    return s === 'for_sale' || s === 'sale_and_rent' || s === 'both' || tm === 'buyer' || tm === 'both' || (Number(c.price) > 0 && s !== 'seller_posted' && s !== 'admin_inspected');
  };

  const isRentCar = (c) => {
    const s = String(c.status || '').toLowerCase();
    const tm = String(c.targetMarket || '').toLowerCase();
    return s === 'for_rent' || s === 'sale_and_rent' || s === 'both' || tm === 'renter' || tm === 'both' || (Number(c.rentalPricePerDay) > 0 && s !== 'seller_posted' && s !== 'admin_inspected');
  };

  const isPendingCar = (c) => {
    const s = String(c.status || '').toLowerCase();
    return s === 'seller_posted' || s === 'admin_inspected';
  };

  const pendingCars        = allCars.filter(isPendingCar);
  const carsForSale        = allCars.filter(isSaleCar);
  const carsForRent        = allCars.filter(isRentCar);
  const pendingRentalCount = rentalBookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;

  // ── Helper to format Additional Vehicle Information text ──────────────────
  const buildFormattedDescription = (info, userColor) => {
    return `ADDITIONAL VEHICLE INFORMATION:
ABS: ${info.abs || 'Yes'}
Adjustable Steering: ${info.adjustableSteering || 'Yes'}
Alloy Wheels: ${info.alloyWheels || 'Yes'}
Anti Theft Device: ${info.antiTheftDevice || 'Yes'}
Aux Compatibility: ${info.auxCompatibility || 'Yes'}
Bluetooth: ${info.bluetooth || 'Yes'}
Color: ${userColor || info.color || 'Blue'}
Cruise Control: ${info.cruiseControl || 'Yes'}
Insurance Type: ${info.insuranceType || 'Comprehensive'}
Make Month: ${info.makeMonth || 'April'}
Navigation System: ${info.navigationSystem || 'Yes'}
Parking Sensors: ${info.parkingSensors || 'Yes'}
Power steering: ${info.powerSteering || 'Yes'}
AM/FM Radio: ${info.amFmRadio || 'Yes'}
Rear Parking Camera: ${info.rearParkingCamera || 'Yes'}
Registration Place: ${info.registrationPlace || 'TS'}
Exchange: ${info.exchange || 'Yes'}
Finance: ${info.finance || 'Yes'}
Sunroof: ${info.sunroof || 'Yes'}
USB Compatibility: ${info.usbCompatibility || 'Yes'}`;
  };

  // ── Open View Details Modal ──────────────────────────────────────────────
  const openViewModal = (car) => {
    setViewingCar(car);
    setActiveViewImageIdx(0);
  };

  // ── Open Buyout & Publish Modal ──────────────────────────────────────────
  const openPublishModal = (car) => {
    setPublishingCar(car);
    setPublishModalTab('pricing');

    const base = car.sellerExpectedPrice || car.price || 800000;
    setPurchasePrice(String(base));
    setSellingPrice(String(car.price || Math.round(base * 1.08)));
    setRentalPrice(String(car.rentalPricePerDay || '2500'));
    setTargetMarket(car.targetMarket && car.targetMarket !== 'none' ? car.targetMarket : 'buyer');

    // Populate core specs
    setEditTitle(car.title || `${car.brand || ''} ${car.model || ''} ${car.year || ''}`.trim());
    setEditBrand(car.brand || '');
    setEditModel(car.model || '');
    setEditYear(String(car.year || '2023'));
    setEditEngineCapacity(car.engineCapacity || '1498 cc');
    setEditKmDriven(String(car.kmDriven || '20000'));
    setEditFuelType(car.fuelType || 'Petrol');
    setEditTransmission(car.transmission || 'Manual');
    setEditColor(car.color || 'Blue');
    setEditNoOfOwners(car.noOfOwners || '1st Owner');
    setEditLicensePlate(car.licensePlate || '');
    setEditVin(car.vin || '');
    setEditLocation(car.location || 'Chennai');
    setEditAddress(car.address || '');

    // Populate additional vehicle info
    const info = car.additionalInfo || {};
    setAddAbs(info.abs || 'Yes');
    setAddAdjustableSteering(info.adjustableSteering || 'Yes');
    setAddAlloyWheels(info.alloyWheels || 'Yes');
    setAddAntiTheftDevice(info.antiTheftDevice || 'Yes');
    setAddAuxCompatibility(info.auxCompatibility || 'Yes');
    setAddBluetooth(info.bluetooth || 'Yes');
    setAddColor(car.color || info.color || 'Blue');
    setAddCruiseControl(info.cruiseControl || 'Yes');
    setAddInsuranceType(info.insuranceType || 'Comprehensive');
    setAddMakeMonth(info.makeMonth || 'April');
    setAddNavigationSystem(info.navigationSystem || 'Yes');
    setAddParkingSensors(info.parkingSensors || 'Yes');
    setAddPowerSteering(info.powerSteering || 'Yes');
    setAddAmFmRadio(info.amFmRadio || 'Yes');
    setAddRearParkingCamera(info.rearParkingCamera || 'Yes');
    setAddRegistrationPlace(info.registrationPlace || 'TS');
    setAddExchange(info.exchange || 'Yes');
    setAddFinance(info.finance || 'Yes');
    setAddSunroof(info.sunroof || 'Yes');
    setAddUsbCompatibility(info.usbCompatibility || 'Yes');

    const desc = car.description && car.description.includes('ADDITIONAL VEHICLE INFORMATION:') 
      ? car.description 
      : buildFormattedDescription(info, car.color || 'Blue');
    setCustomDescription(desc);
  };

  // ── Handle Buy & Publish with Full Editable Specs & Additional Info ───────
  const handlePurchaseAndPublish = async (e) => {
    e.preventDefault();
    if (!publishingCar || publishing) return;
    setPublishing(true);

    const carId = publishingCar.id || publishingCar._id;
    
    const additionalInfoObj = {
      abs: addAbs,
      adjustableSteering: addAdjustableSteering,
      alloyWheels: addAlloyWheels,
      antiTheftDevice: addAntiTheftDevice,
      auxCompatibility: addAuxCompatibility,
      bluetooth: addBluetooth,
      color: editColor || addColor,
      cruiseControl: addCruiseControl,
      insuranceType: addInsuranceType,
      makeMonth: addMakeMonth,
      navigationSystem: addNavigationSystem,
      parkingSensors: addParkingSensors,
      powerSteering: addPowerSteering,
      amFmRadio: addAmFmRadio,
      rearParkingCamera: addRearParkingCamera,
      registrationPlace: addRegistrationPlace,
      exchange: addExchange,
      finance: addFinance,
      sunroof: addSunroof,
      usbCompatibility: addUsbCompatibility
    };

    const finalDescription = customDescription.trim() || buildFormattedDescription(additionalInfoObj, editColor);

    const publishData = {
      purchasePriceByAdmin: purchasePrice,
      sellingPrice,
      rentalPricePerDay: rentalPrice,
      targetMarket,
      title: editTitle.trim(),
      brand: editBrand.trim(),
      model: editModel.trim(),
      year: parseInt(editYear) || 2023,
      engineCapacity: editEngineCapacity.trim(),
      kmDriven: parseInt(editKmDriven) || 20000,
      fuelType: editFuelType,
      transmission: editTransmission,
      color: editColor.trim(),
      noOfOwners: editNoOfOwners,
      licensePlate: editLicensePlate.trim(),
      vin: editVin.trim(),
      location: editLocation.trim(),
      address: editAddress.trim(),
      description: finalDescription,
      additionalInfo: additionalInfoObj
    };

    const statusMap = { buyer: 'for_sale', renter: 'for_rent', both: 'sale_and_rent' };
    const newStatus  = statusMap[targetMarket] || 'for_sale';
    const destLabel  = targetMarket === 'buyer'  ? 'Cars For Sale Marketplace'
                     : targetMarket === 'renter' ? 'Rental Fleet'
                     : 'Buyer Marketplace & Rental Fleet';

    try {
      const adminToken = sessionStorage.getItem('carhub_admin_token') || localStorage.getItem('carhub_admin_token');
      const res = await fetch(`/api/admin/purchase-and-publish/${carId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
        },
        body: JSON.stringify(publishData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error (HTTP ${res.status})`);
      }

      const result = await res.json();
      const confirmedCar = result.car;

      setAllCars(prev => prev.map(c => {
        const cId = c.id || String(c._id);
        const targetId = String(carId);
        if (cId !== targetId) return c;
        return {
          ...c,
          ...confirmedCar,
          ...publishData,
          status: newStatus,
          price: parseInt(sellingPrice) || c.price,
          rentalPricePerDay: parseInt(rentalPrice),
          purchasePriceByAdmin: parseInt(purchasePrice)
        };
      }));

      api.purchaseAndPublish(carId, publishData).catch(() => {});

      setPublishingCar(null);
      if (viewingCar && (viewingCar.id === carId || viewingCar._id === carId)) {
        setViewingCar(null);
      }
      showToast(`✅ Vehicle details updated & published to ${destLabel}!`, 'success');
      setTimeout(() => fetchData(true), 1500);

    } catch (err) {
      showToast(`Failed to publish: ${err.message}`, 'error');
    } finally {
      setPublishing(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const TabBtn = ({ id, label, icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={activeTab === id ? 'btn-primary' : 'btn-secondary'}
      style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span style={{
          background: activeTab === id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '2px 8px', fontSize: '0.78rem', fontWeight: '800'
        }}>{count}</span>
      )}
    </button>
  );

  const CarCardSale = ({ c }) => (
    <div key={c.id || c._id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <img
          src={c.images?.[0] || 'https://via.placeholder.com/320x160?text=No+Image'}
          alt={c.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }}
        />
        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '4px' }}>{c.title}</h4>
        <div style={{ fontSize: '0.88rem', color: '#10b981', fontWeight: '700' }}>
          Selling Price: ₹{(c.price || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Engine: {c.engineCapacity || '1.5L'} · {c.noOfOwners || '1st Owner'}
        </div>
        {c.status === 'sale_and_rent' && (
          <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700', marginTop: '4px', display: 'block' }}>
            Also listed for Rent
          </span>
        )}
      </div>

      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => openViewModal(c)}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="View Full Seller & Vehicle Details"
        >
          <Eye size={13} /> View
        </button>
        <button
          onClick={() => openPublishModal(c)}
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="Edit Specs & Additional Info"
        >
          <Settings size={13} /> Edit
        </button>
        <button
          onClick={() => handleDeleteCar(c.id || c._id, c.title)}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Permanently Delete Car from Database"
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );

  const CarCardRent = ({ c }) => {
    const isRented = (c.rentalStatus === 'RENTED' || c.isAvailable === false) ||
      rentalBookings.some(b => String(b.carId) === String(c.id || c._id) && (b.status || '').toLowerCase() === 'confirmed');

    return (
      <div key={c.id || c._id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative', border: isRented ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ position: 'relative' }}>
            <img
              src={c.images?.[0] || 'https://via.placeholder.com/320x160?text=No+Image'}
              alt={c.title}
              style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px', opacity: isRented ? 0.85 : 1 }}
            />
            <span style={{
              position: 'absolute', top: '10px', right: '10px',
              background: isRented ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
              color: '#fff', fontSize: '0.7rem', fontWeight: '800',
              padding: '3px 10px', borderRadius: '20px'
            }}>
              {isRented ? '🔒 RENTED OUT' : '✅ AVAILABLE'}
            </span>
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '4px' }}>{c.title}</h4>
          <div style={{ fontSize: '0.88rem', color: '#3b82f6', fontWeight: '700' }}>
            Rental Rate: ₹{(c.rentalPricePerDay || 0).toLocaleString()}/day
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Engine: {c.engineCapacity || '1.5L'} · {c.noOfOwners || '1st Owner'}
          </div>
          {c.status === 'sale_and_rent' && (
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700', marginTop: '4px', display: 'block' }}>
              Also listed For Sale
            </span>
          )}
        </div>

        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => openViewModal(c)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="View Full Seller & Vehicle Details"
          >
            <Eye size={13} /> View
          </button>
          <button
            onClick={() => openPublishModal(c)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Edit Specs & Additional Info"
          >
            <Settings size={13} /> Edit
          </button>
          <button
            onClick={() => handleDeleteCar(c.id || c._id, c.title)}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Permanently Delete Car from Database"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    );
  };


  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 'clamp(12px, 3vw, 20px)', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)', borderRadius: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#f59e0b" />
            <h2 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', fontWeight: '800' }}>Admin Command Center</h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Inspection Queue · Direct Buyouts · Marketplace Publishing · Live Communication
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          <button
            onClick={() => fetchData(true)}
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.8rem', minHeight: '36px' }}
            disabled={refreshing}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {onOpenAdminChat && (
            <button
              onClick={onOpenAdminChat}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '7px 14px', fontSize: '0.8rem', minHeight: '36px' }}
            >
              <MessageSquare size={16} /> Live Chat
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Pending Queue',    val: pendingCars.length,     color: '#f59e0b', icon: <Clock size={20} /> },
          { label: 'Cars For Sale',    val: carsForSale.length,     color: '#10b981', icon: <ShoppingBag size={20} /> },
          { label: 'Rental Fleet',     val: carsForRent.length,     color: '#3b82f6', icon: <Key size={20} /> },
          { label: 'Rental Requests',  val: pendingRentalCount,     color: '#ec4899', icon: <Calendar size={20} /> },
          { label: 'Inquiries & Chats',val: chatThreads.length,     color: '#8b5cf6', icon: <MessageSquare size={20} /> },
          { label: 'Total Inventory',  val: allCars.length,         color: '#a855f7', icon: <Car size={20} /> },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '6px', WebkitOverflowScrolling: 'touch' }}>
        <TabBtn id="pending"  label="Pending Inspections" icon={<Clock size={15} />}       count={pendingCars.length} />
        <TabBtn id="for_sale" label="Cars For Sale"        icon={<ShoppingBag size={15} />} count={carsForSale.length} />
        <TabBtn id="for_rent" label="Rental Fleet"         icon={<Key size={15} />}         count={carsForRent.length} />
        <TabBtn id="rentals"  label="Rental Bookings"      icon={<Calendar size={15} />}    count={pendingRentalCount} />
        <TabBtn id="chats"    label="Inquiries & Chats"    icon={<MessageSquare size={15} />} count={chatThreads.length} />
        <TabBtn id="users"    label="User Management"      icon={<Users size={15} />}       count={users.length} />
        <TabBtn id="reports"  label="Reports & Analytics"  icon={<BarChart3 size={15} />} />
      </div>

      {/* ── TAB: PENDING INSPECTIONS ──────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.82rem', lineHeight: 1.4 }}>
            ⚡ <strong>Admin Action Required:</strong> These cars were submitted by sellers with detailed specifications, location map markers, and 5 angle photos. Click <strong>View</strong> to inspect full details, <strong>AI Diagnostics</strong> for inspection scans, or <strong>Buy & Publish</strong> to make them live.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <p>Loading pending inspection queue…</p>
            </div>
          ) : pendingCars.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px' }}>
              <CheckCircle2 size={52} color="#10b981" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontWeight: '800', marginBottom: '8px' }}>Queue Clear!</h3>
              <p style={{ color: 'var(--text-muted)' }}>All submitted vehicles have been inspected and processed.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '20px' }}>
              {pendingCars.map(c => {
                const distNum = c.distanceKm || (c.distance ? parseInt(c.distance) : 6);
                return (
                  <div key={c.id || c._id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={c.images?.[0] || 'https://via.placeholder.com/340x170?text=No+Image'}
                          alt={c.title}
                          style={{ width: '100%', height: '175px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }}
                        />
                        <span style={{
                          position: 'absolute', top: '10px', right: '10px',
                          background: c.status === 'admin_inspected' ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)',
                          color: '#fff', fontSize: '0.7rem', fontWeight: '800',
                          padding: '3px 8px', borderRadius: '20px'
                        }}>
                          {c.status === 'admin_inspected' ? '✓ AI Scanned' : 'Awaiting Scan'}
                        </span>
                        <span style={{
                          position: 'absolute', bottom: '10px', left: '10px',
                          background: 'rgba(15,23,42,0.85)',
                          color: '#38bdf8', fontSize: '0.7rem', fontWeight: '700',
                          padding: '2px 8px', borderRadius: '6px', backdropFilter: 'blur(4px)'
                        }}>
                          📍 {distNum} km away
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{c.title}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 10px 0' }}>
                        Seller: <strong>{c.ownerName || c.sellerName}</strong> · Plate: {c.licensePlate}
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Seller Expected:</span>
                          <strong style={{ color: '#3b82f6' }}>₹{(c.sellerExpectedPrice || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          Engine: <strong>{c.engineCapacity || '1.5L'}</strong> · {c.noOfOwners || '1st Owner'} · {c.kmDriven?.toLocaleString()} km
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#f59e0b" />
                          <span>Doorstep: <strong>{c.location}</strong> ({c.address || 'Chennai'})</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <button
                        onClick={() => openViewModal(c)}
                        className="btn-secondary"
                        style={{ justifyContent: 'center', fontSize: '0.82rem', padding: '8px 6px' }}
                      >
                        <Eye size={14} /> View Details
                      </button>
                      <button
                        onClick={() => setInspectingCar(c)}
                        className="btn-secondary"
                        style={{ justifyContent: 'center', fontSize: '0.82rem', padding: '8px 6px', color: 'var(--accent-primary)' }}
                      >
                        <Sparkles size={14} /> AI Diagnostics
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openPublishModal(c)}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '9px 12px' }}
                      >
                        <DollarSign size={15} /> Buy & Publish
                      </button>
                      <button
                        onClick={() => handleDeleteCar(c.id || c._id, c.title)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Permanently Delete from Database"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CARS FOR SALE ────────────────────────────────────────── */}
      {activeTab === 'for_sale' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading…</div>
          ) : carsForSale.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <ShoppingBag size={52} color="#64748b" style={{ marginBottom: '12px' }} />
              <h3>No Cars Listed For Sale Yet</h3>
              <p style={{ color: 'var(--text-muted)' }}>Buy & Publish vehicles from the Pending Inspections tab to list them here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '20px' }}>
              {carsForSale.map(c => <CarCardSale key={c.id || c._id} c={c} />)}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RENTAL FLEET ─────────────────────────────────────────── */}
      {activeTab === 'for_rent' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading…</div>
          ) : carsForRent.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px' }}>
              <Key size={52} color="#64748b" style={{ marginBottom: '12px' }} />
              <h3>Rental Fleet is Empty</h3>
              <p style={{ color: 'var(--text-muted)' }}>Publish vehicles to the Rental Fleet via Buy & Publish.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '20px' }}>
              {carsForRent.map(c => <CarCardRent key={c.id || c._id} c={c} />)}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: INQUIRIES & CHATS PER CAR ────────────────────────────── */}
      {activeTab === 'chats' && (() => {
        // Distinct cars in threads
        const carOptions = Array.from(new Set(chatThreads.map(t => t.carId))).filter(Boolean);

        const filteredChatThreads = chatThreads.filter(t => {
          if (chatSearch.trim()) {
            const q = chatSearch.toLowerCase();
            const carMatch = (t.carTitle || '').toLowerCase().includes(q);
            const buyerMatch = (t.buyerName || '').toLowerCase().includes(q);
            const msgMatch = (t.lastMessage || '').toLowerCase().includes(q);
            if (!carMatch && !buyerMatch && !msgMatch) return false;
          }

          if (chatFilter === 'unread') {
            if ((t.unreadCount || 0) <= 0) return false;
          } else if (chatFilter === 'buyers') {
            if (t.buyerRole && t.buyerRole.toLowerCase().includes('seller')) return false;
          } else if (chatFilter === 'renters') {
            if (t.buyerRole && !t.buyerRole.toLowerCase().includes('renter')) return false;
          }

          if (chatCarSelect !== 'all' && String(t.carId) !== String(chatCarSelect)) {
            return false;
          }

          return true;
        });

        const unreadTotal = chatThreads.filter(t => (t.unreadCount || 0) > 0).length;

        return (
          <div>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', borderLeft: '4px solid #8b5cf6', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.86rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                💬 <strong>Customer Inquiry & WhatsApp Chat Center:</strong> Live inquiries sent by buyers for specific vehicles. View messages, filter by car or status, and reply directly in WhatsApp dark mode.
              </div>
              <button
                onClick={() => onOpenAdminChat && onOpenAdminChat()}
                className="btn-primary"
                style={{ background: '#00a884', borderColor: '#00a884', fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageSquare size={15} /> Launch WhatsApp Window
              </button>
            </div>

            {/* Inquiries Filter Bar */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All Inquiries (${chatThreads.length})` },
                  { id: 'unread', label: `🔴 Needs Reply (${unreadTotal})` },
                  { id: 'buyers', label: '👤 Buyer Inquiries' },
                  { id: 'renters', label: '🔑 Rental Inquiries' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setChatFilter(tab.id)}
                    style={{
                      background: chatFilter === tab.id ? '#8b5cf6' : 'var(--bg-secondary)',
                      color: chatFilter === tab.id ? '#fff' : 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: chatFilter === tab.id ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Car Dropdown */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search buyer or car..."
                    value={chatSearch}
                    onChange={e => setChatSearch(e.target.value)}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '7px 10px 7px 32px',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      outline: 'none',
                      minWidth: '180px'
                    }}
                  />
                  {chatSearch && (
                    <button onClick={() => setChatSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                <select
                  value={chatCarSelect}
                  onChange={e => setChatCarSelect(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">🚗 Filter by Car (All)</option>
                  {carOptions.map(cid => {
                    const sample = chatThreads.find(t => t.carId === cid);
                    return (
                      <option key={cid} value={cid}>{sample?.carTitle || cid}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Inquiries Cards Grid */}
            {filteredChatThreads.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
                <MessageSquare size={52} color="#8b5cf6" style={{ marginBottom: '12px', opacity: 0.7 }} />
                <h3 style={{ fontWeight: '800', marginBottom: '8px' }}>No Inquiries Match Filter</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  {chatThreads.length === 0
                    ? 'When buyers send inquiries from the marketplace, they will be categorized here.'
                    : 'Try clearing the search or switching filter tabs to view all inquiries.'}
                </p>
                {chatThreads.length > 0 && (
                  <button onClick={() => { setChatFilter('all'); setChatSearch(''); setChatCarSelect('all'); }} className="btn-secondary" style={{ marginTop: '12px' }}>
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {filteredChatThreads.map(t => {
                  const hasUnread = (t.unreadCount || 0) > 0;
                  return (
                    <div
                      key={t.threadId || t.carId}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: hasUnread ? '1px solid rgba(37, 211, 102, 0.5)' : '1px solid rgba(139, 92, 246, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: hasUnread ? '0 4px 20px rgba(37, 211, 102, 0.15)' : 'none'
                      }}
                    >
                      <div>
                        {/* Car Info Header */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
                          <img
                            src={t.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200'}
                            alt={t.carTitle}
                            style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.carTitle}
                              </h4>
                              {hasUnread && (
                                <span style={{ background: '#25d366', color: '#111b21', fontSize: '0.68rem', fontWeight: '800', padding: '2px 7px', borderRadius: '10px', flexShrink: 0, marginLeft: '6px' }}>
                                  {t.unreadCount} NEW
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                              {t.carPrice ? `₹${t.carPrice?.toLocaleString()}` : 'Price on Request'}
                            </div>
                          </div>
                        </div>

                        {/* Customer Info & Message Preview */}
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                👤 {t.buyerName || 'Buyer'}
                              </span>
                              {t.buyerRole && (
                                <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                  {t.buyerRole}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.82rem',
                            color: hasUnread ? 'var(--text-main)' : 'var(--text-muted)',
                            fontWeight: hasUnread ? '600' : '400',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            "{t.lastMessage}"
                          </p>
                        </div>
                      </div>

                      {/* Actions: Open WhatsApp Chat, Audio Call, Video Call */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onOpenAdminChat && onOpenAdminChat({ buyerId: t.buyerId, buyerName: t.buyerName, carId: t.carId, carTitle: t.carTitle })}
                          className="btn-primary"
                          style={{ flex: 2, justifyContent: 'center', fontSize: '0.82rem', padding: '8px 10px', background: '#00a884', borderColor: '#00a884', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <MessageSquare size={14} /> WhatsApp Chat
                        </button>
                        <button
                          onClick={() => onOpenAdminChat && onOpenAdminChat({ buyerId: t.buyerId, buyerName: t.buyerName, carId: t.carId, carTitle: t.carTitle, initialMode: 'audio' })}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '8px 10px', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
                          title="Start Audio Call"
                        >
                          <Phone size={14} /> Call
                        </button>
                        <button
                          onClick={() => onOpenAdminChat && onOpenAdminChat({ buyerId: t.buyerId, buyerName: t.buyerName, carId: t.carId, carTitle: t.carTitle, initialMode: 'video' })}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '8px 10px', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}
                          title="Start Video Call"
                        >
                          <Video size={14} /> Video
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── TAB: USER MANAGEMENT (CATEGORIZED LIST WITH DELETE) ───────── */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>Registered Platform Users</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                All buyers, sellers, renters, and administrator accounts connected to MongoDB.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Users' },
                { id: 'Buyer / Renter', label: 'Buyers & Renters' },
                { id: 'Seller', label: 'Sellers' },
                { id: 'Admin', label: 'Admins' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setUserFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: userFilter === f.id ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                    background: userFilter === f.id ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                    color: userFilter === f.id ? '#f59e0b' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search users by name, email or city..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* User List Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>User Details</th>
                  <th style={{ padding: '12px 8px' }}>Account Role</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => userFilter === 'all' || u.role === userFilter)
                  .filter(u => !userSearch || (u.name + u.email + (u.city || '')).toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => {
                    const uId = u.id || u._id;
                    const roleBadgeColor = 
                      u.role === 'Admin' ? '#f59e0b' :
                      u.role === 'Seller' ? '#3b82f6' : '#10b981';

                    return (
                      <tr key={uId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: `${roleBadgeColor}15`,
                            color: roleBadgeColor,
                            border: `1px solid ${roleBadgeColor}30`
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {u.city || 'Chennai, Tamil Nadu'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          {u.role !== 'Admin' && (
                            <button
                              onClick={() => handleDeleteUser(uId, u.name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Delete user account"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: RENTAL BOOKINGS ───────────────────────────────────────── */}
      {activeTab === 'rentals' && (
        <div>
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', borderLeft: '4px solid #ec4899', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
            📅 <strong>Rental Fleet Dispatch:</strong> Review customer reservation requests. Approving a booking reserves the vehicle and marks it as <strong>RENTED</strong> across buyer/renter search filters.
          </div>

          {rentalBookings.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <Calendar size={52} color="#ec4899" style={{ marginBottom: '12px' }} />
              <h3>No Rental Bookings Yet</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Customer rental bookings will show here with one-click approval workflows.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {rentalBookings.map(b => {
                const bId = b.id || b._id;
                const st = (b.status || 'pending').toLowerCase();
                const statusStyles = {
                  pending:   { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#f59e0b', label: 'Pending Approval' },
                  confirmed: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', text: '#10b981', label: 'Active Rental' },
                  rejected:  { bg: 'rgba(239,68,68,0.1)',  border: '#ef4444', text: '#ef4444', label: 'Rejected' },
                };
                const sc = statusStyles[st] || statusStyles.pending;

                return (
                  <div
                    key={bId}
                    className="glass-panel"
                    style={{
                      padding: '20px 24px',
                      borderRadius: '16px',
                      border: `1px solid ${sc.border}`,
                      background: sc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Calendar size={18} color="#3b82f6" />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>{b.carTitle || 'Vehicle'}</h4>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          padding: '2px 10px',
                          borderRadius: '20px',
                          background: 'transparent',
                          border: `1px solid ${sc.text}`,
                          color: sc.text
                        }}>
                          {sc.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <span>👤 <strong style={{ color: 'var(--text-main)' }}>{b.renterName || 'Customer'}</strong></span>
                        <span>📅 {b.startDate} → {b.endDate}</span>
                        <span>🗓️ {b.days || 1} Day{(b.days || 1) > 1 ? 's' : ''}</span>
                        <span>💰 <strong style={{ color: '#10b981' }}>₹{(b.totalCost || 0).toLocaleString()}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                      {st === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateRentalStatus(bId, 'confirmed')}
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                          >
                            <Check size={15} /> Approve
                          </button>
                          <button
                            onClick={() => handleUpdateRentalStatus(bId, 'rejected')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239,68,68,0.4)',
                              background: 'rgba(239,68,68,0.1)',
                              color: '#ef4444',
                              fontWeight: '700',
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </>
                      ) : (
                        <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {st === 'confirmed' ? '✅ Approved' : '❌ Rejected'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: REPORTS & ANALYTICS ──────────────────────────────────── */}
      {activeTab === 'reports' && reports && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '20px' }}>
            Financial & Fleet Performance Analytics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Buyout Capital Invested</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#f59e0b', marginTop: '6px' }}>
                ₹{(reports.totalCapitalSpent || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live Fleet Market Valuation</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', marginTop: '6px' }}>
                ₹{(reports.totalInventoryValue || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Vehicles Acquired</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#3b82f6', marginTop: '6px' }}>
                {reports.totalCars || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: VIEW FULL DETAILS MODAL (ALL SELLER DETAILS & IMAGES) ─ */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewingCar && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90dvh', overflowY: 'auto', padding: 'clamp(18px, 3vw, 30px)', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.3)', position: 'relative', overscrollBehavior: 'contain' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={20} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{viewingCar.title}</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Complete Seller Submission Details · Doorstep Address · 5 Angle Photos · AI Diagnostic Report
                </p>
              </div>
              <button 
                onClick={() => setViewingCar(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* ── Photo Gallery with 5 Angles & Thumbnails ── */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
                <img
                  src={viewingCar.images?.[activeViewImageIdx] || viewingCar.images?.[0] || 'https://via.placeholder.com/800x400?text=No+Photo'}
                  alt={`Car Photo ${activeViewImageIdx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', color: '#fff', fontWeight: '700' }}>
                  Photo {activeViewImageIdx + 1} of {viewingCar.images?.length || 1}
                </div>
              </div>

              {/* Thumbnails Row */}
              {viewingCar.images && viewingCar.images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {viewingCar.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveViewImageIdx(idx)}
                      style={{
                        width: '74px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: activeViewImageIdx === idx ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                        opacity: activeViewImageIdx === idx ? 1 : 0.65,
                        flexShrink: 0,
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={img} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section: Seller Profile & Inspection Location ── */}
            <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
                <MapPin size={16} /> 1. Seller & Inspection Doorstep Location
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Owner Full Name:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{viewingCar.ownerName || viewingCar.sellerName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Ownership History:</span>
                  <strong style={{ color: '#10b981' }}>{viewingCar.noOfOwners || '1st Owner'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Contact Phone:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{viewingCar.sellerPhone || '+91 9876543210'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Inspection City / Hub:</span>
                  <strong style={{ color: '#3b82f6' }}>{viewingCar.location || 'Chennai'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Street Address & Landmark:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{viewingCar.address || 'Chennai Doorstep Hub'}</strong>
                </div>
                {viewingCar.coordinates && (
                  <div style={{ gridColumn: 'span 2', fontSize: '0.78rem', color: '#60a5fa' }}>
                    📍 Map GPS Coordinates: Lat {viewingCar.coordinates.lat?.toFixed(4)}, Lng {viewingCar.coordinates.lng?.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section: Full Vehicle Specifications ── */}
            <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                <Car size={16} /> 2. Complete Vehicle Specifications & Financials
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Brand & Model:</span>
                  <strong>{viewingCar.brand} {viewingCar.model}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Manufacturing Year:</span>
                  <strong>{viewingCar.year}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Engine Capacity:</span>
                  <strong style={{ color: '#ec4899' }}>{viewingCar.engineCapacity || '1498 cc'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Fuel Type:</span>
                  <strong>{viewingCar.fuelType}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Transmission:</span>
                  <strong>{viewingCar.transmission}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Color:</span>
                  <strong>{viewingCar.color}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>KM Driven:</span>
                  <strong>{viewingCar.kmDriven?.toLocaleString()} km</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Fuel Mileage:</span>
                  <strong>{viewingCar.mileage || 16} KM/L</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Vehicle Condition:</span>
                  <strong style={{ color: '#10b981' }}>{viewingCar.condition || 'Very Good'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>License Plate Number:</span>
                  <strong>{viewingCar.licensePlate}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>VIN / Chassis:</span>
                  <strong>{viewingCar.vin}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Seller Expected Price:</span>
                  <strong style={{ color: '#3b82f6', fontSize: '1.05rem' }}>₹{(viewingCar.sellerExpectedPrice || 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* ── Section: AI Inspection Scan & Diagnostics ── */}
            {viewingCar.aiInspection && (
              <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                  <Sparkles size={16} /> 3. AI Computer Vision Inspection Diagnostics
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Damage Integrity Score</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>
                      {viewingCar.aiInspection.damageScore || 95}/100
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Blur Quality Check</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>
                      {viewingCar.aiInspection.blurPassed ? '✓ Passed' : 'Needs Review'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OCR License Match</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                      {viewingCar.aiInspection.ocrPlateDetected || viewingCar.licensePlate}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Detected Color</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                      {viewingCar.aiInspection.detectedColor || viewingCar.color}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Section: Additional Description / Information ── */}
            {viewingCar.description && (
              <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Vehicle Description & Structured Specs
                </h4>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit', 
                  fontSize: '0.82rem', 
                  color: 'var(--text-muted)', 
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  {viewingCar.description}
                </pre>
              </div>
            )}

            {/* ── Action Buttons inside View Modal ── */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const target = viewingCar;
                  setViewingCar(null);
                  setInspectingCar(target);
                }}
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                <Sparkles size={15} color="var(--accent-primary)" /> Run AI Scan
              </button>

              <button
                onClick={() => {
                  const target = viewingCar;
                  setViewingCar(null);
                  openPublishModal(target);
                }}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '10px 18px', fontSize: '0.85rem' }}
              >
                <DollarSign size={16} /> Buy & Publish
              </button>

              <button
                onClick={() => handleDeleteCar(viewingCar.id || viewingCar._id, viewingCar.title)}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: AI INSPECTOR SCAN MODAL ──────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {inspectingCar && (
        <div className="modal-overlay">
          <div style={{ width: '100%', maxWidth: '650px', maxHeight: '90dvh', overflowY: 'auto' }}>
            <AIInspector car={inspectingCar} />
            <button onClick={() => setInspectingCar(null)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
              Close AI Suite
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: ENHANCED BUY & PUBLISH MODAL (EDITING & STRUCTURED) ─ */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {publishingCar && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', maxHeight: '90dvh', overflowY: 'auto', padding: 'clamp(18px, 3vw, 30px)', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)', overscrollBehavior: 'contain' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>Confirm Buyout & Publish Vehicle</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Edit vehicle details, configure pricing, and add structured vehicle specifications before listing.
                </p>
              </div>
              <button onClick={() => setPublishingCar(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Navigation Tabs for Buyout Modal */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setPublishModalTab('pricing')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  border: publishModalTab === 'pricing' ? '1px solid #f59e0b' : '1px solid transparent',
                  background: publishModalTab === 'pricing' ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: publishModalTab === 'pricing' ? '#f59e0b' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                💰 1. Pricing & Destination
              </button>
              <button
                type="button"
                onClick={() => setPublishModalTab('specs')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  border: publishModalTab === 'specs' ? '1px solid #3b82f6' : '1px solid transparent',
                  background: publishModalTab === 'specs' ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: publishModalTab === 'specs' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                🚗 2. Core Specifications
              </button>
              <button
                type="button"
                onClick={() => setPublishModalTab('additional_info')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  border: publishModalTab === 'additional_info' ? '1px solid #10b981' : '1px solid transparent',
                  background: publishModalTab === 'additional_info' ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: publishModalTab === 'additional_info' ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                📋 3. Additional Vehicle Info (ABS, Sunroof, etc.)
              </button>
            </div>

            <form onSubmit={handlePurchaseAndPublish} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* ── TAB 1: PRICING & MARKETPLACE DESTINATION ── */}
              {publishModalTab === 'pricing' && (
                <div>
                  <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <label style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: '800', display: 'block', marginBottom: '10px' }}>
                      📍 Publish Destination
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {[
                        { val: 'buyer',  label: '🛒 Cars For Sale',   sub: 'Visible to Buyers' },
                        { val: 'renter', label: '🔑 Rental Fleet',    sub: 'Visible to Renters' },
                        { val: 'both',   label: '⚡ Both Portals',    sub: 'Sale + Rent' },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setTargetMarket(opt.val)}
                          style={{
                            flex: 1, minWidth: '130px', padding: '10px 12px', borderRadius: '10px',
                            border: targetMarket === opt.val ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                            background: targetMarket === opt.val ? 'rgba(245,158,11,0.15)' : 'var(--bg-secondary)',
                            color: targetMarket === opt.val ? '#f59e0b' : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', textAlign: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div>{opt.label}</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Purchase Price Paid to Seller (₹) *
                      </label>
                      <input
                        type="number" 
                        value={purchasePrice}
                        onChange={e => setPurchasePrice(e.target.value)}
                        required min="1"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                        Seller Expected: ₹{(publishingCar.sellerExpectedPrice || 0).toLocaleString()}
                      </span>
                    </div>

                    {(targetMarket === 'buyer' || targetMarket === 'both') && (
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Customer Selling Price (₹) *
                        </label>
                        <input
                          type="number" 
                          value={sellingPrice}
                          onChange={e => setSellingPrice(e.target.value)}
                          required min="1"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: '#10b981', fontSize: '0.95rem', fontWeight: '700' }}
                        />
                      </div>
                    )}

                    {(targetMarket === 'renter' || targetMarket === 'both') && (
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Rental Daily Rate (₹/day) *
                        </label>
                        <input
                          type="number" 
                          value={rentalPrice}
                          onChange={e => setRentalPrice(e.target.value)}
                          required min="100"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: '#3b82f6', fontSize: '0.95rem', fontWeight: '700' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 2: EDIT CORE VEHICLE SPECIFICATIONS ── */}
              {publishModalTab === 'specs' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Listing Title</label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Brand</label>
                    <input type="text" value={editBrand} onChange={e => setEditBrand(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Model</label>
                    <input type="text" value={editModel} onChange={e => setEditModel(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Manufacturing Year</label>
                    <input type="number" value={editYear} onChange={e => setEditYear(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Engine Capacity</label>
                    <input type="text" value={editEngineCapacity} onChange={e => setEditEngineCapacity(e.target.value)} placeholder="e.g. 1498 cc" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>KM Driven</label>
                    <input type="number" value={editKmDriven} onChange={e => setEditKmDriven(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Fuel Type</label>
                    <select value={editFuelType} onChange={e => setEditFuelType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="EV">EV (Electric)</option>
                      <option value="CNG">CNG</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Transmission</label>
                    <select value={editTransmission} onChange={e => setEditTransmission(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Vehicle Color</label>
                    <input type="text" value={editColor} onChange={e => { setEditColor(e.target.value); setAddColor(e.target.value); }} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ownership Count</label>
                    <select value={editNoOfOwners} onChange={e => setEditNoOfOwners(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                      <option value="1st Owner">1st Owner</option>
                      <option value="2nd Owner">2nd Owner</option>
                      <option value="3rd Owner">3rd Owner</option>
                      <option value="4th+ Owner">4th+ Owner</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>License Plate Number</label>
                    <input type="text" value={editLicensePlate} onChange={e => setEditLicensePlate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Location City</label>
                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                  </div>
                </div>
              )}

              {/* ── TAB 3: ADDITIONAL VEHICLE INFORMATION (STRUCTURED TOGGLES/DROPDOWNS) ── */}
              {publishModalTab === 'additional_info' && (
                <div>
                  <div style={{ background: 'rgba(16,185,129,0.08)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '16px', fontSize: '0.82rem' }}>
                    ✨ <strong>Structured Vehicle Information:</strong> Configure all standard automotive feature tags. These will format cleanly into the car's official certified description.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                    {[
                      { label: 'ABS', val: addAbs, set: setAddAbs },
                      { label: 'Adjustable Steering', val: addAdjustableSteering, set: setAddAdjustableSteering },
                      { label: 'Alloy Wheels', val: addAlloyWheels, set: setAddAlloyWheels },
                      { label: 'Anti Theft Device', val: addAntiTheftDevice, set: setAddAntiTheftDevice },
                      { label: 'Aux Compatibility', val: addAuxCompatibility, set: setAddAuxCompatibility },
                      { label: 'Bluetooth', val: addBluetooth, set: setAddBluetooth },
                      { label: 'Cruise Control', val: addCruiseControl, set: setAddCruiseControl },
                      { label: 'Navigation System', val: addNavigationSystem, set: setAddNavigationSystem },
                      { label: 'Parking Sensors', val: addParkingSensors, set: setAddParkingSensors },
                      { label: 'Power Steering', val: addPowerSteering, set: setAddPowerSteering },
                      { label: 'AM/FM Radio', val: addAmFmRadio, set: setAddAmFmRadio },
                      { label: 'Rear Parking Camera', val: addRearParkingCamera, set: setAddRearParkingCamera },
                      { label: 'Exchange Available', val: addExchange, set: setAddExchange },
                      { label: 'Finance Available', val: addFinance, set: setAddFinance },
                      { label: 'Sunroof', val: addSunroof, set: setAddSunroof },
                      { label: 'USB Compatibility', val: addUsbCompatibility, set: setAddUsbCompatibility }
                    ].map(field => (
                      <div key={field.label}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                          {field.label}
                        </label>
                        <select
                          value={field.val}
                          onChange={e => {
                            field.set(e.target.value);
                            const updated = {
                              abs: field.label === 'ABS' ? e.target.value : addAbs,
                              adjustableSteering: field.label === 'Adjustable Steering' ? e.target.value : addAdjustableSteering,
                              alloyWheels: field.label === 'Alloy Wheels' ? e.target.value : addAlloyWheels,
                              antiTheftDevice: field.label === 'Anti Theft Device' ? e.target.value : addAntiTheftDevice,
                              auxCompatibility: field.label === 'Aux Compatibility' ? e.target.value : addAuxCompatibility,
                              bluetooth: field.label === 'Bluetooth' ? e.target.value : addBluetooth,
                              color: editColor,
                              cruiseControl: field.label === 'Cruise Control' ? e.target.value : addCruiseControl,
                              insuranceType: addInsuranceType,
                              makeMonth: addMakeMonth,
                              navigationSystem: field.label === 'Navigation System' ? e.target.value : addNavigationSystem,
                              parkingSensors: field.label === 'Parking Sensors' ? e.target.value : addParkingSensors,
                              powerSteering: field.label === 'Power Steering' ? e.target.value : addPowerSteering,
                              amFmRadio: field.label === 'AM/FM Radio' ? e.target.value : addAmFmRadio,
                              rearParkingCamera: field.label === 'Rear Parking Camera' ? e.target.value : addRearParkingCamera,
                              registrationPlace: addRegistrationPlace,
                              exchange: field.label === 'Exchange Available' ? e.target.value : addExchange,
                              finance: field.label === 'Finance Available' ? e.target.value : addFinance,
                              sunroof: field.label === 'Sunroof' ? e.target.value : addSunroof,
                              usbCompatibility: field.label === 'USB Compatibility' ? e.target.value : addUsbCompatibility
                            };
                            setCustomDescription(buildFormattedDescription(updated, editColor));
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    ))}

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Insurance Type</label>
                      <select value={addInsuranceType} onChange={e => setAddInsuranceType(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                        <option value="Comprehensive">Comprehensive</option>
                        <option value="Third Party">Third Party</option>
                        <option value="Zero Depreciation">Zero Depreciation</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Make Month</label>
                      <select value={addMakeMonth} onChange={e => setAddMakeMonth(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Registration Place</label>
                      <input type="text" value={addRegistrationPlace} onChange={e => setAddRegistrationPlace(e.target.value)} placeholder="e.g. TS, TN, KA" style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.82rem' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Color</label>
                      <input type="text" value={addColor} onChange={e => { setAddColor(e.target.value); setEditColor(e.target.value); }} style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.82rem' }} />
                    </div>
                  </div>

                  {/* Formatted Description Editor */}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Formatted Certified Description (Editable)
                    </label>
                    <textarea
                      rows={9}
                      value={customDescription}
                      onChange={e => setCustomDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        lineHeight: 1.5
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPublishingCar(null)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={publishing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const carToDelete = publishingCar;
                    if (carToDelete) {
                      setPublishingCar(null);
                      handleDeleteCar(carToDelete.id || carToDelete._id, carToDelete.title);
                    }
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  disabled={publishing}
                >
                  <Trash2 size={16} /> Delete Vehicle
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 2, justifyContent: 'center',
                    background: publishing ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    cursor: publishing ? 'not-allowed' : 'pointer',
                    opacity: publishing ? 0.7 : 1
                  }}
                  disabled={publishing}
                >
                  {publishing ? (
                    <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</>
                  ) : (
                    <><DollarSign size={16} /> Confirm Buyout & Publish</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
