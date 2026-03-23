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
  { label: 'Total Residents', value: '124', icon: Users, color: 'bg-indigo-500', trend: '+12%' },
  { label: 'Active Balance', value: '$12,450', icon: Wallet, color: 'bg-emerald-500', trend: '-2.4%' },
  { label: 'Open Complaints', value: '6', icon: MessageSquareWarning, color: 'bg-amber-500', trend: '+1' },
  { label: 'Maintenance ROI', value: '94%', icon: TrendingUp, color: 'bg-rose-500', trend: '+4%' },
];

export const Dashboard = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Community Overview</h2>
          <p className="text-slate-500 mt-1">Here's what's happening in your apartment today.</p>
        </motion.div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group glass relative p-6 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stat.value}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 bg-white/40 dark:bg-slate-900/40">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Clock size={20} className="text-indigo-500" />
              Recent Activities
            </h3>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== 4 && <div className="absolute left-6 top-10 w-0.5 h-10 bg-slate-100 dark:bg-slate-800"></div>}
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Maintenance Request Resolved</p>
                    <p className="text-xs text-slate-500 mt-0.5">Unit A-204 leaky faucet was fixed by plumber.</p>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2 block">2 HOURS AGO</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="space-y-6">
          <div className="glass p-6 bg-indigo-600 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CircleAlert size={20} />
              Important Alerts
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <p className="text-sm font-medium">Water Supply Maintenance</p>
                <p className="text-xs text-indigo-100 mt-1">Scheduled for tomorrow, 10 AM to 2 PM. Please store water in advance.</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <p className="text-sm font-medium">Monthly Dues Reminder</p>
                <p className="text-xs text-indigo-100 mt-1">68% of residents have completed payments for March.</p>
              </div>
            </div>
            <button className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-xl shadow-indigo-900/20">
              View All Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
