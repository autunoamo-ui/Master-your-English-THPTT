export type Difficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export interface Question {
  id: string;
  topicId: string;
  content: string;
  type: 'multiple_choice';
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface Topic {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
}

export interface ExamSession {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  topicId?: string; // If it's a topic-specific test
  isFullExam: boolean;
  questions?: Question[];
  history: {
    questionId: string;
    userAnswer: number | null;
    isCorrect: boolean;
  }[];
}

export interface UserProgress {
  totalAttempts: number;
  averageScore: number;
  streakDays: number;
  weakTopics: string[];
  lastStudyDate: string;
}

export interface Material {
  name: string;
  type: 'text' | 'image' | 'pdf';
  content: string; // text or base64
  mimeType?: string;
}

export interface AppData {
  sessions: ExamSession[];
  progress: UserProgress;
}
