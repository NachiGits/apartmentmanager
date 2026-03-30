import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { sendExpenseEmail } from '../lib/brevo';
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
  TrendingDown,
  Paperclip,
  X,
  Tag,
  Zap,
  Settings,
  Users2,
  Bell,
  ChevronDown,
  Trash2,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Expense Categories ────────────────────────────────────────────────────
const PRESET_CATEGORIES = [
  { id: 'MOTOR_CLEANING',    label: 'Motor Cleaning',       icon: '🪣', color: 'blue'   },
  { id: 'ELECTRICAL',        label: 'Electrical Charges',   icon: '⚡', color: 'yellow' },
  { id: 'HOUSEKEEPING',      label: 'Housekeeping',         icon: '🧹', color: 'green'  },
  { id: 'TANK_CLEANING',     label: 'Tank Cleaning',        icon: '💧', color: 'cyan'   },
  { id: 'LIFT_AMC',          label: 'Lift AMC',             icon: '🛗', color: 'purple' },
  { id: 'CCTV',              label: 'CCTV Maintenance',     icon: '📹', color: 'red'    },
  { id: 'NEW_PURCHASE',      label: 'New Product Purchase', icon: '🛒', color: 'orange' },
  { id: 'OTHERS',            label: 'Others',               icon: '📋', color: 'slate'  },
];

const CATEGORY_COLORS: Record<string, string> = {
  blue:   'bg-blue-100   text-blue-700   dark:bg-blue-500/10   dark:text-blue-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  cyan:   'bg-cyan-100   text-cyan-700   dark:bg-cyan-500/10   dark:text-cyan-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  red:    'bg-rose-100   text-rose-700   dark:bg-rose-500/10   dark:text-rose-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  slate:  'bg-slate-100  text-slate-700  dark:bg-slate-500/10  dark:text-slate-400',
};

function getCategoryInfo(categoryId: string, customCategories: string[] = []) {
  const preset = PRESET_CATEGORIES.find(c => c.id === categoryId);
  if (preset) return preset;
  if (customCategories.includes(categoryId)) {
    return { id: categoryId, label: categoryId, icon: '🏷️', color: 'slate' };
  }
  return { id: 'OTHERS', label: categoryId || 'Uncategorized', icon: '📋', color: 'slate' };
}

