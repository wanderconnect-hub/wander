import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Map, Star, Edit3, Settings, Users, X, MessageSquare, ArrowLeft, Loader } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';
import { DEFAULT_AVATARS, getFallbackAvatar } from '../utils/avatars';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Profile() {
  const { buddies, userProfile, setUserProfile, currentUserEmail, currentUserId, setRegisteredUsers, calculateAge, registeredUsers, createSupabaseChat, trips, notifications, chats } = useContext(TravelContext);
  const { userId } = useParams();
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === currentUserId || userId === currentUserEmail;

  // ─── Local lookup first ───────────────────────────────────────────────────
  let localTargetUser = null;
  if (!isOwnProfile) {
    localTargetUser = registeredUsers.find(u =>
      (u.id   && String(u.id) === String(userId)) ||
      (u.email && userId && u.email.toLowerCase() === userId.toLowerCase()) ||
      (u.profile?.name && userId && u.profile.name.toLowerCase() === decodeURIComponent(userId).toLowerCase()) ||
      (u.name  && userId && u.name.toLowerCase()  === decodeURIComponent(userId).toLowerCase())
    );
  }

  // ─── Remote fetch state (for users not in local cache) ───────────────────
  const [remoteProfile, setRemoteProfile] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteFetched, setRemoteFetched] = useState(false);

  useEffect(() => {
    // Only fetch remotely if:
    //   • viewing someone else's profile, AND
    //   • not found in local registeredUsers, AND
    //   • haven't fetched yet for this userId
    if (isOwnProfile || localTargetUser) {
      setRemoteProfile(null);
      setRemoteFetched(false);
      return;
    }

    let cancelled = false;
    setLoadingRemote(true);

    const fetchRemote = async () => {
      try {
        let query;
        if (UUID_REGEX.test(userId)) {
          // UUID → look up by id column
          query = supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        } else {
          // email / name → try email first
          query = supabase.from('profiles').select('*').ilike('email', userId).maybeSingle();
        }

        const { data, error } = await query;

        if (!cancelled) {
          if (error) {
            console.error('Remote profile fetch error:', error);
          } else if (data) {
            setRemoteProfile({
              id: data.id,
              email: data.email || userId,
              buddies: [],
              profile: {
                name: data.name || 'Traveler',
                bio: data.bio || 'No bio added yet.',
                styles: data.styles || ['Explorer'],
                avatar: getFallbackAvatar(data.gender, data.avatar),
                title: data.title || 'Traveler',
                gender: data.gender || 'Male',
                dob: data.dob || null,
              }
            });
          }
          setRemoteFetched(true);
          setLoadingRemote(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Remote profile fetch exception:', e);
          setRemoteFetched(true);
          setLoadingRemote(false);
        }
      }
    };

    fetchRemote();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isOwnProfile]);

  // ─── Resolve target user (local wins, then remote) ────────────────────────
  const targetUser = localTargetUser || remoteProfile;
  const targetId = isOwnProfile ? currentUserId : targetUser?.id;
  const targetEmail = isOwnProfile ? currentUserEmail : (targetUser?.email || targetUser?.profile?.email);

  const [targetJoinedTripIds, setTargetJoinedTripIds] = useState(new Set());
  const [targetChatsCount, setTargetChatsCount] = useState(0);

  useEffect(() => {
    if (isOwnProfile || !targetId) {
      setTargetJoinedTripIds(new Set());
      return;
    }

    let active = true;
    supabase
      .from('notifications')
      .select('trip_id')
      .eq('sender_id', targetId)
      .eq('type', 'join_request')
      .eq('status', 'accepted')
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching target user joined trips:", error);
        } else if (data && active) {
          const ids = new Set(data.map(n => n.trip_id).filter(Boolean));
          setTargetJoinedTripIds(ids);
        }
      });

    return () => { active = false; };
  }, [targetId, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile || !targetId) {
      setTargetChatsCount(0);
      return;
    }

    let active = true;
    supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', targetId)
      .then(async ({ data: myLinks, error }) => {
        if (error || !myLinks || myLinks.length === 0) {
          if (active) setTargetChatsCount(0);
          return;
        }

        const chatIds = myLinks.map(l => l.chat_id);
        const { data: allParts, error: partsErr } = await supabase
          .from('chat_participants')
          .select('chat_id, user_id')
          .in('chat_id', chatIds)
          .neq('user_id', targetId);

        if (partsErr || !allParts) {
          if (active) setTargetChatsCount(0);
          return;
        }

        const targetBuddies = targetUser?.buddies || [];
        const activePartners = new Set();
        
        allParts.forEach(p => {
          const isBuddy = targetBuddies.some(b => 
            b.id === p.user_id || 
            (b.email && typeof p.user_id === 'string' && b.email.toLowerCase() === p.user_id.toLowerCase())
          );
          if (isBuddy) {
            activePartners.add(p.user_id);
          }
        });

        if (active) {
          setTargetChatsCount(activePartners.size);
        }
      });

    return () => { active = false; };
  }, [targetId, isOwnProfile, targetUser]);

  // Calculate Trip Count
  const postedTrips = trips.filter(t => 
    (targetId && t.host?.id === targetId) ||
    (targetEmail && t.host?.email?.toLowerCase() === targetEmail.toLowerCase())
  );

  const joinedTripIds = new Set();
  if (isOwnProfile) {
    notifications.forEach(n => {
      const isSenderOfAcceptedJoin = n.type === 'join_request' && n.status === 'accepted' && (
        (currentUserId && n.senderId === currentUserId) ||
        (currentUserEmail && n.sender?.email?.toLowerCase() === currentUserEmail.toLowerCase())
      );
      const isReceiverOfAcceptedRequest = n.type === 'request_accepted' && (
        (currentUserId && n.receiverId === currentUserId) ||
        (currentUserEmail && n.receiverEmail?.toLowerCase() === currentUserEmail.toLowerCase())
      );
      if ((isSenderOfAcceptedJoin || isReceiverOfAcceptedRequest) && n.trip?.id) {
        joinedTripIds.add(n.trip.id);
      }
    });
  } else {
    targetJoinedTripIds.forEach(id => joinedTripIds.add(id));
  }

  const userTripIds = new Set();
  postedTrips.forEach(t => userTripIds.add(t.id));
  joinedTripIds.forEach(id => userTripIds.add(id));
  const tripCount = userTripIds.size;

  // Calculate Connection Count
  const connectionCount = (() => {
    if (isOwnProfile) {
      const userChats = chats.filter(chat => 
        chat.participants.includes(currentUserId) ||
        (currentUserEmail && chat.participants.includes(currentUserEmail)) ||
        chat.participants.some(p => p && typeof p === 'string' && currentUserEmail && p.toLowerCase() === currentUserEmail.toLowerCase())
      );

      const activeChatPartners = new Set();
      userChats.forEach(chat => {
        const otherParticipant = chat.participants.find(p => 
          p !== currentUserId && 
          p !== currentUserEmail && 
          (p && typeof p === 'string' && currentUserEmail && p.toLowerCase() !== currentUserEmail.toLowerCase())
        );
        
        if (otherParticipant) {
          const isBuddy = buddies.some(b => 
            b.id === otherParticipant || 
            (b.email && typeof otherParticipant === 'string' && b.email.toLowerCase() === otherParticipant.toLowerCase())
          );
          if (isBuddy) {
            activeChatPartners.add(otherParticipant);
          }
        }
      });
      return activeChatPartners.size;
    } else {
      return targetChatsCount;
    }
  })();

  // ─── Display profile ──────────────────────────────────────────────────────
  const displayProfileRaw = isOwnProfile
    ? userProfile
    : (targetUser?.profile || {
        name: 'Traveler',
        bio: 'Bio not available.',
        styles: ['Explorer'],
        avatar: getFallbackAvatar('Male'),
        title: 'Adventure Partner',
        gender: 'Male',
        dob: '1997-04-12',
      });

  const displayProfile = {
    ...displayProfileRaw,
    bio:
      !isOwnProfile && displayProfileRaw.bio && displayProfileRaw.bio.includes('Click Edit Profile')
        ? 'No bio added yet.'
        : displayProfileRaw.bio,
  };

  const displayBuddies = isOwnProfile ? buddies : (targetUser?.buddies || []);

  // ─── Local state ──────────────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const handleMessageUser = async () => {
    if (!targetUser) return;
    setMessaging(true);
    try {
      const otherId = targetUser.id;
      const otherEmail = targetUser.email;
      if (otherId) {
        await createSupabaseChat(otherId, `Hey! I was looking at your travel profile and wanted to connect.`);
      }
      navigate('/messages', { state: { selectUserEmail: otherEmail || otherId } });
    } catch (e) {
      console.error('Failed to message user:', e);
    } finally {
      setMessaging(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setUserProfile(editForm);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: editForm.name,
            title: editForm.title,
            bio: editForm.bio,
            avatar: editForm.avatar,
            styles: editForm.styles || [],
            gender: editForm.gender,
            dob: editForm.dob
          })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to update profile in Supabase:', error);
          alert('Error saving profile to database: ' + error.message);
        }
      }
    } catch (err) {
      console.error('Failed to sync profile update to Supabase:', err);
    } finally {
      setSaving(false);
    }

    if (currentUserEmail) {
      setRegisteredUsers(prev =>
        prev.map(u =>
          (u.id === currentUserId || (u.email && u.email.toLowerCase() === currentUserEmail.toLowerCase()))
            ? { ...u, profile: editForm }
            : u
        )
      );
    }

    setIsEditModalOpen(false);
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (!isOwnProfile && loadingRemote && !localTargetUser) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <Loader size={36} style={{ animation: 'spin 1s linear infinite' }} color="var(--primary)" />
        <p>Loading profile...</p>
      </div>
    );
  }

  // ─── Not found state ──────────────────────────────────────────────────────
  if (!isOwnProfile && remoteFetched && !targetUser) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        <Users size={48} style={{ opacity: 0.4 }} />
        <h2>Profile Not Found</h2>
        <p>This traveler's profile could not be found.</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          {isOwnProfile ? 'Travel Profile' : `${displayProfile.name}'s Profile`}
        </h1>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          {!isOwnProfile && (
            <button className="btn btn-outline" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              Back
            </button>
          )}
          {!isOwnProfile && targetUser && (
            <button className="btn btn-primary" onClick={handleMessageUser} disabled={messaging}>
              <MessageSquare size={20} />
              {messaging ? 'Starting Chat...' : 'Send Message'}
            </button>
          )}
          {isOwnProfile && (
            <>
              <button className="btn btn-outline">
                <Settings size={20} />
              </button>
              <button className="btn btn-primary" onClick={() => { setEditForm(userProfile); setIsEditModalOpen(true); }}>
                <Edit3 size={20} />
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-header">
        <img
          src={getFallbackAvatar(displayProfile.gender, displayProfile.avatar)}
          alt={displayProfile.name}
          className="profile-avatar"
        />

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{displayProfile.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            {displayProfile.title}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {displayProfile.gender || 'Male'} • {displayProfile.dob ? `${calculateAge(displayProfile.dob)} years old` : '26 years old'}
          </p>

          <div className="trust-score">
            <Shield size={20} />
            ID Verified • Trust Score: 98%
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">{tripCount}</div>
              <div className="stat-label">Trips</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{connectionCount}</div>
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
            {(displayProfile.styles || []).map(style => (
              <span key={style} className="filter-chip">{style}</span>
            ))}
          </div>

          <h3 style={{ marginBottom: '1rem' }}>About Me</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
            {displayProfile.bio}
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
                "Amazing travel buddy! Super respectful, great at navigating, and took the best photos of our group."
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
            {displayBuddies.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No travel buddies yet. Head to Connect to find some!</p>
            ) : (
              displayBuddies.map((buddy, index) => (
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

      {/* Edit Profile Modal – only shown on own profile */}
      {isOwnProfile && (
        <div className={`modal-overlay ${isEditModalOpen ? 'active' : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-modal" onClick={() => setIsEditModalOpen(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <img
                  src={getFallbackAvatar(editForm.gender || 'Male', editForm.avatar)}
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
                        const file = e.target.files[0];
                        if (file.size > 1024 * 1024) {
                          alert('Please select an image file under 1MB to avoid database/storage size issues.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm({ ...editForm, avatar: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>

              <div className="form-row form-group">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={editForm.gender || 'Male'}
                    onChange={e => {
                      const nextGender = e.target.value;
                      const isUsingDefault = Object.values(DEFAULT_AVATARS).includes(editForm.avatar) ||
                                             (typeof editForm.avatar === 'string' && editForm.avatar.includes('unsplash.com'));
                      if (isUsingDefault) {
                        setEditForm({ ...editForm, gender: nextGender, avatar: DEFAULT_AVATARS[nextGender] || DEFAULT_AVATARS.Male });
                      } else {
                        setEditForm({ ...editForm, gender: nextGender });
                      }
                    }}
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
                <input type="text" className="form-control" value={(editForm.styles || []).join(', ')} onChange={e => setEditForm({...editForm, styles: e.target.value.split(',').map(s => s.trim())})} required />
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

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ width: '100%', padding: '1rem', opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
