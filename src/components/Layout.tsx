import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  ReceiptIndianRupee, 
  MessageSquareWarning, 
  Megaphone, 
  Users,
  LogOut,
  Bell,
  Menu,
  X,
  CreditCard,
  Search,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let subscription: any = null;

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      setUser(authUser);
      if (authUser) {
        supabase.from('profiles').select('role').eq('id', authUser.id).single()
          .then(({ data }) => setUserRole(data?.role || 'RESIDENT'));
        
        fetchNotifications(authUser.id);

        // REAL-TIME SUBSCRIPTION
        subscription = supabase
          .channel(`public:notifications:profile_id=eq.${authUser.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `profile_id=eq.${authUser.id}`
          }, (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            import('react-hot-toast').then(({ toast }) => toast.success('New Request: ' + payload.new.title, { icon: '🔔' }));
          })
          .subscribe();
      }
    });

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', userId)
      .eq('status', 'UNREAD')
      .order('created_at', { ascending: false })
      .limit(5);
    setNotifications(data || []);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ status: 'READ' })
      .eq('profile_id', user.id);
    setNotifications([]);
    setShowNotifs(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('homeconnect_logged_in_notified');
    import('react-hot-toast').then(({ toast }) => toast.success('Logged out successfully'));
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ReceiptIndianRupee, label: 'Expenses', path: '/expenses' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: MessageSquareWarning, label: 'Complaints', path: '/complaints' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements' },
    { icon: Users, label: 'Residents', path: '/residents' },
  ];

  if (userRole === 'SUPER_ADMIN') {
    navItems.push({ icon: Users, label: 'Users', path: '/?tab=users' });
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 flex flex-col">
      {/* Top Premium Navigation */}
      <header className="sticky top-0 z-50 w-full">
        {/* Main Header */}
        <div className="glass mx-0 md:mx-4 mt-0 md:mt-4 border-b md:border border-white/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-xl transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1.5 bg-gradient-premium rounded-xl text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer" onClick={() => navigate('/')}>
                <Building2 size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-gradient leading-none">HomeConnect</span>
                <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest mt-0.5 hidden sm:block">Manager</span>
              </div>
            </div>

            {/* Desktop Navigation Row (Single Line) */}
            <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto no-scrollbar scroll-smooth">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all duration-300 group whitespace-nowrap
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-black scale-105' 
                      : 'text-surface-500 dark:text-surface-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-surface-100'}
                  `}
                >
                  <item.icon size={16} className="transition-transform group-hover:scale-110" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-1.5">
                <button className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-surface-400 transition-all active:scale-90">
                  <Search size={18} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative active:scale-90 group"
                  >
                    <Bell size={18} className="text-surface-400 group-hover:text-primary transition-colors" />
                    {notifications.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800 animate-pulse"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifs && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden z-[100]"
                      >
                         <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</span>
                            {notifications.length > 0 && (
                              <button onClick={markAllRead} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Clear All</button>
                            )}
                         </div>
                         <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 italic text-xs">No unread alerts</div>
                            ) : (
                              notifications.map(n => (
                                <div 
                                  key={n.id} 
                                  onClick={() => {
                                    if(n.type === 'SQFT_REQUEST') navigate('/residents');
                                    markAllRead();
                                  }}
                                  className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer group"
                                >
                                   <div className="flex gap-3">
                                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 mt-2 ${n.type === 'SQFT_REQUEST' ? 'bg-amber-500' : n.type === 'ANNOUNCEMENT' ? 'bg-purple-500' : n.type === 'EXPENSE' ? 'bg-rose-500' : 'bg-indigo-500'} group-hover:scale-150 transition-transform`}></div>
                                      <div className="flex-1">
                                         <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-[10px] font-black leading-tight uppercase tracking-widest text-slate-800 dark:text-slate-200">{n.title || 'Notification'}</p>
                                            <span className="text-[7px] font-black bg-slate-100 dark:bg-white/10 px-1 rounded uppercase">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                         </div>
                                         <p className="text-[10px] text-slate-500 leading-snug font-medium mb-1.5">{n.description}</p>
                                         <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1">Click to Review <ExternalLink size={8} /></span>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              ))
                            )}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-6 w-px bg-black/5 dark:bg-white/5 mx-1"></div>

                <div className="h-8 w-8 rounded-xl bg-gradient-premium flex items-center justify-center text-white font-black text-sm overflow-hidden shadow-lg shadow-emerald-500/20 border border-white dark:border-white/10 active:scale-95 transition-transform text-center pt-2">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.user_metadata?.full_name?.charAt(0) || 'U'
                  )}
                </div>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 text-surface-400 hover:text-red-500 rounded-lg transition-all active:scale-90 border border-transparent font-bold text-[11px] uppercase"
                >
                  <LogOut size={16} />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>

              {/* Mobile Profile & Menu Toggle */}
              <div className="lg:hidden flex items-center gap-2">
                 <div className="h-9 w-9 rounded-xl bg-gradient-premium flex items-center justify-center text-white font-black text-sm overflow-hidden shadow-lg border border-white dark:border-white/10 pt-2 text-center">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user?.user_metadata?.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                <button 
                  onClick={toggleMenu}
                  className="p-2 bg-primary text-white rounded-xl active:scale-90 transition-all shadow-lg shadow-emerald-500/30"
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Quick Nav (Horizontal Scroll) - Controlled visibility */}
          {!isMenuOpen && (
            <div className="lg:hidden w-full overflow-hidden border-t border-black/5 dark:border-white/5 animate-fade-up">
              <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-3.5 py-2.5 rounded-full whitespace-nowrap transition-all
                      ${isActive 
                        ? 'bg-primary text-white shadow-lg shadow-emerald-500/20 font-bold' 
                        : 'bg-black/5 dark:bg-white/5 text-surface-600 dark:text-surface-400 hover:text-surface-900'}
                    `}
                  >
                    <item.icon size={15} />
                    <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Full Menu Overlay - Grid Style with Solid Background */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-surface-950"
            >
              {/* Header inside the overlay */}
              <div className="px-6 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-surface-900 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-premium rounded-xl text-white shadow-lg shadow-emerald-500/20">
                    <Building2 size={22} strokeWidth={2.5} />
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-gradient leading-none">HomeConnect</span>
                </div>
                <button 
                  onClick={toggleMenu}
                  className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl active:scale-90 transition-all"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Grid Navigation - More compact to fit without scrolling */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3">
                  {navItems.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <NavLink
                        onClick={() => setIsMenuOpen(false)}
                        to={item.path}
                        className={({ isActive }) => `
                          flex flex-col items-center justify-center py-6 px-4 rounded-[2rem] transition-all gap-3 border
                          ${isActive 
                            ? 'bg-primary/5 text-primary border-primary/20 shadow-md shadow-emerald-500/5' 
                            : 'bg-white dark:bg-white/5 text-surface-500 dark:text-surface-400 border-black/5 dark:border-white/5'}
                        `}
                      >
                        <div className={`p-3.5 rounded-xl ${location.pathname === item.path ? 'bg-primary text-white shadow-lg shadow-emerald-500/30' : 'bg-black/5 dark:bg-white/10'}`}>
                          <item.icon size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{item.label}</span>
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Profile Bar in Bottom */}
              <div className="p-6 md:p-8 border-t border-black/5 dark:border-white/5 bg-white dark:bg-black/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-premium flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-xl shadow-emerald-500/20 divide-x-2 border-2 border-white dark:border-white/10 pt-2 text-center">
                       {user?.user_metadata?.avatar_url ? (
                         <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         user?.user_metadata?.full_name?.charAt(0) || 'U'
                       )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-base font-black text-surface-900 dark:text-white leading-none mb-1 tracking-tight">{user?.user_metadata?.full_name || 'Resident'}</p>
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Authorized Session</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full p-5 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                >
                   <div className="p-1.5 bg-white/20 rounded-lg">
                      <LogOut size={14} />
                   </div>
                  Sign Out Securely
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Breadcrumb / Page Title Bar (Integrated) */}
      <div className="px-4 md:px-12 py-4 md:py-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-0.5 md:mb-1">
              Active Dashboard
            </h1>
            <p className="text-xl md:text-3xl font-black text-surface-900 dark:text-white tracking-tight">
              {navItems.find(i => i.path === location.pathname)?.label || 'Overview'}
            </p>
          </div>
          
          <div className="hidden md:block">
             <p className="text-sm font-medium text-surface-500 text-right">
              Welcome back, <br/>
              <span className="text-surface-900 dark:text-white font-bold text-base">{user?.user_metadata?.full_name || 'Member'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="animate-fade-up">
           <Outlet />
        </div>
      </main>
    </div>
  );
};
