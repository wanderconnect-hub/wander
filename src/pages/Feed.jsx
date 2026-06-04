import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle, Plus, Image as ImageIcon, UserPlus, Clock, Trash2, MoreVertical } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';
import { getFallbackAvatar } from '../utils/avatars';

export default function Feed() {
  const { userProfile, currentUserEmail, currentUserId, trips, setTrips, loading, notifications, setNotifications, setBuddies, chats, setChats, fetchSupabaseNotifications, deleteTrip } = useContext(TravelContext);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [sendingTripIds, setSendingTripIds] = useState(new Set());
  const [posting, setPosting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClose = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);
  
  const filters = ['All', 'Adventure', 'Culture', 'Relaxation', 'Hiking'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handlePostTrip = async (e) => {
    e.preventDefault();
    if (posting) return;
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("You must be logged in to post a trip.", "error");
        return;
      }

      const startDateVal = e.target.startDate.value;
      const endDateVal = e.target.endDate.value;

      if (new Date(startDateVal) > new Date(endDateVal)) {
        showToast("End date cannot be before start date.", "error");
        return;
      }

      const formatDateRange = (startStr, endStr) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const options = { month: 'short', day: 'numeric' };
        const startFormatted = start.toLocaleDateString('en-US', options);
        const endFormatted = end.toLocaleDateString('en-US', options);
        
        if (start.getFullYear() === end.getFullYear()) {
          return `${startFormatted} - ${endFormatted}`;
        }
        return `${startFormatted}, ${start.getFullYear()} - ${endFormatted}, ${end.getFullYear()}`;
      };

      const dateStr = formatDateRange(startDateVal, endDateVal);

      const tripData = {
        destination: e.target.destination.value,
        date: dateStr,
        budget: e.target.budget.value,
        description: e.target.description.value,
        category: e.target.category.value,
        image: imagePreview || "https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        host_id: user.id
      };

      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select('*, host:profiles(*)')
        .single();

      if (error) {
        console.error("Error inserting trip into Supabase:", error.message);
        showToast("Failed to post trip to database.", "error");
        return;
      }

      if (data) {
        const formattedTrip = {
          id: data.id,
          destination: data.destination,
          date: data.date,
          budget: data.budget,
          description: data.description,
          category: data.category,
          image: data.image,
          created_at: data.created_at || new Date().toISOString(),
          host: {
            id: data.host?.id || data.host_id || user.id,
            name: data.host?.name || userProfile.name,
            email: data.host?.email || currentUserEmail,
            gender: data.host?.gender || userProfile.gender,
            verified: true,
            avatar: data.host?.avatar || userProfile.avatar
          }
        };

        setTrips([formattedTrip, ...trips]);
        setIsModalOpen(false);
        setImagePreview(null);
        e.target.reset();
        showToast("Successfully posted your new trip!");
      }
    } catch (err) {
      console.error("Post trip exception:", err);
      showToast("Something went wrong.", "error");
    } finally {
      setPosting(false);
    }
  };

  const handleRequestToJoin = async (trip) => {
    if (sendingTripIds.has(trip.id)) return;
    setSendingTripIds(prev => {
      const next = new Set(prev);
      next.add(trip.id);
      return next;
    });

    const hostEmail = trip.host?.email;
    const hostName = trip.host?.name || "Host";

    const isSupabaseTrip = typeof trip.id === 'string' && trip.id.length > 20;
    const isSupabaseSender = currentUserId && typeof currentUserId === 'string' && currentUserId.length > 20;
    const hostId = trip.host?.id;

    try {
      if (isSupabaseTrip && isSupabaseSender && hostId) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            type: 'join_request',
            sender_id: currentUserId,
            receiver_id: hostId,
            trip_id: trip.id,
            status: 'pending',
            read: false
          });
        if (error) {
          console.error("Error inserting join_request in Supabase:", error);
          setSendingTripIds(prev => {
            const next = new Set(prev);
            next.delete(trip.id);
            return next;
          });
          return;
        } else {
          await fetchSupabaseNotifications();
        }
      } else {
        const newRequest = {
          id: `req-${Date.now()}`,
          type: "join_request",
          receiverEmail: hostEmail,
          sender: {
            name: userProfile.name,
            email: currentUserEmail,
            avatar: userProfile.avatar,
            location: "Local Traveler",
            style: userProfile.styles?.[0] || "Explorer"
          },
          trip: {
            id: trip.id,
            destination: trip.destination,
            hostEmail: hostEmail
          },
          status: "pending",
          timestamp: "Just now",
          read: false
        };

        setNotifications(prev => [newRequest, ...prev]);
      }
      showToast(`Join request sent to ${hostName}!`, 'info');
    } catch (e) {
      console.error(e);
      setSendingTripIds(prev => {
        const next = new Set(prev);
        next.delete(trip.id);
        return next;
      });
    }
  };

  const getRequestStatus = (tripId) => {
    const req = notifications.find(
      n => n.type === 'join_request' && n.sender?.email === currentUserEmail && n.trip?.id === tripId
    );
    return req ? req.status : null;
  };

  // Helper to parse end date from the trip date string
  const getTripEndDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    const endPart = parts[parts.length - 1].trim();
    const yearMatch = endPart.match(/\b\d{4,}\b/);
    let year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
    let cleanDateStr = endPart.replace(/,?\s*\b\d{4,}\b/, '').trim();
    if (/^\d+$/.test(cleanDateStr) && parts.length > 1) {
      const startPart = parts[0].trim();
      const monthMatch = startPart.match(/^[a-zA-Z]+/);
      if (monthMatch) {
        cleanDateStr = `${monthMatch[0]} ${cleanDateStr}`;
      }
    }
    const parsed = new Date(`${cleanDateStr} ${year}`);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(23, 59, 59, 999);
      return parsed;
    }
    return new Date();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredTrips = trips.filter(trip => {
    const isPast = getTripEndDate(trip.date) < today;
    if (isPast) return false;
    return activeFilter === 'All' || trip.category === activeFilter;
  });

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Visual Toast Notification Banner */}
      {toast && (
        <div 
          className="toast-banner"
          style={{
            background: toast.type === 'success' ? 'var(--success)' : toast.type === 'info' ? 'var(--secondary)' : 'var(--accent)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={20} /> : <Clock size={20} />}
          <span style={{ fontWeight: '600' }}>{toast.message}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-title">
          <h1 className="page-title">Discover Trips</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Find trusted companions for your next adventure</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Post Trip
        </button>
      </div>

      <div className="filters-bar">
        {filters.map(filter => (
          <button 
            key={filter} 
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '5px solid var(--border-color)',
            borderTop: '5px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem'
          }}></div>
          <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Discovering trips in your area...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>No trips in this category yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Be the first one to post a trip for {activeFilter}!</p>
          <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Post Trip
          </button>
        </div>
      ) : (
        <div className="trips-grid">
          {filteredTrips.map(trip => {
            const isOwnTrip = (trip.host?.id && trip.host?.id === currentUserId) || (trip.host?.email && trip.host?.email.toLowerCase() === currentUserEmail.toLowerCase());
            const requestStatus = getRequestStatus(trip.id);

            return (
              <div key={trip.id} className="trip-card animate-fade-in">
                <div className="trip-image-wrap" style={{ position: 'relative' }}>
                  <img src={trip.image} alt={trip.destination} className="trip-image" />
                  <div className="trip-date-badge">
                    <Calendar size={16} />
                    {trip.date}
                  </div>

                  {isOwnTrip && (
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === trip.id ? null : trip.id);
                        }}
                        style={{
                          background: 'rgba(26, 26, 36, 0.65)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(26, 26, 36, 0.85)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(26, 26, 36, 0.65)'}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openDropdownId === trip.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '0.5rem',
                          background: 'var(--card-bg)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          border: '1px solid var(--border-color)',
                          padding: '0.5rem',
                          minWidth: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          zIndex: 20
                        }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              if (window.confirm("Are you sure you want to delete this trip?")) {
                                const res = await deleteTrip(trip.id);
                                if (res.success) {
                                  showToast("Trip deleted successfully.");
                                } else {
                                  showToast("Failed to delete trip.", "error");
                                }
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent)',
                              padding: '0.6rem 0.8rem',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              width: '100%',
                              textAlign: 'left'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = 'rgba(235, 87, 87, 0.1)';
                              e.currentTarget.style.color = 'red';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--accent)';
                            }}
                          >
                            <Trash2 size={16} />
                            Delete Trip
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="trip-content">
                  <h3 className="trip-dest">
                    <MapPin size={24} color="var(--primary)" />
                    {trip.destination}
                  </h3>
                  <p className="trip-desc">{trip.description}</p>
                  
                  {/* Action Join Button */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    {isOwnTrip ? (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        background: 'rgba(0, 78, 137, 0.1)', 
                        color: 'var(--secondary)', 
                        padding: '0.5rem 1.25rem', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        width: '100%',
                        justifyContent: 'center'
                      }}>
                        Hosted by you
                      </span>
                    ) : requestStatus === 'accepted' ? (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: 'var(--success)', 
                        padding: '0.5rem 1.25rem', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        width: '100%',
                        justifyContent: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        ✓ Request Approved
                      </span>
                    ) : requestStatus === 'pending' ? (
                      <button 
                        className="btn btn-outline" 
                        disabled
                        style={{ 
                          width: '100%', 
                          fontSize: '0.9rem', 
                          background: 'var(--background)',
                          color: 'var(--text-muted)',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Clock size={16} />
                        Pending Approval
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        disabled={sendingTripIds.has(trip.id)}
                        onClick={() => handleRequestToJoin(trip)}
                        style={{ 
                          width: '100%', 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          opacity: sendingTripIds.has(trip.id) ? 0.6 : 1,
                          cursor: sendingTripIds.has(trip.id) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <UserPlus size={16} />
                        {sendingTripIds.has(trip.id) ? 'Sending...' : 'Request to Join'}
                      </button>
                    )}
                  </div>                   <div className="trip-host">
                    <Link to={`/profile/${trip.host?.id || trip.host?.email}`} className="host-avatar-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                      <div className="host-avatar-wrap">
                        <img src={getFallbackAvatar(trip.host?.gender, trip.host?.avatar)} alt={trip.host?.name || "Host"} className="host-avatar" />
                        {trip.host?.verified && (
                          <div className="verified-badge" title="Verified User">
                            <CheckCircle size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="host-info">
                        <h5 style={{ margin: 0, fontWeight: '700' }}>{trip.host?.name || "Traveler"}</h5>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Budget: {trip.budget}</p>
                      </div>
                    </Link>
                    <span style={{ fontSize: '0.75rem', background: 'var(--background)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
                      {trip.category || 'Adventure'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Trip Modal */}
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Post a New Trip</h2>
            <button className="close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
          </div>
          
          <form onSubmit={handlePostTrip}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={18} /> Trip Image
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if(e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 1024 * 1024) {
                      showToast("Image file is too large! Please choose an image smaller than 1MB.", "error");
                      e.target.value = "";
                      setImagePreview(null);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                className="form-control" 
                style={{ padding: '0.5rem', cursor: 'pointer' }} 
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" style={{ marginTop: '1rem', width: '100%', height: '150px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
              )}
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Destination</label>
                <input name="destination" type="text" className="form-control" placeholder="Where to?" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Category / Travel Style</label>
                <select name="category" className="form-control" required style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  <option value="Adventure">Adventure</option>
                  <option value="Culture">Culture</option>
                  <option value="Relaxation">Relaxation</option>
                  <option value="Hiking">Hiking</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Start Date</label>
                <input 
                  name="startDate" 
                  type="date" 
                  className="form-control" 
                  required 
                  style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)', height: '48px', padding: '0.5rem' }} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">End Date</label>
                <input 
                  name="endDate" 
                  type="date" 
                  className="form-control" 
                  required 
                  style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)', height: '48px', padding: '0.5rem' }} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Estimated Budget</label>
              <input name="budget" type="text" className="form-control" placeholder="e.g. ₹15,000" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Trip Description</label>
              <textarea 
                name="description"
                className="form-control" 
                rows="4" 
                placeholder="What's the vibe? Who are you looking for?"
                required
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={posting}
              style={{ 
                width: '100%', 
                padding: '1rem',
                opacity: posting ? 0.6 : 1,
                cursor: posting ? 'not-allowed' : 'pointer'
              }}
            >
              {posting ? 'Publishing...' : 'Publish Trip'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
