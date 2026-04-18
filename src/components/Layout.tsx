import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  PenTool, 
  BarChart3, 
  Settings, 
  GraduationCap,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Copy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'practice', label: 'Luyện tập', icon: BookOpen },
  { id: 'exam', label: 'Thi thử', icon: PenTool },
  { id: 'clone-exam', label: 'Tải đề mẫu', icon: Copy },
  { id: 'path', label: 'Lộ trình AI', icon: GraduationCap },
  { id: 'analysis', label: 'Thống kê', icon: BarChart3 },
];

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg-light text-text-dark font-sans antialiased">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 h-[72px]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-2xl tracking-tighter gradient-text">AI-EXAM PRO</span>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#ecfdf5] border border-[#d1fae5] rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs font-bold text-success">Gemini 3 Flash: Online</span>
           </div>
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
           >
             {isSidebarOpen ? <X /> : <Menu />}
           </button>
           <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)] overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-60 bg-bg-light border-r border-slate-200 lg:border-none transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 overflow-y-auto px-6 py-6",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm",
                  activeTab === item.id 
                    ? "bg-white text-primary shadow-sleek" 
                    : "text-text-muted hover:bg-slate-200/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.id === 'analysis' && (
                  <span className="ml-auto text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase tracking-tighter">GV</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-10">
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm",
                activeTab === 'settings' ? "bg-white text-primary shadow-sleek" : "text-text-muted hover:bg-slate-200/50"
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Cấu hình API</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-bg-light">
          <div className="p-6 lg:p-10">
            {children}
          </div>
          
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
