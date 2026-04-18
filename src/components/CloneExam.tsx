import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, RefreshCcw, Copy, Download, BrainCircuit, Wand2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Material, Question, ExamSession } from '../types';
import { analyzeExamStructure, generateCloneExam } from '../services/gemini';
import { getFileContent } from './ExamGenerator'; // I need to export this or extract it. Wait, I'll redefine or adapt it.
import * as mammoth from 'mammoth';
import { exportSessionToWord } from '../services/exportService';

interface CloneExamProps {
  onStart: (topicId: string | null, material?: Material) => void;
}

export default function CloneExam({ onStart }: CloneExamProps) {
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  
  const [similarity, setSimilarity] = useState<'strict' | 'moderate' | 'loose'>('moderate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractFileContent = async (file: File): Promise<Material> => {
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { type: 'text', content: result.value, file };
    } else if (file.type === "application/pdf" || file.type.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ type: file.type.includes('pdf') ? 'pdf' : 'image', content: (reader.result as string).split(',')[1], file, mimeType: file.type });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      const text = await file.text();
      return { type: 'text', content: text, file };
    }
  };

  const { getRootProps: getSampleRootProps, getInputProps: getSampleInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    maxSize: 10485760,
    onDrop: (files) => { setSampleFile(files[0]); setError(null); }
  });

  const { getRootProps: getTargetRootProps, getInputProps: getTargetInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    maxSize: 10485760,
    onDrop: (files) => { setTargetFile(files[0]); setError(null); }
  });

  const handleGenerate = async () => {
    if (!sampleFile || !targetFile) {
      setError("Vui lòng tải lên ĐẦY ĐỦ cả Đề mẫu và Ngữ liệu đích.");
      return;
    }
    
    setIsProcessing(true);
    setGeneratedQuestions(null);
    setError(null);
    
    try {
      setStatusText('Bước 1: Trích xuất nội dung file...');
      const sampleMat = await extractFileContent(sampleFile);
      const targetMat = await extractFileContent(targetFile);

      setStatusText('Bước 2: AI đang phân tích cấu trúc Đề Mẫu...');
      const structure = await analyzeExamStructure(sampleMat);
      
      setStatusText('Bước 3: Đang lắp ghép ngữ liệu mới vào bộ khung...');
      const questions = await generateCloneExam(structure, targetMat, similarity);
      
      setGeneratedQuestions(questions);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra trong quá trình mô phỏng đề thi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportWord = () => {
    if (!generatedQuestions) return;
    const session: ExamSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      score: 0,
      totalQuestions: generatedQuestions.length,
      topicId: 'clone',
      questions: generatedQuestions,
      answers: generatedQuestions.map(() => 0)
    };
    exportSessionToWord(session);
  };

  const handleCopyClipboard = () => {
    if (!generatedQuestions) return;
    let text = "ĐỀ THI TIẾNG ANH\n\n";
    generatedQuestions.forEach((q, i) => {
      text += \`Câu \${i+1}: \${q.content}\n\`;
      q.options.forEach((opt, idx) => {
        text += \`\${String.fromCharCode(65 + idx)}. \${opt}\n\`;
      });
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    alert("Đã sao chép nội dung vào bộ nhớ tạm!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tạo đề phái sinh</h1>
        <p className="text-slate-500 font-medium">Sao chép cấu trúc từ một Đề mẫu và thay ruột bằng Ngữ liệu mới của bạn.</p>
      </div>

      {!generatedQuestions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Box 1: Sample Exam */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
               <FileText className="w-5 h-5 text-indigo-500" />
               1. Tải lên Đề Mẫu
            </h3>
            <div {...getSampleRootProps()} className={\`w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors \${sampleFile ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'}\`}>
              <input {...getSampleInputProps()} />
              {sampleFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-indigo-500" />
                  <p className="font-bold text-indigo-700">{sampleFile.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-600">Kéo thả file Đề Mẫu vào đây</p>
                  <p className="text-xs text-slate-400">Hỗ trợ: .docx, .pdf, .txt, hình ảnh (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md border border-slate-100">
             <Wand2 className="w-6 h-6 text-orange-500" />
          </div>

          {/* Box 2: Target Material */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
               <BrainCircuit className="w-5 h-5 text-emerald-500" />
               2. Tải lên Ngữ Liệu Mới
            </h3>
            <div {...getTargetRootProps()} className={\`w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors \${targetFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-400'}\`}>
              <input {...getTargetInputProps()} />
              {targetFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <p className="font-bold text-emerald-700">{targetFile.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-600">Kéo thả file Ngữ liệu vào đây</p>
                  <p className="text-xs text-slate-400">File chứa từ vựng, ngữ pháp, báo chí...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!generatedQuestions && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div>
            <h3 className="text-md font-bold text-slate-700 mb-3">Mức độ mô phỏng:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { id: 'strict', label: 'Rất sát mẫu', desc: 'Giữ nguyên 100% cấu trúc, tỷ lệ câu' },
                 { id: 'moderate', label: 'Vừa phải', desc: 'Có linh hoạt đổi tỉ lệ form' },
                 { id: 'loose', label: 'Chỉ giữ khung', desc: 'Tự do sáng tạo theo độ khó' }
               ].map(opt => (
                 <div 
                   key={opt.id} 
                   onClick={() => setSimilarity(opt.id as any)}
                   className={\`p-4 rounded-2xl border-2 cursor-pointer transition-all \${similarity === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}\`}
                 >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={\`w-4 h-4 rounded-full border-2 \${similarity === opt.id ? 'border-indigo-500 border-4' : 'border-slate-300'}\`} />
                      <span className={\`font-bold \${similarity === opt.id ? 'text-indigo-700' : 'text-slate-600'}\`}>{opt.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-6">{opt.desc}</p>
                 </div>
               ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 font-medium rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <RefreshCcw className="w-5 h-5 animate-spin" />
                <span>{statusText}</span>
              </div>
            ) : (
              <>
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Tạo đề phái sinh ngay
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Result UI */}
      {generatedQuestions && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                 <CheckCircle className="w-6 h-6 text-emerald-600" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-800">Khởi tạo xong!</h2>
                  <p className="text-sm font-medium text-slate-500">{generatedQuestions.length} câu hỏi phái sinh đã được tạo.</p>
               </div>
             </div>
             
             <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={handleCopyClipboard}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
               >
                 <Copy className="w-4 h-4" /> Sao chép
               </button>
               <button 
                 onClick={handleExportWord}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
               >
                 <Download className="w-4 h-4" /> Xuất Word
               </button>
               <button 
                 onClick={() => { setGeneratedQuestions(null); setSampleFile(null); setTargetFile(null); }}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
               >
                 Làm lại
               </button>
             </div>
           </div>

           <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 space-y-12">
             {generatedQuestions.map((q, idx) => (
               <div key={q.id} className="space-y-3">
                 <div className="flex gap-3 items-start">
                   <div className="w-8 h-8 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-500">
                     {idx + 1}
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 pt-1 leading-relaxed">
                     {q.content}
                   </h3>
                 </div>
                 
                 <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className={\`p-3 rounded-xl border-2 \${q.correctAnswer === optIdx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}\`}>
                        <span className={\`font-black mr-2 \${q.correctAnswer === optIdx ? 'text-emerald-600' : 'text-slate-400'}\`}>
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className={\`font-medium \${q.correctAnswer === optIdx ? 'text-emerald-800' : 'text-slate-600'}\`}>
                          {opt}
                        </span>
                      </div>
                    ))}
                 </div>

                 <div className="pl-11 mt-2">
                   <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-medium text-indigo-900">
                     <span className="font-bold mr-2 uppercase tracking-wide text-indigo-700 shadow-sm bg-white px-2 py-0.5 rounded-md">AI Giải thích</span>
                     {q.explanation}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
