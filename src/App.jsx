import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Compass, User, MessageCircle, Menu, Bell, Users, LogOut, Globe, X, Check, AlertCircle, Briefcase, Search as SearchIcon } from 'lucide-react';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Connect from './pages/Connect';
import Trips from './pages/Trips';
import Search from './pages/Search';
import Auth from './pages/Auth';
import { TravelContext } from './context.jsx';

function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, setNotifications, setBuddies, setChats, currentUserEmail, userProfile, setRegisteredUsers, connectTravelBuddies } = React.useContext(TravelContext);

  const visibleNotifications = notifications.filter(n => n.receiverEmail === currentUserEmail);

  const handleAccept = (notif) => {
    // Handle Connect Request Notification Accept
    if (notif.type === 'connect_request') {
      // 1. Update the original notification's status to 'accepted' and mark read
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'accepted', read: true } : n));

      // 2. Add connect_accepted notification for the sender
      const acceptanceNotification = {
        id: `accept-${Date.now()}`,
        type: "connect_accepted",
        receiverEmail: notif.sender.email,
        sender: {
          name: userProfile.name,
          email: currentUserEmail,
          avatar: userProfile.avatar
        },
        status: "accepted",
        timestamp: "Just now",
        read: false
      };
      // We wrap the setter to preserve both the original update and the new notification
      setNotifications(prev => [acceptanceNotification, ...prev.map(n => n.id === notif.id ? { ...n, status: 'accepted', read: true } : n)]);

      // Add as travel buddies to BOTH users
      connectTravelBuddies(currentUserEmail, notif.sender.email, {
        id: Date.now(),
        name: userProfile.name,
        avatar: userProfile.avatar,
        location: userProfile.location || "Traveler",
        style: userProfile.styles?.[0] || "Explorer"
      }, {
        id: notif.sender.id,
        name: notif.sender.name,
        avatar: notif.sender.avatar,
        location: notif.sender.location || "Traveler",
        style: notif.sender.style || "Explorer"
      });

      // Create new chat thread
      setChats(prev => {
        const chatIndex = prev.findIndex(c => 
          c.participants.includes(currentUserEmail) && c.participants.includes(notif.sender.email)
        );

        const welcomeMsg = {
          id: Date.now(),
          senderEmail: currentUserEmail, // Sent by me (acceptor)
          text: `Hey! I accepted your connection request. Let's travel together!`
        };

        if (chatIndex !== -1) {
          return prev.map((c, idx) => idx === chatIndex ? {
            ...c,
            time: "Just now",
            unread: c.unread + 1,
            messages: [...c.messages, welcomeMsg]
          } : c);
        } else {
          return [{
            id: Date.now(),
            participants: [currentUserEmail, notif.sender.email],
            name: notif.sender.name,
            avatar: notif.sender.avatar,
            time: "Just now",
            unread: 1,
            active: false,
            messages: [welcomeMsg]
          }, ...prev];
        }
      });
      return;
    }

    // 1. Update notification status to accepted in context
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'accepted', read: true } : n));
    
    // 2. Push a new "request_accepted" notification for the sender of the request
    const acceptanceNotification = {
      id: `accept-${Date.now()}`,
      type: "request_accepted",
      receiverEmail: notif.sender.email, // Sent to the person who requested!
      sender: {
        name: userProfile.name, // The host who accepted
        email: currentUserEmail,
        avatar: userProfile.avatar
      },
      trip: {
        id: notif.trip.id,
        destination: notif.trip.destination
      },
      status: "accepted",
      timestamp: "Just now",
      read: false
    };
    setNotifications(prev => [acceptanceNotification, ...prev]);

    // 3. Add as travel buddies to BOTH users
    connectTravelBuddies(currentUserEmail, notif.sender.email, {
      id: Date.now(),
      name: userProfile.name,
      avatar: userProfile.avatar,
      location: userProfile.location || "Traveler",
      style: userProfile.styles?.[0] || "Explorer"
    }, {
      id: notif.sender.id,
      name: notif.sender.name,
      avatar: notif.sender.avatar,
      location: notif.sender.location || "Ahmedabad",
      style: notif.sender.style || "Foodie"
    });

    // 4. Create or append message thread using the new participants schema
    setChats(prev => {
      const chatIndex = prev.findIndex(c => 
        c.participants.includes(currentUserEmail) && c.participants.includes(notif.sender.email)
      );

      const welcomeMsg = {
        id: Date.now(),
        senderEmail: notif.sender.email, // Sent by the person who requested (Alex Chen / Neha Patel, etc.)
        text: `Hey! Thanks for accepting my request to join your trip to ${notif.trip.destination}. Let's coordinate details here.`
      };

      if (chatIndex !== -1) {
        return prev.map((c, idx) => idx === chatIndex ? {
          ...c,
          time: "Just now",
          unread: c.unread + 1,
          messages: [...c.messages, welcomeMsg]
        } : c);
      } else {
        return [{
          id: Date.now(),
          participants: [currentUserEmail, notif.sender.email],
          name: notif.sender.name,
          avatar: notif.sender.avatar,
          time: "Just now",
          unread: 1,
          active: false,
          messages: [welcomeMsg]
        }, ...prev];
      }
    });
  };

  const handleDecline = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'declined', read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => n.receiverEmail === currentUserEmail ? { ...n, read: true } : n));
  };

  return (
    <div className={`notif-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="notif-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <h2><Bell size={22} color="var(--primary)" /> Notifications</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {visibleNotifications.some(n => !n.read) && (
              <button 
                onClick={handleMarkAllRead} 
                style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
              >
                Mark all as read
              </button>
            )}
            <button className="close-modal" onClick={onClose} style={{ width: '32px', height: '32px', padding: 0 }}><X size={18} /></button>
          </div>
        </div>

        <div className="notif-body">
          {visibleNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ marginBottom: '1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
              <p>No notifications yet.</p>
            </div>
          ) : (
            visibleNotifications.map(notif => (
              <div key={notif.id} className={`notif-card ${!notif.read ? 'unread' : ''}`}>
                <div className="notif-user-info">
                  <img src={notif.sender.avatar} alt={notif.sender.name} className="notif-avatar" />
                  <div style={{ flex: 1 }}>
                    {notif.type === 'join_request' && (
                      <p className="notif-text">
                        <strong>{notif.sender.name}</strong> requested to join your trip to <strong>{notif.trip.destination}</strong>!
                      </p>
                    )}
                    {notif.type === 'connect_request' && (
                      <p className="notif-text">
                        <strong>{notif.sender.name}</strong> sent you a connection request!
                      </p>
                    )}
                    {notif.type === 'request_accepted' && (
                      <p className="notif-text">
                        <strong>{notif.sender.name}</strong> accepted your request to join their trip to <strong>{notif.trip.destination}</strong>!
                      </p>
                    )}
                    {notif.type === 'connect_accepted' && (
                      <p className="notif-text">
                        <strong>{notif.sender.name}</strong> accepted your connection request!
                      </p>
                    )}
                    <span className="notif-time">{notif.timestamp}</span>
                  </div>
                </div>

                {(notif.type === 'join_request' || notif.type === 'connect_request') && notif.status === 'pending' && (
                  <div className="notif-actions">
                    <button className="notif-btn notif-btn-accept" onClick={() => handleAccept(notif)}>
                      <Check size={16} /> Accept
                    </button>
                    <button className="notif-btn notif-btn-decline" onClick={() => handleDecline(notif)}>
                      <X size={16} /> Decline
                    </button>
                  </div>
                )}

                {(notif.type === 'join_request' || notif.type === 'connect_request') && notif.status === 'accepted' && (
                  <span className="notif-status-badge notif-status-accepted">
                    ✓ Request Approved
                  </span>
                )}

                {(notif.type === 'join_request' || notif.type === 'connect_request') && notif.status === 'declined' && (
                  <span className="notif-status-badge notif-status-declined">
                    ✕ Request Declined
                  </span>
                )}

                {(notif.type === 'request_accepted' || notif.type === 'connect_accepted') && (
                  <span className="notif-status-badge notif-status-accepted" style={{ background: 'rgba(0, 78, 137, 0.1)', color: 'var(--secondary)' }}>
                    Connected • Start chatting!
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ mobileOpen, setMobileOpen, notifOpen, setNotifOpen }) {
  const { userProfile, setIsAuthenticated, notifications, currentUserEmail } = React.useContext(TravelContext);
  const [showMenu, setShowMenu] = React.useState(false);
  
  const unreadCount = notifications.filter(n => n.receiverEmail === currentUserEmail && !n.read).length;

  const navItems = [
    { path: '/', label: 'Explore', icon: <Compass size={20} /> },
    { path: '/trips', label: 'Trips', icon: <Briefcase size={20} /> },
    { path: '/connect', label: 'Connect', icon: <Users size={20} /> },
    { path: '/search', label: 'Search', icon: <SearchIcon size={20} /> },
    { path: '/messages', label: 'Messages', icon: <MessageCircle size={20} /> },
    { path: '/profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <>
      <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="logo">
          <Globe size={28} color="var(--primary)" style={{ animation: 'spin 20s linear infinite' }} />
          Wander<span>Connect</span>
        </div>
        
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive && !notifOpen ? 'active' : ''}`}
              onClick={() => {
                setMobileOpen(false);
                setNotifOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ marginTop: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Desktop Sidebar Bell button */}
          <button 
            className={`nav-item ${notifOpen ? 'active' : ''}`}
            onClick={() => {
              setNotifOpen(!notifOpen);
              setMobileOpen(false);
            }}
            style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.65rem',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 0 0 2px var(--card-bg)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </div>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '0.5rem',
              background: 'var(--card-bg)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)',
              padding: '0.5rem',
              zIndex: 10,
              animation: 'fadeIn 0.2s ease'
            }}>
              <button 
                className="nav-item" 
                style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', color: 'var(--danger)', cursor: 'pointer', padding: '0.75rem', marginBottom: 0 }}
                onClick={() => setIsAuthenticated(false)}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          )}

          <div 
            className="sidebar-user" 
            style={{ marginTop: 0, cursor: 'pointer', padding: '1rem', borderRadius: 'var(--radius-md)', transition: 'background 0.2s ease', background: showMenu ? 'var(--background)' : 'transparent' }}
            onClick={() => setShowMenu(!showMenu)}
            title="Account Options"
          >
            <img src={userProfile.avatar} alt={userProfile.name} />
            <div className="user-info">
              <h4>{userProfile.name}</h4>
              <p>Trust Score: 98%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <button onClick={() => setMobileOpen(true)} className="btn-outline" style={{ border: 'none', padding: '0.5rem' }}>
          <Menu size={24} />
        </button>
        <div className="logo" style={{ marginBottom: 0, fontSize: '1.25rem' }}>
          Wander<span>Connect</span>
        </div>
        <button 
          onClick={() => setNotifOpen(true)} 
          className="btn-outline" 
          style={{ border: 'none', padding: '0.5rem', position: 'relative' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--primary)',
              color: 'white',
              fontSize: '0.65rem',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: '0 0 0 2px white'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

function App() {
  const { isAuthenticated } = React.useContext(TravelContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Auth page route */}
        <Route 
          path="/auth" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <div className="app-container">
                <Sidebar 
                  mobileOpen={mobileOpen} 
                  setMobileOpen={setMobileOpen} 
                  notifOpen={notifOpen} 
                  setNotifOpen={setNotifOpen} 
                />
                
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Feed />} />
                    <Route path="/trips" element={<Trips />} />
                    <Route path="/connect" element={<Connect />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/messages" element={<Messages />} />
                    {/* Fallback to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                {/* Global Slide-over Notification Centre */}
                <NotificationDrawer 
                  isOpen={notifOpen} 
                  onClose={() => setNotifOpen(false)} 
                />
              </div>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
