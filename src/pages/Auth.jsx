import { useState, useContext } from 'react';
import { Mail, Lock, User as UserIcon, Globe } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';

export default function Auth() {
  const { setIsAuthenticated, setUserProfile, setCurrentUserEmail } = useContext(TravelContext);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', gender: '', dob: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFormData({ name: '', email: '', password: '', gender: '', dob: '' });
    setErrorMsg('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (authMode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim());
      if (error) {
        setErrorMsg(error.message);
      } else {
        alert("Password reset link sent to your email!");
        switchMode('login');
      }
      return;
    }

    if (authMode === 'register') {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.gender || !formData.dob) {
        setErrorMsg('All fields are required.');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            gender: formData.gender,
            dob: formData.dob
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      const defaultAvatars = {
        Male: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
        Female: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
        "Non-binary": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
        Other: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
      };

      const userProfileData = {
        name: formData.name.trim(),
        bio: "Tell us about yourself! Click 'Edit Profile' to add your bio, tagline, and travel styles.",
        styles: ["Adventurer"],
        avatar: defaultAvatars[formData.gender] || defaultAvatars.Male,
        title: "New Traveler",
        gender: formData.gender,
        dob: formData.dob
      };

      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          ...userProfileData
        });
      } catch (err) {
        console.error("Profile upsert failed (handled by DB trigger):", err);
      }

      if (!data.session) {
        alert("Registration successful! A confirmation email has been sent. Please verify your email and then sign in.");
        switchMode('login');
      } else {
        setUserProfile(userProfileData);
        setCurrentUserEmail(data.user.email);
        setIsAuthenticated(true);
      }
    } else if (authMode === 'login') {
      if (!formData.email.trim() || !formData.password.trim()) {
        setErrorMsg('Email and password are required.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        setUserProfile({
          name: profile.name,
          bio: profile.bio || "Tell us about yourself!",
          styles: profile.styles || [],
          avatar: profile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
          title: profile.title || "Traveler",
          gender: profile.gender,
          dob: profile.dob
        });
      } else {
        setUserProfile({
          name: data.user.email,
          bio: "Tell us about yourself!",
          styles: ["Adventurer"],
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
          title: "Traveler"
        });
      }

      setCurrentUserEmail(data.user.email);
      setIsAuthenticated(true);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)'
    }}>
      {/* Left side - Image & Branding */}
      <div style={{
        flex: 1,
        background: `linear-gradient(rgba(0, 78, 137, 0.7), rgba(0, 78, 137, 0.9)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        color: 'white',
        '@media (maxWidth: 768px)': { display: 'none' } // Simple responsive hide can be done in CSS, but inline needs JS check or CSS classes. I'll add a class for it below.
      }} className="auth-hero">
        <div className="logo" style={{ color: 'white', fontSize: '3rem', marginBottom: '1.5rem', justifyContent: 'flex-start' }}>
          <Globe size={48} color="var(--primary)" style={{ animation: 'spin 25s linear infinite' }} />
          Wander<span style={{ color: 'var(--primary)' }}>Connect</span>
        </div>
        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '800' }}>
          Find Your Next <br /> Travel Buddy.
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: '0.9', maxWidth: '500px' }}>
          Join thousands of travelers exploring the world together. Safe, verified, and community-driven.
        </p>
      </div>

      {/* Right side - Forms */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--card-bg)'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in">
          <div className="auth-mobile-logo" style={{ display: 'none', justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="logo" style={{ fontSize: '2rem' }}>
              <Globe size={32} color="var(--primary)" style={{ animation: 'spin 20s linear infinite' }} />
              Wander<span style={{ color: 'var(--primary)' }}>Connect</span>
            </div>
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'register' && 'Create an Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: errorMsg ? '1rem' : '2.5rem' }}>
            {authMode === 'login' && 'Please enter your details to sign in.'}
            {authMode === 'register' && 'Start your journey with us today.'}
            {authMode === 'forgot' && 'Enter your email to receive a reset link.'}
          </p>

          {errorMsg && (
            <div style={{
              background: 'rgba(235, 87, 87, 0.1)',
              borderLeft: '4px solid var(--danger)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              fontWeight: '500'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {authMode === 'register' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-control" placeholder="John Doe" style={{ paddingLeft: '3rem' }} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control"
                      required
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)', height: '48px' }}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      style={{ background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border-color)', height: '48px', padding: '0.5rem' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" placeholder="hello@wanderconnect.com" style={{ paddingLeft: '3rem' }} required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                  {authMode === 'login' && (
                    <button type="button" onClick={() => switchMode('forgot')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" className="form-control" placeholder="••••••••" style={{ paddingLeft: '3rem' }} required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1.1rem' }}>
              {authMode === 'login' && 'Sign In'}
              {authMode === 'register' && 'Sign Up'}
              {authMode === 'forgot' && 'Send Reset Link'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            {authMode === 'login' && (
              <>Don't have an account? <button onClick={() => switchMode('register')} style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign up</button></>
            )}
            {authMode === 'register' && (
              <>Already have an account? <button onClick={() => switchMode('login')} style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in</button></>
            )}
            {authMode === 'forgot' && (
              <>Remembered your password? <button onClick={() => switchMode('login')} style={{ color: 'var(--primary)', fontWeight: '700' }}>Back to sign in</button></>
            )}
          </div>
        </div>
      </div>

      {/* Quick CSS for Auth responsive */}
      <style>{`
        @media (max-width: 768px) {
          .auth-hero { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
