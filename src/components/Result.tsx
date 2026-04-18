import { motion } from 'motion/react';
import { 
  Award, 
  Clock, 
  Target, 
  ArrowLeft, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle,
  Brain,
  ChevronRight
} from 'lucide-react';
import { ExamSession } from '../types';
import { MOCK_QUESTIONS } from '../constants';
import { cn, formatTime } from '../lib/utils';

interface ResultProps {
  session: ExamSession;
  onRestart: () => void;
  onReturn: () => void;
}

export default function Result({ session, onRestart, onReturn }: ResultProps) {
  const scorePercent = (session.correctAnswers / session.totalQuestions) * 100;
  
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <section className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-orange-200"
        >
          <Award className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900">Kết quả bài làm</h1>
        <p className="text-slate-500 font-medium">Chúc mừng bạn đã hoàn thành bài thi thử!</p>
      </section>

      {/* Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm số</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-slate-900">{session.score.toFixed(1)}</span>
              <span className="text-slate-400 font-bold">/ 10</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${scorePercent}%` }}
                className={cn("h-full rounded-full", scorePercent >= 80 ? 'bg-emerald-500' : scorePercent >= 50 ? 'bg-orange-500' : 'bg-red-500')}
               />
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đúng / Sai</span>
            <div className="text-3xl font-black flex items-center justify-center gap-3 py-2">
              <span className="text-emerald-500">{session.correctAnswers}</span>
              <span className="text-slate-200">/</span>
              <span className="text-red-500">{session.totalQuestions - session.correctAnswers}</span>
            </div>
            <p className="text-slate-400 text-xs font-bold leading-relaxed pt-2">Đạt {scorePercent.toFixed(0)}% yêu cầu của bài đề ra.</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</span>
            <div className="text-3xl font-black py-2 text-slate-700 flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-slate-300" />
              {formatTime(session.timeSpent)}
            </div>
            <p className="text-slate-400 text-xs font-bold pt-2">Tốc độ trung bình: {(session.timeSpent / session.totalQuestions).toFixed(1)}s / câu</p>
        </div>
      </div>

      {/* AI Next Steps */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-slate-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
             <Brain className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Chẩn đoán từ AI Tutor</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Bạn đang gặp khó khăn ở phần <strong>Đọc hiểu</strong> và <strong>Câu điều kiện</strong>. 
              SmartEng12 khuyên bạn nên dành thêm 15 phút mỗi ngày để luyện tập lộ trình cá nhân hóa vừa được thiết lập.
            </p>
          </div>
          <button 
            onClick={onReturn}
            className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all flex items-center gap-2 shrink-0"
          >
            Xem lộ trình
            <ChevronRight className="w-5 h-5" />
          </button>
      </div>

      {/* Review Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 px-4">Xem lại bài làm</h3>
        <div className="space-y-4">
          {session.history.map((h, i) => {
            const question = session.questions?.find(q => q.id === h.questionId) || MOCK_QUESTIONS.find(q => q.id === h.questionId) || MOCK_QUESTIONS[0];
            return (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black",
                  h.isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 space-y-4">
                  <p className="font-bold text-slate-800">{question.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((opt, optIndex) => (
                      <div 
                        key={optIndex}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border",
                          optIndex === question.correctAnswer 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : h.userAnswer === optIndex && !h.isCorrect 
                              ? "bg-red-50 border-red-200 text-red-700" 
                              : "bg-slate-50 border-slate-100 text-slate-400"
                        )}
                      >
                        {String.fromCharCode(65 + optIndex)}. {opt}
                      </div>
                    ))}
                  </div>
                  {!h.isCorrect && (
                    <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-500 border border-slate-100">
                       <span className="text-blue-600 uppercase tracking-widest mr-2">Giải thích:</span>
                       {question.explanation}
                    </div>
                  )}
                </div>
                {h.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                ) : (
                   <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          onClick={onReturn}
          className="px-8 py-4 w-full sm:w-auto bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Trang chủ
        </button>
        <button 
          onClick={() => {
            import('../services/exportService').then(({ exportSessionToWord }) => {
              exportSessionToWord(session);
            });
          }}
          className="px-8 py-4 w-full sm:w-auto bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-100 transition-all"
        >
          <Award className="w-5 h-5" />
          Xuất file Word đề thi
        </button>
        <button 
          onClick={onRestart}
          className="px-8 py-4 w-full sm:w-auto bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
        >
          <RefreshCcw className="w-5 h-5" />
          Làm đề mới
        </button>
      </div>
    </div>
  );
}
