import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExamGenerator from './components/ExamGenerator';
import Quiz from './components/Quiz';
import Result from './components/Result';
import StudyPath from './components/StudyPath';
import Settings from './components/Settings';
import Analysis from './components/Analysis';
import CloneExam from './components/CloneExam';
import { useStorage } from './hooks/useStorage';
import { ExamSession, Material } from './types';
import { AnimatePresence, motion } from 'motion/react';

type ViewState = 'dashboard' | 'practice' | 'exam' | 'clone-exam' | 'quiz' | 'result' | 'path' | 'analysis' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [customMaterial, setCustomMaterial] = useState<Material | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const { data, addSession, resetData } = useStorage();

  const handleStartExam = (topicId: string | null, material?: Material) => {
    setSelectedTopicId(topicId);
    if (material) {
      setCustomMaterial(material);
    } else {
      setCustomMaterial(null);
    }
    setActiveTab('quiz');
  };

  const handleQuizComplete = (session: ExamSession) => {
    addSession(session);
    setActiveSession(session);
    setActiveTab('result');
  };

  const handleCancelQuiz = () => {
    setActiveTab('exam');
    setCustomMaterial(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} onStartPractice={() => setActiveTab('exam')} />;
      case 'practice':
      case 'exam':
        return <ExamGenerator onStart={handleStartExam} />;
      case 'clone-exam':
        return <CloneExam onStart={handleStartExam} />;
      case 'quiz':
        return <Quiz 
          topicId={selectedTopicId} 
          customMaterial={customMaterial} 
          onComplete={handleQuizComplete} 
          onCancel={handleCancelQuiz} 
        />;
      case 'result':
        return activeSession ? (
          <Result 
            session={activeSession} 
            onRestart={() => handleStartExam(selectedTopicId)}
            onReturn={() => setActiveTab('dashboard')}
          />
        ) : <Dashboard data={data} onStartPractice={() => setActiveTab('exam')} />;
      case 'path':
        return <StudyPath data={data} />;
      case 'settings':
        return <Settings onReset={resetData} />;
      case 'analysis':
        return <Analysis data={data} />;
      default:
        return <Dashboard data={data} onStartPractice={() => setActiveTab('exam')} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as ViewState)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
