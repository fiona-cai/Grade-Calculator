import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function parseCourseOutlineWithAI(file: File): Promise<any[]> {
  try {
    // Check if API key is available
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log('Google AI API key not found, falling back to simple parsing');
      return await parseCourseOutlineSimple(file);
    }

    console.log('Using Google AI API key:', process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...');

    let textContent = '';
    
    if (file.type === 'application/pdf') {
      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(Buffer.from(arrayBuffer));
      textContent = data.text;
    } else if (file.type.startsWith('text/html')) {
      // For HTML files, read the content
      textContent = await file.text();
    } else {
      // For image files, we'll need OCR or ask user to provide text
      throw new Error('Image files require OCR processing. Please provide a PDF or HTML file.');
    }

    if (!textContent.trim()) {
      throw new Error('No text content found in the file');
    }

    console.log('Extracted text content length:', textContent.length);

    // Use Google Gemini to parse the course outline
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are an expert at parsing course outlines and extracting assessment information. 

Extract all assessments (quizzes, assignments, exams, projects, etc.) from the course outline text.

For each assessment, provide:
- name: A clear, descriptive name
- category: Group similar assessments (e.g., "Quizzes", "Assignments", "Exams", "Projects")
- max: Maximum points possible (default to 100 if not specified)
- weight: Percentage weight of the assessment (must be a number)

IMPORTANT WEIGHT GUIDELINES:
- Quizzes: Typically 1-5% each (if many quizzes, use 1-2% each)
- Assignments: Typically 5-15% each
- Midterm Exam: Typically 20-30%
- Final Exam: Typically 30-50%
- Projects: Typically 10-25% each
- Labs: Typically 2-10% each

Ensure the total weight adds up to 100%. If you see many quizzes (8+), use smaller weights per quiz (1-2%).

Return ONLY a valid JSON array of assessment objects. Do not include any markdown formatting, code blocks, or explanations. Just return the raw JSON array.

Example format:
[
  {"name": "Quiz 1", "category": "Quizzes", "max": 100, "weight": 2},
  {"name": "Quiz 2", "category": "Quizzes", "max": 100, "weight": 2},
  {"name": "Quiz 3", "category": "Quizzes", "max": 100, "weight": 2},
  {"name": "Midterm Exam", "category": "Exams", "max": 100, "weight": 30},
  {"name": "Final Exam", "category": "Exams", "max": 100, "weight": 50},
  {"name": "Assignment 1", "category": "Assignments", "max": 100, "weight": 7},
  {"name": "Assignment 2", "category": "Assignments", "max": 100, "weight": 7}
]

Course outline text:
${textContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI Response:', text);

    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('Cleaned response:', cleanedText);

    // Parse the JSON response
    let assessments;
    try {
      assessments = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', text);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }

    if (!Array.isArray(assessments)) {
      throw new Error('AI response is not an array');
    }

    // Normalize weights to sum to 100%
    const totalWeight = assessments.reduce((sum, assessment) => sum + (assessment.weight || 0), 0);
    if (totalWeight > 0) {
      const normalizedAssessments = assessments.map(assessment => ({
        ...assessment,
        weight: Math.round((assessment.weight / totalWeight) * 100 * 100) / 100 // Round to 2 decimal places
      }));
      console.log('Parsed assessments:', normalizedAssessments);
      return normalizedAssessments;
    }

    console.log('Parsed assessments:', assessments);
    return assessments;

  } catch (error) {
    console.error('AI parsing error:', error);
    console.log('Falling back to simple parsing');
    return await parseCourseOutlineSimple(file);
  }
}

export async function parseCourseOutlineSimple(file: File): Promise<any[]> {
  try {
    let textContent = '';
    
    if (file.type === 'application/pdf') {
      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(Buffer.from(arrayBuffer));
      textContent = data.text;
    } else if (file.type.startsWith('text/html')) {
      // For HTML files, read the content
      textContent = await file.text();
    } else {
      // For image files, return default structure
      return getDefaultAssessments();
    }

    if (!textContent.trim()) {
      return getDefaultAssessments();
    }

    console.log('Using simple parsing for text content');

    // Enhanced regex patterns for different assessment types
    const patterns = {
      quiz: /quiz\s*(\d+)/gi,
      exam: /(midterm|final|exam)\s*(?:exam)?/gi,
      assignment: /assignment\s*(\d+)|homework\s*(\d+)|hw\s*(\d+)/gi,
      project: /project\s*(\d+)/gi,
      lab: /lab\s*(\d+)/gi,
    };

    const assessments: any[] = [];
    const foundAssessments = new Set<string>();

    // Find quizzes
    let quizMatches = textContent.match(patterns.quiz);
    if (quizMatches) {
      const quizCount = Math.max(...quizMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }));
      
      for (let i = 1; i <= quizCount; i++) {
        const assessmentName = `Quiz ${i}`;
        if (!foundAssessments.has(assessmentName)) {
          assessments.push({
            name: assessmentName,
            category: 'Quizzes',
            max: 100,
            weight: Math.round((100 / (quizCount + 2)) * 100) / 100 // Distribute weight among quizzes
          });
          foundAssessments.add(assessmentName);
        }
      }
    }

    // Find exams
    let examMatches = textContent.match(patterns.exam);
    if (examMatches) {
      const examTypes = [...new Set(examMatches.map(match => match.toLowerCase().trim()))];
      
      examTypes.forEach(examType => {
        const assessmentName = examType.charAt(0).toUpperCase() + examType.slice(1);
        if (!foundAssessments.has(assessmentName)) {
          assessments.push({
            name: assessmentName,
            category: 'Exams',
            max: 100,
            weight: examType.includes('final') ? 40 : 30
          });
          foundAssessments.add(assessmentName);
        }
      });
    }

    // Find assignments
    let assignmentMatches = textContent.match(patterns.assignment);
    if (assignmentMatches) {
      const assignmentCount = Math.max(...assignmentMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }));
      
      for (let i = 1; i <= assignmentCount; i++) {
        const assessmentName = `Assignment ${i}`;
        if (!foundAssessments.has(assessmentName)) {
          assessments.push({
            name: assessmentName,
            category: 'Assignments',
            max: 100,
            weight: Math.round((100 / (assignmentCount + 2)) * 100) / 100
          });
          foundAssessments.add(assessmentName);
        }
      }
    }

    // Find projects
    let projectMatches = textContent.match(patterns.project);
    if (projectMatches) {
      const projectCount = Math.max(...projectMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }));
      
      for (let i = 1; i <= projectCount; i++) {
        const assessmentName = `Project ${i}`;
        if (!foundAssessments.has(assessmentName)) {
          assessments.push({
            name: assessmentName,
            category: 'Projects',
            max: 100,
            weight: Math.round((100 / (projectCount + 2)) * 100) / 100
          });
          foundAssessments.add(assessmentName);
        }
      }
    }

    // Find labs
    let labMatches = textContent.match(patterns.lab);
    if (labMatches) {
      const labCount = Math.max(...labMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }));
      
      for (let i = 1; i <= labCount; i++) {
        const assessmentName = `Lab ${i}`;
        if (!foundAssessments.has(assessmentName)) {
          assessments.push({
            name: assessmentName,
            category: 'Labs',
            max: 100,
            weight: Math.round((100 / (labCount + 2)) * 100) / 100
          });
          foundAssessments.add(assessmentName);
        }
      }
    }

    // If no assessments found, return default structure
    if (assessments.length === 0) {
      return getDefaultAssessments();
    }

    // Normalize weights to sum to 100%
    const totalWeight = assessments.reduce((sum, assessment) => sum + (assessment.weight || 0), 0);
    if (totalWeight > 0) {
      const normalizedAssessments = assessments.map(assessment => ({
        ...assessment,
        weight: Math.round((assessment.weight / totalWeight) * 100 * 100) / 100
      }));
      return normalizedAssessments;
    }

    console.log('Simple parsing result:', assessments);
    return assessments;

  } catch (error) {
    console.error('Simple parsing error:', error);
    return getDefaultAssessments();
  }
}

function getDefaultAssessments(): any[] {
  return [
    { name: 'Quiz 1', category: 'Quizzes', max: 100, weight: 10 },
    { name: 'Quiz 2', category: 'Quizzes', max: 100, weight: 10 },
    { name: 'Quiz 3', category: 'Quizzes', max: 100, weight: 10 },
    { name: 'Midterm Exam', category: 'Exams', max: 100, weight: 30 },
    { name: 'Final Exam', category: 'Exams', max: 100, weight: 40 }
  ];
}