import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquareWarning, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  Loader2,
  Building2,
  LayoutGrid,
  List,
  Filter,
  X,
  Send,
  User,
  ExternalLink
} from 'lucide-react';

export const Complaints = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAptId, setUserAptId] = useState<string | null>(null);
  const [allApts, setAllApts] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (userAptId) {
      fetchComplaints();
    }
  }, [userAptId]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('role, apartment_id').eq('id', user.id).single();
    const role = profile?.role || 'RESIDENT';
    setUserRole(role);

    let aptId = profile?.apartment_id;

    if (role === 'SUPER_ADMIN') {
      const { data: apts } = await supabase.from('apartments').select('*').order('name');
      setAllApts(apts || []);
      if (!aptId && apts && apts.length > 0) aptId = 'all';
    }
    
    const finalAptId = aptId || 'all';
    setUserAptId(finalAptId);
  };

  const fetchComplaints = async () => {
    setLoading(true);
    let query = supabase.from('complaints').select('*, profiles(full_name), apartments(name)');
    
    if (userAptId !== 'all') {
      query = query.eq('apartment_id', userAptId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    
    setComplaints(data?.map(c => ({
      ...c,
      apartment_name: c.apartments?.name || 'Unknown Community'
    })) || []);
    setLoading(false);
  };

  const filteredComplaints = complaints.filter(c => {
    const sMatch = searchTerm.toLowerCase();
    const matchesSearch = c.title?.toLowerCase().includes(sMatch) || 
                         c.description?.toLowerCase().includes(sMatch) ||
                         c.apartment_name?.toLowerCase().includes(sMatch);
    
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAptId || userAptId === 'all') {
       alert('Please select a specific apartment to lodge a complaint.');
       return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('complaints').insert({
      title,
      description: desc,
      priority,
      profile_id: user.id,
      apartment_id: userAptId
    });

    if (!error) {
      setShowAddModal(false);
      setTitle('');
      setDesc('');
      fetchComplaints();
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'HIGH': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  const getStatusIcon = (s: string) => {
    switch(s) {
      case 'RESOLVED': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'IN_PROGRESS': return <Clock size={16} className="text-indigo-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
             <MessageSquareWarning className="text-indigo-600" size={24} />
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-balance">Maintenance & Helpdesk</h2>
             {userRole === 'SUPER_ADMIN' && (
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">
                  Global Admin
                </span>
             )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Community issue tracking & maintenance resolutions.</p>
          
          {userRole === 'SUPER_ADMIN' && (
            <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-[450px]">
               <Building2 size={16} className="ml-2 text-primary" />
               <select 
                 value={userAptId || 'all'}
                 onChange={(e) => {
                   setUserAptId(e.target.value);
                   setFilterStatus('ALL');
                 }}
                 className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-wider h-10 px-2 dark:text-white"
               >
                 <option value="all">🌐 All Communities (Global Helpdesk)</option>
                 {allApts.map(a => (
                   <option key={a.id} value={a.id}>{a.name}</option>
                 ))}
               </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setViewType('grid')}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewType('table')}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List size={18} />
              </button>
           </div>
           
           <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
           >
             <Plus size={18} /> <span className="hidden sm:inline">New Request</span>
           </button>
        </div>
      </div>

      <div className="glass p-6 bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={(e)=>setSearchTerm(e.target.value)}
              placeholder="Search by title or community..." 
              className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
             {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
               <button 
                 key={st}
                 onClick={()=>setFilterStatus(st)}
                 className={`flex-1 md:flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${filterStatus === st ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
               >
                 {st.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        {loading ? (
           <div className="p-32 text-center space-y-4">
              <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Community Tickets...</p>
           </div>
        ) : filteredComplaints.length === 0 ? (
           <div className="p-32 text-center glass bg-white/20 dark:bg-white/5 border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
             <MessageSquareWarning size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
             <p className="text-slate-400 font-medium">{searchTerm ? 'No tickets match your filters.' : 'Excellent! Zero open complaints.'}</p>
           </div>
        ) : viewType === 'table' ? (
           <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-700">
                   <th className="px-6 py-5">Complaint Title</th>
                   <th className="px-6 py-5">Community</th>
                   <th className="px-6 py-5">Reported By</th>
                   <th className="px-6 py-5">Status</th>
                   <th className="px-6 py-5">Priority</th>
                   <th className="px-6 py-5 text-right w-10"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {filteredComplaints.map((c) => (
                   <tr key={c.id} className="text-sm hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.05] transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{c.title}</span>
                           <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{c.apartment_name}</span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500">
                           <User size={14} className="text-slate-300" />
                           <span className="text-xs font-medium">{c.profiles?.full_name || 'Resident'}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {getStatusIcon(c.status)}
                           <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">{c.status}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border ${getPriorityColor(c.priority)}`}>
                           {c.priority}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                           <MoreHorizontal size={18} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredComplaints.map((c, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={c.id} 
                  className="glass p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${getPriorityColor(c.priority)}`}>
                      <MessageSquareWarning size={20} />
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                       <span className="text-[9px] font-black text-indigo-500 uppercase mt-1">{c.apartment_name}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 mb-6">
                    <h4 className="font-bold text-slate-900 dark:text-white capitalize mb-2 line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                       <User size={12} className="text-slate-400" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate max-w-[100px]">{c.profiles?.full_name || 'Resident'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2">
                          {getStatusIcon(c.status)}
                          <span className="text-[9px] font-black uppercase text-slate-400">{c.status}</span>
                       </div>
                       <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors">
                          <ExternalLink size={16} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="glass max-w-lg w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative">
              <button onClick={()=>setShowAddModal(false)} className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><X size={18} /></button>
              <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Send className="text-indigo-600" /> New Support Ticket</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Subject</label>
                  <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm font-bold" placeholder="High-level description" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Detailed Info</label>
                  <textarea rows={4} value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm" placeholder="Please provide more details for faster resolution..." required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Priority Level</label>
                  <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm font-black">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">CRITICAL</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-extrabold shadow-xl shadow-indigo-600/20 mt-4 transition-all hover:scale-[1.02] active:scale-95">
                  Lodge Complaint
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
