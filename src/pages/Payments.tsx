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
  Zap,
  ArrowDownLeft,
  ArrowRight
} from 'lucide-react';

export const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [outstanding, setOutstanding] = useState(0);
  const [collectionRatio, setCollectionRatio] = useState(0);
  const [nextLiquidation, setNextLiquidation] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('apartment_id').eq('id', user.id).single();
      const aptId = profile?.apartment_id;

      let query = supabase
        .from('charges')
        .select('*, resident_units(unit_label)')
        .order('due_date', { ascending: true });
      
      if (aptId) {
        query = query.eq('apartment_id', aptId);
      }

      const { data } = await query;
      const ledger = data || [];
      setPayments(ledger);

      const pending = ledger.filter(p => p.status === 'PENDING');
      const totalOutstanding = pending.reduce((sum, p) => sum + (Number(p.amount) + Number(p.late_fee || 0)), 0);
      const totalBilled = ledger.reduce((sum, p) => sum + (Number(p.amount) + Number(p.late_fee || 0)), 0);
      
      setOutstanding(totalOutstanding);
      setCollectionRatio(totalBilled > 0 ? (1 - (totalOutstanding / totalBilled)) * 100 : 0);

      const nextDue = pending[0]?.due_date;
      setNextLiquidation(nextDue ? new Date(nextDue).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'All Settled');
    } catch (err) {
      console.error('Payment fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Fiscal Oversight</span>
             </div>
          </div>
          <h2 className="text-5xl font-black text-surface-900 dark:text-white tracking-tighter leading-none">Finance & Ledger</h2>
          <p className="text-surface-500 mt-4 font-medium text-lg">Manage your community's liquidity and billing lifecycle.</p>
        </div>
        
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-10 py-5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:scale-105 shadow-2xl transition-all active:scale-95">
            <Zap size={18} strokeWidth={3} /> Instant Settlement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Outstanding Card */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
           className="group glass p-10 bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="p-4 bg-indigo-500 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
              <Wallet size={32} strokeWidth={2.5} />
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Receivables</p>
               <div className="flex items-center justify-end gap-1 text-emerald-500 font-black text-sm mt-1">
                 <ArrowUpRight size={14} /> +2.4%
               </div>
            </div>
          </div>
          
          <div className="mt-12 relative z-10">
            <h3 className="text-surface-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Aggregate Balance</h3>
            <p className="text-5xl font-black text-surface-900 dark:text-white tracking-tighter leading-none">
               ${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-10 pt-10 border-t border-black/5 dark:border-white/5 space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-surface-400 uppercase tracking-widest">Collection Volume</span>
              <span className="text-xs font-black text-indigo-500">{collectionRatio.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-surface-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
               <motion.div 
                initial={{ width: 0 }} animate={{ width: `${collectionRatio}%` }}
                className="h-full bg-indigo-500 shadow-glow"
               />
            </div>
          </div>
        </motion.div>

        {/* Reserve Fund Card - IMPROVED CONTRAST */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
           className="group glass p-10 bg-indigo-600 dark:bg-indigo-900 border-none shadow-3xl relative overflow-hidden flex flex-col justify-between"
        >
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-12">
                <div className="p-4 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
                   <ShieldCheck size={36} className="text-white" strokeWidth={2.5} />
                </div>
                <button className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10 text-white"><MoreVertical size={20}/></button>
              </div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Secured Assets</p>
              <h3 className="text-4xl font-black text-white tracking-tighter leading-tight">Emergency <br/>Community Fund</h3>
              <p className="text-white/60 mt-4 font-bold text-xs max-w-[200px] leading-relaxed">Protected capital for essential maintenance and upgrades.</p>
           </div>
           
           <div className="mt-12 relative z-10">
             <button className="w-full py-5 bg-white text-indigo-900 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all active:scale-95 group flex items-center justify-center gap-3">
               Audit Ledger <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
           </div>
        </motion.div>

        {/* Migration/Liquidation Card */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           className="group glass p-10 bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl"
        >
           <div className="p-4 bg-emerald-500 rounded-3xl text-white shadow-xl shadow-emerald-500/20 w-fit mb-12">
            <CreditCard size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-surface-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Pending Maturity</h3>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">
             {nextLiquidation || 'All Settled'}
          </p>
          <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
             <Clock size={16} className="text-emerald-500" />
             <p className="text-xs text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider">Settlement Window Active</p>
          </div>
          
          <div className="mt-10 flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full bg-surface-200 dark:bg-white/10 border-4 border-white dark:border-surface-900 flex items-center justify-center text-[10px] font-black text-surface-500">
                U{i}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-indigo-500 border-4 border-white dark:border-surface-900 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
              +12
            </div>
          </div>
        </motion.div>
      </div>

      <div className="glass overflow-hidden bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-3xl">
        <div className="p-10 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-surface-50/30 dark:bg-white/[0.02]">
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-4 text-surface-900 dark:text-white">
            <CreditCard size={28} className="text-indigo-500" strokeWidth={2.5} /> 
            Receivables Ledger
          </h3>
          <div className="flex items-center gap-6 text-[10px] font-black text-surface-500 tracking-widest uppercase">
             <span className="px-5 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5">Fiscal Period: MAR 2024</span>
             <CalendarDays size={20} className="text-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-surface-50/50 dark:bg-black/20 text-[10px] uppercase font-black tracking-[0.25em] text-surface-400">
                 <th className="px-10 py-8 italic underline decoration-indigo-500/30 decoration-4">Resident Identity</th>
                 <th className="px-10 py-8">Invoiced Amount</th>
                 <th className="px-10 py-8">Adjustments</th>
                 <th className="px-10 py-8">Settlement Date</th>
                 <th className="px-10 py-8 text-center">Audit Status</th>
                 <th className="px-10 py-8 text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
               {loading ? (
                 <tr><td colSpan={6} className="p-32 text-center text-primary"><Loader2 className="animate-spin mx-auto scale-[2]" strokeWidth={3} /></td></tr>
               ) : payments.length === 0 ? (
                 <tr><td colSpan={6} className="p-32 text-center text-surface-400 font-bold uppercase tracking-[0.3em] text-xs">Zero receivables in current buffer.</td></tr>
               ) : payments.map((p, _i) => (
                 <tr key={p.id} className="group hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.03] transition-colors">
                   <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-indigo-500 shadow-xl border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform">
                          {p.resident_units?.unit_label?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xl text-surface-900 dark:text-white tracking-tighter leading-none mb-1">{p.resident_units?.unit_label || 'Common Area'}</span>
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Digital Asset ID</span>
                        </div>
                      </div>
                   </td>
                   <td className="px-10 py-8 font-black text-2xl text-surface-900 dark:text-white tracking-tighter leading-none">
                      ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </td>
                   <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-rose-500 font-black text-sm tracking-tighter">
                         <ArrowDownLeft size={14} /> ${p.late_fee || 0} Fee
                      </div>
                   </td>
                   <td className="px-10 py-8 text-[11px] text-surface-500 font-black uppercase tracking-widest">
                     {new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                   </td>
                   <td className="px-10 py-8 text-center">
                      <span className={`px-5 py-2 text-[10px] font-black rounded-xl uppercase border tracking-[0.2em] shadow-sm ${statusColors(p.status)}`}>
                        {p.status}
                      </span>
                   </td>
                   <td className="px-10 py-8 text-right">
                      <button className="px-6 py-3 bg-white dark:bg-white/5 hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-black/10 active:scale-95">
                         Details
                      </button>
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
