import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Send, 
  Phone, 
  Video, 
  X, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck, 
  UserCheck, 
  MessageSquare,
  Sparkles,
  Paperclip,
  Smile,
  Search,
  Check,
  CheckCheck,
  Pin,
  BellOff,
  Bell,
  ChevronDown,
  Car,
  MoreVertical,
  Volume2,
  ArrowLeft
} from 'lucide-react';

// Web Audio Call Sounds
function playCallSound(type = 'ring') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'ring') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {}
}

export default function AdminChat({ isOpen, onClose, targetCar, chatPartner, initialMode }) {
  const { user } = useAuth();
  
  const adminFromStorage = (() => {
    try {
      const s = sessionStorage.getItem('carhub_admin_user') || localStorage.getItem('carhub_admin_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  const isUserAdmin = (user?.role === 'Admin') ||
    !!adminFromStorage ||
    !!localStorage.getItem('carhub_admin_token') ||
    !!sessionStorage.getItem('carhub_admin_token') ||
    window.location.pathname.startsWith('/admin');

  const currentUserId = isUserAdmin 
    ? 'admin' 
    : (user ? (user.id || user._id || user.email) : 'usr-buyer');

  const currentUserName = isUserAdmin 
    ? (adminFromStorage?.name || user?.name || 'CarHub Admin') 
    : (user ? user.name : 'Customer');

  // ── Thread & Conversation State ──────────────────────────────────────────
  const [threads, setThreads] = useState([]);
  const [activeCarId, setActiveCarId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Unread' | 'Buyers' | 'Renters' | 'Cars' | 'Favourites'
  const [selectedCarFilter, setSelectedCarFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'unread' | 'replied'
  const [showNotifBanner, setShowNotifBanner] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [activeCall, setActiveCall] = useState(null); // 'audio' | 'video'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Load / Refresh Threads List ──────────────────────────────────────────
  const loadThreads = async () => {
    try {
      let data = [];
      if (isUserAdmin) {
        data = await api.getAdminChatThreads();
      } else {
        data = await api.getUserChatThreads(currentUserId);
      }

      if (Array.isArray(data)) {
        // If targetCar is passed and not in list, synthesize a thread for it
        if (targetCar && !data.find(t => String(t.carId) === String(targetCar.id || targetCar._id))) {
          const newThread = {
            threadId: String(targetCar.id || targetCar._id),
            carId: String(targetCar.id || targetCar._id),
            carTitle: targetCar.title || `${targetCar.brand} ${targetCar.model}`,
            carImage: (targetCar.images && targetCar.images[0]) || targetCar.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
            carPrice: targetCar.sellingPrice || targetCar.price || 0,
            buyerId: isUserAdmin ? (chatPartner?.buyerId || 'usr-buyer') : currentUserId,
            buyerName: isUserAdmin ? (chatPartner?.buyerName || 'Customer') : currentUserName,
            lastMessage: 'Tap to start discussion with Admin',
            lastMessageTime: new Date(),
            unreadCount: 0,
            isSeen: true
          };
          data.unshift(newThread);
        }
        setThreads(data);
      }
    } catch (e) {}
  };

  // ── Initialize Active Thread on Open or targetCar change ─────────────────
  useEffect(() => {
    if (!isOpen) return;

    loadThreads();

    if (targetCar) {
      const carId = String(targetCar.id || targetCar._id);
      setActiveCarId(carId);
      setActiveThread({
        carId: carId,
        carTitle: targetCar.title || `${targetCar.brand} ${targetCar.model}`,
        carImage: (targetCar.images && targetCar.images[0]) || targetCar.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
        carPrice: targetCar.sellingPrice || targetCar.price || 0,
        buyerId: isUserAdmin ? (chatPartner?.buyerId || 'usr-buyer') : currentUserId,
        buyerName: isUserAdmin ? (chatPartner?.buyerName || 'Customer') : currentUserName
      });
    } else if (chatPartner?.carId) {
      setActiveCarId(String(chatPartner.carId));
      setActiveThread({
        carId: String(chatPartner.carId),
        carTitle: chatPartner.carTitle || 'Certified Car Inquiry',
        carImage: chatPartner.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
        carPrice: chatPartner.carPrice || 0,
        buyerId: chatPartner.buyerId,
        buyerName: chatPartner.buyerName
      });
    }

    if (initialMode === 'audio' || initialMode === 'video') {
      startMediaCall(initialMode);
    }
  }, [isOpen, targetCar, chatPartner, initialMode, isUserAdmin, currentUserId]);

  // ── Auto select first thread if none active ──────────────────────────────
  useEffect(() => {
    if (!activeCarId && threads.length > 0) {
      const first = threads[0];
      setActiveCarId(first.carId);
      setActiveThread(first);
    }
  }, [threads, activeCarId]);

  // ── Load Messages for Active Thread & Mark Seen ──────────────────────────
  const loadActiveMessages = async () => {
    if (!isOpen || !activeCarId) return;

    try {
      const partnerId = isUserAdmin ? (activeThread?.buyerId || 'usr-buyer') : 'admin';
      const history = await api.getChatConversation(currentUserId, activeCarId, partnerId);

      if (Array.isArray(history) && history.length > 0) {
        setMessages(history.map(m => ({
          id: m.id || m._id || `${m.timestamp}-${Math.random()}`,
          senderId: m.senderId,
          senderName: m.senderName,
          senderRole: m.senderRole,
          recipientId: m.recipientId,
          text: m.text || m.message || '',
          carId: m.carId,
          carTitle: m.carTitle,
          isRead: m.isRead,
          timestamp: new Date(m.timestamp || m.createdAt || Date.now()),
          isCallNotification: m.isCallNotification,
          callType: m.callType
        })));
      } else {
        // Default initial message for this car
        setMessages([
          {
            id: 'init-1',
            senderId: 'admin',
            senderName: 'CarHub Admin',
            senderRole: 'Admin',
            recipientId: currentUserId,
            text: `Hello ${currentUserName}! Welcome to CarHub Official Admin Support. You are inquiring about "${activeThread?.carTitle || 'this vehicle'}". All our cars are 140-point inspected with doorstep test drive. How can we help you?`,
            carId: activeCarId,
            carTitle: activeThread?.carTitle || 'Certified Car',
            isRead: true,
            timestamp: new Date()
          }
        ]);
      }

      // Mark messages sent to me as seen in API
      api.markChatSeen({
        readerId: currentUserId,
        senderId: partnerId,
        carId: activeCarId
      });
    } catch (e) {}
  };

  useEffect(() => {
    loadActiveMessages();
  }, [activeCarId, isOpen]);

  // ── Real-Time Polling Interval (every 2.5 seconds) ───────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      loadActiveMessages();
      loadThreads();
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen, activeCarId]);

  // ── Scroll to bottom on new message ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Call Timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (activeCall) {
      timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // ── Send Message Handler ─────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeCarId) return;

    const userText = input.trim();
    const partnerId = isUserAdmin ? (activeThread?.buyerId || 'usr-buyer') : 'admin';

    const optimisticMsg = {
      id: `local-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: user?.role || (isUserAdmin ? 'Admin' : 'Buyer / Renter'),
      recipientId: partnerId,
      text: userText,
      carId: activeCarId,
      carTitle: activeThread?.carTitle || 'Certified Vehicle',
      carImage: activeThread?.carImage || '',
      carPrice: activeThread?.carPrice || 0,
      isRead: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');

    try {
      await api.sendChatMessage({
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: user?.role || (isUserAdmin ? 'Admin' : 'Buyer / Renter'),
        recipientId: partnerId,
        text: userText,
        carId: activeCarId,
        carTitle: activeThread?.carTitle || 'Certified Vehicle',
        carImage: activeThread?.carImage || '',
        carPrice: activeThread?.carPrice || 0
      });

      loadThreads();
    } catch (e) {}

    // Simulated instant reply from Admin if buyer chatting in standalone mode
    if (!isUserAdmin) {
      setTimeout(() => {
        setMessages(prev => {
          // Check if already replied
          if (prev.length > 0 && prev[prev.length - 1].senderId === 'admin') return prev;
          return [
            ...prev,
            {
              id: `admin-rep-${Date.now()}`,
              senderId: 'admin',
              senderName: 'CarHub Admin',
              senderRole: 'Admin',
              recipientId: currentUserId,
              text: `Thanks for asking about ${activeThread?.carTitle || 'the vehicle'}! Our inspection report and service logs are ready. Would you like to schedule a home test drive or speak on a quick call?`,
              carId: activeCarId,
              carTitle: activeThread?.carTitle || 'Certified Vehicle',
              isRead: true,
              timestamp: new Date()
            }
          ];
        });
      }, 1500);
    }
  };

  // ── Media Streaming Calls (Audio / Video) ────────────────────────────────
  const startMediaCall = async (mode) => {
    setMediaError('');
    setActiveCall(mode);
    playCallSound('ring');

    try {
      const constraints = mode === 'video' ? { audio: true, video: true } : { audio: true, video: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (localVideoRef.current && mode === 'video') {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      setMediaError('Microphone/Camera accessed in demo emulation mode.');
    }

    try {
      await api.sendChatMessage({
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: user?.role || (isUserAdmin ? 'Admin' : 'Buyer'),
        recipientId: isUserAdmin ? (activeThread?.buyerId || 'usr-buyer') : 'admin',
        text: `📞 Started a ${mode.toUpperCase()} call regarding ${activeThread?.carTitle || 'vehicle'}`,
        carId: activeCarId,
        carTitle: activeThread?.carTitle || 'Certified Vehicle',
        isCallNotification: true,
        callType: mode
      });
    } catch (e) {}
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const endCall = () => {
    playCallSound('end');
    stopMediaStream();
    setActiveCall(null);
    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `Call ended (${callDuration}s duration)`,
        timestamp: new Date(),
        isCallNotification: true,
        callType: 'none'
      }
    ]);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTimeStr = (dateObj) => {
    try {
      const d = new Date(dateObj);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    } catch (e) {
      return '';
    }
  };

  // Distinct cars for dropdown filter
  const distinctCarsInThreads = useMemo(() => {
    const map = new Map();
    threads.forEach(t => {
      if (t.carId && !map.has(t.carId)) {
        map.set(t.carId, t.carTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [threads]);

  // ── Filtered Threads List ────────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      // 1. Search query across title, buyer name, buyer email, message
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (t.carTitle || '').toLowerCase().includes(q);
        const buyerMatch = (t.buyerName || '').toLowerCase().includes(q);
        const buyerIdMatch = (t.buyerId || '').toLowerCase().includes(q);
        const msgMatch = (t.lastMessage || '').toLowerCase().includes(q);
        if (!titleMatch && !buyerMatch && !buyerIdMatch && !msgMatch) return false;
      }

      // 2. Tab Filter
      if (filterTab === 'Unread') {
        if ((t.unreadCount || 0) <= 0) return false;
      } else if (filterTab === 'Buyers') {
        if (t.buyerRole && t.buyerRole.toLowerCase().includes('seller')) return false;
      } else if (filterTab === 'Renters') {
        if (t.buyerRole && !t.buyerRole.toLowerCase().includes('renter')) return false;
      } else if (filterTab === 'Cars') {
        if (!t.carId || t.carId === 'general') return false;
      }

      // 3. Dropdown Car Filter
      if (selectedCarFilter !== 'all' && String(t.carId) !== String(selectedCarFilter)) {
        return false;
      }

      // 4. Dropdown Status Filter
      if (selectedStatusFilter === 'unread' && (t.unreadCount || 0) <= 0) {
        return false;
      }
      if (selectedStatusFilter === 'replied' && t.lastMessageSenderId !== 'admin') {
        return false;
      }

      return true;
    });
  }, [threads, searchQuery, filterTab, selectedCarFilter, selectedStatusFilter]);

  if (!isOpen) return null;

  const adminTabs = ['All', 'Unread', 'Buyers', 'Renters', 'Cars', 'Favourites'];
  const buyerTabs = ['All', 'Unread', 'Cars', 'Favourites'];
  const tabsToDisplay = isUserAdmin ? adminTabs : buyerTabs;

  return (
    <div className="modal-overlay">
      {/* ── Main WhatsApp Web Dark Container ────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: '1180px',
        height: '92dvh',
        maxHeight: '780px',
        display: 'flex',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
        background: '#111b21',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#e9edef',
        fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, sans-serif',
        overscrollBehavior: 'contain'
      }}>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── LEFT SIDEBAR (Car Chat Threads List) ─────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          width: isMobile ? '100%' : '380px',
          minWidth: isMobile ? '0' : '320px',
          borderRight: isMobile ? 'none' : '1px solid #222d34',
          display: (isMobile && showMobileChat) ? 'none' : 'flex',
          flexDirection: 'column',
          background: '#111b21'
        }}>

          {/* 1. Sidebar Top Header */}
          <div style={{
            height: '60px',
            background: '#202c33',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #222d34'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isUserAdmin ? '#7c3aed' : '#00a884',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '800'
              }}>
                {isUserAdmin ? <UserCheck size={20} /> : <ShieldCheck size={20} />}
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', lineHeight: 1.2 }}>
                  {isUserAdmin ? 'CarHub Admin Center' : 'CarHub Live Inquiries'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#8696a0' }}>
                  {isUserAdmin ? 'Customer Inquiries & WhatsApp Line' : 'Dedicated Vehicle Chats'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.72rem',
                background: '#00a884',
                color: '#111b21',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '800'
              }}>
                ONLINE
              </span>
            </div>
          </div>

          {/* 2. Notification Turn-On Ribbon (Matching Screenshot) */}
          {showNotifBanner && (
            <div style={{
              background: '#182229',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #222d34'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#00a884',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111b21'
                }}>
                  <BellOff size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                    Message notifications are off.
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#53bdeb', cursor: 'pointer', textDecoration: 'underline' }}>
                    Turn on desktop notifications
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowNotifBanner(false)}
                style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 3. Search Bar */}
          <div style={{ padding: '8px 12px 4px 12px', background: '#111b21' }}>
            <div style={{
              position: 'relative',
              background: '#202c33',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px'
            }}>
              <Search size={16} color="#8696a0" />
              <input
                type="text"
                placeholder={isUserAdmin ? "Search buyer, car name, message..." : "Search or start a new chat"}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e9edef',
                  fontSize: '0.84rem',
                  padding: '9px 10px'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 4. Filter Pills (All, Unread, Buyers, Renters, Cars, Favourites) */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '6px 12px 6px 12px',
            background: '#111b21',
            overflowX: 'auto'
          }}>
            {tabsToDisplay.map(tab => {
              const isActive = filterTab === tab;
              const unreadTotal = tab === 'Unread' ? threads.filter(t => t.unreadCount > 0).length : null;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  style={{
                    background: isActive ? '#00a884' : '#202c33',
                    color: isActive ? '#111b21' : '#8696a0',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? '800' : '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab}
                  {unreadTotal > 0 && (
                    <span style={{
                      background: isActive ? '#111b21' : '#25d366',
                      color: isActive ? '#25d366' : '#111b21',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '1px 5px'
                    }}>
                      {unreadTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 5. Additional Dropdown Filters for Admin */}
          {isUserAdmin && (
            <div style={{
              display: 'flex',
              gap: '6px',
              padding: '2px 12px 8px 12px',
              background: '#111b21',
              borderBottom: '1px solid #222d34'
            }}>
              <select
                value={selectedCarFilter}
                onChange={e => setSelectedCarFilter(e.target.value)}
                style={{
                  flex: 1,
                  background: '#202c33',
                  color: '#8696a0',
                  border: '1px solid #2a3942',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  fontSize: '0.72rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">🚗 All Cars ({threads.length})</option>
                {distinctCarsInThreads.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                style={{
                  flex: 1,
                  background: '#202c33',
                  color: '#8696a0',
                  border: '1px solid #2a3942',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  fontSize: '0.72rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">⚡ All Status</option>
                <option value="unread">🔴 Needs Reply ({threads.filter(t => t.unreadCount > 0).length})</option>
                <option value="replied">✓ Replied</option>
              </select>
            </div>
          )}

          {/* 6. Car Threads Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredThreads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8696a0', fontSize: '0.88rem' }}>
                <Car size={34} style={{ marginBottom: '10px', opacity: 0.6 }} />
                <div>No chats found for this filter</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  {isUserAdmin ? 'Buyer inquiries will appear here automatically' : 'Click "Enquire Admin" on any car to start chatting'}
                </div>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const isSelected = String(thread.carId) === String(activeCarId);
                const hasUnread = (thread.unreadCount || 0) > 0;

                return (
                  <div
                    key={thread.threadId || thread.carId}
                    onClick={() => {
                      setActiveCarId(String(thread.carId));
                      setActiveThread(thread);
                      setShowMobileChat(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      background: isSelected ? '#2a3942' : 'transparent',
                      borderBottom: '1px solid #222d34',
                      transition: 'background 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#202c33'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Car Thumbnail Avatar as Profile */}
                    <div style={{ position: 'relative', marginRight: '12px' }}>
                      <img
                        src={thread.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200'}
                        alt={isUserAdmin ? (thread.buyerName || 'Buyer Profile') : thread.carTitle}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isSelected ? '2px solid #00a884' : hasUnread ? '2px solid #25d366' : '1px solid rgba(255,255,255,0.15)'
                        }}
                      />
                      {hasUnread && (
                        <span style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          background: '#25d366',
                          border: '2px solid #111b21'
                        }} />
                      )}
                    </div>

                    {/* Thread Text Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name Line: Buyer Name for Admin, Car Title for Buyer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '0.94rem',
                            fontWeight: hasUnread ? '800' : '700',
                            margin: 0,
                            color: '#e9edef',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {isUserAdmin ? (thread.buyerName || 'Customer') : thread.carTitle}
                          </h4>
                          {isUserAdmin && thread.buyerRole && (
                            <span style={{ background: 'rgba(59,130,246,0.18)', color: '#93c5fd', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem', flexShrink: 0 }}>
                              {thread.buyerRole}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: hasUnread ? '#25d366' : isSelected ? '#00a884' : '#8696a0', flexShrink: 0, marginLeft: '6px' }}>
                          {formatTimeStr(thread.lastMessageTime)}
                        </span>
                      </div>

                      {/* Subtitle Line: Car Title & Price for Admin */}
                      {isUserAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '2px' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                            🚗 {thread.carTitle}
                          </span>
                          {thread.carPrice ? (
                            <span style={{ color: '#10b981', fontWeight: '700', flexShrink: 0 }}>
                              ₹{(thread.carPrice / 100000).toFixed(1)}L
                            </span>
                          ) : null}
                        </div>
                      )}

                      {/* Last message preview */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          fontSize: '0.78rem',
                          color: hasUnread ? '#e9edef' : '#8696a0',
                          fontWeight: hasUnread ? '600' : '400',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {/* Seen Indicator Blue Ticks (matching WhatsApp) */}
                          {thread.isSeen !== false ? (
                            <CheckCheck size={13} color="#53bdeb" />
                          ) : (
                            <Check size={13} color="#8696a0" />
                          )}
                          <span>
                            {thread.lastMessageSenderId === 'admin' ? 'You: ' : isUserAdmin && thread.buyerName ? `${thread.buyerName.split(' ')[0]}: ` : ''}
                            {thread.lastMessage || 'Vehicle inquiry active'}
                          </span>
                        </div>

                        {/* Unread badge or pin */}
                        {thread.unreadCount > 0 ? (
                          <span style={{
                            background: '#25d366',
                            color: '#111b21',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            borderRadius: '50%',
                            minWidth: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                            marginLeft: '6px'
                          }}>
                            {thread.unreadCount}
                          </span>
                        ) : (
                          <Pin size={12} color="#8696a0" style={{ marginLeft: '6px', opacity: isSelected ? 1 : 0.4 }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── RIGHT MAIN CONVERSATION PANEL ────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          display: (isMobile && !showMobileChat) ? 'none' : 'flex',
          flexDirection: 'column',
          background: '#0b141a',
          position: 'relative'
        }}>

          {/* 1. Chat Header Bar */}
          <div style={{
            height: '60px',
            background: '#202c33',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #222d34',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {isMobile && (
                <button 
                  onClick={() => setShowMobileChat(false)}
                  style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  title="Back to conversation list"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {activeThread?.carImage && (
                <img
                  src={activeThread.carImage}
                  alt={isUserAdmin ? (activeThread.buyerName || 'Buyer') : activeThread.carTitle}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                {/* Header Name: Buyer Name for Admin, Car Title for Buyer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '800',
                    margin: 0,
                    color: '#e9edef',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {isUserAdmin ? (activeThread?.buyerName || 'Customer') : (activeThread?.carTitle || 'Certified Car Inquiry')}
                  </h3>
                  {isUserAdmin && activeThread?.buyerRole && (
                    <span style={{ background: 'rgba(59,130,246,0.18)', color: '#93c5fd', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '600' }}>
                      {activeThread.buyerRole}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.74rem', color: '#8696a0', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  {isUserAdmin ? (
                    <>
                      <span style={{ color: '#38bdf8', fontWeight: '600' }}>🚗 {activeThread?.carTitle}</span>
                      {activeThread?.carPrice ? (
                        <>
                          <span>•</span>
                          <span style={{ color: '#10b981', fontWeight: '700' }}>₹{activeThread.carPrice?.toLocaleString()}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {activeThread?.carPrice ? (
                        <span style={{ color: '#10b981', fontWeight: '700' }}>₹{activeThread.carPrice?.toLocaleString()}</span>
                      ) : null}
                      <span>•</span>
                      <span>CarHub Official Support</span>
                    </>
                  )}
                  <span>•</span>
                  <span style={{ color: '#53bdeb' }}>140-Point Verified</span>
                </div>
              </div>
            </div>

            {/* Right Action Icons (Audio Call, Video Call, Close) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => startMediaCall('audio')}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid #3b82f6',
                  color: '#60a5fa',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700'
                }}
                title="Start Audio Call"
              >
                <Phone size={15} /> Audio Call
              </button>

              <button
                onClick={() => startMediaCall('video')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700'
                }}
                title="Start Video Call"
              >
                <Video size={15} /> Video Call
              </button>

              <button
                onClick={() => { stopMediaStream(); onClose(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  cursor: 'pointer',
                  padding: '6px'
                }}
                title="Close Chat Window"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* 2. Active Audio / Video Call Overlay */}
          {activeCall && (
            <div style={{
              background: '#182229',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #222d34',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: activeCall === 'video' ? '#10b981' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  {activeCall === 'video' ? <Video size={18} /> : <Phone size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#e9edef' }}>
                    Live {activeCall.toUpperCase()} Consultation in Progress
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#00a884', fontWeight: '700' }}>
                    ⏱️ {formatTimer(callDuration)} • Connected with {isUserAdmin ? activeThread?.buyerName : 'Admin'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    background: isMuted ? '#ef4444' : '#202c33',
                    border: 'none',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                {activeCall === 'video' && (
                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    style={{
                      background: isVideoOff ? '#ef4444' : '#202c33',
                      border: 'none',
                      color: '#fff',
                      padding: '8px',
                      borderRadius: '50%',
                      cursor: 'pointer'
                    }}
                  >
                    {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                  </button>
                )}

                <button
                  onClick={endCall}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    fontSize: '0.8rem'
                  }}
                >
                  <PhoneOff size={16} /> End Call
                </button>
              </div>
            </div>
          )}

          {/* 3. Messages Stream (WhatsApp Wallpaper Pattern) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(32, 44, 51, 0.4) 0%, rgba(11, 20, 26, 0.95) 100%)`,
            backgroundSize: 'cover'
          }}>
            {/* WhatsApp Date Separator (Today) */}
            <div style={{ alignSelf: 'center', margin: '4px 0 10px 0' }}>
              <span style={{
                background: '#182229',
                color: '#8696a0',
                fontSize: '0.74rem',
                fontWeight: '600',
                padding: '5px 12px',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                Today
              </span>
            </div>

            {/* Target Car Ribbon Card Inside Chat */}
            {activeThread && (
              <div style={{
                alignSelf: 'center',
                maxWidth: '460px',
                width: '100%',
                background: 'rgba(32, 44, 51, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '10px'
              }}>
                <img
                  src={activeThread.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200'}
                  alt={activeThread.carTitle}
                  style={{ width: '60px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#00a884', fontWeight: '800' }}>
                    OFFICIAL VEHICLE INQUIRY
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#e9edef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeThread.carTitle}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8696a0' }}>
                    Price: <strong style={{ color: '#10b981' }}>₹{activeThread.carPrice?.toLocaleString()}</strong> · Direct CarHub Assurance
                  </div>
                </div>
              </div>
            )}

            {/* Messages Bubbles */}
            {messages.map((m, idx) => {
              const isMe = m.senderId === currentUserId;
              const isSys = m.senderId === 'system' || m.isCallNotification;

              if (isSys) {
                return (
                  <div key={m.id || idx} style={{ alignSelf: 'center', margin: '6px 0' }}>
                    <span style={{
                      background: '#182229',
                      color: '#8696a0',
                      fontSize: '0.76rem',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      📞 {m.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={m.id || idx}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '68%',
                    minWidth: '120px',
                    background: isMe ? '#005c4b' : '#202c33',
                    color: '#e9edef',
                    padding: '8px 12px 6px 12px',
                    borderRadius: isMe ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                    fontSize: '0.88rem',
                    lineHeight: 1.4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    position: 'relative',
                    wordBreak: 'break-word'
                  }}
                >
                  {/* Sender Name for Multi-user context */}
                  {!isMe && (
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: isUserAdmin ? '#53bdeb' : '#25d366',
                      marginBottom: '2px'
                    }}>
                      {m.senderName || 'CarHub Admin'}
                    </div>
                  )}

                  {/* Message Body */}
                  <div>{m.text}</div>

                  {/* Timestamp & Double Blue Ticks (Matching Screenshot) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    fontSize: '0.68rem',
                    color: '#8696a0',
                    marginTop: '2px'
                  }}>
                    <span>{formatTimeStr(m.timestamp)}</span>
                    {isMe && (
                      <CheckCheck size={14} color="#53bdeb" />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 4. Bottom WhatsApp Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              height: '62px',
              background: '#202c33',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderTop: '1px solid #222d34'
            }}
          >
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}
              title="Emoji"
            >
              <Smile size={22} />
            </button>

            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}
              title="Attach Document / Inspection Photo"
              onClick={() => setInput(prev => `${prev} [CarHub Inspection Report Attached]`)}
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              placeholder="Type a message"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1,
                background: '#2a3942',
                border: 'none',
                outline: 'none',
                borderRadius: '8px',
                padding: '11px 16px',
                color: '#e9edef',
                fontSize: '0.9rem'
              }}
            />

            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                background: '#00a884',
                border: 'none',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111b21',
                cursor: input.trim() ? 'pointer' : 'default',
                opacity: input.trim() ? 1 : 0.6,
                transition: 'opacity 0.2s ease'
              }}
              title="Send Message"
            >
              <Send size={18} />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
