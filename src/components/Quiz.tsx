import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Flag,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Brain
} from 'lucide-react';
import { Question, ExamSession, Material } from '../types';
import { MOCK_QUESTIONS, TOPICS } from '../constants';
import { cn, formatTime } from '../lib/utils';
import { explainQuestion, generateExamFromMaterial, chatWithTutor } from '../services/gemini';
import { playSound } from '../lib/audio';
import Markdown from 'react-markdown';

interface QuizProps {
  topicId: string | null;
  customMaterial?: Material | null;
  onComplete: (session: ExamSession) => void;
  onCancel: () => void;
}

export default function Quiz({ topicId, customMaterial, onComplete, onCancel }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{role: 'ai'|'user', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Gamification state
  const [combo, setCombo] = useState(0);
  const [showComboAnim, setShowComboAnim] = useState(false);

  useEffect(() => {
    const initQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        if (customMaterial) {
          const generatedQuestions = await generateExamFromMaterial(customMaterial);
          setQuestions(generatedQuestions);
          setAnswers(new Array(generatedQuestions.length).fill(null));
        } else {
          // Normal flow
          await new Promise(resolve => setTimeout(resolve, 1000));
          let qList = [...MOCK_QUESTIONS];
          if (topicId && topicId !== 'all' && topicId !== 'hard') {
            qList = qList.filter(q => q.topicId === topicId);
          }
          // Pad to at least 5 for demo purpose
          while (qList.length < 5) {
            qList.push(...MOCK_QUESTIONS.map(q => ({ ...q, id: q.id + Math.random().toString() })));
          }
          setQuestions(qList);
          setAnswers(new Array(qList.length).fill(null));
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Không thể khởi tạo đề thi.");
      } finally {
        setLoading(false);
      }
    };

    initQuiz();
  }, [topicId, customMaterial]);

  useEffect(() => {
    if (isFinished || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isFinished, timeLeft]);

  const handleAnswer = (optionIndex: number) => {
    if (isFinished) return;
    const newAnswers = [...answers];
    const isChangingAnswer = newAnswers[currentIndex] !== null;
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    // Gamification Logic
    if (currentQuestion && !isChangingAnswer) {
      if (optionIndex === currentQuestion.correctAnswer) {
        playSound('correct');
        setCombo(prev => {
          const next = prev + 1;
          if (next >= 3) {
            playSound('combo');
            setShowComboAnim(true);
            setTimeout(() => setShowComboAnim(false), 2000);
          }
          return next;
        });
      } else {
        playSound('wrong');
        setCombo(0);
      }
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    setIsFinished(true);
    let correct = 0;
    const history = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        userAnswer: answers[i],
        isCorrect
      };
    });

    onComplete({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      score: (correct / questions.length) * 10,
      totalQuestions: questions.length,
      correctAnswers: correct,
      timeSpent: 3600 - timeLeft,
      topicId: topicId || undefined,
      isFullExam: !topicId || topicId === 'all',
      questions,
      history
    });
  };

  const handleExplain = async () => {
    if (!currentQuestion) return;
    setExplaining(true);
    setShowExplanation(true);
    
    // Check if we already have history for this question by checking the chat context (simple approach: clear history on new question)
    // Actually, we should probably reset chat history when switching questions.
    // We'll reset it every time they click "Giải thích" for the FIRST time on a question.
    setChatHistory([]);
    
    const explanation = await explainQuestion(currentQuestion, answers[currentIndex]);
    setChatHistory([{ role: 'ai', content: explanation }]);
    setExplaining(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentQuestion || explaining) return;
    
    const newMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: newMessage }]);
    setExplaining(true);
    
    const reply = await chatWithTutor(currentQuestion, chatHistory, newMessage);
    setChatHistory(prev => [...prev, { role: 'ai', content: reply }]);
    setExplaining(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-primary rounded-full animate-spin" />
        <p className="font-bold text-slate-400">
          {customMaterial 
            ? "Gemini đang phân tích ngữ liệu và biên soạn câu hỏi..." 
            : "Đang khởi tạo bộ đề theo chuẩn ma trận..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rất tiếc, đã có lỗi xảy ra</h2>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">{error}</p>
        </div>
        <button 
          onClick={onCancel}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 md:top-10 bg-slate-50/90 backdrop-blur-md py-4 z-20">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Clock className={cn("w-4 h-4", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-blue-500")} />
            <span className={cn("font-mono font-bold text-lg", timeLeft < 300 ? "text-red-600" : "text-slate-700")}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
          >
            Nộp bài
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Quiz Area */}
        <div className="lg:col-span-3 space-y-8 relative">
            {/* Combo Animation Modal/Toast */}
            <AnimatePresence>
              {showComboAnim && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center drop-shadow-2xl"
                >
                  <span className="text-6xl text-orange-500">🔥</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase italic tracking-widest mt-2">{combo} COMBO!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-wider">
                  Question {currentIndex + 1}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-lg",
                  currentQuestion.difficulty === 'Nhận biết' && "bg-slate-100 text-slate-500",
                  currentQuestion.difficulty === 'Thông hiểu' && "bg-blue-50 text-blue-500",
                  currentQuestion.difficulty === 'Vận dụng' && "bg-orange-50 text-orange-500",
                  currentQuestion.difficulty === 'Vận dụng cao' && "bg-red-50 text-red-500",
                )}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-10">
                {currentQuestion.content}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all relative group",
                      answers[currentIndex] === i 
                        ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10" 
                        : "border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all",
                      answers[currentIndex] === i ? "bg-blue-500 text-white" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="font-bold text-slate-700 flex-1">{option}</span>
                    {answers[currentIndex] === i && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 absolute right-6" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 font-black text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                Câu trước
              </button>
              
              <button 
                onClick={handleExplain}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all"
              >
                <Brain className="w-4 h-4" />
                AI Giải thích câu này
              </button>

              <button 
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 font-black text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all group"
              >
                Câu tiếp theo
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm sticky top-28">
               <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-blue-500" />
                 Bảng câu hỏi
               </h3>
               <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-4 gap-2">
                 {questions.map((_, i) => (
                   <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "aspect-square rounded-xl text-sm font-black transition-all flex items-center justify-center",
                      currentIndex === i 
                        ? "bg-slate-900 text-white shadow-lg" 
                        : answers[i] !== null ? "bg-blue-100 text-blue-700 font-bold" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    )}
                   >
                     {i + 1}
                   </button>
                 ))}
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Đã làm</span>
                    <span>{answers.filter(a => a !== null).length}/{questions.length}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      className="bg-blue-500 h-full rounded-full"
                      animate={{ width: `${(answers.filter(a => a !== null).length / questions.length) * 100}%` }}
                    />
                  </div>
                  
                  {combo > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-orange-500 bg-orange-50 rounded-xl py-2 animate-pulse border border-orange-100">
                      <span>🔥 Đang chuỗi đúng: {combo}</span>
                    </div>
                  )}
               </div>
            </div>
        </div>
      </div>

      {/* AI Explanation Drawer/Modal */}
      <AnimatePresence>
        {showExplanation && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExplanation(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 bg-white z-[70] rounded-t-[3rem] p-8 md:p-12 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Brain className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">AI Tutor Giải mã</h2>
                  </div>
                  <button onClick={() => setShowExplanation(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <XCircle className="w-6 h-6 text-slate-400 hover:text-slate-600 transition-colors" />
                  </button>
                </div>

                {explaining && chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                     <div className="w-10 h-10 border-3 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                     <p className="font-bold text-slate-400">Đang phân tích cấu trúc bài và từ vựng...</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-[50vh] md:h-[40vh]">
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] md:max-w-[75%] rounded-2xl p-5 shadow-sm",
                            msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-700 border border-slate-100"
                          )}>
                            <div className={cn("pro-markdown font-medium text-sm leading-relaxed", msg.role === 'user' && "prose-invert")}>
                              <Markdown>{msg.content}</Markdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {explaining && chatHistory.length > 0 && (
                        <div className="flex w-full justify-start">
                           <div className="max-w-[85%] rounded-2xl p-5 bg-slate-50 border border-slate-100 shadow-sm">
                             <div className="flex items-center gap-3 text-indigo-500 font-bold text-sm tracking-wide">
                               <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                               Gia sư đang trả lời...
                             </div>
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex gap-3 mt-auto">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Hỏi AI tại sao đán án này sai..."
                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors font-medium text-slate-700 shadow-inner"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={explaining || !chatInput.trim()}
                        className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        Gửi câu hỏi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
