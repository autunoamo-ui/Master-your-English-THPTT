import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { ExamSession } from '../types';

export async function exportSessionToWord(session: ExamSession) {
  if (!session.questions || session.questions.length === 0) {
    alert("Không có câu hỏi nào để xuất.");
    return;
  }

  const doc = new Document({
    creator: "Smart English App",
    title: "Đề Thi Tiếng Anh",
    description: "Đề thi tự tạo từ AI",
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "ĐỀ THI TIẾNG ANH",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),
          ...session.questions.flatMap((q, i) => [
            new Paragraph({
              spacing: { before: 200, after: 100 },
              children: [
                new TextRun({ text: `Câu ${i + 1}: `, bold: true }),
                new TextRun({ text: q.content }),
              ],
            }),
            ...q.options.map((opt, optIndex) => 
              new Paragraph({
                spacing: { before: 50, after: 50 },
                indent: { left: 720 }, // 0.5 inch
                children: [
                  new TextRun({ text: `${String.fromCharCode(65 + optIndex)}. `, bold: true }),
                  new TextRun({ text: opt }),
                ],
              })
            ),
          ]),
          // Khóa đáp án (Page break could be added here if needed, keeping it simple for now)
          new Paragraph({
            text: "ĐÁP ÁN VÀ GIẢI THÍCH",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000, after: 400 },
            pageBreakBefore: true,
          }),
          ...session.questions.flatMap((q, i) => [
            new Paragraph({
              spacing: { before: 200, after: 50 },
              children: [
                new TextRun({ text: `Câu ${i + 1}: `, bold: true }),
                new TextRun({ text: String.fromCharCode(65 + q.correctAnswer), bold: true, color: "008800" }),
              ],
            }),
            new Paragraph({
              spacing: { before: 50, after: 100 },
              indent: { left: 360 },
              children: [
                new TextRun({ text: "Giải thích: ", italics: true }),
                new TextRun({ text: q.explanation }),
              ],
            }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `De_Thi_Tien_Anh_${new Date().toISOString().slice(0, 10)}.docx`);
}
