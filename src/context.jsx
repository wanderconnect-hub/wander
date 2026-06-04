/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { getFallbackAvatar } from './utils/avatars';

export const TravelContext = createContext();

export function calculateAge(dobString) {
  if (!dobString) return null;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function TravelProvider({ children }) {
  // Preloaded registered users (supporting easy login for Rohan, Priya, Arjun, and Alex)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('wc_registeredUsers');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let migrated = false;
          const checked = parsed.map(u => {
            if (u.profile && typeof u.profile.avatar === 'string' && u.profile.avatar.includes('photo-1535713875002-d1d0cf377fde')) {
              u.profile.avatar = getFallbackAvatar(u.profile.gender || 'Male', u.profile.avatar);
              migrated = true;
            }
            if (!u.buddies) {
              const defaultBuddies = (u.email || '').toLowerCase() === 'alex@wanderconnect.com' ? [
                { 
                  id: 101, 
                  name: "Aditi Rao", 
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&w=150&q=80",
                  location: "Mumbai",
                  style: "Backpacker"
                }
              ] : [];
              u.buddies = defaultBuddies;
              migrated = true;
            }
            return u;
          });
          if (migrated) {
            try {
              localStorage.setItem('wc_registeredUsers', JSON.stringify(checked));
            } catch (err) {
              console.error("Failed to save wc_registeredUsers to localStorage:", err);
            }
          }
          return checked;
        }
      }
    } catch (e) {
      console.error("Error parsing registeredUsers from localStorage", e);
    }
    return [
      {
        name: "Alex Chen",
        email: "alex@wanderconnect.com",
        password: "password123",
        buddies: [
          { 
            id: 101, 
            name: "Aditi Rao", 
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&w=150&q=80",
            location: "Mumbai",
            style: "Backpacker"
          }
        ],
        profile: {
          name: "Alex Chen",
          bio: "Hey! I'm Alex. I've been traveling full-time for the last 2 years. I love finding off-the-beaten-path locations, trying local street food, and hiking up to great viewpoints.",
          styles: ["Backpacking", "Photography", "Foodie", "Budget"],
          avatar: getFallbackAvatar('Male'),
          title: "Digital Nomad & Adventure Photographer",
          gender: "Male",
          dob: "1997-04-12"
        }
      },
      {
        name: "Rohan Sharma",
        email: "rohan@wanderconnect.com",
        password: "password123",
        buddies: [],
        profile: {
          name: "Rohan Sharma",
          bio: "Adventure enthusiast. Love trekking, skiing, and off-roading. Let's conquer the mountains!",
          styles: ["Adventure", "Hiking", "Photography"],
          avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
          title: "Mountain Guide & Nomad",
          gender: "Male",
          dob: "1999-08-23"
        }
      },
      {
        name: "Priya Desai",
        email: "priya@wanderconnect.com",
        password: "password123",
        buddies: [],
        profile: {
          name: "Priya Desai",
          bio: "Beach lover, foodie, and yoga practitioner. Let's find the best sunset spots!",
          styles: ["Relaxation", "Foodie", "Culture"],
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
          title: "Beach Bum & Yoga Teacher",
          gender: "Female",
          dob: "1998-11-05"
        }
      },
      {
        name: "Arjun Verma",
        email: "arjun@wanderconnect.com",
        password: "password123",
        buddies: [],
        profile: {
          name: "Arjun Verma",
          bio: "Road trip fanatic. I love long drives, local histories, and camping under the stars.",
          styles: ["Hiking", "Culture", "Adventure"],
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
          title: "Roadtripper & Historian",
          gender: "Male",
          dob: "1995-01-15"
        }
      }
    ];
  });







  // Current User Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('wc_userProfile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.avatar === 'string' && parsed.avatar.includes('photo-1535713875002-d1d0cf377fde')) {
          parsed.avatar = getFallbackAvatar(parsed.gender || 'Male', parsed.avatar);
          localStorage.setItem('wc_userProfile', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "Alex Chen",
      bio: "Hey! I'm Alex. I've been traveling full-time for the last 2 years. I love finding off-the-beaten-path locations, trying local street food, and hiking up to great viewpoints. I'm generally pretty easy-going and love deep conversations over a coffee or beer. Looking for travel buddies who don't mind waking up early for sunrise shots!",
      styles: ["Backpacking", "Photography", "Foodie", "Budget"],
      avatar: getFallbackAvatar('Male'),
      title: "Digital Nomad & Adventure Photographer",
      gender: "Male",
      dob: "1997-04-12"
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('wc_userProfile', JSON.stringify(userProfile));
    } catch (e) {
      console.error("Failed to save wc_userProfile to localStorage:", e);
    }
  }, [userProfile]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('wc_isAuthenticated') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wc_isAuthenticated', isAuthenticated);
    } catch (e) {
      console.error(e);
    }
  }, [isAuthenticated]);

  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    try {
      return localStorage.getItem('wc_currentUserEmail') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wc_currentUserEmail', currentUserEmail);
    } catch (e) {
      console.error(e);
    }
  }, [currentUserEmail]);

  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      return localStorage.getItem('wc_currentUserId') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wc_currentUserId', currentUserId);
    } catch (e) {
      console.error(e);
    }
  }, [currentUserId]);

  useEffect(() => {
    let active = true;

    const syncSession = async (session) => {
      if (!active) return;
      if (session) {
        setIsAuthenticated(true);
        setCurrentUserEmail(session.user.email);
        setCurrentUserId(session.user.id);

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Error loading profile from DB on session sync:", error);
          }

          if (profile && active) {
            setUserProfile({
              name: profile.name,
              bio: profile.bio || "Tell us about yourself!",
              styles: profile.styles || [],
              avatar: getFallbackAvatar(profile.gender, profile.avatar),
              title: profile.title || "Traveler",
              gender: profile.gender,
              dob: profile.dob
            });
          }
        } catch (err) {
          console.error("Exception loading profile on session sync:", err);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUserEmail('');
        setCurrentUserId('');
      }
    };

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Initial travel buddies for the user (synced per registered user account)
  const [buddies, setBuddies] = useState([]);

  // Sync buddies state when the logged-in email changes
  useEffect(() => {
    if (currentUserEmail) {
      const user = registeredUsers.find(u => u.email && u.email.toLowerCase() === currentUserEmail.toLowerCase());
      if (user) {
        setBuddies(user.buddies || []);
      }
    } else {
      setBuddies([]);
    }
  }, [currentUserEmail, registeredUsers]);

  // Shared Trips State (moved from Feed.jsx to make it global)
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Joint Requests & Notifications State
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('wc_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: "notif-1",
        type: "join_request",
        receiverEmail: "alex@wanderconnect.com", // Addressed to Alex Chen
        sender: {
          id: 103,
          name: "Neha Patel",
          email: "neha@wanderconnect.com",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80",
          location: "Ahmedabad",
          style: "Foodie & Culture"
        },
        trip: {
          id: 4,
          destination: "Varkala Beach, Kerala",
          hostEmail: "alex@wanderconnect.com"
        },
        status: "pending", // pending, accepted, declined
        timestamp: "2 hours ago",
        read: false
      }
    ];
  });

  const fetchTripsAndProfiles = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch profiles, trips, and buddies in parallel
      const [profilesRes, tripsRes, buddiesRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('trips').select('*, host:profiles(*)').order('created_at', { ascending: false }),
        supabase.from('buddies').select('*')
      ]);

      const { data: profilesData, error: profilesError } = profilesRes;
      const { data: tripsData, error: tripsError } = tripsRes;
      const { data: buddiesData } = buddiesRes;

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else if (profilesData) {
        const mappedUsers = profilesData.map(p => {
          // Find connections where p.id is either user_id_1 or user_id_2
          const userBuddiesRelations = buddiesData ? buddiesData.filter(b => b.user_id_1 === p.id || b.user_id_2 === p.id) : [];
          const userBuddies = userBuddiesRelations.map(rel => {
            const otherId = rel.user_id_1 === p.id ? rel.user_id_2 : rel.user_id_1;
            const otherProfile = profilesData.find(op => op.id === otherId);
            return {
              id: otherId,
              name: otherProfile?.name || "Traveler",
              avatar: getFallbackAvatar(otherProfile?.gender, otherProfile?.avatar),
              location: otherProfile?.location || "Delhi",
              style: otherProfile?.styles?.[0] || "Explorer"
            };
          });

          return {
            id: p.id,
            name: p.name,
            email: p.email || (currentUserId && p.id === currentUserId ? currentUserEmail : `${(p.name || 'user').toLowerCase().replace(/\s+/g, '')}@wanderconnect.com`),
            buddies: userBuddies,
            profile: {
              name: p.name,
              bio: p.bio || "Tell us about yourself! Click 'Edit Profile' to add your bio, tagline, and travel styles.",
              styles: p.styles || ["Adventurer"],
              avatar: getFallbackAvatar(p.gender, p.avatar),
              title: p.title || "Traveler",
              gender: p.gender || "Male",
              dob: p.dob
            }
          };
        });

        const defaultUsers = [
          {
            name: "Alex Chen",
            email: "alex@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Alex Chen",
              bio: "Hey! I'm Alex. I've been traveling full-time for the last 2 years. I love finding off-the-beaten-path locations, trying local street food, and hiking up to great viewpoints.",
              styles: ["Backpacking", "Photography", "Foodie", "Budget"],
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
              title: "Digital Nomad & Adventure Photographer",
              gender: "Male",
              dob: "1997-04-12"
            }
          },
          {
            name: "Rohan Sharma",
            email: "rohan@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Rohan Sharma",
              bio: "Adventure enthusiast. Love trekking, skiing, and off-roading. Let's conquer the mountains!",
              styles: ["Adventure", "Hiking", "Photography"],
              avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
              title: "Mountain Guide & Nomad",
              gender: "Male",
              dob: "1999-08-23"
            }
          },
          {
            name: "Priya Desai",
            email: "priya@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Priya Desai",
              bio: "Beach lover, foodie, and yoga practitioner. Let's find the best sunset spots!",
              styles: ["Relaxation", "Foodie", "Culture"],
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
              title: "Beach Bum & Yoga Teacher",
              gender: "Female",
              dob: "1998-11-05"
            }
          },
          {
            name: "Arjun Verma",
            email: "arjun@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Arjun Verma",
              bio: "Road trip fanatic. I love long drives, local histories, and camping under the stars.",
              styles: ["Hiking", "Culture", "Adventure"],
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
              title: "Roadtripper & Historian",
              gender: "Male",
              dob: "1995-01-15"
            }
          },
          {
            name: "Vikram Singh",
            email: "vikram@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Vikram Singh",
              bio: "Always looking for the next mountain to climb. Let's do a bike trip to Leh!",
              styles: ["Adventure", "Hiking"],
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=400&q=80",
              title: "Adventure Travel Partner",
              gender: "Male",
              dob: "2000-04-12"
            }
          },
          {
            name: "Neha Patel",
            email: "neha@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Neha Patel",
              bio: "Planning a trip to Rajasthan to explore forts and eat amazing local food. Looking for a buddy!",
              styles: ["Foodie", "Culture"],
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
              title: "Culture Explorer",
              gender: "Female",
              dob: "2002-06-15"
            }
          },
          {
            name: "Rahul Nair",
            email: "rahul@wanderconnect.com",
            password: "password123",
            buddies: [],
            profile: {
              name: "Rahul Nair",
              bio: "Backpacker heading to Varkala for a month. Surf, chill, and repeat.",
              styles: ["Relaxation", "Backpacking"],
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
              title: "Surf & Chill Backpacker",
              gender: "Male",
              dob: "1998-03-22"
            }
          }
        ];

        const combined = [...mappedUsers];
        defaultUsers.forEach(du => {
          if (!combined.some(c => c.email && du.email && c.email.toLowerCase() === du.email.toLowerCase())) {
            combined.push(du);
          }
        });

        setRegisteredUsers(combined);
      }

      if (tripsError) {
        console.error("Error fetching trips:", tripsError);
      } else if (tripsData) {
        const mappedTrips = tripsData.map(t => ({
          id: t.id,
          destination: t.destination,
          date: t.date,
          budget: t.budget,
          description: t.description,
          category: t.category,
          image: t.image,
          created_at: t.created_at,
          host: {
            id: t.host?.id || t.host_id,
            name: t.host?.name || "Traveler",
            email: t.host?.email || "",
            gender: t.host?.gender || "Male",
            avatar: getFallbackAvatar(t.host?.gender, t.host?.avatar),
            verified: true
          }
        }));

        const defaultTrips = [
          {
            id: 1,
            destination: "Manali, Himachal Pradesh",
            date: "Oct 15 - Oct 25",
            budget: "₹15,000",
            description: "Looking for 2 adventure seekers to explore Rohtang Pass, cafe hop in Old Manali, and do the Kheerganga trek.",
            image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "Adventure",
            host: {
              name: "Rohan Sharma",
              email: "rohan@wanderconnect.com",
              verified: true,
              avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            }
          },
          {
            id: 2,
            destination: "South Goa Beaches",
            date: "Nov 05 - Nov 12",
            budget: "₹8,000",
            description: "Cozy beachside workstation, exploring hidden waterfalls, and sunset kayaking. Relaxed vibe, remote work friendly.",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "Relaxation",
            host: {
              name: "Priya Desai",
              email: "priya@wanderconnect.com",
              verified: true,
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            }
          },
          {
            id: 3,
            destination: "Spiti Valley, Himachal",
            date: "Sep 20 - Sep 30",
            budget: "₹22,000",
            description: "Epic road trip through Spiti. Need physically fit companions who love high altitudes and starry nights.",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "Hiking",
            host: {
              name: "Arjun Verma",
              email: "arjun@wanderconnect.com",
              verified: false,
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            }
          },
          {
            id: 4,
            destination: "Varkala Beach, Kerala",
            date: "Dec 10 - Dec 18",
            budget: "₹12,000",
            description: "Heading down to Kerala for surfing, sunset cafes, and chilling by the cliff. Looking for surf enthusiasts and beach lovers!",
            image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "Relaxation",
            host: {
              name: "Alex Chen",
              email: "alex@wanderconnect.com",
              verified: true,
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
            }
          }
        ];

        // Real DB trips first (already ordered newest-first by Supabase query),
        // then append any static mock trips that don't duplicate a real one.
        const combinedTrips = [...mappedTrips];
        defaultTrips.forEach(dt => {
          if (!combinedTrips.some(ct => ct.destination.toLowerCase() === dt.destination.toLowerCase() && ct.date === dt.date)) {
            combinedTrips.push(dt);
          }
        });

        setTrips(combinedTrips);
      }
    } catch (err) {
      console.error("Failed fetching trips and profiles:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUserId, currentUserEmail, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTripsAndProfiles();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchTripsAndProfiles]);

  // Periodic silent polling to fetch fresh profiles and trips from the DB every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchTripsAndProfiles(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchTripsAndProfiles]);

  // Reactive Sync: Map latest user avatar and name updates from registeredUsers onto existing trips
  useEffect(() => {
    setTrips(prevTrips => {
      let changed = false;
      const updated = prevTrips.map(t => {
        if (!t.host) return t;
        const hostUser = registeredUsers.find(u => 
          (t.host.id && u.id === t.host.id) || 
          (t.host.email && u.email && u.email.toLowerCase() === t.host.email.toLowerCase())
        );
        if (hostUser && hostUser.profile) {
          const latestAvatar = getFallbackAvatar(hostUser.profile.gender, hostUser.profile.avatar);
          if (t.host.avatar !== latestAvatar || t.host.name !== hostUser.profile.name) {
            changed = true;
            return {
              ...t,
              host: {
                ...t.host,
                name: hostUser.profile.name || t.host.name,
                avatar: latestAvatar,
                gender: hostUser.profile.gender || t.host.gender
              }
            };
          }
        }
        return t;
      });
      return changed ? updated : prevTrips;
    });
  }, [registeredUsers]);

  // Reactive Sync: Map latest sender avatars from registeredUsers onto notifications
  useEffect(() => {
    setNotifications(prevNotifications => {
      let changed = false;
      const updated = prevNotifications.map(n => {
        if (!n.sender) return n;
        const senderUser = registeredUsers.find(u => 
          (n.sender.id && u.id === n.sender.id) || 
          (n.sender.email && u.email && u.email.toLowerCase() === n.sender.email.toLowerCase())
        );
        if (senderUser && senderUser.profile) {
          const latestAvatar = getFallbackAvatar(senderUser.profile.gender, senderUser.profile.avatar);
          if (n.sender.avatar !== latestAvatar || n.sender.name !== senderUser.profile.name) {
            changed = true;
            return {
              ...n,
              sender: {
                ...n.sender,
                name: senderUser.profile.name || n.sender.name,
                avatar: latestAvatar,
                gender: senderUser.profile.gender || n.sender.gender
              }
            };
          }
        }
        return n;
      });
      return changed ? updated : prevNotifications;
    });
  }, [registeredUsers]);



  useEffect(() => {
    try {
      localStorage.setItem('wc_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  // Global Message Threads
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('wc_chats');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        participants: ["alex@wanderconnect.com", "rohan@wanderconnect.com"],
        time: "10:32 AM",
        unread: 2,
        active: true,
        messages: [
          { id: 101, senderEmail: 'rohan@wanderconnect.com', text: "Hey! I saw your post for the Manali trip. I've been wanting to go there for ages!" },
          { id: 102, senderEmail: 'alex@wanderconnect.com', text: "Awesome! Are you comfortable with hiking and waking up early? We plan to do the Kheerganga trek." },
          { id: 103, senderEmail: 'rohan@wanderconnect.com', text: "Definitely. I'm pretty active. What kind of budget were you thinking for accommodation?" },
          { id: 104, senderEmail: 'alex@wanderconnect.com', text: "We're looking at about ₹800-1500 a night per person for decent homestays or hostels." },
          { id: 105, senderEmail: 'rohan@wanderconnect.com', text: "Sounds like a plan! Let's book the homestay." }
        ]
      },
      {
        id: 2,
        participants: ["alex@wanderconnect.com", "priya@wanderconnect.com"],
        time: "Yesterday",
        unread: 0,
        active: false,
        messages: [
          { id: 201, senderEmail: 'priya@wanderconnect.com', text: "Hi! I'm interested in the South Goa trip." },
          { id: 202, senderEmail: 'alex@wanderconnect.com', text: "Great! Do you ride a scooty?" },
          { id: 203, senderEmail: 'priya@wanderconnect.com', text: "Yes, I can. Are you still looking for people for Goa?" }
        ]
      },
      {
        id: 3,
        participants: ["alex@wanderconnect.com", "arjun@wanderconnect.com"],
        time: "Mon",
        unread: 0,
        active: false,
        messages: [
          { id: 301, senderEmail: 'alex@wanderconnect.com', text: "Hey Arjun, what's the plan for Spiti?" },
          { id: 302, senderEmail: 'arjun@wanderconnect.com', text: "I'll send you the Spiti itinerary tomorrow." }
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('wc_chats', JSON.stringify(chats));
    } catch (e) {
      console.error(e);
    }
  }, [chats]);

  const fetchChatsAndMessages = async () => {
    if (!isAuthenticated || !currentUserId) return;
    try {
      // Get all chat IDs the current user is part of
      const { data: myPartLinks, error: pError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);

      if (pError || !myPartLinks || myPartLinks.length === 0) {
        return; // Fall back to mock chats if no DB chats exist yet
      }

      const chatIds = myPartLinks.map(link => link.chat_id);

      // Get all participants of these chats (including user profile details)
      const { data: allParts, error: partsError } = await supabase
        .from('chat_participants')
        .select('chat_id, user_id, profiles:profiles(*)')
        .in('chat_id', chatIds);

      // Get all messages for these chats
      const { data: allMessages, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: true });

      if (partsError || msgsError) {
        console.error("Error loading chat details:", partsError || msgsError);
        return;
      }

      // Map into the format expected by the frontend
      const formattedChats = chatIds.map(chatId => {
        const chatParticipants = allParts.filter(p => p.chat_id === chatId);
        const chatMsgs = allMessages.filter(m => m.chat_id === chatId);
        
        const otherPart = chatParticipants.find(p => p.user_id !== currentUserId);
        const latestMsg = chatMsgs[chatMsgs.length - 1];

        // Format timestamp
        let timeStr = "Just now";
        if (latestMsg) {
          const date = new Date(latestMsg.created_at);
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: chatId,
          participants: chatParticipants.map(p => p.user_id),
          name: otherPart?.profiles?.name || "Travel Buddy",
          avatar: getFallbackAvatar(otherPart?.profiles?.gender, otherPart?.profiles?.avatar),
          time: timeStr,
          unread: 0,
          active: false,
          messages: chatMsgs.map(m => {
            const senderEmail = chatParticipants.find(p => p.user_id === m.sender_id)?.profiles?.email || "";
            return {
              id: m.id,
              senderEmail: senderEmail,
              sender_id: m.sender_id,
              text: m.text,
              created_at: m.created_at
            };
          })
        };
      });

      // Filter out mock chats that might conflict or just merge
      setChats(prev => {
        const mockChats = prev.filter(c => typeof c.id === 'number');
        const dbChats = formattedChats;
        // Keep mock chats only if they are not already matched by email in DB chats
        const filteredMockChats = mockChats.filter(mc => 
          !dbChats.some(dc => dc.participants.some(p => mc.participants.includes(p)))
        );
        return [...dbChats, ...filteredMockChats];
      });
    } catch (err) {
      console.error("Exception fetching chats:", err);
    }
  };

  const createSupabaseChat = async (otherUserId, welcomeText) => {
    if (!currentUserId || !otherUserId) return;
    try {
      // 1. Check if chat already exists
      const { data: myChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);

      if (myChats && myChats.length > 0) {
        const chatIds = myChats.map(c => c.chat_id);
        
        const { data: matchingChats } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', otherUserId)
          .in('chat_id', chatIds);

        if (matchingChats && matchingChats.length > 0) {
          const existingChatId = matchingChats[0].chat_id;
          await supabase
            .from('messages')
            .insert({
              chat_id: existingChatId,
              sender_id: currentUserId,
              text: welcomeText
            });
          fetchChatsAndMessages();
          return;
        }
      }

      // 2. Create new chat room
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({})
        .select('id')
        .single();

      if (chatError || !newChat) {
        console.error("Error creating chat room:", chatError);
        return;
      }

      const chatId = newChat.id;

      // 3. Add participants
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chatId, user_id: currentUserId },
          { chat_id: chatId, user_id: otherUserId }
        ]);

      if (partError) {
        console.error("Error adding chat participants:", partError);
        return;
      }

      // 4. Send welcome message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          text: welcomeText
        });

      if (msgError) {
        console.error("Error sending welcome message:", msgError);
        return;
      }

      fetchChatsAndMessages();
    } catch (err) {
      console.error("Exception creating chat:", err);
    }
  };

  const fetchSupabaseNotifications = async () => {
    if (!isAuthenticated || !currentUserId) return;
    try {
      const { data: notifsData, error } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(*), receiver:receiver_id(*), trip:trip_id(*)')
        .or(`receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
        return;
      }

      if (notifsData) {
        const mapped = notifsData.map(n => {
          const senderProf = n.sender || {};
          const receiverProf = n.receiver || {};
          
          return {
            id: n.id,
            type: n.type,
            senderId: n.sender_id,
            receiverId: n.receiver_id,
            receiverEmail: receiverProf.email || "",
            sender: {
              id: senderProf.id,
              name: senderProf.name || "Traveler",
              email: senderProf.email || "",
              avatar: getFallbackAvatar(senderProf.gender, senderProf.avatar),
              location: senderProf.location || "Local Traveler",
              style: senderProf.styles?.[0] || "Explorer"
            },
            trip: n.trip ? {
              id: n.trip.id,
              destination: n.trip.destination,
              hostEmail: receiverProf.email || ""
            } : null,
            status: n.status,
            timestamp: new Date(n.created_at).toLocaleDateString() === new Date().toLocaleDateString()
              ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(n.created_at).toLocaleDateString(),
            read: n.read
          };
        });

        setNotifications(prev => {
          const mockNotifs = prev.filter(n => typeof n.id === 'string' && !n.id.includes('-'));
          const dbNotifs = mapped;
          const filteredMock = mockNotifs.filter(mn => 
            !dbNotifs.some(dn => dn.sender.email === mn.sender.email && dn.type === mn.type && dn.trip?.id === mn.trip?.id)
          );
          return [...dbNotifs, ...filteredMock];
        });
      }
    } catch (err) {
      console.error("Exception loading notifications:", err);
    }
  };

  // Sync Supabase chats and notifications on authentication
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      fetchChatsAndMessages();
      fetchSupabaseNotifications();

      // Subscribe to real-time messages changes to receive updates instantly
      const channel = supabase
        .channel('realtime-messages-room')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchChatsAndMessages();
        })
        .subscribe();

      // Subscribe to real-time notifications changes to receive updates instantly
      const notifChannel = supabase
        .channel('realtime-notifications-room')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          fetchSupabaseNotifications();
          fetchChatsAndMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(notifChannel);
      };
    }
  }, [isAuthenticated, currentUserId]);

  const connectTravelBuddies = (emailA, emailB, detailsA, detailsB) => {
    const isAValidUuid = detailsA.id && typeof detailsA.id === 'string' && detailsA.id.length > 20;
    const isBValidUuid = detailsB.id && typeof detailsB.id === 'string' && detailsB.id.length > 20;

    if (isAValidUuid && isBValidUuid) {
      const id1 = detailsA.id < detailsB.id ? detailsA.id : detailsB.id;
      const id2 = detailsA.id < detailsB.id ? detailsB.id : detailsA.id;
      
      supabase
        .from('buddies')
        .insert({
          user_id_1: id1,
          user_id_2: id2,
          status: 'accepted'
        })
        .then(({ error }) => {
          if (error && error.code !== '23505') {
            console.error("Error inserting buddy connection to Supabase:", error);
          }
        });
    }

    setRegisteredUsers(prev => {
      const updated = prev.map(u => {
        // Add B to A's buddies
        if (u.email && emailA && u.email.toLowerCase() === emailA.toLowerCase()) {
          const currentBuddies = u.buddies || [];
          const exists = currentBuddies.some(b => b.name === detailsB.name);
          if (exists) return u;
          const newBuddies = [...currentBuddies, {
            id: detailsB.id || Date.now(),
            name: detailsB.name,
            avatar: detailsB.avatar,
            location: detailsB.location || "Traveler",
            style: detailsB.style || "Explorer"
          }];
          if (emailA.toLowerCase() === currentUserEmail.toLowerCase()) {
            setBuddies(newBuddies);
          }
          return { ...u, buddies: newBuddies };
        }
        // Add A to B's buddies
        if (u.email && emailB && u.email.toLowerCase() === emailB.toLowerCase()) {
          const currentBuddies = u.buddies || [];
          const exists = currentBuddies.some(b => b.name === detailsA.name);
          if (exists) return u;
          const newBuddies = [...currentBuddies, {
            id: detailsA.id || Date.now(),
            name: detailsA.name,
            avatar: detailsA.avatar,
            location: detailsA.location || "Traveler",
            style: detailsA.style || "Explorer"
          }];
          if (emailB.toLowerCase() === currentUserEmail.toLowerCase()) {
            setBuddies(newBuddies);
          }
          return { ...u, buddies: newBuddies };
        }
        return u;
      });
    });
  };

  const deleteTrip = async (tripId) => {
    try {
      const isSupabaseId = typeof tripId === 'string' && tripId.includes('-');
      if (isSupabaseId) {
        const { data, error } = await supabase
          .from('trips')
          .delete()
          .eq('id', tripId)
          .select();
        if (error) {
          console.error("Error deleting trip from Supabase:", error);
          return { error };
        }
        if (!data || data.length === 0) {
          console.warn("No rows affected or unauthorized delete for trip:", tripId);
          return { error: new Error("Unauthorized: You do not have permission to delete this trip.") };
        }
      }
      setTrips(prev => prev.filter(t => t.id !== tripId));
      return { success: true };
    } catch (err) {
      console.error("Exception deleting trip:", err);
      return { error: err };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out:", e);
    }
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setCurrentUserId('');
  };

  const handleAcceptNotification = async (notif) => {
    // Handle Connect Request Notification Accept
    if (notif.type === 'connect_request') {
      const isSupabaseNotif = typeof notif.id === 'string' && notif.id.includes('-');
      
      if (isSupabaseNotif) {
        // Update notification status to accepted
        await supabase
          .from('notifications')
          .update({ status: 'accepted', read: true })
          .eq('id', notif.id);
        
        // Insert connect_accepted notification for the sender
        await supabase
          .from('notifications')
          .insert({
            type: 'connect_accepted',
            sender_id: currentUserId,
            receiver_id: notif.sender.id,
            status: 'accepted',
            read: false
          });
      } else {
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
        setNotifications(prev => [acceptanceNotification, ...prev.map(n => n.id === notif.id ? { ...n, status: 'accepted', read: true } : n)]);
      }

      // Add as travel buddies to BOTH users
      connectTravelBuddies(currentUserEmail, notif.sender.email, {
        id: currentUserId,
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
      if (notif.sender.id && typeof notif.sender.id === 'string' && notif.sender.id.length > 20) {
        await createSupabaseChat(notif.sender.id, `Hey! I accepted your connection request. Let's travel together!`);
      } else {
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
      }
      
      if (isSupabaseNotif) {
        fetchSupabaseNotifications();
      }
      return;
    }

    // Handle Join Request Notification Accept
    const isSupabaseNotif = typeof notif.id === 'string' && notif.id.includes('-');

    if (isSupabaseNotif) {
      // Update notification status to accepted
      await supabase
        .from('notifications')
        .update({ status: 'accepted', read: true })
        .eq('id', notif.id);
      
      // Insert request_accepted notification for the sender
      await supabase
        .from('notifications')
        .insert({
          type: 'request_accepted',
          sender_id: currentUserId,
          receiver_id: notif.sender.id,
          trip_id: notif.trip.id,
          status: 'accepted',
          read: false
        });
    } else {
      // 1. Update notification status to accepted in context
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'accepted', read: true } : n));
      
      // 2. Push a new "request_accepted" notification for the sender of the request
      const acceptanceNotification = {
        id: `accept-${Date.now()}`,
        type: "request_accepted",
        receiverEmail: notif.sender.email,
        sender: {
          name: userProfile.name,
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
    }

    // 3. Add as travel buddies to BOTH users
    connectTravelBuddies(currentUserEmail, notif.sender.email, {
      id: currentUserId,
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
    if (notif.sender.id && typeof notif.sender.id === 'string' && notif.sender.id.length > 20) {
      await createSupabaseChat(notif.sender.id, `Hey! Thanks for accepting my request to join your trip to ${notif.trip.destination}. Let's coordinate details here.`);
    } else {
      setChats(prev => {
        const chatIndex = prev.findIndex(c => 
          c.participants.includes(currentUserEmail) && c.participants.includes(notif.sender.email)
        );

        const welcomeMsg = {
          id: Date.now(),
          senderEmail: notif.sender.email,
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
    }

    if (isSupabaseNotif) {
      fetchSupabaseNotifications();
    }
  };

  // Send a connect request (notification) to another user
  const sendConnectRequest = async (targetUser) => {
    if (!currentUserId || !targetUser?.id) return { error: 'Missing IDs' };
    try {
      // Insert connect_request notification for the target user
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: 'connect_request',
          sender_id: currentUserId,
          receiver_id: targetUser.id,
          status: 'pending',
          read: false
        });
      if (error) {
        console.error('Error sending connect request:', error);
        return { error };
      }
      await fetchSupabaseNotifications();
      return { success: true };
    } catch (err) {
      console.error('Exception sending connect request:', err);
      return { error: err };
    }
  };

  const handleDeclineNotification = async (notif) => {
    const isSupabaseNotif = typeof notif.id === 'string' && notif.id.includes('-');

    if (isSupabaseNotif) {
      await supabase
        .from('notifications')
        .update({ status: 'declined', read: true })
        .eq('id', notif.id);
      fetchSupabaseNotifications();
    } else {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'declined', read: true } : n));
    }
  };

  return (
    <TravelContext.Provider value={{ 
      buddies, 
      setBuddies, 
      userProfile, 
      setUserProfile, 
      isAuthenticated, 
      setIsAuthenticated,
      registeredUsers,
      setRegisteredUsers,
      currentUserEmail,
      setCurrentUserEmail,
      currentUserId,
      setCurrentUserId,
      trips,
      setTrips,
      loading,
      setLoading,
      notifications,
      setNotifications,
      chats,
      setChats,
      connectTravelBuddies,
      sendConnectRequest,
      calculateAge,
      createSupabaseChat,
      fetchSupabaseNotifications,
      fetchChatsAndMessages,
      handleAcceptNotification,
      handleDeclineNotification,
      deleteTrip,
      logout
    }}>
      {children}
    </TravelContext.Provider>
  );
}
