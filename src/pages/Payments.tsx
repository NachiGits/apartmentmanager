import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Loader2,
  CalendarDays,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('charges')
      .select('*')
      .order('created_at', { ascending: false });
    
    setPayments(data || []);
    setLoading(false);
  };

  const statusColors = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-surface-900 dark:text-white tracking-tighter">Finance & Ledger</h2>
          <p className="text-surface-500 mt-2 font-medium">Global status of community maintenance and billing.</p>
        </div>
        
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-8 py-3.5 bg-gradient-premium text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
            <Zap size={18} strokeWidth={2.5} /> Instant Settlement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="hover-card glass p-10 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 col-span-1 shadow-xl shadow-black/5 dark:shadow-none">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl w-fit mb-8 shadow-inner">
            <Wallet size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-surface-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Aggregate Outstanding</h3>
          <p className="text-5xl font-black text-surface-900 dark:text-white tracking-tighter">$34,250.00</p>
          <div className="mt-10 pt-10 border-t border-black/5 dark:border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-surface-400 uppercase tracking-widest">March Progress</span>
              <span className="text-xs font-black text-primary">84.2%</span>
            </div>
            <div className="w-full h-3 bg-surface-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '84.2%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-premium shadow-glow"
               />
            </div>
          </div>
        </div>

        <div className="hover-card glass p-10 bg-surface-900 dark:bg-surface-950 text-white relative flex flex-col justify-between overflow-hidden border border-white/5 shadow-2xl">
           <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/30 rounded-full blur-[100px]"></div>
           <div className="relative z-10">
             <div className="flex items-center justify-between mb-10">
               <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                 <ShieldCheck size={36} className="text-primary" strokeWidth={2.5} />
               </div>
               <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 active:scale-95"><MoreVertical size={20}/></button>
             </div>
             <p className="text-surface-400 text-[10px] font-black uppercase tracking-[0.2em]">Escrow & Assets</p>
             <h3 className="text-4xl font-black mt-2 mb-8 tracking-tighter leading-tight">Secured <br/>Reserve Fund</h3>
           </div>
           <button className="w-full py-5 bg-white text-surface-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all active:scale-95 relative z-10">
             Compliance Report
           </button>
        </div>

        <div className="hover-card glass p-10 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">
           <div className="p-4 bg-accent/10 text-accent rounded-2xl w-fit mb-8 shadow-inner">
            <CreditCard size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-surface-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Next Liquidation</h3>
          <p className="text-4xl font-black text-surface-900 dark:text-white tracking-tighter text-gradient">April 10, 2024</p>
          <p className="text-xs text-surface-500 mt-6 flex items-center gap-2 font-medium italic"><Clock size={14}/> Mean interval: 2.1 days</p>
          <div className="mt-8 flex gap-2">
            {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-surface-100 dark:bg-white/5 border-2 border-white dark:border-white/10 flex items-center justify-center text-[10px] font-black text-surface-400">U{i}</div>)}
            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white dark:border-white/10 flex items-center justify-center text-[10px] font-black text-primary">+12</div>
          </div>
        </div>
      </div>

      <div className="glass overflow-hidden bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-none">
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
            <CreditCard size={22} className="text-primary" strokeWidth={2.5} /> 
            Receivables Ledger
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-black text-surface-500 tracking-widest uppercase">
             <span className="px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg">March 2024</span>
             <CalendarDays size={18} className="text-surface-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-surface-50/50 dark:bg-black/20 text-[10px] uppercase font-black tracking-[0.2em] text-surface-400">
                 <th className="px-10 py-6">Resident Identity</th>
                 <th className="px-10 py-6">Invoiced</th>
                 <th className="px-10 py-6">Accrued Late Fees</th>
                 <th className="px-10 py-6">Maturity Date</th>
                 <th className="px-10 py-6 text-center">Status</th>
                 <th className="px-10 py-6 text-right w-10"></th>
               </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
               {loading ? (
                 <tr><td colSpan={6} className="p-32 text-center text-primary"><Loader2 className="animate-spin mx-auto scale-150" /></td></tr>
               ) : payments.length === 0 ? (
                 <tr><td colSpan={6} className="p-32 text-center text-surface-400 font-bold uppercase tracking-widest text-xs">Zero receivables in current buffer.</td></tr>
               ) : payments.map((p, _i) => (
                 <tr key={p.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                   <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 bg-gradient-premium/10 rounded-2xl flex items-center justify-center font-black text-sm text-primary shadow-inner">
                          {p.unit_number?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-surface-900 dark:text-white tracking-tight">{p.unit_number || 'Unit Unknown'}</span>
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Account Active</span>
                        </div>
                      </div>
                   </td>
                   <td className="px-10 py-7 font-black text-lg text-surface-900 dark:text-white tracking-tighter">${p.amount}</td>
                   <td className="px-10 py-7 text-rose-500 font-black text-sm tracking-tighter">${p.late_fee || 0}</td>
                   <td className="px-10 py-7 text-[11px] text-surface-500 font-black uppercase tracking-widest">
                     {new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                   </td>
                   <td className="px-10 py-7 text-center">
                      <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase border tracking-[0.2em] shadow-sm ${statusColors(p.status)}`}>
                        {p.status}
                      </span>
                   </td>
                   <td className="px-10 py-7 text-right">
                      <button className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90"><ArrowUpRight size={20} className="text-surface-300 group-hover:text-primary transition-colors" /></button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
