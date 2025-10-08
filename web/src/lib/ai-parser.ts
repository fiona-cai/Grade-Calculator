import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function parseCourseOutlineWithAI(filePath: string, fileType: string): Promise<any[]> {
  try {
    // Check if API key is available
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log('Google AI API key not found, falling back to simple parsing');
      return await parseCourseOutlineSimple(filePath, fileType);
    }

    console.log('Using Google AI API key:', process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...');

    let textContent = '';
    
    if (fileType === 'application/pdf') {
      // Extract text from PDF
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      textContent = data.text;
    } else if (fileType.startsWith('text/html')) {
      // For HTML files, read the content
      textContent = fs.readFileSync(filePath, 'utf8');
    } else {
      // For image files, we'll need OCR or ask user to provide text
      throw new Error('Image files require OCR processing. Please provide a PDF or HTML file.');
    }

    if (!textContent.trim()) {
      throw new Error('No text content found in the file');
    }

    // Use Google Gemini to parse the course outline
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `You are an expert at parsing course outlines and extracting assessment information. 

Extract all assessments (quizzes, assignments, exams, projects, etc.) from the course outline text.

For each assessment, provide:
- name: A clear, descriptive name
- category: Group similar assessments (e.g., "Quizzes", "Assignments", "Exams", "Projects")
- max: Maximum points possible (default to 100 if not specified)
- weight: Percentage weight of the assessment (must be a number)

Return ONLY a valid JSON array of assessment objects. Do not include any markdown formatting, code blocks, or explanations. Just return the raw JSON array.

Example format:
[
  {"name": "Quiz 1", "category": "Quizzes", "max": 100, "weight": 5},
  {"name": "Quiz 2", "category": "Quizzes", "max": 100, "weight": 5},
  {"name": "Midterm Exam", "category": "Exams", "max": 100, "weight": 30},
  {"name": "Final Exam", "category": "Exams", "max": 100, "weight": 40},
  {"name": "Assignment 1", "category": "Assignments", "max": 100, "weight": 10},
  {"name": "Assignment 2", "category": "Assignments", "max": 100, "weight": 10}
]

Course outline text:
${textContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from AI parser');
    }

    // Clean the response text - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('AI Response:', cleanedText);

    // Parse the JSON response
    let assessments;
    try {
      assessments = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw AI response:', text);
      console.error('Cleaned response:', cleanedText);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }
    
    // Validate and add IDs
    const validatedAssessments = assessments.map((assessment: any, index: number) => ({
      id: `assessment-${index + 1}`,
      name: assessment.name || `Assessment ${index + 1}`,
      category: assessment.category || 'Assignments',
      max: Number(assessment.max) || 100,
      weight: Number(assessment.weight) || 0
    }));

    // Ensure total weight doesn't exceed 100%
    const totalWeight = validatedAssessments.reduce((sum: number, a: any) => sum + a.weight, 0);
    if (totalWeight > 100) {
      // Scale down weights proportionally
      const scaleFactor = 100 / totalWeight;
      validatedAssessments.forEach((assessment: any) => {
        assessment.weight = Math.round(assessment.weight * scaleFactor * 100) / 100;
      });
    }

    return validatedAssessments;

  } catch (error) {
    console.error('AI parsing error:', error);
    
    // Check if it's a quota error and provide helpful message
    if (error instanceof Error && (error.message.includes('quota') || error.message.includes('limit'))) {
      console.log('Google AI quota exceeded, falling back to simple parsing');
    }
    
    // Fallback to simple regex parsing
    return await parseCourseOutlineSimple(filePath, fileType);
  }
}

async function parseCourseOutlineSimple(filePath: string, fileType: string): Promise<any[]> {
  const assessments = [];
  
  if (fileType === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      const text = data.text;
      
      // Enhanced regex patterns to extract assessment information
      const patterns = [
        // Quiz patterns: "Quiz 1: 10%", "Quiz 1 (10%)", "Quiz 1 - 10%"
        { regex: /(?:quiz|assignment|homework)\s*(\d+)\s*[:\-\(]?\s*(\d+(?:\.\d+)?)\s*%/gi, type: 'quiz' },
        // Exam patterns: "Midterm: 30%", "Final Exam: 50%"
        { regex: /(midterm|mid-term|final(?:\s+exam)?)\s*[:\-\(]?\s*(\d+(?:\.\d+)?)\s*%/gi, type: 'exam' },
        // Assignment patterns: "Assignment 1: 15%"
        { regex: /assignment\s*(\d+)\s*[:\-\(]?\s*(\d+(?:\.\d+)?)\s*%/gi, type: 'assignment' },
        // Project patterns: "Project: 20%"
        { regex: /project\s*[:\-\(]?\s*(\d+(?:\.\d+)?)\s*%/gi, type: 'project' }
      ];
      
      let assessmentCount = { quiz: 1, assignment: 1, project: 1 };
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
          const weight = parseFloat(match[2] || match[1]);
          let name = '';
          let category = '';
          
          switch (pattern.type) {
            case 'quiz':
              name = `Quiz ${assessmentCount.quiz}`;
              category = 'Quizzes';
              assessmentCount.quiz++;
              break;
            case 'exam':
              name = match[1].toLowerCase().includes('final') ? 'Final Exam' : 'Midterm Exam';
              category = match[1].toLowerCase().includes('final') ? 'Final Exam' : 'Midterm';
              break;
            case 'assignment':
              name = `Assignment ${assessmentCount.assignment}`;
              category = 'Assignments';
              assessmentCount.assignment++;
              break;
            case 'project':
              name = `Project ${assessmentCount.project}`;
              category = 'Projects';
              assessmentCount.project++;
              break;
          }
          
          assessments.push({
            id: `${category.toLowerCase().replace(/\s+/g, '-')}-${assessments.length + 1}`,
            name,
            category,
            max: 100,
            weight: weight
          });
        }
      }
      
    } catch (error) {
      console.error('Error parsing PDF:', error);
    }
  }
  
  // If no patterns found, create default structure
  if (assessments.length === 0) {
    assessments.push(
      { id: 'quiz-1', name: 'Quiz 1', category: 'Quizzes', max: 100, weight: 10 },
      { id: 'quiz-2', name: 'Quiz 2', category: 'Quizzes', max: 100, weight: 10 },
      { id: 'midterm', name: 'Midterm Exam', category: 'Midterm', max: 100, weight: 30 },
      { id: 'final', name: 'Final Exam', category: 'Final Exam', max: 100, weight: 50 }
    );
  }
  
  return assessments;
}
