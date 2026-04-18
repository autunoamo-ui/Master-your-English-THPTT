import { Topic, Question } from './types';

export const TOPICS: Topic[] = [
  { id: 't1', name: 'Ngữ pháp cơ bản', icon: 'BookOpen', questionCount: 150 },
  { id: 't2', name: 'Từ vựng (Vocabulary)', icon: 'Type', questionCount: 200 },
  { id: 't3', name: 'Đọc hiểu (Reading)', icon: 'FileText', questionCount: 100 },
  { id: 't4', name: 'Phát âm & Trọng âm', icon: 'Volume2', questionCount: 80 },
  { id: 't5', name: 'Tìm lỗi sai', icon: 'AlertCircle', questionCount: 70 },
  { id: 't6', name: 'Viết lại câu', icon: 'Pencil', questionCount: 90 },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    topicId: 't1',
    content: 'If I ______ enough money, I would buy a new car.',
    type: 'multiple_choice',
    options: ['had', 'have', 'have had', 'will have'],
    correctAnswer: 0,
    explanation: 'Câu điều kiện loại 2 (diễn tả hành động không có thật ở hiện tại): If + S + V2/ed, S + would + V1.',
    difficulty: 'Nhận biết',
  },
  {
    id: 'q2',
    topicId: 't2',
    content: 'She was ______ when she heard the news of her success.',
    type: 'multiple_choice',
    options: ['over the moon', 'under the weather', 'down in the dumps', 'on the fence'],
    correctAnswer: 0,
    explanation: '"Over the moon" là thành ngữ có nghĩa là rất hạnh phúc.',
    difficulty: 'Thông hiểu',
  },
  {
    id: 'q3',
    topicId: 't4',
    content: 'Choose the word that has the main stress placed differently from the others.',
    type: 'multiple_choice',
    options: ['abandon', 'recognize', 'concentrate', 'specialize'],
    correctAnswer: 0,
    explanation: 'A. abandon /əˈbændən/ (nhấn âm 2). B. recognize /ˈrekəɡnaɪz/ (nhấn âm 1). C. concentrate /ˈkɒnsntreɪt/ (nhấn âm 1). D. specialize /ˈspeʃəlaɪz/ (nhấn âm 1).',
    difficulty: 'Thông hiểu',
  },
  {
    id: 'q4',
    topicId: 't5',
    content: 'Identify the error: (A) The number of (B) students (C) are (D) increasing significantly.',
    type: 'multiple_choice',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 2,
    explanation: 'Cấu trúc "The number of + N(plural)" đi với động từ số ít. Sửa "are" -> "is".',
    difficulty: 'Vận dụng',
  },
  {
    id: 'q5',
    topicId: 't3',
    content: 'Which of the following would be the best title for the passage?',
    type: 'multiple_choice',
    options: ['The Benefits of AI', 'The Risks of Technology', 'A Future with AI', 'Education in the Digital Age'],
    correctAnswer: 2,
    explanation: 'Đoạn văn nhấn mạnh về sự kết hợp giữa con người và AI trong tương lai.',
    difficulty: 'Vận dụng cao',
  }
];

export const EXAM_MATRIX = {
  total: 50,
  time: 60, // minutes
  distribution: {
    t4: 4, // Pronunciation
    t1: 15, // Grammar
    t2: 15, // Vocabulary
    t5: 3, // Error ID
    t6: 5, // Sentence rewrite
    t3: 8, // Reading
  }
};
