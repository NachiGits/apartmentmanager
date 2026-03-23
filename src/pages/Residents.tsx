import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  MapPin,
  Maximize2,
  Settings,
  ShieldCheck,
  MoreVertical,
  Loader2,
  X,
  Copy,
  CheckCircle2,
  Send,
  Home,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendInviteEmail } from '../lib/brevo';

export const Residents = () => {
  const [residents, setResidents]           = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail]       = useState('');
  const [inviteUnit, setInviteUnit]         = useState('');
  const [inviting, setInviting]             = useState(false);
  const [inviteResult, setInviteResult]     = useState<{
    type: 'success' | 'error' | null;
    message: string;
    link?: string;
  }>({ type: null, message: '' });
  const [copied, setCopied]                 = useState(false);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*, apartments(name)')
      .order('full_name');

    setResidents(data || []);
    setLoading(false);
  };

  const filteredResidents = residents.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.unit_number?.toLowerCase().includes(q)
    );
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult({ type: null, message: '' });

    try {
      // 1. Get current user's apartment_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('apartment_id, full_name, apartments(name)')
        .eq('id', user.id)
        .single();

      if (!profile?.apartment_id) throw new Error('Your profile is not linked to an apartment.');

      // 2. Create invitation in database
      const { data: invitation, error: insertError } = await supabase
        .from('invitations')
        .insert({
          email:        inviteEmail || null,
          apartment_id: profile.apartment_id,
          unit_number:  inviteUnit || null,
          invited_by:   user.id,
        })
        .select()
        .single();

      if (insertError || !invitation) throw new Error('Failed to create invitation.');

      const inviteLink = `${window.location.origin}/join?token=${invitation.token}`;

      // 3. Send email via Brevo (if email provided)
      if (inviteEmail) {
        const emailResult = await sendInviteEmail({
          toEmail:       inviteEmail,
          apartmentName: (profile.apartments as any)?.name || 'Your Apartment',
          inviterName:   profile.full_name || 'Your Admin',
          unitNumber:    inviteUnit || undefined,
          inviteToken:   invitation.token,
        });

        if (!emailResult.success) {
          // Still show the link even if email fails
          setInviteResult({
            type: 'success',
            message: `Invite created! Email delivery failed (${emailResult.error}). Share the link below manually.`,
            link:  inviteLink,
          });
        } else {
          setInviteResult({
            type: 'success',
            message: `Invite sent to ${inviteEmail}! They can also use the link below.`,
            link:  inviteLink,
          });
        }
      } else {
        setInviteResult({
          type: 'success',
          message: 'Invite link generated! Share it with the resident.',
          link:  inviteLink,
        });
      }

      setInviteEmail('');
      setInviteUnit('');
    } catch (err: any) {
      setInviteResult({ type: 'error', message: err.message || 'Something went wrong.' });
    } finally {
      setInviting(false);
    }
  };

  const copyLink = () => {
    if (inviteResult.link) {
      navigator.clipboard.writeText(inviteResult.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteUnit('');
    setInviteResult({ type: null, message: '' });
    setCopied(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Resident Directory</h2>
          <p className="text-slate-500 mt-1">Manage unit assignments and member access.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <UserPlus size={18} /> Invite Member
          </button>
        </div>
      </div>

      <div className="glass p-6 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, unit, or email..."
              className="w-full pl-12 pr-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><Settings size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
          ) : filteredResidents.length === 0 ? (
            <div className="col-span-full p-20 text-center glass opacity-50">
              <Users size={40} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400">{search ? 'No residents match your search.' : 'No residents registered yet.'}</p>
            </div>
          ) : filteredResidents.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 bg-white/60 dark:bg-slate-800/60 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative border-slate-200 dark:border-slate-800"
            >
              <button className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} className="text-slate-400" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {r.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    {r.full_name}
                    {r.role === 'ADMIN' && <ShieldCheck size={14} className="text-indigo-500" />}
                    {r.role === 'SUPER_ADMIN' && <ShieldCheck size={14} className="text-amber-500" />}
                  </h4>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{r.role}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <MapPin size={16} />
                  <span className="text-sm">{r.unit_number ? `Unit ${r.unit_number}` : 'Unit not assigned'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Mail size={16} />
                  <span className="text-sm lowercase">{r.email || 'no-email@set.up'}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200" />)}
                </div>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline underline-offset-4">
                  View Profile <Maximize2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ======= INVITE MODAL ======= */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetInviteModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass max-w-lg w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative"
            >
              {/* Close */}
              <button onClick={resetInviteModal} className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={18} />
              </button>

              <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-600" /> Invite a Member
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Send a personal email invite or generate a shareable link.
              </p>

              <AnimatePresence mode="wait">
                {/* ── RESULT STATE ── */}
                {inviteResult.type && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {/* Success */}
                    {inviteResult.type === 'success' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{inviteResult.message}</p>
                        </div>

                        {inviteResult.link && (
                          <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Invite Link</label>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                              <p className="text-indigo-600 dark:text-indigo-400 text-xs font-mono flex-1 truncate">{inviteResult.link}</p>
                              <button
                                onClick={copyLink}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                              >
                                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Clock size={12} className="text-slate-400" />
                              <p className="text-xs text-slate-400">This link expires in 7 days.</p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button onClick={resetInviteModal} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm">
                            Done
                          </button>
                          <button
                            onClick={() => setInviteResult({ type: null, message: '' })}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all"
                          >
                            Invite Another
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {inviteResult.type === 'error' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
                          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                          <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{inviteResult.message}</p>
                        </div>
                        <button
                          onClick={() => setInviteResult({ type: null, message: '' })}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── FORM STATE ── */}
                {!inviteResult.type && (
                  <motion.form key="form" onSubmit={handleInvite} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                        Member Email <span className="text-slate-400 font-normal normal-case">(optional — skip to generate link only)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="resident@example.com"
                          className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Unit Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                        Unit Number <span className="text-slate-400 font-normal normal-case">(optional)</span>
                      </label>
                      <div className="relative">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={inviteUnit}
                          onChange={(e) => setInviteUnit(e.target.value)}
                          placeholder="e.g. A-204"
                          className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                      <Send size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-600 dark:text-indigo-300">
                        {inviteEmail
                          ? `An invite email will be sent to ${inviteEmail} via Brevo, and a shareable link will be generated.`
                          : 'A shareable invite link will be generated. You can send it via WhatsApp or any messenger.'}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetInviteModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {inviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {inviteEmail ? 'Send Invite' : 'Generate Link'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
