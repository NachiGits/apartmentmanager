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

export const JoinCallback = () => {
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

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite link has expired.');
      }

      // 4. Update user profile with apartment_id and role
      setMessage('Setting up your profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id:           user.id,
          email:        user.email,
          full_name:    user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url:   user.user_metadata?.avatar_url,
          apartment_id: apartmentId,
          unit_number:  unitNumber || null,
          role:         'MEMBER',
          updated_at:   new Date().toISOString(),
        });

      if (profileError) throw new Error('Failed to update your profile.');

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

      // Redirect to /setup — App.tsx will detect apartment is now linked and push to dashboard
      setTimeout(() => navigate('/setup', { replace: true }), 2000);

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
            <p className="text-slate-400 text-sm mt-2">Please wait a moment...</p>
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
            <button
              onClick={() => navigate('/join', { replace: true })}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all"
            >
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
