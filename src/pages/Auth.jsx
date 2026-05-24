import { useState, useContext } from 'react';
import { Mail, Lock, User as UserIcon, Globe } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';

export default function Auth() {
  const {
    setIsAuthenticated,
    setUserProfile,
    setCurrentUserEmail
  } = useContext(TravelContext);

  const [authMode, setAuthMode] = useState('login'); // login | register | forgot
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
    dob: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFormData({ name: '', email: '', password: '', gender: '', dob: '' });
    setErrorMsg('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const email = formData.email.trim().toLowerCase();

    try {
      // ---------------- FORGOT PASSWORD ----------------
      if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        alert("Password reset link sent to your email!");
        switchMode('login');
        return;
      }

      // ---------------- REGISTER ----------------
      if (authMode === 'register') {
        if (
          !formData.name.trim() ||
          !email ||
          !formData.password ||
          !formData.gender ||
          !formData.dob
        ) {
          setErrorMsg('All fields are required.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: formData.password
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        const userId = data.user?.id;

        const defaultAvatars = {
          Male: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
          Female: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
          "Non-binary": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          Other: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
        };

        // Save profile in DB
        await supabase.from('profiles').insert([
          {
            id: userId,
            name: formData.name.trim(),
            email,
            gender: formData.gender,
            dob: formData.dob,
            bio: "Tell us about yourself!",
            styles: ["Adventurer"],
            avatar: defaultAvatars[formData.gender] || defaultAvatars.Male,
            title: "New Traveler"
          }
        ]);

        setUserProfile({
          name: formData.name.trim(),
          gender: formData.gender,
          dob: formData.dob,
          avatar: defaultAvatars[formData.gender] || defaultAvatars.Male,
          title: "New Traveler"
        });

        setCurrentUserEmail(email);
        setIsAuthenticated(true);
      }

      // ---------------- LOGIN ----------------
      if (authMode === 'login') {
        if (!email || !formData.password) {
          setErrorMsg('Email and password required.');
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        setCurrentUserEmail(data.user.email);

        // fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setUserProfile(profile || {
          name: data.user.email,
          title: "Traveler"
        });

        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)'
    }}>

      {/* LEFT SIDE */}
      <div className="auth-hero" style={{
        flex: 1,
        background: `linear-gradient(rgba(0, 78, 137, 0.7), rgba(0, 78, 137, 0.9)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        color: 'white'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          <Globe size={48} />
          Wander<span style={{ color: 'var(--primary)' }}>Connect</span>
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: '800' }}>
          Find Your Next Travel Buddy
        </h1>
      </div>

      {/* RIGHT SIDE */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>

        <div style={{ width: '100%', maxWidth: 420 }}>

          <h2>
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'register' && 'Create Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h2>

          {errorMsg && (
            <div style={{ color: 'red', marginBottom: 10 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* NAME */}
            {authMode === 'register' && (
              <input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            {/* EMAIL */}
            <input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            {/* PASSWORD */}
            {authMode !== 'forgot' && (
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}

            {/* REGISTER EXTRA */}
            {authMode === 'register' && (
              <>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                  <option>Other</option>
                </select>

                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </>
            )}

            <button type="submit">
              {authMode === 'login' && 'Sign In'}
              {authMode === 'register' && 'Sign Up'}
              {authMode === 'forgot' && 'Send Reset Link'}
            </button>
          </form>

          {/* SWITCH MODE */}
          <div style={{ marginTop: 20 }}>
            {authMode === 'login' && (
              <button onClick={() => switchMode('register')}>Create account</button>
            )}
            {authMode === 'register' && (
              <button onClick={() => switchMode('login')}>Login</button>
            )}
            {authMode === 'login' && (
              <button onClick={() => switchMode('forgot')}>Forgot Password?</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}