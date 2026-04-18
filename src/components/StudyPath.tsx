import { motion } from 'motion/react';
import { 
  History, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  TrendingDown,
  RefreshCcw,
  GraduationCap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppData } from '../types';
import { getStudyPath } from '../services/gemini';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';

interface StudyPathProps {
  data: AppData;
}

export default function StudyPath({ data }: StudyPathProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAIPath = async () => {
    setLoading(true);
    const weakTopics = data.progress.weakTopics.length > 0 
      ? data.progress.weakTopics 
      : ['Conditional Sentences', 'Relative Clauses', 'Inversions']; // Fallback for demo
    const res = await getStudyPath(data.sessions, weakTopics);
    setRecommendation(res);
    setLoading(false);
  };

  useEffect(() => {
    if (data.sessions.length > 0 && !recommendation) {
      fetchAIPath();
    }
  }, [data.sessions]);

  if (data.sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-indigo-500" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-text-dark">Chưa có dữ liệu lộ trình</h2>
          <p className="text-text-muted mt-2">Hãy hoàn thành ít nhất một bài kiểm tra để AI có thể phân tích và đề xuất lộ trình học tập cá nhân hóa cho bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text-dark">Lộ trình học tập AI</h1>
          <p className="text-text-muted font-medium">Báo cáo chẩn đoán từ Gemini Flash</p>
        </div>
        <button 
          onClick={fetchAIPath}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-text-muted hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
          Làm mới báo cáo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sleek flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
              <p className="font-bold text-slate-400">Gemini AI đang chẩn đoán...</p>
            </div>
          ) : recommendation ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sleek pro-markdown"
            >
              <Markdown>{recommendation}</Markdown>
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-6">
            <div className="bg-[#fdf4ff] border border-[#f5d0fe] p-8 rounded-2xl">
               <span className="inline-block px-2 py-1 bg-[#a21caf] text-white text-[10px] font-extrabold rounded mb-4 uppercase tracking-tighter">AI Diagnostic</span>
               <h3 className="font-bold text-[#701a75] mb-4">Lỗ hổng kiến thức</h3>
               <div className="space-y-4">
                  {(data.progress.weakTopics.length > 0 ? data.progress.weakTopics : ['Conditional Sentences', 'Relative Clauses', 'Inversions']).map((topicName, i) => (
                    <div key={i} className="flex justify-between items-center pb-2 border-bottom border-[#f0e1f7] last:border-0 border-b">
                      <span className="text-sm font-semibold text-[#701a75]">{topicName}</span>
                      <span className="text-sm font-bold text-error">Yếu</span>
                    </div>
                  ))}
               </div>
               <div className="mt-6 text-sm leading-relaxed text-[#701a75] font-medium">
                  <strong>Gợi ý từ AI:</strong> Bạn thường sai ở phần Đảo ngữ loại 3. Hãy luyện tập bộ đề "Hard Structure" để cải thiện.
               </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sleek border border-slate-100 text-center">
               <div className="w-32 h-32 border-[10px] border-slate-100 border-t-primary rounded-full mx-auto flex items-center justify-center text-3xl font-black text-primary mb-6">
                 72%
               </div>
               <h4 className="font-bold text-text-dark">Mục tiêu ĐH Ngoại Thương</h4>
               <p className="text-xs text-text-muted mt-2 font-medium">Còn thiếu 0.8 điểm để đạt 9.2</p>
            </div>
        </div>
      </div>
    </div>
  );
}
