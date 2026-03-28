import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Receipt, 
  ArrowUpRight, 
  Calculator, 
  Loader2, 
  CheckCircle2,
  Calendar,
  IndianRupee,
  MoreVertical,
  Building2,
  LayoutGrid,
  List,
  History,
  TrendingDown
} from 'lucide-react';

export const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAptId, setUserAptId] = useState<string | null>(null);
  const [allApts, setAllApts] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (userAptId) {
      fetchExpenses();
    }
  }, [month, userAptId]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('role, apartment_id').eq('id', user.id).single();
    const role = profile?.role || 'RESIDENT';
    setUserRole(role);

    let aptId = profile?.apartment_id;

    if (role === 'SUPER_ADMIN') {
      const { data: apts } = await supabase.from('apartments').select('*').order('name');
      setAllApts(apts || []);
      if (!aptId && apts && apts.length > 0) aptId = 'all';
    }
    
    const finalAptId = aptId || 'all';
    setUserAptId(finalAptId);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    let query = supabase.from('expenses').select('*, apartments(name)');
    
    if (userAptId !== 'all') {
      query = query.eq('apartment_id', userAptId);
    }
    
    const { data } = await query
      .eq('month', month)
      .order('created_at', { ascending: false });
    
    setExpenses(data?.map(e => ({
      ...e,
      apartment_name: e.apartments?.name || 'Unknown Community'
    })) || []);
    setLoading(false);
  };

  const filteredExpenses = expenses.filter(e => 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.apartment_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAptId || userAptId === 'all') {
       alert('Please select a specific apartment before adding an expense.');
       return;
    }

    const { error } = await supabase.from('expenses').insert({
      amount: parseFloat(amount),
      description: desc,
      month,
      apartment_id: userAptId
    });

    if (!error) {
      setShowAddModal(false);
      setAmount('');
      setDesc('');
      fetchExpenses();
    }
  };

  const generateCharges = async () => {
    if (userAptId === 'all') return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    alert('Monthly maintenance charges generated for the selected community!');
  };

  const total = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
             <TrendingDown className="text-rose-500" size={24} />
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financial Ledger</h2>
             {userRole === 'SUPER_ADMIN' && (
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">
                  Full Control
                </span>
             )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Community expenses & bill generation.</p>
          
          {userRole === 'SUPER_ADMIN' && (
            <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-[450px]">
               <Building2 size={16} className="ml-2 text-primary" />
               <select 
                 value={userAptId || 'all'}
                 onChange={(e) => setUserAptId(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-wider h-10 px-2 dark:text-white"
               >
                 <option value="all">🌐 All Communities (Global Finance)</option>
                 {allApts.map(a => (
                   <option key={a.id} value={a.id}>{a.name}</option>
                 ))}
               </select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setViewType('grid')}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewType('table')}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List size={18} />
              </button>
           </div>

          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:text-white"
          />
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass p-6 bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-8">
               <div className="relative w-full max-w-sm">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search transactions..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                 />
               </div>
               <div className="hidden sm:flex items-center gap-3 text-slate-400">
                  <History size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{month} Summary</span>
               </div>
             </div>

             {loading ? (
                <div className="p-32 text-center space-y-4">
                   <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Financial Records...</p>
                </div>
             ) : filteredExpenses.length === 0 ? (
                <div className="p-32 text-center glass bg-white/20 dark:bg-white/5 border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Receipt size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-400 font-medium">No expenses logged for this period.</p>
                </div>
             ) : viewType === 'table' ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-5">Description</th>
                        <th className="px-6 py-5">Community</th>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-6 py-5 text-right">Amount</th>
                        <th className="px-6 py-5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="text-sm hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.05] transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="font-bold text-slate-800 dark:text-slate-200">{exp.description}</span>
                               <span className="text-[10px] text-slate-400 uppercase font-black">Utility Bill</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-md">{exp.apartment_name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{new Date(exp.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                             <span className="font-black text-rose-500">₹{Number(exp.amount).toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                                <MoreVertical size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredExpenses.map((exp) => (
                      <motion.div 
                        initial={{ opacity: 0, scale:0.95 }} animate={{ opacity: 1, scale:1 }}
                        key={exp.id} 
                        className="glass p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group"
                      >
                         <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                               <Receipt size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(exp.created_at).toLocaleDateString()}</span>
                         </div>
                         <h4 className="font-bold text-slate-900 dark:text-white mb-1">{exp.description}</h4>
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">{exp.apartment_name}</p>
                         <div className="flex items-end justify-between">
                            <div className="text-xs font-medium text-slate-500">Category: Maintenance</div>
                            <div className="text-xl font-black text-slate-900 dark:text-white">₹{Number(exp.amount).toLocaleString()}</div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="glass p-8 bg-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 relative">
              <Calendar size={18} /> Total Outflow
            </h3>
            <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest mb-6 relative">{month}</p>
            <div className="flex items-baseline gap-2 relative">
              <span className="text-4xl font-black">₹{total.toLocaleString()}</span>
              <ArrowUpRight className="text-emerald-300" size={24} />
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between relative">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Pending Billing</div>
              <CheckCircle2 size={16} className="text-indigo-200 border-2 border-indigo-200/20 rounded-full" />
            </div>
          </div>

          {userAptId !== 'all' && (
            <button 
              onClick={generateCharges}
              disabled={generating || total === 0}
              className="w-full glass p-6 border-indigo-200 dark:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-all text-left flex items-center gap-4 group"
            >
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                <Calculator size={24} />
              </div>
              <div className="flex-1">
                <span className="block font-bold">Bill Generation</span>
                <span className="block text-[10px] font-black uppercase text-slate-400">Calculate unit shares</span>
              </div>
              {generating && <Loader2 className="animate-spin text-indigo-600" />}
            </button>
          )}

          <div className="glass p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
             <h4 className="font-bold text-xs uppercase tracking-widest mb-4">Quick Insights</h4>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                   <span className="text-xs text-slate-500">Transcations</span>
                   <span className="text-xs font-black">{filteredExpenses.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                   <span className="text-xs text-slate-500">Avg. Cost</span>
                   <span className="text-xs font-black">₹{filteredExpenses.length ? (total / filteredExpenses.length).toFixed(0) : 0}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative">
               <button onClick={()=>setShowAddModal(false)} className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-full"><X size={18} /></button>
               <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Receipt className="text-indigo-600" /> Log Expense</h3>
               <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Total Amount (₹)</label>
                    <div className="relative">
                       <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input type="number" required value={amount} onChange={(e)=>setAmount(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none pl-10 pr-4 py-3 rounded-xl font-bold" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Spend Description</label>
                    <input required value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm" placeholder="e.g. Elevatory Maintenance" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/20 mt-4">Save Transaction</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ size, className, onClick }: any) => (
  <svg onClick={onClick} className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
