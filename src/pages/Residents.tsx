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
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendInviteEmail } from '../lib/brevo';

export const Residents = () => {
  const [residents, setResidents]           = useState<any[]>([]);
  const [invites, setInvites]               = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [apartmentConfig, setApartmentConfig] = useState<any>(null);
  const [search, setSearch]                 = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [editingResident, setEditingResident] = useState<any>(null);

  // Edit form state
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editSqftBuildUp, setEditSqftBuildUp] = useState('');
  const [editSqftCarpet, setEditSqftCarpet] = useState('');
  const [editSqftUDS, setEditSqftUDS] = useState('');
  const [editOccType, setEditOccType]   = useState<'OWNER' | 'TENANT'>('OWNER');
  const [updating, setUpdating]         = useState(false);

  // User state
  const [user, setUser]                       = useState<any>(null);
  const [userRole, setUserRole]               = useState<string | null>(null);
  const [userAptId, setUserAptId]             = useState<string | null>(null);
  const [userFullName, setUserFullName]       = useState<string>('');

  // Invite form state
  const [inviteEmail, setInviteEmail]       = useState('');
  const [inviteUnit, setInviteUnit]         = useState('');
  const [inviteSqftBuildUp, setInviteSqftBuildUp] = useState('');
  const [inviteSqftCarpet, setInviteSqftCarpet] = useState('');
  const [inviteSqftUDS, setInviteSqftUDS] = useState('');
  const [inviteOccupancyType, setInviteOccupancyType] = useState<'OWNER' | 'TENANT'>('OWNER');
  const [inviting, setInviting]             = useState(false);
  const [inviteResult, setInviteResult]     = useState<{
    type: 'success' | 'error' | null;
    message: string;
    link?: string;
  }>({ type: null, message: '' });
  const [copied, setCopied]                 = useState(false);
  const [syncing, setSyncing]               = useState(false);
  const [allApts, setAllApts]               = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUser(authUser);

      // 1. Check Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('apartment_id, role, full_name')
        .eq('id', authUser.id)
        .single();
      
      const currentRole = profile?.role || 'MEMBER';
      setUserRole(currentRole);
      setUserFullName(profile?.full_name || '');

      let aptId = profile?.apartment_id;

      // 2. Fallbacks and Global Data
      if (currentRole === 'SUPER_ADMIN') {
        const { data: apts } = await supabase.from('apartments').select('*').order('name');
        setAllApts(apts || []);
        
        // If they already have an apartment picked, or we pick the first one for them
        if (!aptId && apts && apts.length > 0) {
           aptId = apts[0].id;
        }
      } else if (!aptId) {
        const { data: mems } = await supabase
          .from('apartment_members')
          .select('apartment_id')
          .eq('profile_id', authUser.id)
          .limit(1);
        
        if (mems && mems.length > 0) {
          aptId = mems[0].apartment_id;
        }
      }
      
      setUserAptId(aptId || null);
      if (aptId) {
        fetchResidents(aptId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchResidents = async (aptIdOverride?: string) => {
    const aptId = aptIdOverride || userAptId;
    if (!aptId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch residents via junction table (parity with Dashboard count)
      const { data: memberRows, error: memberError } = await supabase
        .from('apartment_members')
        .select('*, profiles(*)')
        .eq('apartment_id', aptId);

      if (memberError) throw memberError;

      // Map to a consistent resident format with robust fallbacks
      const profs = memberRows?.map(m => ({
        ...m.profiles,
        id: m.profile_id, // Source of truth for ID is the junction
        role: m.role, // Use the role from the membership specifically
        joined_at: m.joined_at,
        full_name: m.profiles?.full_name || 'System User',
        email: m.profiles?.email || 'Syncing Profile...',
        is_synced: !!m.profiles
      })) || [];

      // Fetch PENDING invitations
      const { data: invs, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('apartment_id', aptId)
        .eq('status', 'PENDING');

      if (inviteError) throw inviteError;

      console.log('[Directory] Fetched residents:', profs.length, 'invites:', invs?.length || 0, 'for apt:', aptId);

      setResidents(profs);
      setInvites(invs || []);

      // Fetch apartment config
      const { data: apt, error: aptError } = await supabase
        .from('apartments')
        .select('*')
        .eq('id', aptId)
        .single();

      if (aptError) throw aptError;
      if (apt) {
        console.log('[Directory] Apt Config:', apt.name, 'Basis:', apt.calc_basis);
        setApartmentConfig(apt);
      }
    } catch (err: any) {
      console.error('[Residents] fetchResidents error:', err);
      setResidents([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.unit_number?.toLowerCase().includes(q)
    );
  });

  const filteredInvites = invites.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.email?.toLowerCase().includes(q) ||
      inv.unit_number?.toLowerCase().includes(q)
    );
  });

  const handlePromote = async (residentId: string) => {
    const isRelinquishing = userRole !== 'SUPER_ADMIN';
    const confirmMsg = isRelinquishing
      ? 'Are you sure? You will promote this member to Admin and you will become a normal Member. You will lose administrative access to this apartment.'
      : 'Promote this member to Admin? (As Super Admin, you will retain your global access).';

    if (!window.confirm(confirmMsg)) return;
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // 1. Promote the target member in apartment_members
      const { error: memErr } = await supabase
        .from('apartment_members')
        .update({ role: 'ADMIN' })
        .eq('profile_id', residentId)
        .eq('apartment_id', userAptId);
      if (memErr) throw memErr;

      // 2. Promote target member in global profiles
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ role: 'ADMIN' })
        .eq('id', residentId);
      if (profErr) throw profErr;

      // 3. Transfer apartment ownership (created_by)
      const { error: aptErr } = await supabase
        .from('apartments')
        .update({ created_by: residentId })
        .eq('id', userAptId);
      if (aptErr) throw aptErr;

      // 4. Demote the current admin if they are not a Super Admin
      if (isRelinquishing) {
        // Demote in junction
        await supabase
          .from('apartment_members')
          .update({ role: 'MEMBER' })
          .eq('profile_id', currentUser.id)
          .eq('apartment_id', userAptId);
        
        // Demote in profile (global role)
        await supabase
          .from('profiles')
          .update({ role: 'MEMBER' })
          .eq('id', currentUser.id);
        
        // Immediate UI feedback
        setUserRole('MEMBER');
      }

      fetchResidents();
    } catch (err: any) {
      alert('Handover failed: ' + err.message);
    }
  };

  const handleUpdateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          unit_number: editUnitNumber,
          sqft_build_up: parseFloat(editSqftBuildUp) || 0,
          sqft_carpet: parseFloat(editSqftCarpet) || 0,
          sqft_uds: parseFloat(editSqftUDS) || 0,
          occupancy_type: editOccType
        })
        .eq('id', editingResident.id);

      if (error) throw error;
      setShowEditModal(false);
      fetchResidents();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (res: any) => {
    setEditingResident(res);
    setEditUnitNumber(res.unit_number || '');
    setEditSqftBuildUp(res.sqft_build_up?.toString() || '');
    setEditSqftCarpet(res.sqft_carpet?.toString() || '');
    setEditSqftUDS(res.sqft_uds?.toString() || '');
    setEditOccType(res.occupancy_type || 'OWNER');
    setShowEditModal(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult({ type: null, message: '' });

    try {
      if (!userAptId) throw new Error('Your profile is not linked to an apartment.');

      // 2. Create invitation in database
      const { data: invitation, error: insertError } = await supabase
        .from('invitations')
        .insert({
          email:          inviteEmail || null,
          apartment_id:   userAptId,
          unit_number:    inviteUnit || null,
          sqft_build_up:  parseFloat(inviteSqftBuildUp) || 0,
          sqft_carpet:    parseFloat(inviteSqftCarpet) || 0,
          sqft_uds:       parseFloat(inviteSqftUDS) || 0,
          occupancy_type: inviteOccupancyType,
          invited_by:     (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (insertError || !invitation) throw new Error('Failed to create invitation.');

      const inviteLink = `${window.location.origin}/join/${invitation.token}`;

      // 3. Send email via Brevo (if email provided)
      if (inviteEmail) {
        const emailResult = await sendInviteEmail({
          toEmail:       inviteEmail,
          apartmentName: 'Your Apartment',
          inviterName:   userFullName || 'Your Admin',
          unitNumber:    inviteUnit || undefined,
          inviteToken:   invitation.token,
        });

        if (!emailResult.success) {
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
      setInviteSqftBuildUp('');
      setInviteSqftCarpet('');
      setInviteSqftUDS('');
      setInviteOccupancyType('OWNER');
      fetchResidents();
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
    setInviteSqftBuildUp('');
    setInviteSqftCarpet('');
    setInviteSqftUDS('');
    setInviteOccupancyType('OWNER');
    setInviteResult({ type: null, message: '' });
    setCopied(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Resident Directory</h2>
             {userRole === 'SUPER_ADMIN' && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">
                  Global Oversight
                </span>
             )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage unit assignments and member access.</p>
          
          {userRole === 'SUPER_ADMIN' && allApts.length > 0 && (
            <div className="mt-4 flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-2xl border border-black/5 max-w-sm">
               <Building2 size={16} className="ml-2 text-primary" />
               <select 
                 value={userAptId || ''}
                 onChange={(e) => {
                   const id = e.target.value;
                   setUserAptId(id);
                   fetchResidents(id);
                 }}
                 className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-wider"
               >
                 {allApts.map(a => (
                   <option key={a.id} value={a.id}>{a.name}</option>
                 ))}
               </select>
            </div>
          )}
        </div>

        {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && userAptId && (
          <div className="flex gap-3">
            <button
              onClick={() => { setSyncing(true); fetchResidents(userAptId || undefined).finally(() => setSyncing(false)); }}
              className={`flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all ${syncing ? 'opacity-50' : ''}`}
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
              Sync Profile
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <UserPlus size={18} /> Invite Member
            </button>
          </div>
        )}
      </div>

      {!userAptId && !loading && (
        <div className="glass p-12 text-center border-amber-500/20 bg-amber-500/5">
           <AlertCircle size={40} className="mx-auto mb-4 text-amber-500" />
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Not Linked to an Apartment</h3>
           <p className="text-slate-500 max-w-md mx-auto mb-6">
             You haven't joined or created an apartment community yet. Please use your invite code or create a new community to view residents.
           </p>
           <button 
             onClick={() => window.location.href = '/complete-profile'} 
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all"
           >
             Finish Setup
           </button>
        </div>
      )}

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
            <div className="col-span-full p-20 text-center space-y-4">
               <Loader2 className="animate-spin mx-auto text-indigo-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {userAptId ? 'Fetching Community Data...' : 'Initializing Session...'}
               </p>
            </div>
          ) : (filteredResidents.length === 0 && filteredInvites.length === 0) ? (
            <div className="col-span-full p-20 text-center glass opacity-50">
              <Users size={40} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400">{search ? 'No residents match your search.' : 'No residents registered yet.'}</p>
            </div>
          ) : (
            <>
              {filteredResidents.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass p-6 bg-white/60 dark:bg-slate-800/60 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative border-slate-200 dark:border-slate-800 flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
                      {r.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold capitalize truncate ${r.is_synced ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                          {r.full_name}
                        </h4>
                        {r.role === 'ADMIN' && <ShieldCheck size={14} className="text-indigo-500 shrink-0" />}
                        {r.role === 'SUPER_ADMIN' && <ShieldCheck size={14} className="text-amber-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${r.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'}`}>
                          {r.role || 'MEMBER'}
                        </span>
                        {user && r.id === user.id && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded uppercase tracking-widest">You</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
                        <MapPin size={12} className={r.unit_number ? "text-indigo-400" : "text-rose-400"} />
                        <span className={`text-[11px] font-black uppercase tracking-tight ${r.unit_number ? "text-slate-700 dark:text-slate-200" : "text-rose-500"}`}>
                          {r.unit_number ? `Unit ${r.unit_number}` : 'Unassigned'}
                        </span>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 shadow-sm ${r.occupancy_type === 'TENANT' ? 'bg-amber-500/5 text-amber-600' : 'bg-emerald-500/5 text-emerald-600'}`}>
                        <ShieldCheck size={12} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{r.occupancy_type || 'OWNER'}</span>
                      </div>

                      {apartmentConfig?.calc_type === 'SQFT' && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm ${
                          ((apartmentConfig?.calc_basis === 'CARPET' ? r.sqft_carpet : 
                           apartmentConfig?.calc_basis === 'UDS' ? r.sqft_uds : 
                           r.sqft_build_up) || 0) > 0 
                           ? 'bg-blue-500/5 text-blue-600 border-blue-500/10' 
                           : 'bg-rose-500/5 text-rose-600 border-rose-500/10 animate-pulse'
                        }`}>
                          <Maximize2 size={12} />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {((apartmentConfig?.calc_basis === 'CARPET' ? r.sqft_carpet : 
                               apartmentConfig?.calc_basis === 'UDS' ? r.sqft_uds : 
                               r.sqft_build_up) || 0) + ' SQFT'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-medium">
                      <Mail size={12} />
                      <span className="truncate max-w-[150px]">{r.email}</span>
                    </div>
                    {((user && r.id === user.id) || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                      <button onClick={() => openEditModal(r)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary transition-all">
                        <Settings size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {filteredInvites.map((inv) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass group relative p-6 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-all opacity-80 bg-amber-500/[0.02] flex flex-col"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <div className="px-2 py-1 bg-amber-500 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">Pending Invite</div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white italic truncate max-w-[150px]">{inv.email || 'Mystery Guest'}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sent {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Unit</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{inv.unit_number || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Area Code</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                          {inv.sqft_build_up || inv.sqft_carpet || inv.sqft_uds || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600/60 text-[10px] font-bold uppercase tracking-widest">
                      <Clock size={12} />
                      <span>Awaiting Response</span>
                    </div>
                    {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                      <button className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-all">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ======= INVITE MODAL ======= */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetInviteModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl transition-all"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass max-w-lg w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative"
            >
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
                {inviteResult.type && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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

                {!inviteResult.type && (
                  <motion.form key="form" onSubmit={handleInvite} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                        Member Email <span className="text-slate-400 font-normal normal-case">(optional)</span>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">Occupancy Type</label>
                        <select
                          value={inviteOccupancyType}
                          onChange={(e) => setInviteOccupancyType(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-xs font-bold h-[46px]"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="TENANT">Tenant</option>
                        </select>
                      </div>

                      {/* Dynamic SQFT Field based on Apartment Type */}
                      {apartmentConfig?.calc_type === 'SQFT' && (
                         <div className="space-y-1.5 flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1">
                               {apartmentConfig?.calc_basis?.replace('_', ' ')} Area
                            </label>
                            <input
                              type="number"
                              value={apartmentConfig?.calc_basis === 'BUILD_UP' ? inviteSqftBuildUp : 
                                     apartmentConfig?.calc_basis === 'CARPET' ? inviteSqftCarpet : 
                                     inviteSqftUDS}
                              onChange={(e) => {
                                if (apartmentConfig?.calc_basis === 'BUILD_UP') setInviteSqftBuildUp(e.target.value);
                                else if (apartmentConfig?.calc_basis === 'CARPET') setInviteSqftCarpet(e.target.value);
                                else setInviteSqftUDS(e.target.value);
                              }}
                              placeholder="SQFT"
                              className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm font-black h-[46px]"
                            />
                         </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                      <Send size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 leading-relaxed font-medium">
                        {inviteEmail
                          ? `An professional invite will be sent to ${inviteEmail}, including instructions to join ${apartmentConfig?.name || 'the community'}.`
                          : 'Generate a shareable link to send via WhatsApp or any preferred messaging app.'}
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

      {/* ======= EDIT MODAL ======= */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative"
            >
              <button onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={18} />
              </button>
              
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <Settings className="text-primary" /> Modify Unit Info
              </h3>

              <form onSubmit={handleUpdateResident} className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Number</label>
                      <input 
                         type="text" 
                         value={editUnitNumber}
                         onChange={(e) => setEditUnitNumber(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Occupancy</label>
                      <select 
                         value={editOccType}
                         onChange={(e) => setEditOccType(e.target.value as any)}
                         className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-3 rounded-xl outline-none text-sm font-bold h-[46px]"
                      >
                         <option value="OWNER">Owner</option>
                         <option value="TENANT">Tenant</option>
                      </select>
                   </div>
                 </div>

                 <div className="space-y-3 pt-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Maximize2 size={12} /> Area Measurements (SQFT)
                   </p>
                   <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1 text-center">
                         <label className="text-[8px] font-black text-slate-400 uppercase">Build-up</label>
                         <input type="number" value={editSqftBuildUp} onChange={(e) => setEditSqftBuildUp(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 px-2 py-2 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1 text-center">
                         <label className="text-[8px] font-black text-slate-400 uppercase">Carpet</label>
                         <input type="number" value={editSqftCarpet} onChange={(e) => setEditSqftCarpet(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 px-2 py-2 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1 text-center">
                         <label className="text-[8px] font-black text-slate-400 uppercase">UDS</label>
                         <input type="number" value={editSqftUDS} onChange={(e) => setEditSqftUDS(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 px-2 py-2 rounded-lg text-xs" />
                      </div>
                   </div>
                 </div>

                 <button type="submit" disabled={updating} className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 mt-4 disabled:opacity-50">
                    {updating ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
