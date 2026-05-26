import { useState, useContext } from 'react';
import { Search as SearchIcon, UserPlus, Check, MessageSquare, AlertCircle, MapPin, Plane, ShieldCheck } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Search() {
  const { 
    registeredUsers, 
    currentUserEmail, 
    buddies, 
    notifications, 
    setNotifications,
    calculateAge,
    currentUserId,
    fetchSupabaseNotifications,
    handleAcceptNotification
  } = useContext(TravelContext);
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingIds, setSendingIds] = useState(new Set());
  const [acceptingIds, setAcceptingIds] = useState(new Set());
  
  // Custom mock database for searchable travelers (including predefined buddies & mock Connect profiles)
  const allSearchablePeopleStatic = [
    {
      id: "rohan-102",
      name: "Rohan Sharma",
      email: "rohan@wanderconnect.com",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      location: "Manali",
      style: "Adventure",
      bio: "Adventure enthusiast. Love trekking, skiing, and off-roading. Let's conquer the mountains!",
      nextTrip: "Manali, Himachal Pradesh (Oct 15 - 25)",
      verified: true,
      age: 26,
      gender: "Male"
    },
    {
      id: "priya-103",
      name: "Priya Desai",
      email: "priya@wanderconnect.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      location: "Goa",
      style: "Relaxation",
      bio: "Beach lover, foodie, and yoga practitioner. Let's find the best sunset spots!",
      nextTrip: "South Goa Beaches (Nov 05 - 12)",
      verified: true,
      age: 27,
      gender: "Female"
    },
    {
      id: "arjun-104",
      name: "Arjun Verma",
      email: "arjun@wanderconnect.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      location: "Shimla",
      style: "Hiking",
      bio: "Road trip fanatic. I love long drives, local histories, and camping under the stars.",
      nextTrip: "Spiti Valley, Himachal (Sep 20 - 30)",
      verified: false,
      age: 31,
      gender: "Male"
    },
    {
      id: "vikram-106",
      name: "Vikram Singh",
      email: "vikram@wanderconnect.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=400&q=80",
      location: "Delhi",
      style: "Adventure",
      bio: "Always looking for the next mountain to climb. Let's do a bike trip to Leh Ladakh!",
      nextTrip: "Leh, Ladakh (Aug 15 - 25)",
      verified: true,
      age: 26,
      gender: "Male"
    },
    {
      id: "neha-107",
      name: "Neha Patel",
      email: "neha@wanderconnect.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      location: "Ahmedabad",
      style: "Foodie & Culture",
      bio: "Planning a trip to Rajasthan to explore forts and eat amazing local food. Looking for a buddy!",
      nextTrip: "Jaipur, Rajasthan (Oct 10 - 15)",
      verified: true,
      age: 24,
      gender: "Female"
    },
    {
      id: "rahul-108",
      name: "Rahul Nair",
      email: "rahul@wanderconnect.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      location: "Kochi",
      style: "Relaxation",
      bio: "Backpacker heading to Varkala for a month. Surf, chill, and repeat.",
      nextTrip: "Varkala, Kerala (Dec 01 - 31)",
      verified: false,
      age: 28,
      gender: "Male"
    }
  ];

  // Dynamic list derived from registeredUsers
  const registeredEmails = new Set(
    (registeredUsers || [])
      .map(u => u?.email?.toLowerCase())
      .filter(Boolean)
  );
  
  const mappedRegistered = (registeredUsers || []).map(u => {
    const emailVal = u?.email || "";
    const nameVal = u?.profile?.name || u?.name || "Traveler";
    const existingMock = allSearchablePeopleStatic.find(p => p.email && p.email.toLowerCase() === emailVal.toLowerCase());
    const id = u?.id || existingMock?.id || `${nameVal.toLowerCase().replace(/\s+/g, '-')}-${emailVal.split('@')[0]?.slice(-3) || '000'}`;
    const ageVal = u?.profile?.dob ? calculateAge(u.profile.dob) : (u?.profile?.age || existingMock?.age || 26);
    
    return {
      id,
      name: nameVal,
      email: emailVal,
      age: ageVal,
      gender: u?.profile?.gender || existingMock?.gender || "Male",
      avatar: u?.profile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      location: u?.profile?.location || existingMock?.location || "Local Traveler",
      style: Array.isArray(u?.profile?.styles) ? u.profile.styles.join(', ') : u?.profile?.styles || existingMock?.style || 'Adventurer',
      bio: u?.profile?.bio || existingMock?.bio || "Hey there! I am new here, let's connect and explore together.",
      nextTrip: u?.profile?.nextTrip || existingMock?.nextTrip || "Planning next adventure",
      verified: existingMock?.verified !== undefined ? existingMock.verified : false
    };
  });

  const remainingMock = allSearchablePeopleStatic.filter(p => p.email && !registeredEmails.has(p.email.toLowerCase()));
  const allSearchablePeople = [...mappedRegistered, ...remainingMock];

  // Exclude active user from search results
  const otherPeople = allSearchablePeople.filter(p => 
    p.email && currentUserEmail && p.email.toLowerCase() !== currentUserEmail.toLowerCase()
  );

  // Filter search results
  const filteredPeople = otherPeople.filter(person => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true; // Show all by default
    return (
      (person.name || "").toLowerCase().includes(query) ||
      (person.id || "").toLowerCase().includes(query) ||
      (person.location || "").toLowerCase().includes(query) ||
      (person.style || "").toLowerCase().includes(query)
    );
  });

  const getRequestStatus = (person) => {
    // Find registered user corresponding to search result
    const matchUser = (registeredUsers || []).find(u => u.email && person.email && u.email.toLowerCase() === person.email.toLowerCase());
    
    // Check if they are already buddies
    if (matchUser) {
      const isBuddy = (buddies || []).some(b => b.id === matchUser.id);
      if (isBuddy) return 'connected';
    }
    const isBuddyByEmail = (buddies || []).some(b => person.name && b.name === person.name);
    if (isBuddyByEmail) return 'connected';

    // Check if there is an incoming pending request from this person to us
    const incomingReq = (notifications || []).find(n => {
      if (n.type !== 'connect_request' || n.status !== 'pending') return false;
      const isSupabaseNotif = n.senderId && n.receiverId;
      if (isSupabaseNotif) {
        return n.senderId === matchUser?.id && n.receiverId === currentUserId;
      } else {
        return n.sender?.email?.toLowerCase() === person.email?.toLowerCase() && 
               n.receiverEmail?.toLowerCase() === currentUserEmail?.toLowerCase();
      }
    });
    if (incomingReq) return 'incoming';

    // Find connect request notification sent by us to this person
    const req = (notifications || []).find(n => {
      if (n.type !== 'connect_request') return false;
      const isSupabaseNotif = n.senderId && n.receiverId;
      if (isSupabaseNotif) {
        return n.senderId === currentUserId && n.receiverId === matchUser?.id;
      } else {
        return n.sender?.email?.toLowerCase() === currentUserEmail?.toLowerCase() && 
               n.receiverEmail?.toLowerCase() === person.email?.toLowerCase();
      }
    });
    
    return req ? req.status : 'none'; // 'pending', 'accepted', 'declined', 'none'
  };

  const handleSendRequest = (person) => {
    const currentStatus = getRequestStatus(person);
    if (currentStatus !== 'none') {
      console.log("Request already exists or connected. Status:", currentStatus);
      return;
    }
    if (sendingIds.has(person.id)) {
      console.log("Request already in-flight for person:", person.id);
      return;
    }

    setSendingIds(prev => {
      const next = new Set(prev);
      next.add(person.id);
      return next;
    });

    const matchUser = (registeredUsers || []).find(u => u.email && person.email && u.email.toLowerCase() === person.email.toLowerCase());
    const isSupabaseReceiver = matchUser?.id && typeof matchUser.id === 'string' && matchUser.id.length > 20;
    const isSupabaseSender = currentUserId && typeof currentUserId === 'string' && currentUserId.length > 20;

    console.log("handleSendRequest - Debug details:", {
      personEmail: person.email,
      matchUser,
      isSupabaseReceiver,
      isSupabaseSender,
      currentUserId,
      currentUserEmail
    });

    if (isSupabaseReceiver && isSupabaseSender) {
      supabase
        .from('notifications')
        .insert({
          type: 'connect_request',
          sender_id: currentUserId,
          receiver_id: matchUser.id,
          status: 'pending',
          read: false
        })
        .then(({ error }) => {
          setSendingIds(prev => {
            const next = new Set(prev);
            next.delete(person.id);
            return next;
          });
          if (error) {
            console.error("Error sending connect request to Supabase:", error);
          } else {
            console.log("Connect request sent successfully! Fetching notifications...");
            fetchSupabaseNotifications();
          }
        });
    } else {
      const activeUser = registeredUsers.find(u => u.email === currentUserEmail) || {
        name: "Alex Chen",
        profile: {
          name: "Alex Chen",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
          styles: ["Explorer"]
        }
      };

      const newRequest = {
        id: `conn-${Date.now()}`,
        type: "connect_request",
        receiverEmail: person.email,
        sender: {
          id: Date.now(),
          name: activeUser.name || activeUser.profile.name,
          email: currentUserEmail,
          avatar: activeUser.profile.avatar,
          location: person.location,
          style: activeUser.profile.styles?.[0] || "Explorer"
        },
        status: "pending",
        timestamp: "Just now",
        read: false
      };

      setNotifications(prev => [newRequest, ...prev]);
      setSendingIds(prev => {
        const next = new Set(prev);
        next.delete(person.id);
        return next;
      });
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Search Travelers</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Find other active travelers by name, travel ID, location, or style, and send a connection request.
      </p>

      {/* Search Input Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        background: 'white',
        padding: '0.75rem',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-color)',
        marginBottom: '2.5rem',
        alignItems: 'center'
      }}>
        <SearchIcon size={22} style={{ color: 'var(--text-muted)', marginLeft: '1rem' }} />
        <input 
          type="text" 
          placeholder="Search by name or Travel ID (e.g. rohan-102, priya-103)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1.05rem',
            fontFamily: 'inherit',
            background: 'transparent'
          }}
        />
      </div>

      {/* Search Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {filteredPeople.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <AlertCircle size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '1rem' }} />
            <h3>No results found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your keywords, name, or travel ID.</p>
          </div>
        ) : (
          filteredPeople.map(person => {
            const status = getRequestStatus(person.email);
            return (
              <div 
                key={person.id} 
                className="trip-card"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  alignItems: 'center',
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Profile Photo */}
                <div style={{ position: 'relative' }}>
                  <img 
                    src={person.avatar} 
                    alt={person.name} 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--background)' }} 
                  />
                  {person.verified && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center' }}>
                      <ShieldCheck size={18} fill="var(--primary)" color="white" />
                    </span>
                  )}
                </div>

                {/* Profile Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{person.name}</h3>
                    {person.age && person.gender && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        ({person.age}, {person.gender})
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', background: 'var(--background)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: '600', marginLeft: 'auto' }}>
                      ID: {person.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={14} /> {person.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plane size={14} /> Next: {person.nextTrip.split('(')[0]}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '0.5rem 0', lineHeight: '1.4' }}>
                    {person.bio}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ background: 'rgba(255, 107, 53, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {person.style}
                    </span>
                  </div>
                </div>

                {/* Connection Request Actions */}
                <div>
                  {status === 'connected' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold', justifyContent: 'center' }}>
                        <Check size={16} /> Connected
                      </span>
                      <button 
                        className="btn-outline" 
                        onClick={() => navigate('/messages')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      >
                        <MessageSquare size={16} /> Chat
                      </button>
                    </div>
                  ) : status === 'pending' ? (
                    <button 
                      disabled
                      style={{
                        background: 'rgba(255, 186, 8, 0.1)',
                        color: 'var(--warning)',
                        border: '1px dashed var(--warning)',
                        padding: '0.6rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'not-allowed'
                      }}
                    >
                      Request Pending
                    </button>
                  ) : status === 'incoming' ? (
                     <button 
                      disabled={acceptingIds.has(person.id)}
                      onClick={async () => {
                        if (acceptingIds.has(person.id)) return;
                        setAcceptingIds(prev => {
                          const next = new Set(prev);
                          next.add(person.id);
                          return next;
                        });
                        try {
                          const matchUser = (registeredUsers || []).find(u => u.email && person.email && u.email.toLowerCase() === person.email.toLowerCase());
                          const incomingNotif = (notifications || []).find(n => {
                            if (n.type !== 'connect_request' || n.status !== 'pending') return false;
                            const isSupabaseNotif = n.senderId && n.receiverId;
                            if (isSupabaseNotif) {
                              return n.senderId === matchUser?.id && n.receiverId === currentUserId;
                            } else {
                              return n.sender?.email?.toLowerCase() === person.email?.toLowerCase() && 
                                     n.receiverEmail?.toLowerCase() === currentUserEmail?.toLowerCase();
                            }
                          });
                          if (incomingNotif) {
                            await handleAcceptNotification(incomingNotif);
                          }
                        } catch (e) {
                          console.error(e);
                          setAcceptingIds(prev => {
                            const next = new Set(prev);
                            next.delete(person.id);
                            return next;
                          });
                        }
                      }}
                      style={{
                        background: 'var(--success)',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: acceptingIds.has(person.id) ? 'not-allowed' : 'pointer',
                        opacity: acceptingIds.has(person.id) ? 0.6 : 1
                      }}
                    >
                      {acceptingIds.has(person.id) ? 'Accepting...' : 'Accept Request'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSendRequest(person)}
                      disabled={sendingIds.has(person.id)}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: sendingIds.has(person.id) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--transition)',
                        opacity: sendingIds.has(person.id) ? 0.6 : 1
                      }}
                      onMouseOver={e => { if (!sendingIds.has(person.id)) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseOut={e => { if (!sendingIds.has(person.id)) e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <UserPlus size={16} /> {sendingIds.has(person.id) ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
