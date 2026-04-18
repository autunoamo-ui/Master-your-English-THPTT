import { AppData } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip as RadarTooltip, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Target, BrainCircuit } from 'lucide-react';

interface AnalysisProps {
  data: AppData;
}

export default function Analysis({ data }: AnalysisProps) {
  if (data.sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-indigo-500" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-slate-800">Chưa có dữ liệu thống kê</h2>
          <p className="text-slate-500 mt-2">Vui lòng hoàn thành ít nhất một bài tập để xem thống kê năng lực của bạn.</p>
        </div>
      </div>
    );
  }

  // Prepared data for Line Chart (Score History)
  const lineData = data.sessions.map((s, index) => ({
    name: `Lần ${index + 1}`,
    score: parseFloat(((s.score / s.totalQuestions) * 10).toFixed(1)),
    date: new Date(s.date).toLocaleDateString('vi-VN'),
  })).slice(-10); // last 10 attempts

  // Prepare data for Radar Chart (Topic Mastery)
  const topicStats: Record<string, { correct: number; total: number; name: string }> = {};
  data.sessions.forEach(s => {
    s.history.forEach(h => {
      const question = s.questions?.find(q => q.id === h.questionId);
      const topicId = question?.topicId || s.topicId || 'Unknown Topic';
      const name = topicId === 't1' ? 'Ngữ pháp cơ bản' : topicId === 't2' ? 'Từ vựng (Vocabulary)' : topicId === 't3' ? 'Đọc hiểu' : topicId === 't5' ? 'Tìm lỗi sai' : topicId === 't6' ? 'Viết lại câu' : topicId === 'Unknown Topic' ? 'General' : topicId;
      
      if (!topicStats[name]) {
        topicStats[name] = { correct: 0, total: 0, name };
      }
      topicStats[name].total += 1;
      if (h.isCorrect) topicStats[name].correct += 1;
    });
  });

  const radarData = Object.values(topicStats).map(stat => ({
    subject: stat.name,
    mastery: parseFloat(((stat.correct / stat.total) * 100).toFixed(0)),
    fullMark: 100,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Dashboard Phân Tích</h1>
          <p className="text-slate-500 font-medium">Theo dõi sự phát triển năng lực của bạn</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
            <Target className="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Điểm trung bình</p>
            <p className="text-2xl font-black text-slate-800">{data.progress.averageScore.toFixed(1)} <span className="text-sm font-medium text-slate-400">/ 10</span></p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng số bài thi</p>
            <p className="text-2xl font-black text-slate-800">{data.progress.totalAttempts}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
            <BrainCircuit className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Điểm yếu cần khắc phục</p>
            <p className="text-md font-bold text-slate-800 truncate" title={data.progress.weakTopics.join(', ')}>
              {data.progress.weakTopics.length > 0 ? data.progress.weakTopics[0] : 'Chưa rõ'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
        >
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            Biểu đồ điểm số 10 lần gần nhất
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <LineTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
        >
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            Phân tích năng lực (Radar Chart)
          </h3>
          <div className="h-80 w-full">
            {radarData.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={110} data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <RadarTooltip />
                  <Radar name="Tỷ lệ đỗ (%)" dataKey="mastery" stroke="#ec4899" fill="#f472b6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
                  Cần làm ít nhất bài từ 3 chủ đề khác nhau để vẽ radar.
                </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
