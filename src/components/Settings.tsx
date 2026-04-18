import { 
  Key, 
  Database, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SettingsProps {
  onReset: () => void;
}

export default function Settings({ onReset }: SettingsProps) {
  const isKeyConfigured = !!process.env.GEMINI_API_KEY;

  return (
    <div className="max-w-3xl space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold text-slate-900">Cấu hình Hệ thống</h1>
        <p className="text-slate-500 mt-2 font-medium">Quản lý API Key và dữ liệu ôn tập của bạn.</p>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {/* API Key Status */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
               <Key className="w-6 h-6 text-blue-500" />
             </div>
             <h3 className="text-xl font-bold">Gemini AI Token</h3>
           </div>
           
           <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-50 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  {isKeyConfigured ? (
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  )}
                  <span className="font-bold text-slate-700">
                     Trạng thái: {isKeyConfigured ? 'Đang hoạt động' : 'Chưa cấu hình'}
                  </span>
                </div>
                {isKeyConfigured && (
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    Vite Injected
                  </span>
                )}
              </div>

              {!isKeyConfigured && (
                <div className="p-6 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4">
                   <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                   <div className="space-y-2">
                     <p className="text-sm font-bold text-red-800 leading-relaxed">
                       Thiếu API Key cho Gemini AI. Bạn cần thêm key vào mục "Secrets" của AI Studio thì các tính năng thông minh mới có thể hoạt động.
                     </p>
                     <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-black text-red-600 uppercase tracking-widest hover:underline"
                    >
                      Lấy API Key tại đây <ExternalLink className="w-3 h-3" />
                    </a>
                   </div>
                </div>
              )}

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-sm font-medium leading-relaxed">
                Tốc độ phản hồi và độ chính xác của AI Tutor phụ thuộc vào loại Model bạn đang sử dụng. 
                Chúng tôi khuyên dùng <strong>Gemini 3 Flash</strong> để có trải nghiệm nhanh nhất.
              </div>
           </div>
        </div>

        {/* Data Management */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
               <Database className="w-6 h-6 text-orange-500" />
             </div>
             <h3 className="text-xl font-bold">Dữ liệu Local Storage</h3>
           </div>

           <div className="flex items-center justify-between p-6 rounded-2xl bg-orange-50/50 border border-orange-100">
              <div className="space-y-1">
                <span className="block font-bold text-slate-800">Xóa vĩnh viễn dữ liệu</span>
                <span className="block text-xs text-orange-600 font-medium">Hành động này sẽ xóa sạch lịch sử làm bài và lộ trình học tập.</span>
              </div>
              <button 
                onClick={() => {
                  if(confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
                    onReset();
                  }
                }}
                className="px-6 py-3 bg-white text-red-500 border border-red-200 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Dọn sạch
              </button>
           </div>
        </div>

        {/* Security Info */}
        <div className="flex items-center justify-center gap-2 text-slate-300 py-4">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dữ liệu của bạn được bảo mật tuyệt đối</span>
        </div>
      </div>
    </div>
  );
}
