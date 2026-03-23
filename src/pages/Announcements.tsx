import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Users, 
  Calendar,
  Loader2,
  X,
  UserCircle2
} from 'lucide-react';

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from('announcements').insert({
      title,
      content,
      author_id: user.id,
      apartment_id: user.user_metadata.apartment_id
    });

    if (!error) {
      setShowAddModal(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Announcements</h2>
          <p className="text-slate-500 mt-1">Updates and broadcasts for the community.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus size={18} /> New Notice
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
        ) : announcements.length === 0 ? (
          <div className="p-20 text-center glass">
            <Megaphone size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400">No announcements yet.</p>
          </div>
        ) : announcements.map((a, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={a.id} 
            className="group glass p-8 bg-white/50 dark:bg-slate-900/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={()=>handleDelete(a.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={18} /></button>
            </div>

            <div className="flex items-start gap-6">
              <div className="shrink-0 p-4 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl">
                <Megaphone size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{a.title}</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-widest">OFFICIAL</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-balance">{a.content}</p>
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserCircle2 size={16} />
                    <span className="text-xs font-medium">{a.profiles?.full_name || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={16} />
                    <span className="text-xs font-medium">{new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="glass max-w-xl w-full bg-white dark:bg-slate-900 p-10 shadow-2xl relative">
              <button onClick={()=>setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              <h3 className="text-2xl font-bold mb-8">Broadcast Notice</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
                  <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Announcement title" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Message Content</label>
                  <textarea rows={6} value={content} onChange={(e)=>setContent(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="What would you like to say to the community?" required />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                  <Megaphone size={20} /> Post Announcement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
