import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  MapPin,
  Home,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';

type InviteStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'joining';

export const JoinApartment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token: routeToken } = useParams();
  
  const tokenFromUrl = routeToken || searchParams.get('token') || '';

  const [manualToken, setManualToken]   = useState('');
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('idle');
  const [invite, setInvite]             = useState<any>(null);
  const [errorMsg, setErrorMsg]         = useState('');

  // Auto-validate token if present in URL
  useEffect(() => {
    if (tokenFromUrl) {
      validateToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validateToken = async (token: string) => {
    setInviteStatus('loading');
    setErrorMsg('');

    const { data, error } = await supabase
      .from('invitations')
      .select('*, apartments(name, address)')
      .eq('token', token.trim())
      .single();

    if (error || !data) {
      setInviteStatus('invalid');
      setErrorMsg('This invite code is invalid or does not exist.');
      return;
    }

    if (data.status === 'ACCEPTED') {
      setInviteStatus('accepted');
      setErrorMsg('This invite has already been used.');
      return;
    }

    if (data.status === 'EXPIRED' || new Date(data.expires_at) < new Date()) {
      setInviteStatus('expired');
      setErrorMsg('This invite link has expired. Please ask your admin for a new one.');
      return;
    }

    setInvite(data);
    setInviteStatus('valid');
  };

  const handleJoinWithGoogle = async () => {
    if (!invite) return;
    setInviteStatus('joining');

    // Store invite token in localStorage so we can use it after Google OAuth redirect
    localStorage.setItem('pendingInviteToken', invite.token);
    localStorage.setItem('pendingApartmentId', invite.apartment_id);
    if (invite.unit_number) localStorage.setItem('pendingUnitNumber', invite.unit_number);
    if (invite.sqft_build_up) localStorage.setItem('pendingSqftBuildUp', invite.sqft_build_up.toString());
    if (invite.sqft_carpet) localStorage.setItem('pendingSqftCarpet', invite.sqft_carpet.toString());
    if (invite.sqft_uds) localStorage.setItem('pendingSqftUDS', invite.sqft_uds.toString());
    if (invite.occupancy_type) localStorage.setItem('pendingOccupancyType', invite.occupancy_type);

    const oauthOptions: any = {
      redirectTo: window.location.origin + '/join/callback'
    };

    // If the admin specified a target email, suggest it to Google
    if (invite.email) {
      oauthOptions.queryParams = {
        prompt: 'select_account',
        login_hint: invite.email
      };
    } else {
      oauthOptions.queryParams = {
        prompt: 'select_account'
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: oauthOptions,
    });

    if (error) {
      setInviteStatus('valid');
      setErrorMsg(error.message);
    }
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) validateToken(manualToken.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 relative overflow-hidden">
      {/* Ambient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={14} /> Back to Home
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/40 mb-5 hover:scale-105 transition-transform">
            <Building2 size={36} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Join Apartment</h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">
            Use your invite link or enter your invite code
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">

          {/* ---- IDLE or MANUAL INPUT STATE ---- */}
          <AnimatePresence mode="wait">
            {(inviteStatus === 'idle') && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Info Banner */}
                <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6">
                  <KeyRound size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-indigo-300 uppercase tracking-widest">Invite Code</p>
                    <p className="text-sm text-slate-300 mt-0.5">
                      Enter the invite code shared by your apartment admin, or open your invite link directly.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleManualCheck} className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste your invite code here..."
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <KeyRound size={16} />
                    Validate Invite Code
                  </button>
                </form>
              </motion.div>
            )}

            {/* ---- LOADING STATE ---- */}
            {inviteStatus === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
                <p className="text-slate-400 text-sm font-medium">Validating your invite...</p>
              </motion.div>
            )}

            {/* ---- VALID INVITE STATE ---- */}
            {inviteStatus === 'valid' && invite && (
              <motion.div key="valid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Success Banner */}
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-emerald-300 uppercase tracking-widest">Valid Invitation</p>
                    <p className="text-sm text-slate-300 mt-0.5">Your invite has been verified!</p>
                  </div>
                </div>

                {/* Apartment Details */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg">
                      <Building2 size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Apartment</p>
                      <p className="text-white font-bold">{invite.apartments?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  {invite.apartments?.address && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-700 rounded-lg">
                        <MapPin size={18} className="text-slate-400" />
                      </div>
                      <p className="text-slate-300 text-sm">{invite.apartments.address}</p>
                    </div>
                  )}
                  {invite.unit_number && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Home size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Your Unit</p>
                        <p className="text-white font-bold">{invite.unit_number}</p>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Maximize2 size={12} /> Unit Dimensions (SQFT)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Build-up</p>
                          <p className="text-xs text-white font-black">{invite.sqft_build_up || '-'}</p>
                       </div>
                       <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Carpet</p>
                          <p className="text-xs text-white font-black">{invite.sqft_carpet || '-'}</p>
                       </div>
                       <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">UDS</p>
                          <p className="text-xs text-white font-black">{invite.sqft_uds || '-'}</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <ShieldCheck size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Occupancy</p>
                      <p className="text-white font-bold capitalize">{invite.occupancy_type || 'OWNER'}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs text-slate-500">
                      Invite expires: <span className="text-slate-400 font-medium">
                        {new Date(invite.expires_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Google Login Button */}
                <button
                  onClick={handleJoinWithGoogle}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Accept & Sign In with Google
                </button>

                {errorMsg && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm text-center font-medium">
                    {errorMsg}
                  </div>
                )}
              </motion.div>
            )}

            {/* ---- JOINING STATE ---- */}
            {inviteStatus === 'joining' && (
              <motion.div key="joining" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
                <p className="text-white font-bold text-lg">Redirecting to Google...</p>
                <p className="text-slate-400 text-sm">You will be linked to the apartment after sign in.</p>
              </motion.div>
            )}

            {/* ---- ERROR STATES ---- */}
            {(inviteStatus === 'invalid' || inviteStatus === 'expired' || inviteStatus === 'accepted') && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col items-center text-center py-8">
                  <div className="p-4 bg-rose-500/10 rounded-full mb-4">
                    <AlertCircle size={36} className="text-rose-400" />
                  </div>
                  <h3 className="text-white font-black text-xl mb-2">
                    {inviteStatus === 'expired' ? 'Invite Expired' :
                     inviteStatus === 'accepted' ? 'Already Used' :
                     'Invalid Code'}
                  </h3>
                  <p className="text-slate-400 text-sm mb-8">{errorMsg}</p>
                  <button
                    onClick={() => { setInviteStatus('idle'); setErrorMsg(''); setManualToken(''); }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    Try a Different Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer note */}
          {inviteStatus === 'idle' && (
            <p className="text-center text-slate-600 text-xs mt-6">
              Don't have a code?{' '}
              <button onClick={() => navigate('/login')} className="text-indigo-400 font-bold hover:underline">
                Sign in directly
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
