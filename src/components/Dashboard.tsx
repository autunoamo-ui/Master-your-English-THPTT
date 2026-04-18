import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Clock, 
  ChevronRight,
  Play,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { AppData } from '../types';
import { TOPICS } from '../constants';
import { cn } from '../lib/utils';

interface DashboardProps {
  data: AppData;
  onStartPractice: () => void;
}

const STAT_CARDS = [
  { id: 'avg', label: 'Điểm trung bình', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'streak', label: 'Chuỗi học tập', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'total', label: 'Bài đã làm', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'time', label: 'Thời gian ôn tập', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
];

export default function Dashboard({ data, onStartPractice }: DashboardProps) {
  const chartData = data.sessions.map((s, index) => ({
    name: `Lần ${index + 1}`,
    score: (s.score / s.totalQuestions) * 10,
  })).slice(-10);

  if (chartData.length === 0) {
    chartData.push({ name: 'Chưa có', score: 0 });
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-extrabold tracking-tight text-text-dark"
          >
            Tổng quan học tập
          </motion.h1>
          <p className="text-text-muted mt-1 font-medium">Chào mừng bạn trở lại với hệ thống AI-EXAM PRO.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartPractice}
          className="px-6 py-3.5 gradient-bg text-white rounded-xl font-bold flex items-center gap-3 shadow-lg hover:opacity-90 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          Tiếp tục ôn luyện
        </motion.button>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STAT_CARDS.slice(0, 3).map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sleek border border-slate-100"
          >
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-2xl font-extrabold text-text-dark">
              {stat.id === 'avg' && `${data.progress.averageScore}`}
              {stat.id === 'streak' && `${data.progress.streakDays} Ngày`}
              {stat.id === 'total' && `${data.progress.totalAttempts}`}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sleek border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-text-dark">Biểu đồ tiến độ</h3>
            <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">10 bài gần nhất</span>
          </div>
          
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#4A90E2" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Popular Topics */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sleek border border-slate-100"
        >
          <h3 className="text-lg font-bold text-text-dark mb-6">Chuyên đề trọng tâm</h3>
          <div className="space-y-3">
            {TOPICS.slice(0, 4).map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-bg-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-text-dark">{topic.name}</span>
                </div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">{topic.questionCount} Qs</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
