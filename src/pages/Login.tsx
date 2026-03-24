import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Loader2, Mail } from 'lucide-react';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Back to Home Button */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-10 left-10 p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest pl-4 pr-6 z-50 backdrop-blur-md active:scale-95"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-5 bg-gradient-premium rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 mb-8 group transition-transform hover:scale-110">
            <Building2 size={44} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-3">Sign In</h2>
          <p className="text-surface-400 font-medium tracking-tight">Access your premium community dashboard</p>
        </div>

        <div className="glass bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl text-center">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 mb-10 flex items-center gap-4 text-left">
             <div className="p-3 bg-white/5 text-primary rounded-xl border border-white/10 shadow-lg">
               <Mail size={24} strokeWidth={2.5} />
             </div>
             <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">One-Tap Access</p>
               <p className="text-sm font-medium text-surface-400 leading-tight mt-1">Fast, secure authentication with Google.</p>
             </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="group w-full bg-white text-surface-950 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-4 shadow-2xl hover:bg-surface-50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-red-500/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div> {error}
              </motion.div>
            )}
          </div>

          <p className="mt-12 text-surface-500 text-[10px] font-bold uppercase tracking-[0.2em] px-6">
            Secured by Supabase & OAuth 2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};
