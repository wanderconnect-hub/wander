import { useContext, useState } from 'react';
import { Shield, Map, Star, Edit3, Settings, Users, X } from 'lucide-react';
import { TravelContext } from '../context.jsx';

export default function Profile() {
  const { buddies, userProfile, setUserProfile, currentUserEmail, setRegisteredUsers, calculateAge } = useContext(TravelContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  const handleSave = (e) => {
    e.preventDefault();
    setUserProfile(editForm);
    
    // Also update the registered database so changes persist across logout/login
    if (currentUserEmail) {
      setRegisteredUsers(prev => prev.map(u => 
        u.email.toLowerCase() === currentUserEmail.toLowerCase() ? { ...u, profile: editForm } : u
      ));
    }
    
    setIsEditModalOpen(false);
  };
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Travel Profile</h1>
        <div>
          <button className="btn btn-outline" style={{ marginRight: '1rem' }}>
            <Settings size={20} />
          </button>
          <button className="btn btn-primary" onClick={() => { setEditForm(userProfile); setIsEditModalOpen(true); }}>
            <Edit3 size={20} />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="profile-header">
        <img 
          src={userProfile.avatar} 
          alt={userProfile.name} 
          className="profile-avatar"
        />
        
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{userProfile.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            {userProfile.title}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {userProfile.gender || 'Male'} • {userProfile.dob ? `${calculateAge(userProfile.dob)} years old` : '26 years old'}
          </p>
          
          <div className="trust-score">
            <Shield size={20} />
            ID Verified • Trust Score: 98%
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">12</div>
              <div className="stat-label">Trips</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{24 + buddies.length}</div>
              <div className="stat-label">Connections</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">4.9</div>
              <div className="stat-label"><Star size={16} style={{ display: 'inline', marginTop: '-4px' }}/> Rating</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="trip-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Map size={24} color="var(--primary)" />
            Travel Style
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
            {userProfile.styles.map(style => (
              <span key={style} className="filter-chip">{style}</span>
            ))}
          </div>

          <h3 style={{ marginBottom: '1rem' }}>About Me</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
            {userProfile.bio}
          </p>
        </div>
        
        <div className="trip-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Reviews</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=50&q=80" 
                  alt="Reviewer" 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h5 style={{ fontSize: '0.95rem' }}>Sarah Jenkins</h5>
                  <div style={{ color: 'var(--success)', display: 'flex', gap: '2px' }}>
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                "Alex was an amazing travel buddy for our trip to Thailand! Super respectful, great at navigating, and took the best photos of our group."
              </p>
            </div>
          </div>
        </div>
        <div className="trip-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} color="var(--primary)" />
            Travel Buddies
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {buddies.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No travel buddies yet. Head to Connect to find some!</p>
            ) : (
              buddies.map((buddy, index) => (
                <div key={buddy.id || buddy.name || index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                  <img src={buddy.avatar} alt={buddy.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h5 style={{ fontSize: '1rem' }}>{buddy.name}</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{buddy.location} • {buddy.style}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <div className={`modal-overlay ${isEditModalOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Edit Profile</h2>
            <button className="close-modal" onClick={() => setIsEditModalOpen(false)}><X size={24} /></button>
          </div>
          
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <img 
                src={editForm.avatar} 
                alt="Avatar Preview" 
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} 
              />
              <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Change Picture
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditForm({ ...editForm, avatar: reader.result });
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }} 
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }} className="form-group">
              <div style={{ flex: 1 }}>
                <label className="form-label">Gender</label>
                <select 
                  className="form-control" 
                  value={editForm.gender || 'Male'} 
                  onChange={e => setEditForm({...editForm, gender: e.target.value})} 
                  required
                  style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)', height: '42px' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={editForm.dob || '1997-04-12'} 
                  onChange={e => setEditForm({...editForm, dob: e.target.value})} 
                  required
                  style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)', height: '42px', padding: '0.5rem' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Title / Tagline</label>
              <input type="text" className="form-control" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Travel Styles (comma separated)</label>
              <input type="text" className="form-control" value={editForm.styles.join(', ')} onChange={e => setEditForm({...editForm, styles: e.target.value.split(',').map(s => s.trim())})} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">About Me (Bio)</label>
              <textarea 
                className="form-control" 
                rows="4" 
                value={editForm.bio}
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                required
              ></textarea>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
