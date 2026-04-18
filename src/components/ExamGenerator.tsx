import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  BookOpen, 
  Clock, 
  Layers, 
  ChevronRight,
  ShieldCheck,
  Star,
  Upload,
  FileText,
  FileJson,
  CheckCircle2,
  RefreshCw,
  FileCode,
  FileDown,
  Image as ImageIcon,
  FileDigit
} from 'lucide-react';
import { TOPICS, EXAM_MATRIX } from '../constants';
import { cn } from '../lib/utils';
import { Material } from '../types';
import mammoth from 'mammoth';

interface ExamGeneratorProps {
  onStart: (topicId: string | null, material?: Material) => void;
}

export default function ExamGenerator({ onStart }: ExamGeneratorProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [uploadedMaterial, setUploadedMaterial] = useState<Material | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = file.name;
    const fileType = file.type;

    try {
      if (fileType === 'application/json' || fileType === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setUploadedMaterial({ name: fileName, content, type: 'text' });
          setIsUploading(false);
        };
        reader.readAsText(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Word .docx
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          setUploadedMaterial({ name: fileName, content: result.value, type: 'text' });
          setIsUploading(false);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType === 'application/pdf' || fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setUploadedMaterial({ 
            name: fileName, 
            content: base64, 
            type: fileType === 'application/pdf' ? 'pdf' : 'image',
            mimeType: fileType 
          });
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Định dạng file chưa được hỗ trợ. Vui lòng chọn .txt, .json, .docx, .pdf hoặc ảnh.");
        setIsUploading(false);
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Có lỗi xảy ra khi xử lý file.");
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson className="w-5 h-5 text-emerald-500" />;
    if (fileName.endsWith('.docx')) return <FileDown className="w-5 h-5 text-blue-500" />;
    if (fileName.endsWith('.pdf')) return <FileDigit className="w-5 h-5 text-red-500" />;
    if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <section>
        <h1 className="text-2xl font-extrabold text-text-dark">Biên soạn đề thi chuẩn Bộ GD&ĐT</h1>
        <p className="text-text-muted mt-1 font-medium italic">Cấu trúc 50 câu / 60 phút</p>
      </section>

      <div className="bg-white p-10 rounded-2xl shadow-sleek border border-slate-100">
        <h3 className="text-lg font-bold text-text-dark mb-6">Chọn ma trận đề thi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setSelectedTopic('all')}
            className={cn(
              "p-6 rounded-xl border flex flex-col text-left transition-all",
              selectedTopic === 'all' 
                ? "border-primary bg-blue-50/50" 
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <span className="font-bold text-text-dark mb-1">Ôn tập Cơ bản</span>
            <span className="text-xs text-text-muted">70% Nhận biết - Thông hiểu</span>
          </button>
          
          <button 
            onClick={() => setSelectedTopic('hard')}
            className={cn(
              "p-6 rounded-xl border flex flex-col text-left transition-all",
              selectedTopic === 'hard' 
                ? "border-primary bg-blue-50/50" 
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <span className="font-bold text-text-dark mb-1">Luyện Đề Nâng Cao</span>
            <span className="text-xs text-text-muted">40% Vận dụng cao</span>
          </button>

          {TOPICS.slice(0, 2).map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={cn(
                "p-6 rounded-xl border flex flex-col text-left transition-all",
                selectedTopic === topic.id 
                  ? "border-primary bg-blue-50/50" 
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <span className="font-bold text-text-dark mb-1">Trọng tâm {topic.name}</span>
              <span className="text-xs text-text-muted">Tập trung chuyên sâu về {topic.name}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => onStart(selectedTopic)}
          className="w-full mt-8 py-5 gradient-bg text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-3"
        >
          🚀 Bắt đầu tạo đề thi thông minh
        </button>
      </div>

      {/* Upload & Featured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sleek border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <Upload className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-text-dark">Tải ngữ liệu nguồn</h3>
          </div>
          
          {!uploadedMaterial ? (
            <label className="flex flex-col items-center justify-center w-full min-h-32 p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all group">
               <div className="flex gap-2 mb-2">
                 <FileText className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                 <FileDown className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                 <FileDigit className="w-5 h-5 text-slate-300 group-hover:text-red-500 transition-colors" />
                 <ImageIcon className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
               </div>
               <span className="text-[10px] font-bold text-slate-400 group-hover:text-text-dark uppercase tracking-widest transition-colors text-center">
                {isUploading ? 'Đang xử lý...' : 'Chọn file .txt, .json, .docx, .pdf, ảnh'}
               </span>
               <input type="file" className="hidden" accept=".txt,.json,.docx,.pdf,image/*" onChange={handleFileUpload} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {getFileIcon(uploadedMaterial.name)}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-text-dark truncate max-w-[150px]">{uploadedMaterial.name}</span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Sẵn sàng phân tích</span>
                  </div>
                </div>
                <button 
                  onClick={() => setUploadedMaterial(null)}
                  className="p-1.5 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <button 
                onClick={() => onStart('custom', uploadedMaterial)}
                className="w-full py-3 bg-text-dark text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3 h-3 fill-current" />
                Tạo đề từ ngữ liệu này
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#fef3c7] p-8 rounded-2xl flex flex-col justify-center border border-[#fde68a]">
           <div className="flex items-center gap-4 mb-4">
             <Star className="w-6 h-6 text-[#92400e] fill-[#92400e]" />
             <h4 className="font-bold text-[#92400e]">Bứt phá 9+ cùng chuyên gia</h4>
           </div>
           <p className="text-[#92400e]/80 text-xs font-medium mb-6">Gói câu hỏi vận dụng cao được biên soạn bởi đội ngũ giáo viên.</p>
           <button className="py-3.5 bg-white text-[#92400e] rounded-xl text-sm font-black shadow-sm border border-[#fde68a] hover:bg-orange-50 transition-all">
              Mở khóa VIP ngay
           </button>
        </div>
      </div>
    </div>
  );
}
