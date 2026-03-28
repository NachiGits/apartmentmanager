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
  LayoutGrid,
  List,
  ExternalLink,
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
  const [viewType, setViewType]               = useState<'grid' | 'table'>('grid');

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
  const [allApts, setAllApts]               = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUser(authUser);

      const { data: profile } = await supabase
        .from('profiles')
        .select('apartment_id, role, full_name')
        .eq('id', authUser.id)
        .single();
      
      const currentRole = profile?.role || 'MEMBER';
      setUserRole(currentRole);
      setUserFullName(profile?.full_name || '');

      let aptId = profile?.apartment_id;

      if (currentRole === 'SUPER_ADMIN') {
        const { data: apts } = await supabase.from('apartments').select('*').order('name');
        setAllApts(apts || []);
        if (!aptId && apts && apts.length > 0) {
           aptId = 'all';
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
      
      const finalAptId = aptId || 'all';
      setUserAptId(finalAptId);
      fetchResidents(finalAptId);
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
      let query = supabase.from('apartment_members').select('*, profiles(*), apartments(name)');
      
      if (aptId !== 'all') {
        query = query.eq('apartment_id', aptId);
      }

      const { data: memberRows, error: memberError } = await query;
      if (memberError) throw memberError;

      const profs = memberRows?.map(m => ({
        ...m.profiles,
        id: m.profile_id,
        role: m.role,
        joined_at: m.joined_at,
        full_name: m.profiles?.full_name || 'System User',
        email: m.profiles?.email || m.profile_id.slice(0, 8),
        is_synced: !!m.profiles,
        apartment_id: m.apartment_id,
        apartment_name: m.apartments?.name || 'Unknown Community'
      })) || [];

      let invQuery = supabase.from('invitations').select('*, apartments(name)').eq('status', 'PENDING');
      if (aptId !== 'all') {
        invQuery = invQuery.eq('apartment_id', aptId);
      }
      
      const { data: invs, error: inviteError } = await invQuery;
      if (inviteError) throw inviteError;

      setResidents(profs);
      setInvites((invs || []).map(i => ({
        ...i,
        apartment_name: i.apartments?.name || 'Unknown Community'
      })));

      if (aptId !== 'all') {
        const { data: apt } = await supabase.from('apartments').select('*').eq('id', aptId).single();
        if (apt) setApartmentConfig(apt);
      } else {
        setApartmentConfig(null);
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
      r.unit_number?.toLowerCase().includes(q) ||
      r.apartment_name?.toLowerCase().includes(q)
    );
  });

  const filteredInvites = invites.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.email?.toLowerCase().includes(q) ||
      inv.unit_number?.toLowerCase().includes(q) ||
      inv.apartment_name?.toLowerCase().includes(q)
    );
  });

  const handleUpdateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident || !userRole) return;
    setUpdating(true);

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isSelf = editingResident.id === user?.id;

    try {
      if (!isAdmin && !isSelf) throw new Error('Unauthorized');
      if (!isAdmin && (editingResident.role === 'ADMIN' || editingResident.role === 'SUPER_ADMIN')) {
        throw new Error('Members cannot change administrative records.');
      }

      const updateData: any = {
        unit_number: editUnitNumber,
        occupancy_type: editOccType
      };

      if (isAdmin) {
        updateData.sqft_build_up = parseFloat(editSqftBuildUp) || 0;
        updateData.sqft_carpet   = parseFloat(editSqftCarpet) || 0;
        updateData.sqft_uds      = parseFloat(editSqftUDS) || 0;
        updateData.sqft_status   = 'APPROVED';
        updateData.sqft_pending_build_up = null;
        updateData.sqft_pending_carpet   = null;
        updateData.sqft_pending_uds      = null;
      } else {
        updateData.sqft_pending_build_up = parseFloat(editSqftBuildUp) || 0;
        updateData.sqft_pending_carpet   = parseFloat(editSqftCarpet) || 0;
        updateData.sqft_pending_uds      = parseFloat(editSqftUDS) || 0;
        updateData.sqft_status           = 'PENDING';
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingResident.id);

      if (error) throw error;

      // === ADMINISTRATIVE NOTIFICATIONS ===
      if (!isAdmin) {
         // 1. Database Notification
         const { data: admins } = await supabase
            .from('apartment_members')
            .select('profile_id')
            .eq('apartment_id', editingResident.apartment_id)
            .eq('role', 'ADMIN');
         
         if (admins && admins.length > 0) {
            const notifs = admins.map(a => ({
               apartment_id: editingResident.apartment_id,
               profile_id: a.profile_id,
               title: 'SQFT Change Request',
               description: `${editingResident.full_name} from Unit ${editUnitNumber} has requested area updates.`,
               type: 'SQFT_REQUEST'
            }));
            await supabase.from('notifications').insert(notifs);

            // 2. Email Admin directly
            const { data: adminProf } = await supabase.from('profiles').select('email').eq('id', admins[0].profile_id).single();
            if (adminProf?.email) {
               import('../lib/brevo').then(m => m.sendSqftChangeEmail({
                  adminEmail: adminProf.email,
                  residentName: editingResident.full_name,
                  apartmentName: editingResident.apartment_name,
                  unitNumber: editUnitNumber
               }));
            }
         }
         import('react-hot-toast').then(({ toast }) => toast.success('Request Submitted to Admin!'));
      } else {
         import('react-hot-toast').then(({ toast }) => toast.success('Record Updated Successfully!'));
      }

      setShowEditModal(false);
      fetchResidents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveSqft = async (res: any) => {
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          sqft_build_up: res.sqft_pending_build_up || 0,
          sqft_carpet:   res.sqft_pending_carpet || 0,
          sqft_uds:      res.sqft_pending_uds || 0,
          sqft_status:   'APPROVED',
          sqft_pending_build_up: null,
          sqft_pending_carpet: null,
          sqft_pending_uds: null
        })
        .eq('id', res.id);
      if (error) throw error;
      fetchResidents();
    } catch (err: any) {
       alert('Approval failed: ' + err.message);
    } finally {
       setUpdating(false);
    }
  };

  const openEditModal = (res: any) => {
    setEditingResident(res);
    setEditUnitNumber(res.unit_number || '');
    if (res.sqft_status === 'PENDING') {
      setEditSqftBuildUp(res.sqft_pending_build_up?.toString() || '');
      setEditSqftCarpet(res.sqft_pending_carpet?.toString() || '');
      setEditSqftUDS(res.sqft_pending_uds?.toString() || '');
    } else {
      setEditSqftBuildUp(res.sqft_build_up?.toString() || '');
      setEditSqftCarpet(res.sqft_carpet?.toString() || '');
      setEditSqftUDS(res.sqft_uds?.toString() || '');
    }
    setEditOccType(res.occupancy_type || 'OWNER');
    setShowEditModal(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult({ type: null, message: '' });

    try {
      if (!userAptId || userAptId === 'all') throw new Error('Please select a specific apartment to send an invite.');

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

      if (inviteEmail) {
        await sendInviteEmail({
          toEmail:       inviteEmail,
          apartmentName: apartmentConfig?.name || 'Your Apartment',
          inviterName:   userFullName || 'Your Admin',
          unitNumber:    inviteUnit || undefined,
          inviteToken:   invitation.token,
        });
      }

      setInviteResult({ type: 'success', message: 'Invite created!', link: inviteLink });
      setInviteEmail('');
      setInviteUnit('');
      fetchResidents();
    } catch (err: any) {
      setInviteResult({ type: 'error', message: err.message });
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
    setInviteResult({ type: null, message: '' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Resident Directory</h2>
             {userRole === 'SUPER_ADMIN' && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">
                  Global Oversight
                </span>
             )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage and track community members.</p>
          
          {userRole === 'SUPER_ADMIN' && (
            <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-[450px]">
               <Building2 size={16} className="ml-2 text-indigo-500" />
               <select 
                 value={userAptId || 'all'}
                 onChange={(e) => {
                   setUserAptId(e.target.value);
                   fetchResidents(e.target.value);
                 }}
                 className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-wider h-10 px-2 dark:text-white"
               >
                 <option value="all">🌐 All Communities (Global View)</option>
                 {allApts.map(a => (
                   <option key={a.id} value={a.id}>{a.name}</option>
                 ))}
               </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <button onClick={() => setViewType('grid')} className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewType('table')} className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}><List size={18} /></button>
           </div>
           
           {userAptId !== 'all' && (
             <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"><UserPlus size={18} /> <span className="hidden sm:inline">Invite Member</span></button>
           )}
        </div>
      </div>

      <div className="glass p-6 bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-8 text-slate-400">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search directory..." className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400" />
          </div>
        </div>

        {loading ? (
          <div className="p-32 text-center space-y-4"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></div>
        ) : (filteredResidents.length === 0 && filteredInvites.length === 0) ? (
          <div className="p-32 text-center"><Users size={48} className="mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nothing found.</p></div>
        ) : viewType === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredResidents.map((r, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={r.id} className="glass p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col group relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg">{r.full_name?.charAt(0) || 'U'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate capitalize">{r.full_name}</h4>
                        {(r.role === 'ADMIN' || r.role === 'SUPER_ADMIN') && <ShieldCheck size={14} className="text-indigo-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${r.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'}`}>{r.role || 'MEMBER'}</span>
                         {r.apartment_name && <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-600/10 text-indigo-600 rounded-md uppercase truncate max-w-[100px]">{r.apartment_name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-white">{r.unit_number || '---'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 text-center relative">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-white">{r.occupancy_type || 'OWNER'}</p>
                       {r.sqft_status === 'PENDING' && <div className="absolute top-0 right-0 p-1"><Clock size={10} className="text-amber-500 animate-pulse" /></div>}
                    </div>
                  </div>

                  {r.sqft_status === 'PENDING' && (
                    <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                       <div className="flex items-center justify-between mb-2"><span className="text-[9px] font-black text-amber-600 uppercase">Pending SQFT Update</span></div>
                       <div className="grid grid-cols-3 gap-2 text-center">
                          <div><div className="text-[8px] font-black text-slate-400">BUILD</div><div className="text-[10px] font-black">{r.sqft_pending_build_up || 0}</div></div>
                          <div><div className="text-[8px] font-black text-slate-400">CARPET</div><div className="text-[10px] font-black">{r.sqft_pending_carpet || 0}</div></div>
                          <div><div className="text-[8px] font-black text-slate-400">UDS</div><div className="text-[10px] font-black">{r.sqft_pending_uds || 0}</div></div>
                       </div>
                       {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                         <button onClick={() => handleApproveSqft(r)} disabled={updating} className="w-full mt-3 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2">{updating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve</button>
                       )}
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate text-[11px] text-slate-500"><Mail size={12} /> <span className="truncate">{r.email}</span></div>
                    {(((user && r.id === user.id) || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && !(userRole === 'MEMBER' && (r.role === 'ADMIN' || r.role === 'SUPER_ADMIN'))) && (
                      <button onClick={() => openEditModal(r)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-500"><Settings size={18} /></button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700"><th className="px-6 py-5">Resident</th><th className="px-6 py-5">Community</th><th className="px-6 py-5">Unit</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right w-10"></th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResidents.map((r) => (
                  <tr key={r.id} className="text-sm hover:bg-indigo-500/[0.03] transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-xs">{r.full_name?.charAt(0) || 'U'}</div><span className="font-bold">{r.full_name}</span></td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{r.apartment_name}</td>
                    <td className="px-6 py-4 font-black">#{r.unit_number || '---'}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${r.sqft_status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>{r.sqft_status === 'PENDING' ? 'PENDING SQFT' : (r.role || 'MEMBER')}</span></td>
                    <td className="px-6 py-4 text-right">{(((user && r.id === user.id) || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && !(userRole === 'MEMBER' && (r.role === 'ADMIN' || r.role === 'SUPER_ADMIN'))) && (<button onClick={() => openEditModal(r)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 rounded-lg text-slate-400"><MoreVertical size={18} /></button>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======= EDIT MODAL ======= */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative">
              <button onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-full"><X size={18} /></button>
              <h3 className="text-xl font-black mb-1 flex items-center gap-2"><Settings className="text-indigo-600" /> {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || editingResident?.id !== user?.id) ? 'Profile Update' : 'Request Changes'}</h3>
              <p className="text-xs text-slate-400 mb-6 uppercase font-bold">{editingResident?.apartment_name}</p>
              <form onSubmit={handleUpdateResident} className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500">Unit Number</label><input value={editUnitNumber} onChange={(e) => setEditUnitNumber(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm font-bold dark:text-white" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500">Occupancy</label><select value={editOccType} onChange={(e) => setEditOccType(e.target.value as any)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm font-bold h-[46px] dark:text-white"><option value="OWNER">Owner</option><option value="TENANT">Tenant</option></select></div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 py-4">
                    <div className="text-center"><label className="text-[8px] font-black text-slate-400 block mb-1">Build-up</label><input value={editSqftBuildUp} onChange={(e)=>setEditSqftBuildUp(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none py-2 rounded-lg text-xs text-center font-bold dark:text-white" /></div>
                    <div className="text-center"><label className="text-[8px] font-black text-slate-400 block mb-1">Carpet</label><input value={editSqftCarpet} onChange={(e)=>setEditSqftCarpet(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none py-2 rounded-lg text-xs text-center font-bold dark:text-white" /></div>
                    <div className="text-center"><label className="text-[8px] font-black text-slate-400 block mb-1">UDS</label><input value={editSqftUDS} onChange={(e)=>setEditSqftUDS(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none py-2 rounded-lg text-xs text-center font-bold dark:text-white" /></div>
                 </div>
                 <button type="submit" disabled={updating} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 disabled:opacity-50">
                    {updating ? <Loader2 size={18} className="animate-spin" /> : (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? 'Apply Changes' : 'Submit for Approval'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
