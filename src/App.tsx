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
  const [appState, setAppState]     = useState<AppState>('loading');
  const [isChecking, setIsChecking] = useState(false);

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
  const checkProfileSetup = async (userId: string, retryCount = 0) => {
    console.log('[App] Checking profile for:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
    setIsChecking(true);
    let profileData: any = null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('apartment_id, role, email')
        .eq('id', userId)
        .maybeSingle();
      
      profileData = profile;

      if (error) {
        console.error('[App] Supabase error during profile check:', error);
        setAppState('public');
        return;
      }

      // If no profile yet, retry once after a delay (handles trigger delay for new users)
      if (!profile && retryCount < 2) {
        console.log('[App] No profile found, retrying in 1s...');
        setTimeout(() => checkProfileSetup(userId, retryCount + 1), 1000);
        return;
      }

      console.log('[App] Profile check result:', profile);
      
      const isSuperAdmin = profile?.role === 'SUPER_ADMIN' || (profile?.email && (profile.email.includes('mail4nachi') || profile.email.includes('admin@apartment.com')));
      
      if (profile?.apartment_id || isSuperAdmin) {
        setAppState('ready');
      } else {
        setAppState('setup');
      }
    } catch (err) {
      console.error('[App] Exception during profile check:', err);
      setAppState('public');
    } finally {
      const finished = retryCount >= 2 || !!(profileData);
      if (finished) {
        setIsChecking(false);
      }
    }
  };

  /**
   * Sub-component to handle route-based state re-validation.
   * This prevents redirect loops by re-checking profile setup on navigation
   * if the user is currently stuck in the 'setup' state.
   */
  /* ── Splash / loading screen ── */
  if (appState === 'loading' || (isChecking && appState !== 'ready')) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated background blobs to mask the flicker transitions better */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white font-black tracking-[0.3em] text-[11px] uppercase ml-[0.3em]">HomeConnect</span>
            <span className="text-indigo-400/60 font-bold text-[8px] uppercase tracking-widest">Initialising Session</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes 
        appState={appState} 
        isChecking={isChecking}
        checkProfileSetup={checkProfileSetup} 
      />
    </Router>
  );
}

/**
 * Stable component to handle routing and guard-based redirects.
 * Moved outside the main App to prevent infinite re-creation loops.
 */
const AppRoutes = ({ appState, isChecking, checkProfileSetup }: { 
  appState: AppState, 
  isChecking: boolean,
  checkProfileSetup: (id: string) => Promise<void> 
}) => {
  const { pathname } = window.location;

  const onFullComplete = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkProfileSetup(session.user.id);
    });
  };

  useEffect(() => {
    const recheckIfSetup = async () => {
       if (appState !== 'setup' || isChecking) return;

       const { data: { session } } = await supabase.auth.getSession();
       if (session) {
         // Re-check profile if on root or join paths
         const targetPaths = ['/', '/join/callback', '/setup'];
         const isTargetPath = targetPaths.some(p => pathname.startsWith(p));
         
         if (isTargetPath) {
            checkProfileSetup(session.user.id);
         }
       }
    };
    
    // Very short debounce
    const handler = setTimeout(recheckIfSetup, 50);
    return () => clearTimeout(handler);
  }, [pathname, appState, isChecking]);

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* ── Always-public routes (no auth needed) ── */}
        <Route path="/join/:token?" element={<JoinApartment />} />
        <Route path="/join/callback" element={<JoinCallback onComplete={onFullComplete} />} />

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
            <Route path="/" element={<Navigate to="/setup" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<CompleteProfile onComplete={onFullComplete} />} />
            {/* Allow routes like /join/:token to stay accessible! */}
            <Route path="/join/:token?" element={<JoinApartment />} />
            <Route path="/join/callback" element={<JoinCallback onComplete={onFullComplete} />} />
            
            {/* Catch-all redirect to setup only if NOT on an allowed route */}
            {!isChecking && (
              <Route path="*" element={<Navigate to="/setup" replace />} />
            )}
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
