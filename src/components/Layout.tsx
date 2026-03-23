import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden text-surface-900 dark:text-surface-50">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="glass fixed h-[calc(100vh-2rem)] m-4 z-50 border border-white/20 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl flex flex-col shadow-2xl transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'hidden'}`}>
            <div className="p-2.5 bg-gradient-premium rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Building2 size={22} strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gradient">HomeConnect</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2.5 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-surface-600 active:scale-95"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                ${isActive 
                  ? 'bg-white dark:bg-white/10 text-primary shadow-premium' 
                  : 'hover:bg-white/30 dark:hover:bg-white/5 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={`${sidebarOpen ? '' : 'mx-auto'} transition-transform duration-300 group-hover:scale-110`} />
                  {sidebarOpen && <span className="font-semibold tracking-tight">{item.label}</span>}
                  {/* Active Indicator Overlay */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-2 w-1 h-6 bg-primary rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 mt-auto border-t border-black/5 dark:border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 text-surface-500 dark:text-surface-400 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all duration-200 group active:scale-95"
          >
            <LogOut size={20} className={`${sidebarOpen ? '' : 'mx-auto'} transition-transform group-hover:-translate-x-1`} />
            {sidebarOpen && <span className="font-semibold tracking-tight">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto transition-all duration-500"
        style={{ marginLeft: sidebarOpen ? 312 : 112 }}
      >
        <header className="sticky top-0 z-40 bg-surface-50/50 dark:bg-surface-950/50 backdrop-blur-xl px-12 py-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-surface-400 uppercase tracking-[0.2em]">Overview</h1>
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              Welcome back, <span className="text-gradient">{user?.user_metadata?.full_name?.split(' ')[0] || 'Member'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative active:scale-95 group">
              <Bell size={20} className="text-surface-500 group-hover:text-primary transition-colors" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-surface-950 animate-pulse"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-black/5 dark:border-white/5">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold">{user?.user_metadata?.full_name || 'User'}</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded-md">Resident</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-premium flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-xl shadow-emerald-500/20 border-2 border-white dark:border-white/10 active:scale-95 transition-transform cursor-pointer">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.user_metadata?.full_name?.charAt(0) || 'U'
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 py-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
