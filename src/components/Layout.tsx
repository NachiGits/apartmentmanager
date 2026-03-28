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
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 flex flex-col">
      {/* Top Premium Navigation */}
      <header className="sticky top-0 z-50 w-full">
        {/* Main Header */}
        <div className="glass mx-0 md:mx-4 mt-0 md:mt-4 border-b md:border border-white/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-xl transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-premium rounded-xl text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer" onClick={() => navigate('/')}>
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg md:text-xl tracking-tight text-gradient leading-none">HomeConnect</span>
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1 hidden xs:block">Apartment Manager</span>
              </div>
            </div>

            {/* Desktop Navigation Links (Hidden on small screens) */}
            <nav className="hidden lg:flex items-center gap-1 mx-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-surface-500 dark:text-surface-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-surface-100'}
                  `}
                >
                  <item.icon size={18} className="transition-transform group-hover:scale-110" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Desktop Actions */}
              <button className="hidden sm:flex p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-surface-500 transition-all active:scale-90">
                <Search size={20} />
              </button>
              
              <button className="hidden sm:flex p-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative active:scale-90 group">
                <Bell size={20} className="text-surface-500 group-hover:text-primary transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-slate-800"></span>
              </button>

              <div className="h-8 w-px bg-black/5 dark:bg-white/5 mx-1 hidden md:block"></div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:block relative group cursor-pointer">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-premium flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-lg shadow-emerald-500/20 border-2 border-white dark:border-white/10 active:scale-95 transition-transform">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user?.user_metadata?.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                </div>

                {/* Mobile Menu Toggle - Always visible on small screens */}
                <button 
                  onClick={toggleMenu}
                  className="p-2.5 bg-primary text-white md:bg-black/5 md:dark:bg-white/5 rounded-xl md:text-surface-600 md:dark:text-surface-400 active:scale-90 transition-all shadow-lg shadow-emerald-500/20 md:shadow-none"
                >
                  {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Sign Out Button (Desktop) */}
                <button 
                  onClick={handleLogout}
                  className="hidden lg:flex p-2.5 hover:bg-red-500/10 text-surface-400 hover:text-red-500 rounded-xl transition-all active:scale-90 ml-1"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Quick Nav (Horizontal Scroll) - Controlled visibility */}
          {!isMenuOpen && (
            <div className="lg:hidden w-full overflow-hidden border-t border-black/5 dark:border-white/5 animate-fade-up">
              <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all
                      ${isActive 
                        ? 'bg-primary text-white shadow-lg shadow-emerald-500/20 font-bold' 
                        : 'bg-black/5 dark:bg-white/5 text-surface-600 dark:text-surface-400 hover:text-surface-900'}
                    `}
                  >
                    <item.icon size={16} />
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
              className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-surface-950"
            >
              {/* Header inside the overlay */}
              <div className="px-6 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-premium rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                    <Building2 size={24} strokeWidth={2.5} />
                  </div>
                  <span className="font-black text-2xl tracking-tighter text-gradient leading-none">HomeConnect</span>
                </div>
                <button 
                  onClick={toggleMenu}
                  className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl active:scale-90 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Grid Navigation */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4">
                  {navItems.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <NavLink
                        onClick={() => setIsMenuOpen(false)}
                        to={item.path}
                        className={({ isActive }) => `
                          flex flex-col items-center justify-center p-8 rounded-[2.5rem] transition-all gap-4 border-2
                          ${isActive 
                            ? 'bg-primary/5 text-primary border-primary/20 shadow-xl shadow-emerald-500/5 scale-[1.02]' 
                            : 'bg-surface-50 dark:bg-white/5 text-surface-500 dark:text-surface-400 border-transparent hover:border-black/5'}
                        `}
                      >
                        <div className={`p-4 rounded-2xl ${location.pathname === item.path ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10'}`}>
                          <item.icon size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Profile Bar in Bottom */}
              <div className="p-8 border-t border-black/5 dark:border-white/5 bg-surface-50/50 dark:bg-black/20">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-3xl bg-gradient-premium flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-2xl shadow-emerald-500/20">
                       {user?.user_metadata?.avatar_url ? (
                         <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         user?.user_metadata?.full_name?.charAt(0) || 'U'
                       )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-lg font-black text-surface-900 dark:text-white leading-none mb-1 tracking-tight">{user?.user_metadata?.full_name || 'Resident'}</p>
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Authorized Access</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full p-6 bg-red-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
                >
                  <LogOut size={20} />
                  Secure Sign Out
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

      {/* Mobile Interaction - Optional: Bottom minimal bar if needed, but top is requested */}
    </div>
  );
};

