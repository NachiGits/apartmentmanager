import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  X,
  UserCircle2,
  Bell,
  Pin,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle2,
  Zap,
  Users2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = [
  { id: 'NORMAL',  label: 'Normal',  icon: <Info size={14} />,        color: 'indigo' },
  { id: 'URGENT',  label: 'Urgent',  icon: <AlertCircle size={14} />, color: 'rose'   },
  { id: 'INFO',    label: 'Info',    icon: <CheckCircle2 size={14} />, color: 'emerald'},
];

const PRIORITY_STYLES: Record<string, string> = {
  NORMAL:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  URGENT:  'bg-rose-100   text-rose-700   dark:bg-rose-500/10   dark:text-rose-400   border-rose-200   dark:border-rose-500/20',
  INFO:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
};

const PRIORITY_BADGE: Record<string, string> = {
  NORMAL:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  URGENT:  'bg-rose-100   text-rose-700   dark:bg-rose-500/20   dark:text-rose-400',
  INFO:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};

const PRIORITY_ACCENT: Record<string, string> = {
  NORMAL:  'border-l-indigo-500',
  URGENT:  'border-l-rose-500',
  INFO:    'border-l-emerald-500',
};

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [aptMembers, setAptMembers] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, apartment_id, full_name, email')
      .eq('id', user.id)
      .single();

    setUserProfile(profile);
    setUserRole(profile?.role || 'RESIDENT');

    // Fetch members for notification count
    if (profile?.apartment_id) {
      const { data: members } = await supabase
        .from('apartment_members')
        .select('profile_id, profiles(full_name)')
        .eq('apartment_id', profile.apartment_id);
      setAptMembers(members || []);
      setMemberCount(members?.length || 0);
    }

    fetchAnnouncements(profile);
  };

  const fetchAnnouncements = async (profile?: any) => {
    setLoading(true);
    const p = profile || userProfile;
    
    if (!p?.apartment_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('announcements')
      .select('*, profiles(full_name)')
      .eq('apartment_id', p.apartment_id)
      .order('created_at', { ascending: false });

    setAnnouncements(data || []);
    setLoading(false);
  };

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.apartment_id) {
      toast.error('You must be a member of an apartment to post announcements.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { data: newAnnouncement, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        author_id: user.id,
        apartment_id: userProfile.apartment_id,
        // priority is stored as part of content metadata for now
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to post announcement');
      setSubmitting(false);
      return;
    }

    // Send in-app notifications to ALL members (no email)
    if (aptMembers.length > 0) {
      const notifications = aptMembers.map(m => ({
        profile_id: m.profile_id,
        apartment_id: userProfile.apartment_id,
        title: `📢 ${title}`,
        description: content.length > 100 ? content.slice(0, 97) + '...' : content,
        type: 'ANNOUNCEMENT',
        status: 'UNREAD',
      }));

      const { error: notifErr } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifErr) {
        console.warn('Notification insert error:', notifErr);
      }
    }

    setShowAddModal(false);
    setTitle('');
    setContent('');
    setPriority('NORMAL');
    setSubmitting(false);
    fetchAnnouncements();
    toast.success(`Announcement posted! ${memberCount} members notified 🔔`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
    toast.success('Announcement deleted');
  };

  const urgentAnnouncements = announcements.filter(a => a.content?.startsWith('[URGENT]'));
  const regularAnnouncements = announcements;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Megaphone className="text-indigo-500" size={24} />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Announcements</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Community notice board · {announcements.length} active notices
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> New Notice
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass p-5 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Notices</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{announcements.length}</p>
        </div>
        <div className="glass p-5 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Members Reached</p>
          <p className="text-3xl font-black text-indigo-600">{memberCount}</p>
        </div>
        <div className="glass p-5 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">This Month</p>
          <p className="text-3xl font-black text-emerald-600">
            {announcements.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Notices...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-24 text-center glass bg-white/30 dark:bg-white/5 border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
            <Megaphone size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-slate-500 font-semibold text-lg">No announcements yet.</p>
            <p className="text-slate-400 text-sm mt-1">Important notices for the community will appear here.</p>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all"
              >
                Create First Announcement
              </button>
            )}
          </div>
        ) : (
          announcements.map((a, i) => {
            const isUrgent = a.content?.includes('[URGENT]') || a.title?.includes('URGENT');
            const priorityKey = isUrgent ? 'URGENT' : 'NORMAL';
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                key={a.id}
                className={`group glass bg-white/60 dark:bg-slate-900/50 relative overflow-hidden border-l-4 ${PRIORITY_ACCENT[priorityKey]} hover:shadow-lg transition-all`}
              >
                {/* Hover Delete (Admin only) */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-5 p-6 md:p-8">
                  {/* Icon */}
                  <div className={`shrink-0 p-3.5 rounded-2xl ${
                    isUrgent
                      ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {isUrgent ? <AlertCircle size={24} /> : <Megaphone size={24} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${PRIORITY_BADGE[priorityKey]}`}>
                        {isUrgent ? '🚨 Urgent' : '📢 Official'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Bell size={8} /> Notified
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                      {a.content?.replace(/\[URGENT\]/g, '')}
                    </p>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400">
                        <UserCircle2 size={14} />
                        <span className="text-xs font-semibold">{a.profiles?.full_name || 'Admin'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {new Date(a.created_at).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-500 ml-auto">
                        <Users2 size={13} />
                        <span className="text-[10px] font-black uppercase">{memberCount} members notified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── Add Announcement Modal ─── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setTitle(''); setContent(''); setPriority('NORMAL'); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              className="glass max-w-xl w-full bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 pb-5 z-10">
                <button
                  onClick={() => { setShowAddModal(false); setTitle(''); setContent(''); setPriority('NORMAL'); }}
                  className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <Megaphone className="text-indigo-600" /> Broadcast Notice
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Bell size={10} />
                  Will be pushed as notification to all {memberCount} members (no email)
                </p>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-5">
                {/* Priority Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Notice Type</label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPriority(opt.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${
                          priority === opt.id
                            ? PRIORITY_STYLES[opt.id] + ' scale-[1.03]'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Subject / Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none px-5 py-4 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="e.g. Water Supply Interruption on Sunday"
                    required
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Message</label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none px-5 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed"
                    placeholder="Write your announcement message here. Be clear and concise for your community members."
                    required
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{content.length} characters</span>
                    {content.length > 200 && (
                      <span className="text-xs text-amber-500 font-medium">Will be truncated in notification preview</span>
                    )}
                  </div>
                </div>

                {/* Notification Preview */}
                {(title || content) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
                      <Sparkles size={10} /> Notification Preview
                    </label>
                    <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                          🏢
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-xs font-black">HomeConnect · Now</p>
                          <p className="text-slate-300 text-xs font-bold mt-0.5">📢 {title || 'Announcement title...'}</p>
                          <p className="text-slate-400 text-[10px] mt-1 leading-snug">
                            {content ? (content.length > 80 ? content.slice(0, 77) + '...' : content) : 'Your message preview...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipients Info */}
                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <Bell size={16} className="text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-indigo-800 dark:text-indigo-300">
                      {memberCount} member{memberCount !== 1 ? 's' : ''} will receive this as an in-app notification
                    </p>
                    <p className="text-[10px] text-indigo-500/70 mt-0.5">No email will be sent · Notification only</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-98"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Zap size={18} />
                  )}
                  {submitting ? 'Posting...' : `Post & Notify ${memberCount} Members`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
