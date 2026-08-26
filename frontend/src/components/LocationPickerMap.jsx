import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, CheckCircle2, Crosshair } from 'lucide-react';

// Custom Pin Icon using L.divIcon for modern SVG styling without broken bundle paths
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-19px, -38px);
      ">
        <div style="
          position: absolute;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.35);
          animation: mapPinPulse 2s infinite ease-out;
        "></div>
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
      <style>
        @keyframes mapPinPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38]
  });
};

const CITY_PRESETS = [
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Salem', lat: 11.6643, lng: 78.1460 },
  { name: 'Trichy', lat: 10.7905, lng: 78.7047 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 }
];

export default function LocationPickerMap({ 
  location, 
  onLocationChange, 
  address, 
  onAddressChange, 
  coordinates, 
  onCoordinatesChange 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [markedInfo, setMarkedInfo] = useState({
    lat: coordinates?.lat || 13.0827,
    lng: coordinates?.lng || 80.2707,
    formatted: address || location || 'Chennai, Tamil Nadu'
  });

  // Reverse geocoding helper using OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.county || data.address?.state_district || 'Chennai';
        const fullAddress = data.display_name || `${city}, Tamil Nadu`;
        
        setMarkedInfo({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
          formatted: fullAddress
        });

        if (onLocationChange && (!location || location === 'Chennai')) {
          onLocationChange(city);
        }
        if (onAddressChange && !address) {
          onAddressChange(fullAddress);
        }
      }
    } catch (e) {
      console.warn('Geocoding notice:', e.message);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = coordinates?.lat || 13.0827;
    const initialLng = coordinates?.lng || 80.2707;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const pinIcon = createCustomPinIcon();
    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    // Marker drag end event
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      onCoordinatesChange({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) });
      reverseGeocode(lat, lng);
    });

    // Map click event
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onCoordinatesChange({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) });
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when coordinates prop changes externally
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng && mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - coordinates.lat) > 0.0001 || Math.abs(currentPos.lng - coordinates.lng) > 0.0001) {
        markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
        mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 14);
        setMarkedInfo(prev => ({
          ...prev,
          lat: coordinates.lat,
          lng: coordinates.lng
        }));
      }
    }
  }, [coordinates]);

  // Search Address or Area
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const query = encodeURIComponent(searchQuery.trim() + ', Tamil Nadu, India');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const foundName = data[0].display_name;

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1.2 });
            markerRef.current.setLatLng([lat, lon]);
          }

          onCoordinatesChange({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lon.toFixed(5)) });
          onLocationChange(searchQuery.trim());
          if (!address) onAddressChange(foundName);
          setMarkedInfo({
            lat: parseFloat(lat.toFixed(5)),
            lng: parseFloat(lon.toFixed(5)),
            formatted: foundName
          });
        } else {
          alert('Location not found. Please click directly on the map to place your pin marker.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // HTML5 GPS Geolocation
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
        }
        onCoordinatesChange({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) });
        reverseGeocode(lat, lng);
        setLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocatingUser(false);
        alert('Could not access current GPS location. Please choose a city preset or click anywhere on the map.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectCityPreset = (city) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 13, { duration: 1 });
      markerRef.current.setLatLng([city.lat, city.lng]);
    }
    onCoordinatesChange({ lat: city.lat, lng: city.lng });
    onLocationChange(city.name);
    reverseGeocode(city.lat, city.lng);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <MapPin size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>
              Vehicle Inspection Location (Interactive Map Marker)
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Click anywhere on the map or drag the pin to mark vehicle doorstep inspection point.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetDeviceLocation}
          disabled={locatingUser}
          style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent-primary)',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Crosshair size={14} />
          {locatingUser ? 'Locating GPS...' : 'Use My Current Location'}
        </button>
      </div>

      {/* Search & City Preset Quick Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="Search area, landmark or street (e.g. Anna Nagar, Chennai)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchLocation(e); } }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.82rem'
            }}
          />
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={isSearching}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            <Search size={14} /> {isSearching ? 'Searching...' : 'Find'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {CITY_PRESETS.slice(0, 5).map(c => (
            <button
              key={c.name}
              type="button"
              onClick={() => handleSelectCityPreset(c)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: location === c.name ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-main)',
                color: location === c.name ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div 
        ref={mapContainerRef} 
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 1
        }}
      />

      {/* Coordinate & Live Marked Info Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-main)',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span>
            Pin Set: <strong style={{ color: 'var(--text-main)' }}>{coordinates?.lat?.toFixed(4)}, {coordinates?.lng?.toFixed(4)}</strong>
          </span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          📍 Doorstep Inspection Region: <strong style={{ color: '#60a5fa' }}>{location || 'Chennai'}</strong>
        </div>
      </div>
    </div>
  );
}
