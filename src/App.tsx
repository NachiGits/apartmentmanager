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
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await checkProfileSetup(session.user.id);
      } else {
        setAppState('public');
      }
    });

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await checkProfileSetup(session.user.id);
      } else {
        setAppState('public');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Check if the logged-in user has completed their profile (i.e. linked to an apartment).
   * - If yes  → 'ready'  (show main app)
   * - If no   → 'setup'  (show CompleteProfile page)
   */
  const checkProfileSetup = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('apartment_id, role')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.apartment_id) {
      setAppState('ready');
    } else {
      setAppState('setup');
    }
  };

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
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── Always-public routes (no auth needed) ── */}
          <Route path="/join" element={<JoinApartment />} />
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
              {/* Redirect every other route to setup */}
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
    </Router>
  );
}

// Wrapper for Home to pass the login navigation handler
const HomeWrapper = () => {
  const navigate = useNavigate();
  return <Home onLogin={() => navigate('/login')} />;
};

export default App;
