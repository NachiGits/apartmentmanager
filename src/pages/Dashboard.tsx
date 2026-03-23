import { motion } from 'framer-motion';
import { 
  Users, 
  Wallet, 
  MessageSquareWarning, 
  TrendingUp, 
  Clock,
  CircleAlert,
  CheckCircle2
} from 'lucide-react';

const stats = [
  { label: 'Total Residents', value: '124', icon: Users, color: 'bg-emerald-500', trend: '+12%' },
  { label: 'Active Balance', value: '$12,450', icon: Wallet, color: 'bg-primary', trend: '-2.4%' },
  { label: 'Open Complaints', value: '6', icon: MessageSquareWarning, color: 'bg-amber-500', trend: '+1' },
  { label: 'Maintenance ROI', value: '94%', icon: TrendingUp, color: 'bg-accent', trend: '+4%' },
];

export const Dashboard = () => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-4xl font-black text-surface-900 dark:text-white tracking-tighter">Community Hub</h2>
          <p className="text-surface-500 mt-2 font-medium">Real-time pulse of your living ecosystem.</p>
        </motion.div>
        
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-surface-50 transition-all active:scale-95 shadow-sm">
            Reports
          </button>
          <button className="px-6 py-3 bg-gradient-premium text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
            New Expense
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="hover-card group glass relative p-8 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 cursor-pointer overflow-hidden"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className={`p-4 rounded-[1.5rem] ${stat.color} text-white shadow-2xl`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-8 relative z-10">
              <h3 className="text-surface-500 dark:text-surface-400 text-xs font-black uppercase tracking-widest">{stat.label}</h3>
              <p className="text-3xl font-black mt-2 text-surface-900 dark:text-white tracking-tighter">{stat.value}</p>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-10 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-none">
            <h3 className="text-xl font-black mb-10 flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><Clock size={22} strokeWidth={2.5} /></div>
              Activity Feed
            </h3>
            <div className="space-y-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-6 relative group">
                  {i !== 4 && <div className="absolute left-7 top-14 w-0.5 h-12 bg-black/5 dark:bg-white/5"></div>}
                  <div className="h-14 w-14 rounded-2xl bg-surface-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 group-hover:border-primary/30 transition-colors">
                    <CheckCircle2 size={28} className="text-primary animate-glow" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Maintenance Request Resolved</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400 font-medium mt-1">Unit A-204 leaky faucet was fixed by professional plumber.</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-[10px] text-primary/50 uppercase font-black tracking-[0.2em]">2 Hours Ago</span>
                      <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                      <span className="text-[10px] text-surface-400 uppercase font-black tracking-[0.2em]">Priority</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="space-y-8">
          <div className="glass p-10 bg-surface-900 dark:bg-surface-950 text-white relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-[80px]"></div>
            <h3 className="text-xl font-black mb-8 flex items-center gap-4 relative z-10">
              <CircleAlert size={24} className="text-primary" strokeWidth={2.5} />
              Critical Alerts
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-3xl backdrop-blur-3xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                <p className="text-sm font-black tracking-tight group-hover:text-primary transition-colors">Water Supply Maintenance</p>
                <p className="text-xs text-surface-400 mt-2 leading-relaxed">Scheduled for tomorrow, 10 AM to 2 PM. High priority outage notice.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl backdrop-blur-3xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                <p className="text-sm font-black tracking-tight group-hover:text-primary transition-colors">Monthly Dues Reminder</p>
                <p className="text-xs text-surface-400 mt-2 leading-relaxed">84% collection reached for March. Final notices pending.</p>
              </div>
            </div>
            <button className="w-full mt-10 py-5 bg-white text-surface-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl active:scale-95 z-10 relative">
              Dashboard Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
