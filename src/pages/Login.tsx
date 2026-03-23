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
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 relative">
      {/* Back to Home Button */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-10 left-10 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest pl-4 pr-6"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/30 mb-6 group transition-transform hover:scale-110">
            <Building2 size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Sign In</h2>
          <p className="text-slate-400 mt-2 font-medium">Access your community dashboard</p>
        </div>

        <div className="glass bg-white/5 backdrop-blur-3xl border-white/10 p-10 rounded-[2.5rem] shadow-2xl text-center">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-10 flex items-center gap-4 text-left">
             <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
               <Mail size={24} />
             </div>
             <div>
               <p className="text-xs font-black text-indigo-300 uppercase tracking-widest">Modern Login</p>
               <p className="text-sm font-medium text-slate-300">Fast, secure One-Tap access with Google.</p>
             </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="group w-full bg-white text-slate-900 py-4.5 rounded-2xl font-black text-lg flex items-center justify-center gap-4 shadow-2xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-70"
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
              <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {error}
              </div>
            )}
          </div>

          <p className="mt-12 text-slate-500 text-xs font-medium px-6">
            By signing in, you agree to our <span className="text-indigo-400">Terms of Service</span> and <span className="text-indigo-400">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
