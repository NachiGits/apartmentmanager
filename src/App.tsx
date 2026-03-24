import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Complaints } from './pages/Complaints';
import { Announcements } from './pages/Announcements';
import { Residents } from './pages/Residents';
import { Payments } from './pages/Payments';
import { JoinApartment } from './pages/JoinApartment';
import { JoinCallback } from './pages/JoinCallback';
import { CompleteProfile } from './pages/CompleteProfile';
import { AnimatePresence } from 'framer-motion';

type AppState = 'loading' | 'public' | 'setup' | 'ready';

function App() {
  const [appState, setAppState]   = useState<AppState>('loading');

  useEffect(() => {
    console.log('[App] Initializing session check...');
    
    // Add a safety timeout to break out of loading if Supabase is stuck
    const timeout = setTimeout(() => {
      if (appState === 'loading') {
        console.warn('[App] Session check timed out. Defaulting to public.');
        setAppState('public');
      }
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[App] Initial session session check result:', session ? 'User logged in' : 'No user');
      if (session) {
        checkProfileSetup(session.user.id);
      } else {
        setAppState('public');
      }
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[App] Auth state changed:', _event, session ? 'User logged in' : 'No user');
      if (session) {
        checkProfileSetup(session.user.id);
      } else {
        setAppState('public');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Check if the logged-in user has completed their profile (i.e. linked to an apartment).
   * - If yes  → 'ready'  (show main app)
   * - If no   → 'setup'  (show CompleteProfile page)
   */
  const checkProfileSetup = async (userId: string) => {
    console.log('[App] Checking profile for:', userId);
    try {
      // Use maybeSingle to avoid errors if profile is missing (brand new user)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('apartment_id, role, email')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[App] Supabase error during profile check:', error);
        // On transient errors, we might want to retry rather than forcing public
        // but for now, we'll stay in current state or move to public if it's total failure
        return;
      }

      console.log('[App] Profile check result:', profile);
      
      const isSuperAdmin = profile?.role === 'SUPER_ADMIN' || (profile?.email && profile.email.includes('mail4nachi'));
      
      if (profile?.apartment_id || isSuperAdmin) {
        if (appState !== 'ready') {
          console.log('[App] Profile is complete. Setting state to READY.');
          setAppState('ready');
        }
      } else {
        if (appState !== 'setup') {
          console.log('[App] Profile incomplete. Setting state to SETUP.');
          setAppState('setup');
        }
      }
    } catch (err) {
      console.error('[App] Exception during profile check:', err);
    }
  };

  /**
   * Sub-component to handle route-based state re-validation.
   * This prevents redirect loops by re-checking profile setup on navigation
   * if the user is currently stuck in the 'setup' state.
   */
  /* ── Splash / loading screen ── */
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-indigo-200 font-black tracking-widest text-[10px] uppercase">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes 
        appState={appState} 
        checkProfileSetup={checkProfileSetup} 
      />
    </Router>
  );
}

/**
 * Stable component to handle routing and guard-based redirects.
 * Moved outside the main App to prevent infinite re-creation loops.
 */
const AppRoutes = ({ appState, checkProfileSetup }: { 
  appState: AppState, 
  checkProfileSetup: (id: string) => Promise<void> 
}) => {
  const { pathname } = window.location;

  useEffect(() => {
    // Check if we just finished onboarding and are still in 'setup' state
    const recheckIfSetup = async () => {
       if (appState !== 'setup') return;

       const { data: { session } } = await supabase.auth.getSession();
       if (session) {
         // Re-check profile if on root or join paths
         if (pathname === '/' || pathname === '/join/callback' || pathname === '/setup') {
            checkProfileSetup(session.user.id);
         }
       }
    };
    
    // Slight debounce to let redirects settle
    const handler = setTimeout(recheckIfSetup, 100);
    return () => clearTimeout(handler);
  }, [pathname, appState]); // Watch both path and state

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* ── Always-public routes (no auth needed) ── */}
        <Route path="/join/:token?" element={<JoinApartment />} />
        <Route path="/join/callback" element={<JoinCallback />} />

        {/* ── Not logged in ── */}
        {appState === 'public' && (
          <>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* ── Logged in but profile incomplete → force setup ── */}
        {appState === 'setup' && (
          <>
            <Route path="/setup" element={<CompleteProfile />} />
            {/* Allow routes like /join/:token to stay accessible! */}
            <Route path="/join/:token?" element={<JoinApartment />} />
            <Route path="/join/callback" element={<JoinCallback />} />
            {/* Catch-all redirect to setup only if NOT on an allowed route */}
            <Route path="*" element={<Navigate to="/setup" replace />} />
          </>
        )}

        {/* ── Fully set up → main app ── */}
        {appState === 'ready' && (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="residents" element={<Residents />} />
            <Route path="payments" element={<Payments />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </AnimatePresence>
  );
};

// Wrapper for Home to pass the login navigation handler
const HomeWrapper = () => {
  const navigate = useNavigate();
  return <Home onLogin={() => navigate('/login')} />;
};

export default App;
