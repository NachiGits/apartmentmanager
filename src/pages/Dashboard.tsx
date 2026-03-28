import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Wallet, 
  MessageSquareWarning, 
  TrendingUp, 
  Clock,
  CircleAlert,
  CheckCircle2,
  Plus,
  Building2,
  ShieldCheck,
  X,
  Loader2,
  MapPin,
  Search,
  UserCog,
  ShieldAlert,
  SearchX
} from 'lucide-react';

export const Dashboard = () => {
  const [loading, setLoading]     = useState(true);
  const [userRole, setUserRole]   = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS'>(
     searchParams.get('tab') === 'users' ? 'USERS' : 'OVERVIEW'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'users') setActiveTab('USERS');
    else setActiveTab('OVERVIEW');
  }, [searchParams]);

  const handleTabChange = (tab: 'OVERVIEW' | 'USERS') => {
    setActiveTab(tab);
    setSearchParams(tab === 'USERS' ? { tab: 'users' } : {});
  };

  const [stats, setStats]         = useState([
    { label: 'Total Residents', value: '0', icon: Users, color: 'bg-emerald-500', trend: 'Live' },
    { label: 'Apartment Units', value: '0', icon: Building2, color: 'bg-indigo-500', trend: 'Active' },
    { label: 'Pending Requests', value: '0', icon: MessageSquareWarning, color: 'bg-amber-500', trend: 'Action' },
    { label: 'System Health', value: 'Prime', icon: ShieldCheck, color: 'bg-accent', trend: 'Stable' },
  ]);

  // Modal State
  const [showCreateApt, setShowCreateApt] = useState(false);
  const [editingAptId, setEditingAptId]   = useState<string | null>(null);
  const [newAptName, setNewAptName]       = useState('');
  const [newAptAddress, setNewAptAddress] = useState('');
  const [creating, setCreating]           = useState(false);

  const [apartments, setApartments] = useState<any[]>([]);
  const [aptMemberCounts, setAptMemberCounts] = useState<{ [key: string]: { admins: number, members: number } }>({});
  const [showDirectory, setShowDirectory] = useState<string | null>(null); // Apartment ID
  const [directoryMembers, setDirectoryMembers] = useState<any[]>([]);
  const [dirLoading, setDirLoading] = useState(false);

  // User Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
    if (userRole === 'SUPER_ADMIN') {
      fetchAllUsers();
    }
  }, [userRole]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role, apartment_id').eq('id', user.id).single();
      const currentRole = profile?.role || 'RESIDENT';
      setUserRole(currentRole);

      let residents = 0;
      let aptsCount = 0;
      let openComplaints = 0;
      let activeAptsList: any[] = [];

      if (currentRole === 'SUPER_ADMIN') {
        const [res, apts, comps, allApts] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('apartments').select('id', { count: 'exact', head: true }),
          supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
          supabase.from('apartments').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        residents = res.count || 0;
        aptsCount = apts.count || 0;
        openComplaints = comps.count || 0;
        activeAptsList = allApts.data || [];

        // SUPER_ADMIN also needs counts per apartment to show on cards
        const aptIds = activeAptsList.map(a => a.id);
        if (aptIds.length > 0) {
          const { data: memberData } = await supabase
            .from('apartment_members')
            .select('apartment_id, role')
            .in('apartment_id', aptIds);
          
          const counts: { [key: string]: { admins: number, members: number } } = {};
          aptIds.forEach(id => counts[id] = { admins: 0, members: 0 });
          memberData?.forEach(m => {
            if (m.role === 'ADMIN') counts[m.apartment_id].admins++;
            else counts[m.apartment_id].members++;
          });
          
          // Ensure Super Admin view reflects their own implicit role if no other admin exists
          aptIds.forEach(id => {
            if (counts[id].admins === 0) counts[id].admins = 1;
          });
          setAptMemberCounts(counts);
        }
      } else {
        // Fetch for specific apartment(s) this admin/member belongs to
        const { data: memberships } = await supabase
          .from('apartment_members')
          .select('role, apartment_id, apartments(*)')
          .eq('profile_id', user.id);
        
        const myAptIds = memberships?.map(m => m.apartment_id) || [];
        // Residents see their own apartments, Admins see managed ones
        activeAptsList = memberships?.map(m => m.apartments) || [];
        aptsCount = myAptIds.length;

        if (myAptIds.length > 0) {
          const [resData, comps] = await Promise.all([
            supabase.from('apartment_members').select('role, apartment_id').in('apartment_id', myAptIds),
            supabase.from('complaints').select('id', { count: 'exact', head: true }).in('apartment_id', myAptIds).eq('status', 'OPEN')
          ]);
          
          const members = resData.data || [];
          residents = members.length;
          openComplaints = comps.count || 0;

          // Process multi-tenant counts
          const counts: { [key: string]: { admins: number, members: number } } = {};
          myAptIds.forEach(id => counts[id] = { admins: 0, members: 0 });
          members?.forEach(m => {
            if (m.role === 'ADMIN') counts[m.apartment_id].admins++;
            else counts[m.apartment_id].members++;
          });

          // Ensure Resident view also sees at least 1 admin if they are managing it
          if (currentRole === 'ADMIN') {
             myAptIds.forEach(id => {
               if (counts[id].admins === 0) counts[id].admins = 1;
             });
          }
          setAptMemberCounts(counts);
        }
      }

      setStats([
        { label: 'Total Residents', value: residents.toString(), icon: Users, color: 'bg-emerald-500', trend: 'Live' },
        { label: 'Apartment Units', value: aptsCount.toString(), icon: Building2, color: 'bg-indigo-500', trend: 'Active' },
        { label: 'Pending Requests', value: openComplaints.toString(), icon: MessageSquareWarning, color: 'bg-amber-500', trend: 'Action' },
        { label: 'Service Status', value: 'Prime', icon: ShieldCheck, color: 'bg-accent', trend: 'Stable' },
      ]);
      setApartments(activeAptsList);

      // Fetch dynamic announcements (Real Alerts)
      const aptIds = activeAptsList.map(a => a.id);
      let announceQuery = supabase.from('announcements').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(3);
      if (currentRole !== 'SUPER_ADMIN' && aptIds.length > 0) {
        announceQuery = announceQuery.in('apartment_id', aptIds);
      }
      const { data: alerts } = await announceQuery;
      setAnnouncements(alerts || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      setAllUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleSuperAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'SUPER_ADMIN' ? 'RESIDENT' : 'SUPER_ADMIN';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const fetchDirectory = async (aptId: string) => {
    setDirLoading(true);
    try {
      const { data } = await supabase
        .from('apartment_members')
        .select(`
          role,
          id,
          profile_id,
          profiles:profile_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('apartment_id', aptId);
      
      setDirectoryMembers(data || []);
      setShowDirectory(aptId);
    } catch (err) {
      console.error('Directory fetch error:', err);
    } finally {
      setDirLoading(false);
    }
  };

  const handleCreateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (editingAptId) {
        // Update mode
        const { error } = await supabase
          .from('apartments')
          .update({ name: newAptName, address: newAptAddress })
          .eq('id', editingAptId);
        if (error) throw error;
      } else {
        // Create mode
        const { data: apt, error } = await supabase
          .from('apartments')
          .insert({ name: newAptName, address: newAptAddress, created_by: user?.id })
          .select()
          .single();
        if (error) throw error;
        
        // Auto-join creator as Admin
        await supabase.from('apartment_members').insert({
          profile_id: user?.id,
          apartment_id: apt.id,
          role: 'ADMIN'
        });
      }

      setShowCreateApt(false);
      setEditingAptId(null);
      setNewAptName('');
      setNewAptAddress('');
      fetchDashboardData();
    } catch (err: any) {
      alert('Operation failed: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
               {userRole?.replace('_', ' ')}
             </span>
          </div>
          <h2 className="text-4xl font-black text-surface-900 dark:text-white tracking-tighter">Community Hub</h2>
          <p className="text-surface-500 mt-2 font-medium">Overview of your HomeConnect community.</p>
        </motion.div>
        
        {userRole === 'SUPER_ADMIN' && (
          <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-white/20 shadow-sm self-start md:self-auto">
            <button 
              onClick={() => handleTabChange('OVERVIEW')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-primary text-white shadow-lg shadow-emerald-500/20' : 'text-surface-500 hover:text-surface-900'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => handleTabChange('USERS')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-primary text-white shadow-lg shadow-emerald-500/20' : 'text-surface-500 hover:text-surface-900'}`}
            >
              User Management
            </button>
          </div>
        )}

        {userRole === 'SUPER_ADMIN' && activeTab === 'OVERVIEW' && (
          <div className="flex gap-4">
            <button 
              onClick={() => setShowCreateApt(true)}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-premium text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus size={18} /> New Apartment
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="hover-card group glass relative p-8 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 cursor-pointer overflow-hidden"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className={`p-4 rounded-[1.5rem] ${stat.color} text-white shadow-2xl transition-transform group-hover:scale-110`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${idx % 2 === 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-8 relative z-10">
              <h3 className="text-surface-500 dark:text-surface-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
              <p className="text-4xl font-black mt-2 text-surface-900 dark:text-white tracking-tighter leading-none">
                {loading ? <Loader2 className="animate-spin text-surface-200" size={24} /> : stat.value}
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          </motion.div>
        ))}
      </div>

      {activeTab === 'OVERVIEW' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Manage Communities / Portfolio oversight */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-6 md:p-10 bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-xl min-h-[500px]">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
                  <h3 className="text-xl font-black flex items-center gap-4 text-surface-900 dark:text-white">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Building2 size={22} strokeWidth={2.5} /></div>
                    {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') ? 'Portfolio Oversight' : 'Your Residence'}
                  </h3>
                  
                  <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="Search complexes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-surface-100 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {apartments.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.address.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2rem]">
                      <div className="w-16 h-16 bg-surface-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 text-surface-400">
                        <SearchX size={32} />
                      </div>
                      <p className="text-surface-400 font-bold uppercase tracking-widest text-[10px]">No matches for "{searchTerm}"</p>
                    </div>
                  ) : apartments.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.address.toLowerCase().includes(searchTerm.toLowerCase())).map((apt) => (
                    <div key={apt.id} className="group p-5 md:p-6 bg-surface-50 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/10 hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between shadow-sm">
                       <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white dark:bg-white/10 shadow-lg flex items-center justify-center border border-black/5 text-primary">
                             <Building2 size={32} strokeWidth={2.5} />
                          </div>
                          <div>
                             <p className="text-xl font-black text-surface-900 dark:text-white leading-tight">{apt.name}</p>
                             <p className="text-xs text-surface-500 font-bold uppercase tracking-wide mt-1">{apt.address}</p>
                             {aptMemberCounts[apt.id] && (
                               <div className="flex gap-4 mt-3">
                                 <div className="flex items-center gap-1.5">
                                   <ShieldCheck size={12} className="text-indigo-500" />
                                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{aptMemberCounts[apt.id].admins} Admins</span>
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                   <Users size={12} className="text-emerald-500" />
                                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{aptMemberCounts[apt.id].members} Residents</span>
                                 </div>
                               </div>
                             )}
                          </div>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                          {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? (
                            <>
                              <button 
                                onClick={() => fetchDirectory(apt.id)}
                                className="px-4 py-3 bg-white dark:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm border border-black/5 whitespace-nowrap"
                              >
                                 Directory
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingAptId(apt.id);
                                  setNewAptName(apt.name);
                                  setNewAptAddress(apt.address);
                                  setShowCreateApt(true);
                                }}
                                className="px-4 py-3 bg-white dark:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm border border-black/5 whitespace-nowrap"
                              >
                                 Modify
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => fetchDirectory(apt.id)}
                              className="px-6 py-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all w-full"
                            >
                               Directory
                            </button>
                          )}
                       </div>
                    </div>
                  ))}
                  
                  {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                    <button 
                      onClick={() => {
                        setEditingAptId(null);
                        setNewAptName('');
                        setNewAptAddress('');
                        setShowCreateApt(true);
                      }}
                      className="w-full p-8 border-2 border-dashed border-surface-200 dark:border-white/10 rounded-[2rem] text-surface-400 font-black text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 group"
                    >
                      <Plus className="group-hover:rotate-90 transition-transform" /> Add New Community
                    </button>
                  )}
                </div>
              </div>
            </div>
  
          {/* Community Broadcast UI */}
          <div className="space-y-8">
            <div className="glass p-6 md:p-10 bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl min-h-[500px] flex flex-col">
              <h3 className="text-xl font-black mb-8 md:mb-10 flex items-center gap-4 text-surface-900 dark:text-white uppercase tracking-widest">
                <CircleAlert size={28} className="text-primary" strokeWidth={2.5} />
                Community Alerts
              </h3>
              
              <div className="space-y-6 flex-1">
                {announcements.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2.5rem] text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Zero active alerts or announcements.</p>
                  </div>
                ) : announcements.map((alert) => (
                  <div 
                    key={alert.id}
                    onClick={() => setSelectedNotice(alert)}
                    className="p-8 bg-surface-50 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Announcement</p>
                    </div>
                    <p className="text-lg font-black text-surface-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{alert.title}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed font-bold line-clamp-1">{alert.content}</p>
                  </div>
                ))}
              </div>
  
              <button 
                onClick={() => window.open('/announcements', '_blank')}
                className="w-full mt-10 p-6 bg-surface-900 dark:bg-white dark:text-surface-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-xl active:scale-95"
              >
                View All Notices
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* USER MANAGEMENT SECTION */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12 bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl min-h-[600px]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div>
              <h3 className="text-3xl font-black flex items-center gap-4 text-surface-900 dark:text-white tracking-tighter">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary"><UserCog size={32} strokeWidth={2.5} /></div>
                Account Oversight
              </h3>
              <p className="text-surface-500 font-bold uppercase tracking-widest text-[10px] mt-2">Managing global user registrations and permissions</p>
            </div>

            <div className="relative group min-w-[350px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Find users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface-100 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-primary/20 rounded-[1.5rem] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {usersLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                 <Loader2 className="animate-spin text-primary mb-4" size={48} />
                 <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Synchronizing database accounts...</p>
              </div>
            ) : allUsers.filter(u => 
                u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="col-span-full text-center py-20 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[3rem]">
                   <SearchX size={48} className="mx-auto text-surface-300 mb-4" />
                   <p className="text-surface-400 font-black uppercase tracking-widest text-xs">No users matching your search.</p>
                </div>
              ) : allUsers.filter(u => 
                u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
              ).map((u) => (
                <div key={u.id} className="p-6 bg-surface-50 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/10 hover:border-primary/20 transition-all flex flex-col justify-between group shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-premium flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : u.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-surface-900 dark:text-white leading-tight truncate">{u.full_name || 'Incomplete Profile'}</p>
                      <p className="text-xs text-surface-500 font-medium truncate mb-3">{u.email}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.role === 'SUPER_ADMIN' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-surface-200 dark:bg-white/10 text-surface-600'}`}>
                          {u.role}
                        </span>
                        {u.role === 'SUPER_ADMIN' && <ShieldAlert size={14} className="text-amber-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex gap-3">
                    <button 
                      onClick={() => toggleSuperAdmin(u.id, u.role)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-xl shadow-red-500/10' : 'bg-primary text-white hover:scale-105 shadow-xl shadow-emerald-500/20 active:scale-95'}`}
                    >
                      {u.role === 'SUPER_ADMIN' ? 'Revoke Power' : 'Grant Super Power'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* COMMUNITY DIRECTORY MODAL */}
      <AnimatePresence>
        {showDirectory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDirectory(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-2xl w-full bg-white dark:bg-surface-950 relative border border-white/20 overflow-hidden shadow-5xl"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between bg-surface-50/50 dark:bg-white/5">
                <div>
                  <h3 className="text-2xl font-black text-surface-900 dark:text-white">Community Directory</h3>
                  <p className="text-xs text-surface-500 font-bold uppercase tracking-widest mt-1">Authorized Estate Members</p>
                </div>
                <button 
                  onClick={() => setShowDirectory(null)}
                  className="p-3 hover:bg-black/5 rounded-2xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                {directoryMembers.map((member) => (
                  <div key={member.id} className="p-5 hover:bg-surface-50 dark:hover:bg-white/5 rounded-2xl flex items-center justify-between transition-colors border border-transparent hover:border-black/5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500 text-lg shadow-inner">
                        {member.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-black text-surface-900 dark:text-white leading-tight">{member.profiles?.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-surface-500 font-medium">{member.profiles?.email}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${member.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENT MODAL */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedNotice(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass p-10 bg-white dark:bg-surface-950 max-w-lg w-full relative border border-white/20 dark:border-white/10 shadow-5xl"
            >
              <button 
                onClick={() => setSelectedNotice(null)}
                className="absolute top-6 right-6 p-2 hover:bg-surface-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Active Announcement</p>
              </div>

              <h3 className="text-3xl font-black mb-4 text-surface-900 dark:text-white tracking-tighter">
                {selectedNotice.title}
              </h3>
              
              <div className="bg-surface-50 dark:bg-white/5 p-6 rounded-2xl mb-8 border border-black/5 dark:border-white/10">
                <p className="text-surface-600 dark:text-surface-300 leading-relaxed font-medium">
                  {selectedNotice.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Users size={14} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-surface-400 leading-none mb-1">Author</p>
                      <p className="text-sm font-bold text-surface-900 dark:text-white leading-none">{selectedNotice.profiles?.full_name || 'System Admin'}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-surface-400 leading-none mb-1">Posted</p>
                   <p className="text-sm font-bold text-surface-900 dark:text-white leading-none">{new Date(selectedNotice.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE APARTMENT MODAL */}
      <AnimatePresence>
        {showCreateApt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateApt(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass p-10 bg-white dark:bg-surface-950 max-w-lg w-full relative border border-white/20 dark:border-white/10 shadow-5xl"
            >
              <button 
                onClick={() => setShowCreateApt(false)}
                className="absolute top-6 right-6 p-2 hover:bg-surface-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-black mb-2 flex items-center gap-3 text-surface-900 dark:text-white">
                <Building2 size={24} className="text-primary" /> {editingAptId ? 'Modify Community' : 'New Community'}
              </h3>
              <p className="text-surface-500 mb-8 font-medium">{editingAptId ? 'Update community parameters.' : 'Initialize a new secure living environment.'}</p>

              <form onSubmit={handleCreateApartment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-surface-400">Apartment Name</label>
                  <input 
                    required
                    value={newAptName}
                    onChange={(e) => setNewAptName(e.target.value)}
                    placeholder="e.g. Skyline Residency"
                    className="w-full bg-surface-100 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-primary/20 p-4 rounded-2xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-surface-400">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                    <input 
                      required
                      value={newAptAddress}
                      onChange={(e) => setNewAptAddress(e.target.value)}
                      placeholder="123 Harmony Street, New York"
                      className="w-full bg-surface-100 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-primary/20 pl-12 pr-4 py-4 rounded-2xl font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateApt(false)}
                    className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-surface-100 dark:bg-white/5 rounded-2xl hover:bg-surface-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-4 bg-gradient-premium text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    {editingAptId ? 'Update Community' : 'Create Community'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
