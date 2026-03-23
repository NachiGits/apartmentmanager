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
  Loader2
} from 'lucide-react';

export const Complaints = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('complaints')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    
    setComplaints(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from('complaints').insert({
      title,
      description: desc,
      priority,
      profile_id: user.id,
      apartment_id: user.user_metadata.apartment_id
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-balance">Maintenance & Helpdesk</h2>
          <p className="text-slate-500 mt-1">Report issues or track existing maintenance requests.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus size={18} /> New Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="glass p-6 bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input placeholder="Search complaints..." className="w-full pl-12 pr-4 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="flex gap-2">
               {['ALL', 'OPEN', 'RESOLVED'].map(tab => (
                 <button key={tab} className="px-4 py-2 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{tab}</button>
               ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
            ) : complaints.length === 0 ? (
              <div className="p-20 text-center grayscale opacity-50">
                <MessageSquareWarning size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-bold text-slate-400">All quiet on the maintenance front!</p>
              </div>
            ) : complaints.map((c, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={c.id} 
                className="group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
              >
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${getPriorityColor(c.priority)}`}>
                  <MessageSquareWarning size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white capitalize">{c.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{c.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">by {c.profiles?.full_name || 'Anonymous'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">• {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(c.status)}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{c.status}</span>
                  </div>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreHorizontal size={20} className="text-slate-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="glass max-w-lg w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative">
              <h3 className="text-xl font-bold mb-6">File Maintenance Request</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Title</label>
                  <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Short summary of the issue" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Description</label>
                  <textarea rows={3} value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Provide more details..." required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Priority</label>
                  <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
