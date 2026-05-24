import { useState, useContext } from 'react';
import { TravelContext } from '../context.jsx';
import { Check, X, MapPin, Plane, ChevronLeft, ChevronRight } from 'lucide-react';

const mockSuggestions = [
  {
    id: 102,
    name: "Vikram Singh",
    email: "vikram@wanderconnect.com",
    age: 26,
    gender: "Male",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=400&q=80",
    location: "Delhi",
    style: "Adventure",
    bio: "Always looking for the next mountain to climb. Let's do a bike trip to Leh!",
    nextTrip: "Leh, Ladakh (Aug 15 - 25)"
  },
  {
    id: 103,
    name: "Neha Patel",
    email: "neha@wanderconnect.com",
    age: 24,
    gender: "Female",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=400&q=80",
    location: "Ahmedabad",
    style: "Foodie & Culture",
    bio: "Planning a trip to Rajasthan to explore forts and eat amazing local food. Looking for a buddy!",
    nextTrip: "Jaipur, Rajasthan (Oct 10 - 15)"
  },
  {
    id: 104,
    name: "Rahul Nair",
    email: "rahul@wanderconnect.com",
    age: 28,
    gender: "Male",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&w=400&q=80",
    location: "Kochi",
    style: "Relaxation",
    bio: "Backpacker heading to Varkala for a month. Surf, chill, and repeat.",
    nextTrip: "Varkala, Kerala (Dec 1 - 31)"
  }
];

export default function Connect() {
  const { setBuddies, setChats, currentUserEmail, buddies, userProfile, connectTravelBuddies, registeredUsers, calculateAge, loading } = useContext(TravelContext);
  const [passedUserIds, setPassedUserIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchAlert, setMatchAlert] = useState(null);

  // Combine registered users and mock suggestions, using email as unique key
  const allProfiles = [];
  
  // Add registered users
  (registeredUsers || []).forEach((u, index) => {
    const prof = u.profile || {};
    const ageVal = prof.dob ? calculateAge(prof.dob) : (prof.age || 26);
    allProfiles.push({
      id: u.id || `reg-${u.email}-${index}`,
      name: prof.name || u.name,
      email: u.email,
      age: ageVal,
      gender: prof.gender || "Male",
      avatar: prof.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      location: prof.location || "Delhi",
      style: prof.styles?.[0] || "Explorer",
      bio: prof.bio || "Hey there! Let's explore the world together.",
      nextTrip: prof.nextTrip || "Leh, Ladakh (Aug 15 - 25)"
    });
  });

  // Add mock suggestions that are not already in the list
  mockSuggestions.forEach(s => {
    if (!allProfiles.some(p => p.email.toLowerCase() === s.email.toLowerCase())) {
      allProfiles.push(s);
    }
  });

  // Derive suggested profiles dynamically by filtering out current user, connected buddies, and passed profiles
  const suggestions = allProfiles.filter(s => 
    s.email.toLowerCase() !== currentUserEmail.toLowerCase() && 
    !buddies.some(b => b.name === s.name) &&
    !passedUserIds.includes(s.id)
  );

  const handleAction = (user, action) => {
    if (action === 'accept') {
      // Add as travel buddies to BOTH users
      connectTravelBuddies(currentUserEmail, user.email, {
        id: Date.now(),
        name: userProfile.name,
        avatar: userProfile.avatar,
        location: userProfile.location || "Traveler",
        style: userProfile.styles?.[0] || "Explorer"
      }, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
        style: user.style
      });

      // Create new chat thread
      const welcomeMsg = {
        id: Date.now(),
        senderEmail: user.email,
        text: `Hey! We matched on WanderConnect. Let's travel together!`
      };

      setChats(prev => {
        const exists = prev.some(c => 
          c.participants.includes(currentUserEmail) && c.participants.includes(user.email)
        );
        if (exists) return prev;
        
        return [{
          id: Date.now(),
          participants: [currentUserEmail, user.email],
          name: user.name,
          avatar: user.avatar,
          time: "Just now",
          unread: 1,
          active: false,
          messages: [welcomeMsg]
        }, ...prev];
      });
      
      // Show Match Alert
      setMatchAlert(user);
      setTimeout(() => {
        setMatchAlert(null);
      }, 3000);
    } else {
      // For pass, add to passedUserIds
      setPassedUserIds(prev => [...prev, user.id]);
    }

    // Adjust currentIndex
    setCurrentIndex(prev => {
      const nextLength = suggestions.length - 1;
      if (prev >= nextLength) {
        return Math.max(0, nextLength - 1);
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem' }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid var(--border-color)',
          borderTop: '5px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1.5rem'
        }}></div>
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Finding travel buddies in your region...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>No more suggestions for now!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Check back later for more travel buddies.</p>
      </div>
    );
  }

  const currentUser = suggestions[currentIndex];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '2rem' }}>
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>Connect</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>
        Profile {currentIndex + 1} of {suggestions.length}
      </div>

      {matchAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--success)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Check size={24} />
          <strong>It's a Match!</strong> You and {matchAlert.name} are now travel buddies!
        </div>
      )}

      <div className="trip-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          style={{ width: '100%', height: '400px', objectFit: 'cover' }} 
        />
        
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '100%', 
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          color: 'white',
          padding: '2rem 1.5rem 1rem'
        }}>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentUser.name}, {currentUser.age} <span style={{ fontSize: '1.2rem', opacity: 0.8, color: 'var(--primary)' }}>({currentUser.gender})</span>
          </h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <MapPin size={16} /> {currentUser.location}
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>
            <Plane size={16} /> Next Trip: {currentUser.nextTrip}
          </p>
          <div style={{ background: 'var(--primary)', display: 'inline-block', padding: '0.2rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
            {currentUser.style}
          </div>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
            {currentUser.bio}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Previous Button */}
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'white', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentIndex === 0 ? 0.4 : 1,
            transition: 'var(--transition)'
          }}
          onMouseOver={e => { if (currentIndex > 0) e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          title="Previous Profile"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Pass Button */}
        <button 
          onClick={() => handleAction(currentUser, 'pass')}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'white', border: '2px solid var(--danger)',
            color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'var(--transition)'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Pass"
        >
          <X size={32} />
        </button>
        
        {/* Accept Button */}
        <button 
          onClick={() => handleAction(currentUser, 'accept')}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--success)', border: 'none',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'var(--transition)'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Connect"
        >
          <Check size={32} />
        </button>

        {/* Next Button */}
        <button 
          onClick={() => setCurrentIndex(prev => Math.min(suggestions.length - 1, prev + 1))}
          disabled={currentIndex === suggestions.length - 1}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'white', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', cursor: currentIndex === suggestions.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentIndex === suggestions.length - 1 ? 0.4 : 1,
            transition: 'var(--transition)'
          }}
          onMouseOver={e => { if (currentIndex < suggestions.length - 1) e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          title="Next Profile"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