// ─── Component ────────────────────────────────────────────────────────────
export const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState<any | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAptId, setUserAptId] = useState<string | null>(null);
  const [allApts, setAllApts] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [aptMembers, setAptMembers] = useState<any[]>([]);
  const [aptCalcType, setAptCalcType] = useState<string>('EQUAL');
  const [aptCalcBasis, setAptCalcBasis] = useState<string>('EQUAL');

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'OTHERS',
    customCategory: '',
    showCustomInput: false,
  });
  const [billFile, setBillFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (userAptId) { fetchExpenses(); fetchMembers(); } }, [month, userAptId]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, apartment_id, full_name, email')
      .eq('id', user.id)
      .single();
    
    const role = profile?.role || 'RESIDENT';
    setUserRole(role);
    setUserProfile(profile);

    let aptId = profile?.apartment_id;

    if (role === 'SUPER_ADMIN') {
      const { data: apts } = await supabase.from('apartments').select('*').order('name');
      setAllApts(apts || []);
      if (!aptId && apts && apts.length > 0) aptId = 'all';
    }

    setUserAptId(aptId || 'all');

    // Load saved custom categories 
    const saved = localStorage.getItem('hc_custom_categories');
    if (saved) setCustomCategories(JSON.parse(saved));
  };

  const fetchExpenses = async () => {
    setLoading(true);
    let query = supabase
      .from('expenses')
      .select('*, apartments(name), profiles(full_name)');

    if (userAptId !== 'all') query = query.eq('apartment_id', userAptId);

    const { data } = await query
      .eq('month', month)
      .order('created_at', { ascending: false });

    setExpenses(data?.map(e => ({
      ...e,
      apartment_name: e.apartments?.name || 'Unknown Community',
      creator_name: e.profiles?.full_name || 'Admin',
    })) || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!userAptId || userAptId === 'all') return;

    const [membersRes, aptRes] = await Promise.all([
      supabase
        .from('apartment_members')
        .select('profile_id, role, profiles(full_name, email, unit_number, sqft_build_up, sqft_carpet, sqft_uds)')
        .eq('apartment_id', userAptId),
      supabase
        .from('apartments')
        .select('calc_type, calc_basis')
        .eq('id', userAptId)
        .single()
    ]);

    setAptMembers(membersRes.data || []);
    setAptCalcType(aptRes.data?.calc_type || 'EQUAL');
    setAptCalcBasis(aptRes.data?.calc_basis || 'EQUAL');
  };

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.apartment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'ALL' || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  const total = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // ─── Add Expense ─────────────────────────────────────────────────────────
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAptId || userAptId === 'all') {
      toast.error('Select a specific community first');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalCategory = formData.showCustomInput
      ? formData.customCategory.toUpperCase().replace(/\s+/g, '_')
      : formData.category;

    // Handle bill upload
    let billUrl: string | null = null;
    if (billFile) {
      setUploading(true);
      const fileName = `${userAptId}/${Date.now()}_${billFile.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('expense-bills')
        .upload(fileName, billFile, { cacheControl: '3600', upsert: false });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from('expense-bills').getPublicUrl(fileName);
        billUrl = urlData?.publicUrl || null;
      }
      setUploading(false);
    }

    const { data: newExpense, error } = await supabase.from('expenses').insert({
      amount: parseFloat(formData.amount),
      description: formData.description,
      month,
      apartment_id: userAptId,
      category: finalCategory,
      custom_category: formData.showCustomInput ? formData.customCategory : null,
      bill_url: billUrl,
      created_by: user.id,
    }).select().single();

    if (error) {
      toast.error('Failed to add expense');
      return;
    }

    // Save custom category if new
    if (formData.showCustomInput && formData.customCategory) {
      const updated = [...customCategories, finalCategory];
      setCustomCategories(updated);
      localStorage.setItem('hc_custom_categories', JSON.stringify(updated));
    }

    // Auto-create splits for all members
    let splitResults: any[] = [];
    if (aptMembers.length > 0) {
      splitResults = (await createExpenseSplits(newExpense.id, parseFloat(formData.amount))) || [];
    }

    // Send notifications with per-member actual amounts
    await notifyMembers(newExpense, parseFloat(formData.amount), finalCategory, splitResults);

    setShowAddModal(false);
    resetForm();
    fetchExpenses();
    toast.success('Expense added and splits created!');
  };

  const createExpenseSplits = async (expenseId: string, totalAmount: number) => {
    if (!userAptId) return;

    // Calculate total SQFT across all members
    let totalSqft = 0;
    if (aptCalcType === 'SQFT') {
      aptMembers.forEach(m => {
        const p = m.profiles;
        const s = aptCalcBasis === 'BUILD_UP' ? (p?.sqft_build_up || 0)
          : aptCalcBasis === 'CARPET' ? (p?.sqft_carpet || 0)
          : (p?.sqft_uds || 0);
        totalSqft += s;
      });
    }

    let allocatedAmount = 0;
    const splits = aptMembers.map((member) => {
      let share = totalAmount / aptMembers.length; // Default: equal
      let sharePct = aptMembers.length > 0 ? (1 / aptMembers.length) * 100 : 0;

      if (aptCalcType === 'SQFT' && totalSqft > 0) {
        const p = member.profiles;
        const memberSqft = Number(aptCalcBasis === 'BUILD_UP' ? (p?.sqft_build_up || 0)
          : aptCalcBasis === 'CARPET' ? (p?.sqft_carpet || 0)
          : (p?.sqft_uds || 0));
        sharePct = (memberSqft / totalSqft) * 100;
        share = (memberSqft / totalSqft) * totalAmount;
      }

      const roundedShare = Math.round(share * 100) / 100;
      allocatedAmount += roundedShare;

      return {
        expense_id: expenseId,
        profile_id: member.profile_id,
        apartment_id: userAptId,
        amount: roundedShare,
        share_percentage: Math.round(sharePct * 100) / 100,
        status: 'PENDING',
      };
    });

    // Fix floating point matching drift on the final member
    if (splits.length > 0) {
      const diff = Math.round((totalAmount - allocatedAmount) * 100) / 100;
      if (diff !== 0) {
        splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + diff) * 100) / 100;
      }
    }

    if (splits.length > 0) {
      await supabase.from('expense_splits').insert(splits);
    }

    return splits; // return so notify can use per-member amounts
  };

  const notifyMembers = async (expense: any, amount: number, category: string, splits: any[] = []) => {
    if (!userAptId || aptMembers.length === 0) return;

    const catLabel = getCategoryInfo(category, customCategories).label;
    const isEqualSplit = aptCalcType !== 'SQFT';
    const equalPerHead = (amount / aptMembers.length).toFixed(2);

    // Build a map of profile_id → split amount for personalised notifications
    const splitMap: Record<string, string> = {};
    splits.forEach(s => {
      splitMap[s.profile_id] = Number(s.amount).toFixed(2);
    });

    const notifications = aptMembers.map(m => {
      const myShare = splitMap[m.profile_id] || equalPerHead;
      return {
        profile_id: m.profile_id,
        apartment_id: userAptId,
        title: `New Expense: ${catLabel}`,
        description: `₹${Number(amount).toLocaleString()} added for "${expense.description}". Your share: ₹${myShare}${
          !isEqualSplit ? ` (${aptCalcBasis.replace('_', ' ')} based)` : ''
        }`,
        type: 'EXPENSE',
        status: 'UNREAD',
      };
    });

    await supabase.from('notifications').insert(notifications);

    // Email: send per-member personalised amount via first member as representative
    const memberEmails = aptMembers.map(m => m.profiles?.email).filter(Boolean);
    if (memberEmails.length > 0) {
      try {
        await sendExpenseEmail({
          toEmails: memberEmails,
          expenseDescription: expense.description,
          category: catLabel,
          totalAmount: amount,
          perHeadAmount: parseFloat(equalPerHead),
          month,
        });
      } catch (err) {
        console.warn('Email send failed (non-critical):', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', description: '', category: 'OTHERS', customCategory: '', showCustomInput: false });
    setBillFile(null);
  };

  // ─── Expense Splits Summary ───────────────────────────────────────────────
  const openSplitDetails = async (exp: any) => {
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('*, profiles(full_name, unit_number)')
      .eq('expense_id', exp.id);
    setShowSplitModal({ expense: exp, splits: splits || [] });
  };

  // ─── Generate Charges ────────────────────────────────────────────────────
  const generateCharges = async () => {
    if (userAptId === 'all') return;
    setGenerating(true);
    try {
      const monthExpenses = expenses;
      if (monthExpenses.length === 0) {
        toast.error('No expenses logged for this month');
        setGenerating(false);
        return;
      }

      const totalMonthAmount = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const perUnit = aptMembers.length > 0 ? totalMonthAmount / aptMembers.length : 0;

      // Insert maintenance charges
      const chargeRows = aptMembers.map(m => ({
        apartment_id: userAptId,
        resident_unit_id: null, // optional link
        amount: Math.round(perUnit * 100) / 100,
        month,
        due_date: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1, 5)).toISOString().slice(0, 10),
        status: 'PENDING',
      }));

      // Notify
      await supabase.from('notifications').insert(aptMembers.map(m => ({
        profile_id: m.profile_id,
        apartment_id: userAptId,
        title: `Maintenance Bill for ${month}`,
        description: `Your maintenance charge: ₹${perUnit.toFixed(2)}. Total community expenses: ₹${totalMonthAmount.toLocaleString()}`,
        type: 'EXPENSE',
        status: 'UNREAD',
      })));

      toast.success(`Maintenance bill of ₹${perUnit.toFixed(0)}/unit generated for ${month}!`);
    } catch (err) {
      toast.error('Failed to generate charges');
    }
    setGenerating(false);
  };

  const allCategories = [
    ...PRESET_CATEGORIES,
    ...customCategories.map(c => ({ id: c, label: c.replace(/_/g, ' '), icon: '🏷️', color: 'slate' }))
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
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
          <p className="text-slate-500 text-sm font-medium">Community expenses with split billing & notifications.</p>

          {userRole === 'SUPER_ADMIN' && (
            <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-[450px]">
              <Building2 size={16} className="ml-2 text-primary" />
              <select
                value={userAptId || 'all'}
                onChange={(e) => setUserAptId(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-wider h-10 px-2 dark:text-white"
              >
                <option value="all">🌐 All Communities</option>
                {allApts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewType('grid')} className={`p-2.5 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewType('table')} className={`p-2.5 rounded-lg transition-all ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              <List size={18} />
            </button>
          </div>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:text-white"
          />

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Add Expense</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search + Category Filter */}
          <div className="glass p-4 bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-12 pr-4 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <Tag size={14} className="text-slate-400 shrink-0" />
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterCategory === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
              >All</button>
              {allCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-6 bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-slate-400">
                <History size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{month} · {filteredExpenses.length} entries</span>
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
                {isAdmin && (
                  <button onClick={() => setShowAddModal(true)} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
                    Add First Expense
                  </button>
                )}
              </div>
            ) : viewType === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-5">Description</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">Community</th>
                      <th className="px-6 py-5">Date</th>
                      <th className="px-6 py-5 text-right">Amount</th>
                      <th className="px-6 py-5 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredExpenses.map((exp) => {
                      const cat = getCategoryInfo(exp.category, customCategories);
                      return (
                        <tr key={exp.id} className="text-sm hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.05] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{exp.description}</span>
                              <span className="text-[10px] text-slate-400 font-medium">by {exp.creator_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${CATEGORY_COLORS[cat.color]}`}>
                              <span>{cat.icon}</span> {cat.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-md">{exp.apartment_name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{new Date(exp.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-rose-500">₹{Number(exp.amount).toLocaleString()}</span>
                              {aptMembers.length > 0 && (
                                <span className="text-[10px] text-slate-400">÷{aptMembers.length} = ₹{(exp.amount / aptMembers.length).toFixed(0)}/unit</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openSplitDetails(exp)}
                                title="View splits"
                                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg text-indigo-500 transition-all"
                              >
                                <Users2 size={15} />
                              </button>
                              {exp.bill_url && (
                                <a href={exp.bill_url} target="_blank" rel="noopener noreferrer"
                                  title="View bill"
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-all"
                                >
                                  <Eye size={15} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryInfo(exp.category, customCategories);
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={exp.id}
                      className="glass p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group cursor-pointer"
                      onClick={() => openSplitDetails(exp)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`px-3 py-2 rounded-2xl text-lg ${CATEGORY_COLORS[cat.color]}`}>
                          {cat.icon}
                        </div>
                        <div className="flex items-center gap-2">
                          {exp.bill_url && (
                            <a href={exp.bill_url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-500"
                            >
                              <FileText size={13} />
                            </a>
                          )}
                          <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(exp.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{exp.description}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${CATEGORY_COLORS[cat.color]}`}>{cat.icon} {cat.label}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-400">{exp.apartment_name}</div>
                          {aptMembers.length > 0 && (
                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                              ÷{aptMembers.length} = ₹{(exp.amount / aptMembers.length).toFixed(0)}/unit
                            </div>
                          )}
                        </div>
                        <div className="text-xl font-black text-rose-500">₹{Number(exp.amount).toLocaleString()}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass p-8 bg-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 relative"><Calendar size={18} /> Total Outflow</h3>
            <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest mb-6 relative">{month}</p>
            <div className="flex items-baseline gap-2 relative">
              <span className="text-4xl font-black">₹{total.toLocaleString()}</span>
              <ArrowUpRight className="text-emerald-300" size={24} />
            </div>
            {aptMembers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 relative">
                <div className="text-[10px] text-indigo-200 font-black uppercase tracking-widest">Per Unit Share</div>
                <div className="text-2xl font-black mt-1">₹{(total / aptMembers.length).toFixed(0)}</div>
                <div className="text-[9px] text-indigo-200/60">{aptMembers.length} members</div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between relative">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Month Summary</div>
              <CheckCircle2 size={16} className="text-indigo-200" />
            </div>
          </div>

          {isAdmin && userAptId !== 'all' && (
            <button
              onClick={generateCharges}
              disabled={generating || total === 0}
              className="w-full glass p-6 border-indigo-200 dark:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-all text-left flex items-center gap-4 group disabled:opacity-50"
            >
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                <Calculator size={24} />
              </div>
              <div className="flex-1">
                <span className="block font-bold">Generate Bills</span>
                <span className="block text-[10px] font-black uppercase text-slate-400">Notify all members</span>
              </div>
              {generating && <Loader2 className="animate-spin text-indigo-600" />}
            </button>
          )}

          {/* Category Breakdown */}
          <div className="glass p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Tag size={14} /> Category Breakdown
            </h4>
            <div className="space-y-2">
              {allCategories
                .filter(cat => filteredExpenses.some(e => e.category === cat.id))
                .map(cat => {
                  const catTotal = filteredExpenses
                    .filter(e => e.category === cat.id)
                    .reduce((s, e) => s + Number(e.amount), 0);
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl">
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        <span>{cat.icon}</span>
                        <span className="text-slate-600 dark:text-slate-300">{cat.label}</span>
                      </span>
                      <span className="text-xs font-black text-rose-500">₹{catTotal.toLocaleString()}</span>
                    </div>
                  );
                })}
              {filteredExpenses.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-4">No data for selected period</div>
              )}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="glass p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-widest mb-4">Quick Insights</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                <span className="text-xs text-slate-500">Transactions</span>
                <span className="text-xs font-black">{filteredExpenses.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                <span className="text-xs text-slate-500">Avg. Cost</span>
                <span className="text-xs font-black">₹{filteredExpenses.length ? (total / filteredExpenses.length).toFixed(0) : 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                <span className="text-xs text-slate-500">Members</span>
                <span className="text-xs font-black">{aptMembers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Add Expense Modal ─── */}
      {typeof document !== 'undefined' && document.body ? createPortal(
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-20 sm:pt-[10vh] p-4 sm:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="glass max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl relative rounded-[2rem] flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 z-10 shrink-0 bg-white/50 backdrop-blur-md dark:bg-slate-900/50">
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X size={18} />
                </button>
                <h3 className="text-xl font-black flex items-center gap-2"><Receipt className="text-indigo-600" /> Log Expense</h3>
                <p className="text-xs text-slate-400 mt-1">Splits will be auto-calculated for all {aptMembers.length} members</p>
              </div>

              <div className="overflow-y-auto">

              <form onSubmit={handleAddExpense} className="p-6 flex flex-col gap-4">
                {/* TOP ROW: Amount & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* STEP 1 — Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-black">1</span>
                      Total Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.amount}
                        onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none pl-10 pr-4 py-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/30"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* STEP 2 — Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-black">2</span>
                      <Tag size={10} /> Category
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.showCustomInput ? 'CUSTOM' : formData.category}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') setFormData(f => ({ ...f, showCustomInput: true, category: '' }));
                          else setFormData(f => ({ ...f, category: val, showCustomInput: false }));
                        }}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-200"
                      >
                        <option value="" disabled>Choose...</option>
                        {PRESET_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                        {customCategories.length > 0 && <option disabled>─── Custom Setup ───</option>}
                        {customCategories.map(c => (
                          <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                        ))}
                        <option disabled>───────────</option>
                        <option value="CUSTOM">+ Add Custom Category</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Custom category name input */}
                <AnimatePresence>
                  {formData.showCustomInput && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <input
                        autoFocus
                        value={formData.customCategory}
                        onChange={e => setFormData(f => ({ ...f, customCategory: e.target.value }))}
                        className="w-full bg-purple-50 dark:bg-purple-500/10 border-2 border-purple-300 dark:border-purple-600 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/30 font-medium text-purple-800 dark:text-purple-200 placeholder-purple-300 mt-1"
                        placeholder="e.g. Gym Equipment Repair"
                        required={formData.showCustomInput}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 3 & 4 — Description & File Attach */}
                <AnimatePresence>
                  {(formData.category || formData.showCustomInput) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-black">3</span>
                          Details & Attachment
                        </label>
                        <button
                          type="button"
                          title="Attach Bill/Image (Max 5MB)"
                          onClick={() => fileInputRef.current?.click()}
                          className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                            billFile 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Paperclip size={12} />
                          {billFile ? 'Attached' : 'Attach File'}
                        </button>
                      </div>
                      <input
                        required
                        value={formData.description}
                        onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                        placeholder={
                          formData.category === 'OTHERS' || formData.showCustomInput
                            ? 'Describe this expense clearly (e.g. Emergency gate repair)'
                            : `e.g. ${
                                formData.category === 'MOTOR_CLEANING' ? 'Monthly water pump service'
                                : formData.category === 'ELECTRICAL' ? 'Common area lighting replacement'
                                : formData.category === 'HOUSEKEEPING' ? 'April cleaning supplies'
                                : formData.category === 'LIFT_AMC' ? 'Quarterly AMC payment'
                                : formData.category === 'CCTV' ? 'Camera module replacement'
                                : 'Add any relevant notes'
                              }`
                        }
                      />
                      
                      {billFile && (
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/30 rounded-xl mt-2">
                           <div className="flex items-center gap-2 min-w-0">
                             <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"><Paperclip size={10} /></span>
                             <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate">{billFile.name}</p>
                           </div>
                           <button type="button" onClick={() => setBillFile(null)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md text-emerald-600 flex-shrink-0"><X size={14}/></button>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} hidden accept="image/*,.pdf" onChange={e => setBillFile(e.target.files?.[0] || null)} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Split Preview */}
                {formData.amount && aptMembers.length > 0 && (() => {
                  const total = parseFloat(formData.amount) || 0;
                  const isSqft = aptCalcType === 'SQFT';

                  // Pre-compute sqft totals for preview
                  let totalSqft = 0;
                  if (isSqft) {
                    aptMembers.forEach(m => {
                      const p = m.profiles;
                      totalSqft += aptCalcBasis === 'BUILD_UP' ? (p?.sqft_build_up || 0)
                        : aptCalcBasis === 'CARPET' ? (p?.sqft_carpet || 0)
                        : (p?.sqft_uds || 0);
                    });
                  }

                  return (
                    <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10">
                        <div className="flex items-center gap-2">
                          <Users2 size={13} className="text-indigo-600" />
                          <span className="text-[10px] font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Split Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSqft && totalSqft > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              ₹{parseFloat((total / totalSqft).toFixed(6))}/sqft
                            </span>
                          )}
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            isSqft
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                          }`}>
                            {isSqft ? `${aptCalcBasis.replace('_', ' ')} Based` : 'Equal Split'}
                          </span>
                        </div>
                      </div>

                      {/* Rows */}
                      <div className="divide-y divide-indigo-50 dark:divide-indigo-500/10 bg-white dark:bg-slate-900 max-h-40 overflow-y-auto">
                        {aptMembers.map(m => {
                          const p = m.profiles;
                          let memberSqft = 0;
                          let share = total / aptMembers.length;
                          let pct = 100 / aptMembers.length;

                          if (isSqft && totalSqft > 0) {
                            memberSqft = aptCalcBasis === 'BUILD_UP' ? (p?.sqft_build_up || 0)
                              : aptCalcBasis === 'CARPET' ? (p?.sqft_carpet || 0)
                              : (p?.sqft_uds || 0);
                            pct = (memberSqft / totalSqft) * 100;
                            share = (memberSqft / totalSqft) * total;
                          }

                          return (
                            <div key={m.profile_id} className="flex items-center justify-between px-4 py-2">
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{p?.full_name || 'Member'}</p>
                                {isSqft && (
                                  <p className="text-[9px] text-slate-400">
                                    {memberSqft > 0 ? `${memberSqft} sqft · ${pct.toFixed(1)}%` : <span className="text-amber-500">No sqft data</span>}
                                  </p>
                                )}
                                {p?.unit_number && (
                                  <p className="text-[9px] text-indigo-400">Unit {p.unit_number}</p>
                                )}
                              </div>
                              <span className="text-xs font-black text-rose-500">₹{share.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between px-4 py-2 bg-indigo-600 text-white">
                        <span className="text-[10px] font-black uppercase tracking-wider">{aptMembers.length} Members Total</span>
                        <span className="text-xs font-black">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Notification info */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <Bell size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    All {aptMembers.length} members will receive in-app notifications and email alerts with their share amount.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={uploading || (!formData.category && !formData.showCustomInput)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  {uploading ? 'Uploading Bill...' : 'Save & Notify Members'}
                </button>
              </form>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}

      {/* ─── Split Details Modal ─── */}
      {typeof document !== 'undefined' && document.body ? createPortal(
        <AnimatePresence>
          {showSplitModal && (
            <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-20 sm:pt-[10vh] p-4 sm:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSplitModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="glass max-w-md w-full bg-white dark:bg-slate-900 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto rounded-[2rem]"
            >
              <button onClick={() => setShowSplitModal(null)} className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={18} />
              </button>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-black flex items-center gap-2"><Users2 className="text-indigo-600" /> Expense Split</h3>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                    aptCalcType === 'SQFT'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                  }`}>
                    {aptCalcType === 'SQFT' ? `${aptCalcBasis.replace('_', ' ')} Based` : 'Equal Split'}
                  </span>
                </div>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{showSplitModal.expense.description}</p>
                  <p className="text-2xl font-black text-rose-500 mt-1">₹{Number(showSplitModal.expense.amount).toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{showSplitModal.expense.month}</p>
                    {(() => {
                      if (aptCalcType === 'SQFT') {
                         let totalSqft = 0;
                         showSplitModal.splits.forEach((s: any) => {
                           const basis = aptCalcBasis || 'BUILD_UP';
                           totalSqft += basis === 'BUILD_UP' ? (s.profiles?.sqft_build_up || 0)
                             : basis === 'CARPET' ? (s.profiles?.sqft_carpet || 0)
                             : (s.profiles?.sqft_uds || 0);
                         });
                         if (totalSqft > 0) {
                           const rate = Number(showSplitModal.expense.amount) / totalSqft;
                           return (
                             <p className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-500/20">
                               Rate: ₹{parseFloat(rate.toFixed(6))}/sqft
                             </p>
                           );
                         }
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {showSplitModal.splits.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto mb-3 text-amber-400" size={32} />
                  <p className="text-slate-500 text-sm">No split records found.</p>
                  <p className="text-slate-400 text-xs mt-1">Splits are created when there are active members.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {showSplitModal.splits.map((split: any) => (
                    <div key={split.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                          {split.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{split.profiles?.full_name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {split.profiles?.unit_number && (
                              <p className="text-[10px] text-slate-400">Unit {split.profiles.unit_number}</p>
                            )}
                            {split.share_percentage != null && aptCalcType === 'SQFT' && (
                              <span className="text-[9px] font-bold text-amber-500">{Number(split.share_percentage).toFixed(1)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-rose-500">₹{Number(split.amount).toFixed(2)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          split.status === 'PAID' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {split.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Total row */}
                  <div className="flex items-center justify-between p-3 bg-indigo-600 text-white rounded-xl mt-3">
                    <span className="text-sm font-black">Total</span>
                    <span className="text-sm font-black">₹{Number(showSplitModal.expense.amount).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
};
