import { jsPDF } from 'jspdf';

export const generateInterviewReport = (sessionData) => {
  const { mode, topics, difficulty, conversation, score } = sessionData;
  const doc = new jsPDF();

  // Colors and styling constants
  const primaryColor = [41, 128, 185]; // Blue
  const textColor = [51, 51, 51];
  const lightGray = [240, 240, 240];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Interview Performance Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

  // Summary Section
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Details', 20, 55);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode: ${mode}`, 20, 65);
  doc.text(`Topics: ${topics.join(', ')}`, 20, 72);
  doc.text(`Difficulty: ${difficulty}`, 20, 79);
  
  // Score block
  doc.setFillColor(...lightGray);
  doc.rect(140, 50, 50, 30, 'F');
  doc.setFontSize(14);
  doc.text('Score', 165, 60, { align: 'center' });
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(score >= 70 ? [46, 204, 113] : [231, 76, 60]));
  doc.text(`${score}/100`, 165, 72, { align: 'center' });

  // Feedback Section (Mock implementation)
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Feedback & Analysis', 20, 100);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Strengths:', 20, 110);
  doc.setFont('helvetica', 'normal');
  doc.text('- Good communication and clear articulation.', 25, 118);
  doc.text('- Confident approach to technical problems.', 25, 125);

  doc.setFont('helvetica', 'bold');
  doc.text('Areas for Improvement:', 20, 135);
  doc.setFont('helvetica', 'normal');
  doc.text('- Could go deeper into system design trade-offs.', 25, 143);
  doc.text('- Work on structuring answers using the STAR method.', 25, 150);

  // Next Steps
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Next Steps:', 20, 160);
  doc.setFont('helvetica', 'normal');
  doc.text('- Review common behavioral questions.', 25, 168);
  doc.text('- Practice more mock interviews under time pressure.', 25, 175);

  // Transcript Preview
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Conversation Snippet', 20, 195);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 205;
  const recentMsgs = conversation.slice(-4);
  recentMsgs.forEach(msg => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }
    const role = msg.role === 'jerry' ? 'Jerry' : 'You';
    const text = doc.splitTextToSize(`${role}: ${msg.text}`, 170);
    doc.text(text, 20, yPos);
    yPos += text.length * 5 + 5;
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by AI Interview Prep', 105, 290, { align: 'center' });

  // Save the PDF
  doc.save('Interview_Report.pdf');
};
