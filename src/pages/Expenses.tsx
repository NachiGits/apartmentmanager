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
  MoreVertical
} from 'lucide-react';

export const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchExpenses();
  }, [month]);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('month', month)
      .order('created_at', { ascending: false });
    
    setExpenses(data || []);
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('expenses').insert({
      amount: parseFloat(amount),
      description: desc,
      month,
      apartment_id: (await supabase.auth.getUser()).data.user?.user_metadata.apartment_id // This would need proper profile fetch in real app
    });

    if (!error) {
      setShowAddModal(false);
      setAmount('');
      setDesc('');
      fetchExpenses();
    }
  };

  const generateCharges = async () => {
    setGenerating(true);
    // Logic for generating charges based on total expenses and unit share
    // In a real Supabase app, this could be a Database Function (RPC)
    // For this demo, we'll simulate the process
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    alert('Charges generated successfully for all residents!');
  };

  const total = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Expense Tracker</h2>
          <p className="text-slate-500 mt-1">Manage and track community spending.</p>
        </div>
        
        <div className="flex gap-3">
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Expenses Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="text-indigo-600" />
                <span className="font-bold">Transaction History</span>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={5} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" /> Loading records...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-slate-400">No expenses found for this month.</td></tr>
                  ) : expenses.map((exp) => (
                    <tr key={exp.id} className="text-sm border-transparent hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-colors">
                      <td className="px-6 py-4 font-medium">{exp.description}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(exp.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-bold">UTILITY</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">${Number(exp.amount).toFixed(2)}</td>
                      <td className="px-6 py-4"><button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><MoreVertical size={16} className="text-slate-400" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Card & Generation */}
        <div className="space-y-6">
          <div className="glass p-8 bg-indigo-600 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 relative">
              <Calendar size={18} /> Monthly Total
            </h3>
            <p className="text-indigo-100/70 text-sm mb-6 relative">Accumulated expenses for {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(month))}</p>
            <div className="flex items-baseline gap-2 relative">
              <span className="text-4xl font-black">${total.toFixed(2)}</span>
              <ArrowUpRight className="text-emerald-300" size={24} />
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between relative">
              <div className="text-xs text-indigo-100">Pending Bill Generation</div>
              <CheckCircle2 size={16} className="text-indigo-200" />
            </div>
          </div>

          <button 
            onClick={generateCharges}
            disabled={generating || total === 0}
            className="w-full glass p-6 border-indigo-200 dark:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-all text-left flex items-center gap-4 group"
          >
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Calculator size={24} />
            </div>
            <div className="flex-1">
              <span className="block font-bold">Generate Charges</span>
              <span className="block text-xs text-slate-500">Calculate share for all residents</span>
            </div>
            {generating && <Loader2 className="animate-spin text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-2xl relative"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Receipt className="text-indigo-600" /> Add New Expense
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Description</label>
                  <input 
                    type="text" 
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Water Tank Repair"
                    required
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20">Save Expense</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
