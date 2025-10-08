import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseCourseOutlineWithAI } from '@/lib/ai-parser';
import { isLocalhost, getDemoCourses } from '@/lib/localhost';

const COURSES_DIR = path.join(process.cwd(), 'data', 'courses');

// Ensure courses directory exists
if (!fs.existsSync(COURSES_DIR)) {
  fs.mkdirSync(COURSES_DIR, { recursive: true });
}

export async function GET() {
  try {
    // If not localhost, return demo data
    if (!isLocalhost()) {
      return NextResponse.json(getDemoCourses());
    }

    const courses = [];
    const files = fs.readdirSync(COURSES_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const courseData = JSON.parse(fs.readFileSync(path.join(COURSES_DIR, file), 'utf8'));
        courses.push({
          id: file.replace('.json', ''),
          ...courseData
        });
      }
    }
    
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // If not localhost, return demo course
    if (!isLocalhost()) {
      const demoCourse = getDemoCourses()[0];
      return NextResponse.json(demoCourse);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const courseName = formData.get('courseName') as string;
    
    if (!file || !courseName) {
      return NextResponse.json({ error: 'File and course name are required' }, { status: 400 });
    }
    
    // Generate unique course ID
    const courseId = courseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const timestamp = Date.now();
    const uniqueId = `${courseId}-${timestamp}`;
    
    // Save file
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uniqueId}.${fileExtension}`;
    const filePath = path.join(COURSES_DIR, fileName);
    
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));
    
    // Parse course outline using AI
    const assessments = await parseCourseOutlineWithAI(filePath, file.type);
    
    // Save course data
    const courseData = {
      name: courseName,
      fileName: fileName,
      assessments: assessments,
      createdAt: new Date().toISOString()
    };
    
    const courseFilePath = path.join(COURSES_DIR, `${uniqueId}.json`);
    fs.writeFileSync(courseFilePath, JSON.stringify(courseData, null, 2));
    
    return NextResponse.json({ 
      id: uniqueId, 
      ...courseData 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
