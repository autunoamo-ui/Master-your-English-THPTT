import { GoogleGenAI, Type } from "@google/genai";
import { Material, Question } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Hàm gọi API Gemini với tính năng tự động chuyển đổi Model (Fallback mechanism)
 * theo thứ tự ưu tiên: 
 * 1. gemini-3-pro-preview (Mặc định)
 * 2. gemini-3-flash-preview
 * 3. gemini-2.5-flash
 */
async function generateContentWithFallback(ai: GoogleGenAI, requestConfig: any) {
  const models = [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash"
  ];
  
  let lastError;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...requestConfig,
        model: model
      });
      return response;
    } catch (error) {
      console.warn(`[Fallback Warning] Model ${model} gặp lỗi/quá tải, đang chuyển sang model tiếp theo...`);
      console.error(error);
      lastError = error;
    }
  }
  
  throw lastError;
}

export async function generateExamFromMaterial(material: Material): Promise<Question[]> {
  if (!API_KEY) throw new Error("Vui lòng cấu hình GEMINI_API_KEY.");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  let parts: any[] = [];
  
  if (material.type === 'text') {
    parts.push({ text: `Dựa trên ngữ liệu sau, hãy tạo bộ đề thi Tiếng Anh 12 (5 câu mẫu) với định dạng JSON: \n\n${material.content}` });
  } else {
    parts.push({ text: "Dựa trên tài liệu đính kèm (PDF hoặc ảnh), hãy trích xuất các kiến thức trọng tâm và tạo bộ đề thi Tiếng Anh 12 (5 câu mẫu) với định dạng JSON." });
    parts.push({ 
      inlineData: { 
        data: material.content, 
        mimeType: material.mimeType || (material.type === 'pdf' ? 'application/pdf' : 'image/jpeg') 
      } 
    });
  }

  const response = await generateContentWithFallback(ai, {
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            content: { type: Type.STRING },
            options: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            difficulty: { 
              type: Type.STRING,
              enum: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']
            }
          },
          required: ['id', 'content', 'options', 'correctAnswer', 'explanation', 'difficulty']
        }
      }
    }
  });

  try {
    let rawText = response.text;
    // Clean up possible markdown code blocks around JSON
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/```(json)?/g, '').trim();
    }
    
    let questions = JSON.parse(rawText);
    
    if (!Array.isArray(questions)) {
      if (questions && questions.questions && Array.isArray(questions.questions)) {
        questions = questions.questions;
      } else {
        throw new Error("AI không trả về mảng danh sách câu hỏi hợp lệ");
      }
    }

    return questions.map((q: any, index: number) => {
      // Safe correct answer parsing
      let cAns = q.correctAnswer;
      if (typeof cAns === 'string') {
        const char = cAns.toUpperCase().trim();
        if (char === 'A') cAns = 0;
        else if (char === 'B') cAns = 1;
        else if (char === 'C') cAns = 2;
        else if (char === 'D') cAns = 3;
        else cAns = parseInt(cAns, 10);
      }
      if (isNaN(cAns) || cAns < 0 || !q.options || cAns >= q.options.length) {
        cAns = 0;
      }
      
      return {
        ...q,
        id: (q.id ? String(q.id) : '') + `_ai_${Math.random().toString(36).substring(2, 9)}_${index}`,
        topicId: 'custom',
        type: 'multiple_choice',
        correctAnswer: cAns
      };
    });
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("AI trả về định dạng không hợp lệ.");
  }
}

export async function explainQuestion(question: any, userAnswer: number | null) {
  if (!API_KEY) return "Vui lòng cấu hình GEMINI_API_KEY để sử dụng tính năng này.";

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    Bạn là một chuyên gia luyện thi Tiếng Anh THPT. 
    Hãy giải thích chi tiết câu hỏi sau:
    Câu hỏi: ${question.content}
    Các lựa chọn: ${question.options.join(', ')}
    Đáp án đúng: ${question.options[question.correctAnswer]}
    Người dùng chọn: ${userAnswer !== null ? question.options[userAnswer] : 'Không chọn'}
    
    Yêu cầu:
    1. Phân tích ngữ pháp/từ vựng liên quan.
    2. Giải thích tại sao đáp án đúng lại là lựa chọn đó.
    3. Tại sao các đáp án khác lại sai.
    4. Cung cấp một ví dụ tương tự.
    Hãy trả về định dạng Markdown.
  `;

  try {
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
    });
    return response.text || "Không thể nhận phản hồi từ AI.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Có lỗi xảy ra khi kết nối với AI.";
  }
}

