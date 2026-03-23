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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Payments & Billing</h2>
          <p className="text-slate-500 mt-1">Status of maintenance charges and collection.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
            <Zap size={18} /> Instant Pay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 bg-white/40 dark:bg-slate-900/40 col-span-1">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl w-fit mb-6 shadow-xl shadow-indigo-500/5">
            <Wallet size={28} />
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Outstanding</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-white">$34,250.00</p>
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Collected (Mar)</span>
              <span className="text-sm font-black text-emerald-500">$12,020 (84%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-4/5"></div>
            </div>
          </div>
        </div>

        <div className="glass p-8 bg-indigo-600 text-white relative flex flex-col justify-between overflow-hidden">
           <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
           <div>
             <div className="flex items-center justify-between mb-8 relative">
               <ShieldCheck size={32} />
               <button className="p-2 border border-white/20 rounded-xl hover:bg-white/10 transition-colors"><MoreVertical size={20}/></button>
             </div>
             <p className="text-indigo-100 text-sm font-medium relative">Community Fund Status</p>
             <h3 className="text-3xl font-black mt-1 mb-6 relative">Secured & Active</h3>
           </div>
           <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-900/30 relative">Explore Assets</button>
        </div>

        <div className="glass p-8 bg-white/40 dark:bg-slate-900/40">
           <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl w-fit mb-6">
            <CreditCard size={28} />
          </div>
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Upcoming Dues</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-white">Next: Apr 10</p>
          <p className="text-xs text-slate-500 mt-4 flex items-center gap-1"><Clock size={12}/> Average payment delay: 2.1 days</p>
        </div>
      </div>

      <div className="glass overflow-hidden bg-white/40 dark:bg-slate-900/40">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><CreditCard size={18} className="text-indigo-600" /> Pending Collection</h3>
          <div className="flex gap-2 text-xs font-bold text-slate-500">
             <span>MARCH 2024</span>
             <CalendarDays size={16} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                 <th className="px-8 py-5">Resident Unit</th>
                 <th className="px-8 py-5">Amount Due</th>
                 <th className="px-8 py-5">Late Fees</th>
                 <th className="px-8 py-5">Due Date</th>
                 <th className="px-8 py-5">Status</th>
                 <th className="px-8 py-5 text-right w-10"></th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {loading ? (
                 <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr>
               ) : payments.length === 0 ? (
                 <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-medium">No pending payments for this cycle.</td></tr>
               ) : payments.map((p, _i) => (
                 <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                   <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-xs text-slate-500">A1</div>
                        <span className="font-bold text-sm">Unit A-204</span>
                      </div>
                   </td>
                   <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">${p.amount}</td>
                   <td className="px-8 py-5 text-rose-500 font-bold text-xs">${p.late_fee || 0}</td>
                   <td className="px-8 py-5 text-xs text-slate-500 font-medium">{new Date(p.due_date).toLocaleDateString()}</td>
                   <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase border tracking-widest ${statusColors(p.status)}`}>{p.status}</span>
                   </td>
                   <td className="px-8 py-5 text-right">
                      <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><ArrowUpRight size={18} className="text-slate-400" /></button>
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
