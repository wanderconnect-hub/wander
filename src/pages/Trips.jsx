import { useState, useContext } from 'react';
import { Calendar, MapPin, CheckCircle, Clock, Award, Compass, Users, ChevronRight, Plus, Image as ImageIcon } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';

export default function Trips() {
  const { trips, setTrips, notifications, currentUserEmail, userProfile, currentUserId } = useContext(TravelContext);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handlePostTrip = async (e) => {
    e.preventDefault();
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
          host: {
            name: data.host?.name || userProfile.name,
            email: data.host?.email || currentUserEmail,
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
    }
  };

  // Hardcoded past completed travels for stunning high-fidelity visualization
  const completedTrips = [
    {
      id: "past-1",
      destination: "Ubud, Bali",
      date: "Mar 10 - Mar 18, 2026",
      budget: "$800",
      description: "Amazing yoga retreat and rice terrace exploration. Stayed in a beautiful eco-lodge and made life-long travel buddies!",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Relaxation",
      host: {
        name: "Alex Chen",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
      },
      buddies: [
        { name: "Aditi Rao", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&w=150&q=80", role: "Co-traveler" },
        { name: "Neha Patel", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80", role: "Co-traveler" }
      ]
    },
    {
      id: "past-2",
      destination: "Leh Ladakh, India",
      date: "Jan 12 - Jan 22, 2026",
      budget: "₹35,000",
      description: "Epic winter road trip across the Himalayan passes. Frozen lakes, double-humped camels, and extreme freezing temperatures!",
      image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Adventure",
      host: {
        name: "Arjun Verma",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      buddies: [
        { name: "Alex Chen", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", role: "Co-traveler" },
        { name: "Rohan Sharma", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80", role: "Co-traveler" }
      ]
    }
  ];

  // Dynamic Upcoming Trips (Trips hosted by the user, OR trips they requested to join and were accepted)
  const upcomingTrips = trips.filter(trip => {
    // 1. If hosted by you
    const isOwnTrip = (trip.host?.id && trip.host?.id === currentUserId) || (trip.host?.email && trip.host?.email.toLowerCase() === currentUserEmail.toLowerCase());
    if (isOwnTrip) return true;

    // 2. If requested to join and accepted by the host
    const requestStatus = notifications.find(
      n => n.type === 'join_request' && n.sender?.email === currentUserEmail && n.trip?.id === trip.id
    )?.status;

    return requestStatus === 'accepted';
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem', position: 'relative' }}>

      {/* Visual Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: toast.type === 'success' ? 'var(--success)' : toast.type === 'info' ? 'var(--secondary)' : 'var(--accent)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <Clock size={20} />}
          <span style={{ fontWeight: '600' }}>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">My Trips</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track your active plans and browse memories from past travels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Post Trip
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="filters-bar" style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', gap: '1.5rem' }}>
        <button
          className={`filter-chip ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
          style={{ padding: '0.6rem 1.75rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}
        >
          Upcoming Trips ({upcomingTrips.length})
        </button>
        <button
          className={`filter-chip ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
          style={{ padding: '0.6rem 1.75rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}
        >
          Past Travels ({completedTrips.length})
        </button>
      </div>

      {/* Content Rendering */}
      {activeTab === 'upcoming' ? (
        upcomingTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Compass size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.6 }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No upcoming trips confirmed yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Host a new trip or apply to join active trips in the Explore section!</p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={20} /> Post Trip
            </button>
          </div>
        ) : (
          <div className="trips-grid">
            {upcomingTrips.map(trip => {
              const isOwnTrip = (trip.host?.id && trip.host?.id === currentUserId) || (trip.host?.email && trip.host?.email.toLowerCase() === currentUserEmail.toLowerCase());

              // Find approved travelers for this trip to display as companions
              const approvedTravelers = notifications
                .filter(n => n.type === 'join_request' && n.trip?.id === trip.id && n.status === 'accepted')
                .map(n => ({
                  name: n.sender?.name || "Traveler",
                  avatar: n.sender?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
                  role: "Confirmed Companion"
                }));

              return (
                <div key={trip.id} className="trip-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="trip-image-wrap">
                    <img src={trip.image} alt={trip.destination} className="trip-image" />
                    <div className="trip-date-badge">
                      <Calendar size={16} />
                      {trip.date}
                    </div>
                  </div>

                  <div className="trip-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        background: isOwnTrip ? 'rgba(0, 78, 137, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: isOwnTrip ? 'var(--secondary)' : 'var(--success)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '700'
                      }}>
                        {isOwnTrip ? "✦ Hosting" : "✓ Approved Plan"}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Budget: {trip.budget}
                      </span>
                    </div>

                    <h3 className="trip-dest" style={{ fontSize: '1.4rem' }}>
                      <MapPin size={22} color="var(--primary)" />
                      {trip.destination}
                    </h3>
                    <p className="trip-desc" style={{ flex: 1 }}>{trip.description}</p>

                    {/* Approved Companions / Buddies section */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={16} /> Confirmed Travel Group
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Include host */}
                        <div style={{ position: 'relative' }}>
                          <img
                            src={trip.host?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"}
                            alt={trip.host?.name || "Host"}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                            title={`${trip.host?.name || "Host"} (Host)`}
                          />
                          <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--primary)', color: 'white', fontSize: '0.5rem', padding: '1px 3px', borderRadius: '3px', fontWeight: 'bold' }}>H</span>
                        </div>

                        {/* Approved travelers */}
                        {approvedTravelers.map((traveler, index) => (
                          <img
                            key={index}
                            src={traveler.avatar}
                            alt={traveler.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border-color)', objectFit: 'cover' }}
                            title={`${traveler.name} (Companion)`}
                          />
                        ))}

                        {approvedTravelers.length === 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Waiting for companions to join...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="trips-grid">
          {completedTrips.map(trip => (
            <div key={trip.id} className="trip-card animate-fade-in" style={{ filter: 'grayscale(15%)', opacity: 0.95 }}>
              <div className="trip-image-wrap">
                <img src={trip.image} alt={trip.destination} className="trip-image" />
                <div className="trip-date-badge" style={{ background: 'rgba(55, 65, 81, 0.85)' }}>
                  <Award size={16} />
                  {trip.date}
                </div>
              </div>

              <div className="trip-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: '700'
                  }}>
                    • Completed
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Cost: {trip.budget}
                  </span>
                </div>

                <h3 className="trip-dest" style={{ fontSize: '1.4rem' }}>
                  <MapPin size={22} color="var(--text-muted)" />
                  {trip.destination}
                </h3>
                <p className="trip-desc">{trip.description}</p>

                {/* Buddies section */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={16} /> Traveled With
                  </h5>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {trip.buddies.map((buddy, index) => (
                      <img
                        key={index}
                        src={buddy.avatar}
                        alt={buddy.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border-color)', objectFit: 'cover' }}
                        title={`${buddy.name} (${buddy.role})`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result);
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }} 
                className="form-control" 
                style={{ padding: '0.5rem', cursor: 'pointer' }} 
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" style={{ marginTop: '1rem', width: '100%', height: '150px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
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
            
            <div style={{ display: 'flex', gap: '1rem' }}>
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
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Publish Trip
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