export async function getStudyPath(sessions: any[], weakTopics: string[]) {
  if (!API_KEY) return "Vui lòng cấu hình GEMINI_API_KEY để sử dụng tính năng này.";

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const historyStr = JSON.stringify(sessions.slice(-5));
  const prompt = `
    Dựa trên lịch sử làm bài của học sinh (5 bài gần nhất): ${historyStr}
    Các chủ đề yếu: ${weakTopics.join(', ')}
    
    Hãy thiết lập một lộ trình ôn luyện cá nhân hóa cho học sinh ôn thi Tiếng Anh THPT.
    Bao gồm:
    1. Phân tích điểm mạnh/điểm yếu hiện tại.
    2. Các chủ đề cần tập trung ngay lập tức.
    3. Gợi ý phương pháp học cho từng chủ đề yếu.
    4. Dự đoán điểm số kỳ thi THPT dựa trên phong độ hiện tại.
    Hãy trả về định dạng Markdown, trình bày đẹp mắt, khuyến khích học sinh.
  `;

  try {
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
    });
    return response.text || "Không thể nhận phản hồi từ AI.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Có lỗi xảy ra khi kết nối với AI.";
  }
}

export async function chatWithTutor(question: any, history: {role: string, content: string}[], message: string) {
  if (!API_KEY) return "Vui lòng cấu hình GEMINI_API_KEY để sử dụng tính năng này.";

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const chatContext = history.map(h => `${h.role === 'ai' ? 'Gia sư' : 'Học trò'}: ${h.content}`).join('\n\n');
  const prompt = `
    Bạn là một gia sư Tiếng Anh nhiệt tình và dễ thương. 
    Chúng ta đang thảo luận về câu hỏi: "${question.content}"
    Các lựa chọn: ${question.options.join(', ')}
    Đáp án đúng: ${question.options[question.correctAnswer]}
    
    Lịch sử trò chuyện:
    ${chatContext}
    
    Học trò hỏi: ${message}
    
    Hãy trả lời ngắn gọn, tập trung vào thắc mắc của học sinh bằng tiếng Việt dễ hiểu. Dùng định dạng Markdown.
  `;

  try {
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
    });
    return response.text || "Không thể nhận phản hồi từ AI.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Lỗi kết nối với Gia sư AI.";
  }
}

