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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/40 dark:bg-surface-950/20 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 px-4 md:px-10 py-3 md:py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-2.5 bg-gradient-premium rounded-xl md:rounded-2xl text-white shadow-xl shadow-emerald-500/20">
            <Building2 size={22} md:size={26} strokeWidth={2.5} />
          </div>
          <span className="font-black text-xl md:text-2xl tracking-tighter text-gradient">HomeConnect</span>
        </div>
        <div className="flex items-center gap-4 md:gap-10">
          <a href="#features" className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-surface-500 hover:text-primary transition-colors">Features</a>
          <button 
            onClick={onLogin}
            className="px-5 md:px-8 py-2.5 md:py-3 bg-gradient-premium text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
          >
            Open App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/4 -z-10 w-[800px] h-[800px] bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 left-0 -z-10 w-[400px] h-[400px] bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-[100px] animate-fade-up"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="px-5 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8 inline-block backdrop-blur-md border border-primary/10">
            Next Generation Living
          </span>
          <h1 className="text-5xl md:text-9xl font-black mb-8 md:mb-10 leading-[1] md:leading-[0.9] tracking-tighter">
            Smart Space. <br className="hidden md:block" /> 
            <span className="text-gradient">Seamless Living.</span>
          </h1>
          <p className="text-lg md:text-2xl text-surface-500 dark:text-surface-400 max-w-3xl mx-auto mb-10 md:mb-14 leading-relaxed font-medium tracking-tight px-4">
            Elevate your community management with a beautiful, lightweight ecosystem designed for transparency and efficiency.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 px-6 sm:px-0">
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 md:px-12 py-5 md:py-6 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 group"
            >
              Get Started <ArrowRight size={22} md:size={26} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 md:px-12 py-5 md:py-6 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl hover:bg-surface-50 transition-all flex items-center justify-center gap-3 md:gap-4 backdrop-blur-md active:scale-95">
              Explore Demo <Smartphone size={22} md:size={26} />
            </button>
          </div>
        </motion.div>

        {/* Dynamic App Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-32 relative w-full max-w-6xl group"
        >
          <div className="glass p-5 bg-white/30 dark:bg-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-none border border-white/20 dark:border-white/10 transition-transform duration-700 group-hover:scale-[1.02]">
             <div className="rounded-[2rem] overflow-hidden bg-surface-100 dark:bg-surface-900 aspect-video flex items-center justify-center relative shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/10 mix-blend-overlay"></div>
                <div className="p-12 text-center group-hover:scale-110 transition-all duration-700">
                   <div className="relative inline-block">
                     <Building2 size={160} className="text-primary/10 dark:text-primary/20 animate-glow" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <Zap size={60} className="text-primary shadow-glow" />
                     </div>
                   </div>
                   <p className="text-xs font-black text-surface-400 uppercase tracking-[0.4em] mt-10">Premium Management Interface</p>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-10 max-w-7xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="text-left mb-24 max-w-3xl">
          <span className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-4 block">Core Capabilities</span>
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">Everything you need to thrive.</h2>
          <p className="text-xl text-surface-500 font-medium leading-relaxed">Engineered for modern residents and fast-paced management teams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="hover-card glass p-12 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5 flex flex-col items-start"
            >
              <div className={`p-5 rounded-3xl bg-white dark:bg-white/5 ${feature.color} mb-8 shadow-xl shadow-black/5 dark:shadow-none`}>
                <feature.icon size={36} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black mb-5 tracking-tight">{feature.title}</h3>
              <p className="text-surface-500 dark:text-surface-400 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 bg-surface-950 text-white px-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-32">
          <div className="flex-1">
            <h2 className="text-6xl font-black mb-12 tracking-tighter leading-tight">Effortless <br/><span className="text-primary">Onboarding.</span></h2>
            <div className="space-y-12">
              {[
                { step: '01', title: 'Seamless Auth', desc: 'Secure one-tap Google login. Zero friction.' },
                { step: '02', title: 'Connect Space', desc: 'Link your unit or register a new community instantly.' },
                { step: '03', title: 'Live Growth', desc: 'Track everything in real-time with beautiful analytics.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-8 group">
                  <span className="text-5xl font-black text-white/10 group-hover:text-primary transition-colors duration-500">{item.step}</span>
                  <div>
                    <h4 className="text-2xl font-black mb-3">{item.title}</h4>
                    <p className="text-surface-400 font-medium text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full bg-gradient-premium rounded-[3rem] p-16 shadow-2xl shadow-emerald-500/20 group hover:scale-[1.02] transition-transform duration-700">
            <h3 className="text-4xl font-black mb-10 tracking-tighter">Enterprise Standard</h3>
            <ul className="space-y-6">
              {['99.9% Cloud Availability', 'Encrypted PostgreSQL State', 'Continuous Automated Backups', 'Real-time Event Streaming'].map(l => (
                <li key={l} className="flex items-center gap-4 font-bold text-lg text-white">
                  <div className="p-1 bg-white/20 rounded-full"><CheckCircle2 size={24} className="text-white" /></div> {l}
                </li>
              ))}
            </ul>
            <div className="mt-16 p-8 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
               <p className="text-lg italic text-emerald-50 leading-relaxed">"HomeConnect has completely transformed how we handle property maintenance and community growth."</p>
               <div className="mt-6 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">S</div>
                 <span className="block font-black text-xs uppercase tracking-[0.2em] text-emerald-200">Sunny Heights Association</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-10 bg-surface-50 dark:bg-surface-950 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-premium rounded-xl text-white">
              <Building2 size={20} />
            </div>
            <span className="font-black text-xl tracking-tighter text-gradient">HomeConnect</span>
          </div>
          <p className="text-sm text-surface-400 font-bold uppercase tracking-widest">© 2024 HomeConnect Global. All Rights Reserved.</p>
          <div className="flex gap-8">
            <button className="text-surface-400 hover:text-primary transition-colors active:scale-95"><Github size={24} /></button>
          </div>
        </div>
      </footer>
    </div>
  );
};
