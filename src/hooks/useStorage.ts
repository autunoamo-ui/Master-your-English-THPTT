import { useState, useEffect } from 'react';
import { AppData, ExamSession, UserProgress } from '../types';

const STORAGE_KEY = 'smart_english_app_data_v1';

const INITIAL_DATA: AppData = {
  sessions: [],
  progress: {
    totalAttempts: 0,
    averageScore: 0,
    streakDays: 0,
    weakTopics: [],
    lastStudyDate: new Date().toISOString(),
  },
};

export function useStorage() {
  const [data, setData] = useState<AppData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addSession = (session: ExamSession) => {
    setData((prev) => {
      const newSessions = [...prev.sessions, session];
      const totalScore = newSessions.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 10, 0);
      const avg = totalScore / newSessions.length;
      
      // Basic weakness analysis
      // weak topics analysis
      const topicStats: Record<string, { correct: number; total: number; name?: string }> = {};
      newSessions.forEach(s => {
        s.history.forEach(h => {
          // get question details directly from session if custom, else from MOCK
          // We need imports to get constants if needed. BUT instead of importing TOPICS/MOCK_QUESTIONS here and creating circular dependencies or large bundle, 
          // let's just make it simpler based on just history
          // In this context, we don't have MOCK_QUESTIONS imported. Let's just track from session.questions if we can.
          // Since we exported it from constants, maybe we just do a simpler string approach or just import them.
          const question = s.questions?.find(q => q.id === h.questionId);
          const topicId = question?.topicId || s.topicId || 'Unknown Topic';
          
          if (!topicStats[topicId]) {
            topicStats[topicId] = { correct: 0, total: 0 };
          }
          topicStats[topicId].total += 1;
          if (h.isCorrect) topicStats[topicId].correct += 1;
        });
      });
      
      const weakTopics = Object.keys(topicStats)
        .filter(tid => topicStats[tid].total > 0 && (topicStats[tid].correct / topicStats[tid].total) <= 0.6)
        .map(tid => tid === 't1' ? 'Ngữ pháp cơ bản' : tid === 't2' ? 'Từ vựng (Vocabulary)' : tid === 't3' ? 'Đọc hiểu' : tid === 'Unknown Topic' ? 'General' : tid);
      
      // If none found but there's history, pick the lowest accuracy ones (up to 3)
      if (weakTopics.length === 0 && Object.keys(topicStats).length > 0) {
        Object.keys(topicStats)
          .sort((a, b) => (topicStats[a].correct / topicStats[a].total) - (topicStats[b].correct / topicStats[b].total))
          .slice(0, 3)
          .forEach(tid => {
            const name = tid === 't1' ? 'Ngữ pháp cơ bản' : tid === 't2' ? 'Từ vựng (Vocabulary)' : tid === 't3' ? 'Đọc hiểu' : tid;
            if (!weakTopics.includes(name)) weakTopics.push(name);
          });
      }

      return {
        ...prev,
        sessions: newSessions,
        progress: {
          ...prev.progress,
          totalAttempts: newSessions.length,
          averageScore: parseFloat(avg.toFixed(1)),
          lastStudyDate: new Date().toISOString(),
          weakTopics: weakTopics,
          // Streak logic could be added here
        },
      };
    });
  };

  const updateProgress = (progress: Partial<UserProgress>) => {
    setData(prev => ({
      ...prev,
      progress: { ...prev.progress, ...progress }
    }));
  };

  const resetData = () => setData(INITIAL_DATA);

  return { data, addSession, updateProgress, resetData };
}
