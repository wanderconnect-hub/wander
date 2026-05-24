import { useState, useContext } from 'react';
import { Calendar, MapPin, CheckCircle, Clock, Award, Compass, Users, ChevronRight } from 'lucide-react';
import { TravelContext } from '../context.jsx';

export default function Trips() {
  const { trips, notifications, currentUserEmail, userProfile } = useContext(TravelContext);
  const [activeTab, setActiveTab] = useState('upcoming');

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
    const isOwnTrip = trip.host.email === currentUserEmail;
    if (isOwnTrip) return true;

    // 2. If requested to join and accepted by the host
    const requestStatus = notifications.find(
      n => n.type === 'join_request' && n.sender.email === currentUserEmail && n.trip.id === trip.id
    )?.status;

    return requestStatus === 'accepted';
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">My Trips</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track your active plans and browse memories from past travels</p>
        </div>
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
          </div>
        ) : (
          <div className="trips-grid">
            {upcomingTrips.map(trip => {
              const isOwnTrip = trip.host.email === currentUserEmail;

              // Find approved travelers for this trip to display as companions
              const approvedTravelers = notifications
                .filter(n => n.type === 'join_request' && n.trip.id === trip.id && n.status === 'accepted')
                .map(n => ({
                  name: n.sender.name,
                  avatar: n.sender.avatar,
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
                            src={trip.host.avatar}
                            alt={trip.host.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                            title={`${trip.host.name} (Host)`}
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

    </div>
  );
}
