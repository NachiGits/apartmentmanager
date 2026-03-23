/**
 * CompleteProfile.tsx
 *
 * Shown after Google OAuth when the user has no apartment linked yet.
 * Three paths:
 *  1. SUPER_ADMIN  — if email contains 'mail4nachi' (auto, no choice needed)
 *  2. Join via invite code / link (role = MEMBER)
 *  3. Create a new apartment (role = ADMIN)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  KeyRound,
  Plus,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Home,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react';

type Mode = 'choose' | 'join' | 'create' | 'loading' | 'done' | 'error';

const SUPER_ADMIN_EMAIL_KEYWORD = 'mail4nachi';

export const CompleteProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser]               = useState<any>(null);
  const [mode, setMode]               = useState<Mode>('loading');
  const [errorMsg, setErrorMsg]       = useState('');

  // Join path
  const [inviteCode, setInviteCode]   = useState(searchParams.get('token') || '');
  const [joining, setJoining]         = useState(false);

  // Create path
  const [aptName, setAptName]         = useState('');
  const [aptAddress, setAptAddress]   = useState('');
  const [creating, setCreating]       = useState(false);

  /* ── On mount: load user, check if already set up ── */
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login', { replace: true }); return; }
    setUser(user);

    // Check if profile already fully set up
    const { data: profile } = await supabase
      .from('profiles')
      .select('apartment_id, role')
      .eq('id', user.id)
      .single();

    if (profile?.apartment_id) {
      navigate('/', { replace: true });
      return;
    }

    // Auto Super Admin check
    if (user.email?.toLowerCase().includes(SUPER_ADMIN_EMAIL_KEYWORD)) {
      await setupSuperAdmin(user);
      return;
    }

    setMode('choose');
  };

  /* ── SUPER ADMIN setup (auto) ── */
  const setupSuperAdmin = async (u: any) => {
    setMode('loading');
    const { error } = await supabase.from('profiles').upsert({
      id:         u.id,
      email:      u.email,
      full_name:  u.user_metadata?.full_name || u.email?.split('@')[0],
      avatar_url: u.user_metadata?.avatar_url,
      role:       'SUPER_ADMIN',
      updated_at: new Date().toISOString(),
    });

    if (error) { setMode('error'); setErrorMsg(error.message); return; }
    setMode('done');
    setTimeout(() => navigate('/', { replace: true }), 1800);
  };

  /* ── JOIN with invite code ── */
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setErrorMsg('');

    try {
      // Validate invite
      const { data: invite, error: invErr } = await supabase
        .from('invitations')
        .select('*, apartments(name)')
        .eq('token', inviteCode.trim())
        .eq('status', 'PENDING')
        .single();

      if (invErr || !invite) throw new Error('Invalid or expired invite code.');
      if (new Date(invite.expires_at) < new Date()) throw new Error('This invite code has expired.');

      // Update profile
      const { error: profErr } = await supabase.from('profiles').upsert({
        id:           user.id,
        email:        user.email,
        full_name:    user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url:   user.user_metadata?.avatar_url,
        apartment_id: invite.apartment_id,
        unit_number:  invite.unit_number || null,
        role:         'MEMBER',
        updated_at:   new Date().toISOString(),
      });
      if (profErr) throw new Error(profErr.message);

      // Mark invite accepted
      await supabase.from('invitations').update({ status: 'ACCEPTED' }).eq('token', inviteCode.trim());

      setMode('done');
      setTimeout(() => navigate('/', { replace: true }), 1800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setJoining(false);
    }
  };

  /* ── CREATE new apartment ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    try {
      // Insert apartment
      const { data: apt, error: aptErr } = await supabase
        .from('apartments')
        .insert({ name: aptName.trim(), address: aptAddress.trim() || null })
        .select()
        .single();

      if (aptErr || !apt) throw new Error(aptErr?.message || 'Failed to create apartment.');

      // Update profile as ADMIN
      const { error: profErr } = await supabase.from('profiles').upsert({
        id:           user.id,
        email:        user.email,
        full_name:    user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url:   user.user_metadata?.avatar_url,
        apartment_id: apt.id,
        role:         'ADMIN',
        updated_at:   new Date().toISOString(),
      });
      if (profErr) throw new Error(profErr.message);

      setMode('done');
      setTimeout(() => navigate('/', { replace: true }), 1800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl animate-pulse delay-700 pointer-events-none" />

      {/* Sign out link top-right */}
      <button
        onClick={handleSignOut}
        className="absolute top-6 right-6 flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
      >
        <LogOut size={14} /> Sign Out
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/40 mb-4 hover:scale-105 transition-transform">
            <Building2 size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Complete Your Setup</h1>
          {user && (
            <p className="text-slate-400 mt-1 text-sm">
              Signed in as <span className="text-indigo-400 font-semibold">{user.email}</span>
            </p>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <AnimatePresence mode="wait">

            {/* ── LOADING ── */}
            {mode === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center gap-4">
                <Loader2 size={44} className="animate-spin text-indigo-400" />
                <p className="text-slate-300 font-medium">Setting up your account...</p>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {mode === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center gap-4 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={44} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-black text-white">You're all set!</h2>
                <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
                <Loader2 size={18} className="animate-spin text-indigo-400 mt-2" />
              </motion.div>
            )}

            {/* ── ERROR ── */}
            {mode === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-10 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-rose-400" />
                </div>
                <h3 className="text-white font-black text-lg">Something went wrong</h3>
                <p className="text-slate-400 text-sm max-w-xs">{errorMsg}</p>
                <button onClick={() => { setMode('choose'); setErrorMsg(''); }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all">
                  Try Again
                </button>
              </motion.div>
            )}

            {/* ── CHOOSE PATH ── */}
            {mode === 'choose' && (
              <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-slate-300 text-sm font-medium text-center mb-6">
                  How would you like to get started?
                </p>

                {/* Option A: Have invite code */}
                <button
                  onClick={() => setMode('join')}
                  className="group w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 rounded-2xl transition-all text-left"
                >
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <KeyRound size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">Join with Invite Code</p>
                    <p className="text-slate-400 text-xs mt-0.5">I was invited by my apartment admin</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>

                {/* Option B: Create apartment */}
                <button
                  onClick={() => setMode('create')}
                  className="group w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/40 rounded-2xl transition-all text-left"
                >
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <Plus size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">Create New Apartment</p>
                    <p className="text-slate-400 text-xs mt-0.5">I'm an admin setting up a new community</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </button>

                <p className="text-center text-slate-600 text-xs pt-2">
                  Not sure? Contact your society admin for an invite link.
                </p>
              </motion.div>
            )}

            {/* ── JOIN FORM ── */}
            {mode === 'join' && (
              <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => { setMode('choose'); setErrorMsg(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest mb-6 flex items-center gap-1 transition-colors">
                  ← Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><KeyRound size={20} /></div>
                  <div>
                    <h3 className="text-white font-black text-lg">Enter Invite Code</h3>
                    <p className="text-slate-500 text-xs">Get this from your apartment admin</p>
                  </div>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Invite Code</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Paste your invite code..."
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-slate-600 mt-1.5 ml-1">
                      Looks like a long code (e.g. <span className="font-mono">3f9a2b1d-...</span>)
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <AlertCircle size={14} className="text-rose-400 shrink-0" />
                      <p className="text-rose-300 text-xs font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <button type="submit" disabled={joining}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                    {joining ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Join Apartment
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── CREATE APARTMENT FORM ── */}
            {mode === 'create' && (
              <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => { setMode('choose'); setErrorMsg(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest mb-6 flex items-center gap-1 transition-colors">
                  ← Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Building2 size={20} /></div>
                  <div>
                    <h3 className="text-white font-black text-lg">Create Apartment</h3>
                    <p className="text-slate-500 text-xs">You'll be the Admin of this community</p>
                  </div>
                </div>

                {/* Admin badge */}
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
                  <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                  <p className="text-amber-300 text-xs font-semibold">
                    You will be registered as <strong>Admin</strong> and can invite residents.
                  </p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Apartment / Society Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        value={aptName}
                        onChange={(e) => setAptName(e.target.value)}
                        placeholder="e.g. Sunrise Heights"
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Address <span className="text-slate-600 font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={aptAddress}
                      onChange={(e) => setAptAddress(e.target.value)}
                      placeholder="e.g. 12 Main Street, Chennai"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <AlertCircle size={14} className="text-rose-400 shrink-0" />
                      <p className="text-rose-300 text-xs font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <button type="submit" disabled={creating}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Create &amp; Continue
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
