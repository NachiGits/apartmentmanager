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
              <button className="hidden sm:flex p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-surface-500 transition-all active:scale-90">
                <Search size={20} />
              </button>
              
              <button className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative active:scale-90 group">
                <Bell size={20} className="text-surface-500 group-hover:text-primary transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-slate-800"></span>
              </button>

              <div className="h-8 w-px bg-black/5 dark:bg-white/5 mx-1 hidden xs:block"></div>

              <div className="flex items-center gap-2">
                <div className="relative group cursor-pointer">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-premium flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-lg shadow-emerald-500/20 border-2 border-white dark:border-white/10 active:scale-95 transition-transform">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user?.user_metadata?.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                  onClick={toggleMenu}
                  className="lg:hidden p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-surface-600 dark:text-surface-400 active:scale-90 transition-all"
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

          {/* Mobile Quick Nav (Horizontal Scroll) */}
          <div className="lg:hidden w-full overflow-hidden border-t border-black/5 dark:border-white/5">
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
                  <span className="text-xs uppercase tracking-wider font-bold">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Full Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 m-4 lg:hidden"
            >
              <div className="glass bg-white dark:bg-slate-900 p-4 shadow-2xl border border-white/20 dark:border-white/5">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      to={item.path}
                      className={({ isActive }) => `
                        flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2
                        ${isActive 
                          ? 'bg-primary/10 text-primary border-2 border-primary/20' 
                          : 'bg-black/5 dark:bg-white/5 text-surface-600 dark:text-surface-400 border-2 border-transparent'}
                      `}
                    >
                      <item.icon size={24} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
                
                <div className="border-t border-black/5 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-premium flex items-center justify-center text-white font-bold">
                       {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{user?.user_metadata?.full_name || 'Resident'}</span>
                      <span className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">Admin Panel</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full p-4 bg-red-500/10 text-red-500 rounded-2xl font-bold active:scale-95 transition-all"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </div>
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 pb-20">
        <div className="animate-fade-up">
           <Outlet />
        </div>
      </main>

      {/* Mobile Interaction - Optional: Bottom minimal bar if needed, but top is requested */}
    </div>
  );
};

