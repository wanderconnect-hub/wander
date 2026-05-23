/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';

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
          // Ensure buddies array is initialized for every user
          return parsed.map(u => {
            if (!u.buddies) {
              const defaultBuddies = u.email.toLowerCase() === 'alex@wanderconnect.com' ? [
                { 
                  id: 101, 
                  name: "Aditi Rao", 
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&w=150&q=80",
                  location: "Mumbai",
                  style: "Backpacker"
                }
              ] : [];
              return { ...u, buddies: defaultBuddies };
            }
            return u;
          });
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
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('wc_registeredUsers', JSON.stringify(registeredUsers));
  }, [registeredUsers]);





  // Current User Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('wc_userProfile');
    return saved ? JSON.parse(saved) : {
      name: "Alex Chen",
      bio: "Hey! I'm Alex. I've been traveling full-time for the last 2 years. I love finding off-the-beaten-path locations, trying local street food, and hiking up to great viewpoints. I'm generally pretty easy-going and love deep conversations over a coffee or beer. Looking for travel buddies who don't mind waking up early for sunrise shots!",
      styles: ["Backpacking", "Photography", "Foodie", "Budget"],
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      title: "Digital Nomad & Adventure Photographer",
      gender: "Male",
      dob: "1997-04-12"
    };
  });

  useEffect(() => {
    localStorage.setItem('wc_userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('wc_isAuthenticated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('wc_isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    return localStorage.getItem('wc_currentUserEmail') || '';
  });

  useEffect(() => {
    localStorage.setItem('wc_currentUserEmail', currentUserEmail);
  }, [currentUserEmail]);

  // Initial travel buddies for the user (synced per registered user account)
  const [buddies, setBuddies] = useState([]);

  // Sync buddies state when the logged-in email changes
  useEffect(() => {
    if (currentUserEmail) {
      const user = registeredUsers.find(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
      if (user) {
        setBuddies(user.buddies || []);
      }
    } else {
      setBuddies([]);
    }
  }, [currentUserEmail, registeredUsers]);

  // Shared Trips State (moved from Feed.jsx to make it global)
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('wc_trips');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(t => {
          if (t.image === "https://images.unsplash.com/photo-1610715936287-6c2ab208cb22?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80") {
            return { ...t, image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" };
          }
          return t;
        });
      } catch (e) {
        console.error(e);
      }
    }
    return [
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
  });

  useEffect(() => {
    localStorage.setItem('wc_trips', JSON.stringify(trips));
  }, [trips]);

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

  useEffect(() => {
    localStorage.setItem('wc_notifications', JSON.stringify(notifications));
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
    localStorage.setItem('wc_chats', JSON.stringify(chats));
  }, [chats]);

  const connectTravelBuddies = (emailA, emailB, detailsA, detailsB) => {
    setRegisteredUsers(prev => {
      const updated = prev.map(u => {
        // Add B to A's buddies
        if (u.email.toLowerCase() === emailA.toLowerCase()) {
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
        if (u.email.toLowerCase() === emailB.toLowerCase()) {
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
      return updated;
    });
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
      trips,
      setTrips,
      notifications,
      setNotifications,
      chats,
      setChats,
      connectTravelBuddies,
      calculateAge
    }}>
      {children}
    </TravelContext.Provider>
  );
}