export async function analyzeExamStructure(material: Material): Promise<any> {
  if (!API_KEY) throw new Error("Vui lòng cấu hình GEMINI_API_KEY.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  let parts: any[] = [];
  if (material.type === 'text') {
    parts.push({ text: `Hãy phân tích đề thi mẫu sau và trả về thông tin cấu trúc dạng JSON: \n\n${material.content}` });
  } else {
    parts.push({ text: "Hãy phân tích đề thi mẫu trong file đính kèm và trả về thông tin cấu trúc dạng JSON." });
    parts.push({ 
      inlineData: { 
        data: material.content, 
        mimeType: material.mimeType || (material.type === 'pdf' ? 'application/pdf' : 'image/jpeg') 
      } 
    });
  }

  const response = await generateContentWithFallback(ai, {
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalQuestions: { type: Type.INTEGER },
          difficulty: { type: Type.STRING },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          questionTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          blueprint: { type: Type.STRING, description: "Tóm tắt cấu trúc ma trận đề" }
        },
        required: ['totalQuestions', 'difficulty', 'topics', 'questionTypes', 'blueprint']
      }
    }
  });

  try {
    let rawText = response.text;
    if (rawText.startsWith('```')) rawText = rawText.replace(/```(json)?/g, '').trim();
    return JSON.parse(rawText);
  } catch (e) {
    throw new Error("Không thể phân tích cấu trúc đề mẫu.");
  }
}

export async function generateCloneExam(structure: any, targetMaterial: Material, similarity: 'strict' | 'moderate' | 'loose'): Promise<Question[]> {
  if (!API_KEY) throw new Error("Vui lòng cấu hình GEMINI_API_KEY.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  let similarityPrompt = "";
  if (similarity === 'strict') {
    similarityPrompt = "GIỮ CHÍNH XÁC cấu trúc, số lượng câu, dạng câu hỏi, và vị trí của từng loại câu hỏi như đề mẫu. CHỈ THAY ĐỔI nội dung từ vựng và ngữ liệu.";
  } else if (similarity === 'moderate') {
    similarityPrompt = "Giữ form tương đối giống đề mẫu, có thể linh hoạt thay đổi tỷ lệ câu hỏi đôi chút cho phù hợp với ngữ liệu đích.";
  } else {
    similarityPrompt = "Chỉ dùng chuẩn độ khó và các chủ đề chính của đề mẫu làm cảm hứng. Tạo đề mới dựa chủ yếu vào ngữ liệu đích.";
  }

  let parts: any[] = [];
  const systemPrompt = `Bạn là một giáo viên chuyên tạo đề thi. Hãy tạo một bộ đề thi mới dựa vào ngữ liệu đích dưới đây.
  
  CẤU TRÚC ĐỀ MẪU CẦN MÔ PHỎNG:
  - Tổng số câu: ${structure.totalQuestions}
  - Độ khó: ${structure.difficulty}
  - Dạng bài: ${structure.questionTypes.join(', ')}
  - Ma trận (Blueprint): ${structure.blueprint}
  
  YÊU CẦU MÔ PHỎNG: ${similarityPrompt}
  
  Ngữ liệu đích để tạo nội dung sẽ được đính kèm ở dưới. Hãy trả về JSON chuẩn của một mảng các câu hỏi.
  `;

  if (targetMaterial.type === 'text') {
    parts.push({ text: `${systemPrompt}\n\nNGỮ LIỆU ĐÍCH: \n${targetMaterial.content}` });
  } else {
    parts.push({ text: systemPrompt });
    parts.push({ 
      inlineData: { 
        data: targetMaterial.content, 
        mimeType: targetMaterial.mimeType || (targetMaterial.type === 'pdf' ? 'application/pdf' : 'image/jpeg') 
      } 
    });
  }

  const response = await generateContentWithFallback(ai, {
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            content: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] }
          },
          required: ['id', 'content', 'options', 'correctAnswer', 'explanation', 'difficulty']
        }
      }
    }
  });

  try {
    let rawText = response.text;
    if (rawText.startsWith('```')) rawText = rawText.replace(/```(json)?/g, '').trim();
    let questions = JSON.parse(rawText);
    if (!Array.isArray(questions)) questions = questions.questions || [];
    
    return questions.map((q: any, index: number) => {
      let cAns = q.correctAnswer;
      if (typeof cAns === 'string') {
        const char = cAns.toUpperCase().trim();
        if (char === 'A') cAns = 0; else if (char === 'B') cAns = 1; else if (char === 'C') cAns = 2; else if (char === 'D') cAns = 3; else cAns = parseInt(cAns, 10);
      }
      if (isNaN(cAns) || cAns < 0 || !q.options || cAns >= q.options.length) cAns = 0;
      
      return {
        ...q,
        id: (q.id ? String(q.id) : '') + `_ai_${Math.random().toString(36).substring(2, 9)}_${index}`,
        topicId: 'custom',
        type: 'multiple_choice',
        correctAnswer: cAns
      };
    });
  } catch (error) {
    throw new Error("AI trả về định dạng đề phái sinh không hợp lệ.");
  }
}
