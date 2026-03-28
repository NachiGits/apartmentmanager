/**
 * JoinCallback.tsx
 *
 * This page handles the redirect AFTER Google OAuth completes for the /join flow.
 * It reads the pending invite token from localStorage, updates the invitation,
 * and sets the user's apartment_id + role in their profile.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type Step = 'loading' | 'success' | 'error';

export const JoinCallback = ({ onComplete }: { onComplete?: () => void }) => {
  const navigate  = useNavigate();
  const [step, setStep]       = useState<Step>('loading');
  const [message, setMessage] = useState('Completing your registration...');
  const [error, setError]     = useState('');

  useEffect(() => {
    completeJoin();
  }, []);

  const completeJoin = async () => {
    try {
      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated. Please try again.');

      // 2. Read pending invite data from localStorage
      const token       = localStorage.getItem('pendingInviteToken');
      const apartmentId = localStorage.getItem('pendingApartmentId');
      const unitNumber  = localStorage.getItem('pendingUnitNumber');

      if (!token || !apartmentId) {
        // No pending invite — just redirect to dashboard normally
        if (onComplete) onComplete();
        navigate('/', { replace: true });
        return;
      }

      setMessage('Linking you to your apartment...');

      // 3. Validate invite is still PENDING
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'PENDING')
        .single();

      if (inviteError || !invite) {
        throw new Error('Invite is invalid or has already been used.');
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite link has expired.');
      }

      // 3.5 STRICT EMAIL VERIFICATION
      // If the admin specified an email in the invitation, we ENSURE it matches the sign-in
      if (invite.email && invite.email.toLowerCase().trim() !== user.email?.toLowerCase().trim()) {
        throw new Error(`This invite was sent to ${invite.email}. Please sign in with that Gmail account to join.`);
      }

      // 4. Update user profile with apartment_id and role
      setMessage('Setting up your profile...');
      
      // Fetch existing role to avoid downgrading
      const { data: existingProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const userRole = (existingProfile?.role && ['SUPER_ADMIN', 'ADMIN', 'RESIDENT'].includes(existingProfile.role)) 
        ? existingProfile.role 
        : 'RESIDENT';

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id:           user.id,
          email:        user.email,
          full_name:    user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url:   user.user_metadata?.avatar_url,
          apartment_id: apartmentId,
          unit_number:  invite.unit_number || unitNumber || null,
          sqft_build_up: invite.sqft_build_up || 0,
          sqft_carpet:   invite.sqft_carpet   || 0,
          sqft_uds:      invite.sqft_uds      || 0,
          occupancy_type: invite.occupancy_type || 'OWNER',
          role:         userRole,
          updated_at:   new Date().toISOString(),
        });

      if (profileError) throw new Error('Failed to update your profile.');

      // 4.5 Add to apartment_members (multi-tenancy)
      const { error: memberError } = await supabase
        .from('apartment_members')
        .upsert({
          profile_id:   user.id,
          apartment_id: apartmentId,
          role:         'MEMBER'
        });

      if (memberError) {
        if (memberError.message.includes('more than 3 apartments')) {
          throw new Error('You cannot belong to more than 3 apartments.');
        }
        throw new Error('Failed to link you to the apartment community.');
      }

      // 5. Mark invitation as ACCEPTED
      setMessage('Finalising invitation...');
      await supabase
        .from('invitations')
        .update({ status: 'ACCEPTED' })
        .eq('token', token);

      // 6. Clean up localStorage
      localStorage.removeItem('pendingInviteToken');
      localStorage.removeItem('pendingApartmentId');
      localStorage.removeItem('pendingUnitNumber');

      setStep('success');
      setMessage('Welcome to your community!');

      if (onComplete) onComplete();
      setTimeout(() => navigate('/', { replace: true }), 1000);

    } catch (err: any) {
      console.error('[JoinCallback]', err);
      setStep('error');
      setError(err.message || 'Something went wrong.');
      // Clean up on error too
      localStorage.removeItem('pendingInviteToken');
      localStorage.removeItem('pendingApartmentId');
      localStorage.removeItem('pendingUnitNumber');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {step === 'loading' && (
          <>
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white font-bold text-xl">{message}</p>
            <p className="text-slate-400 text-sm mt-2 mb-8">Please wait a moment...</p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/login', { replace: true });
              }}
              className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              Cancel or Stuck? Sign Out
            </button>
          </>
        )}

        {step === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={44} className="text-emerald-400" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">{message}</h2>
            <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>

            <div className="mt-6">
              <Loader2 size={20} className="animate-spin text-indigo-400 mx-auto" />
            </div>
          </>
        )}

        {step === 'error' && (
          <>
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={44} className="text-rose-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Registration Failed</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/join', { replace: true })}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/login', { replace: true });
                }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all active:scale-95"
              >
                Sign Out & Restart
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
