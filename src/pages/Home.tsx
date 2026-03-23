import { motion } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  Cloud, 
  Smartphone, 
  BarChart3,
  ArrowRight,
  Github,
  CheckCircle2
} from 'lucide-react';

export const Home = ({ onLogin }: { onLogin: () => void }) => {

  const features = [
    { 
      title: 'Smart Billing', 
      desc: 'Automated expense tracking and fair share calculations based on unit square footage.',
      icon: Zap,
      color: 'text-amber-500'
    },
    { 
      title: 'Secure Access', 
      desc: 'Enterprise-grade security with Google OAuth and PostgreSQL Row Level Security.',
      icon: ShieldCheck,
      color: 'text-indigo-500'
    },
    { 
      title: 'Maintenance Hub', 
      desc: 'Centralized helpdesk for residents to report issues and track resolution live.',
      icon: BarChart3,
      color: 'text-emerald-500'
    },
    { 
      title: 'Cloud Managed', 
      desc: 'Zero server maintenance. Scalable infrastructure powered by Supabase.',
      icon: Cloud,
      color: 'text-sky-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/30 dark:bg-slate-900/10 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Building2 size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">HomeConnect</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Features</a>
          <button 
            onClick={onLogin}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/4 -z-10 w-[600px] h-[600px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-3xl animate-pulse"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-widest mb-6 inline-block">
            Apartment Management Reinvented
          </span>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
            Your Community, <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-400">Perfectly Sync'd.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            A modern, lightweight ecosystem for residents and admins to collaborate, track expenses, and manage mantenimiento operations with zero friction.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={onLogin}
              className="w-full md:w-auto px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
            >
              Get Started Now <ArrowRight size={24} />
            </button>
            <button className="w-full md:w-auto px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
              Watch Demo <Smartphone size={24} />
            </button>
          </div>
        </motion.div>

        {/* Floating App Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 relative w-full max-w-5xl"
        >
          <div className="glass p-4 bg-white/50 dark:bg-slate-900/50 shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:shadow-none border-white/20">
             <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-[500px] flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                <div className="p-12 text-center group-hover:scale-110 transition-transform">
                   <Building2 size={120} className="text-indigo-600/20" />
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4">Interface Preview</p>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-8 max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-800">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black mb-4">Everything You Need.</h2>
          <p className="text-slate-500 font-medium">Built for modern communities who value efficiency and design.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="glass p-10 bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-white/5 flex flex-col items-start"
            >
              <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-white/5 ${feature.color} mb-6 shadow-xl shadow-slate-200/5`}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Usage Guide */}
      <section className="py-24 bg-slate-900 text-white px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-5xl font-black mb-8">How it works?</h2>
            <div className="space-y-10">
              {[
                { step: '01', title: 'Sign in with Google', desc: 'Secure one-tap login. No password management needed.' },
                { step: '02', title: 'Create or Join', desc: 'Register your apartment or join an existing one using an invite code.' },
                { step: '03', title: 'Sync Operations', desc: 'Manage expenses, communicate, and track maintenance instantly.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <span className="text-4xl font-black text-indigo-500/30">{item.step}</span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full bg-indigo-600 rounded-[2.5rem] p-12 shadow-2xl shadow-indigo-500/20">
            <h3 className="text-3xl font-black mb-6">Built for Reliability</h3>
            <ul className="space-y-4">
              {['99.9% Uptime Guarantee', 'End-to-end Data Encryption', 'Daily Backups', 'Real-time Syncing'].map(l => (
                <li key={l} className="flex items-center gap-3 font-bold text-indigo-100">
                  <CheckCircle2 size={20} className="text-white" /> {l}
                </li>
              ))}
            </ul>
            <div className="mt-12 p-6 bg-white/10 rounded-2xl border border-white/20">
               <p className="text-sm italic text-indigo-50">"Transitioning from spreadsheets to HomeConnect saved us 15 hours of admin work every month."</p>
               <span className="block mt-4 font-black text-xs uppercase tracking-widest text-indigo-200">— Sunny Heights Residents Association</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Building2 size={16} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">HomeConnect</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">© 2024 HomeConnect. Built for modern communities.</p>
          <div className="flex gap-6">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Github size={20} /></button>
          </div>
        </div>
      </footer>
    </div>
  );
};
