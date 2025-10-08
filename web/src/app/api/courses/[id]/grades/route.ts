import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isLocalhost } from '@/lib/localhost';

const COURSES_DIR = path.join(process.cwd(), 'data', 'courses');

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // If not localhost, return success without saving
    if (!isLocalhost()) {
      return NextResponse.json({ 
        message: 'Demo mode - grades not saved',
        grades: {} 
      });
    }

    const courseFilePath = path.join(COURSES_DIR, `${id}.json`);
    
    if (!fs.existsSync(courseFilePath)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const grades = await request.json();
    const existingData = JSON.parse(fs.readFileSync(courseFilePath, 'utf8'));
    
    const updatedData = {
      ...existingData,
      grades,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(courseFilePath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      message: 'Grades saved successfully',
      grades 
    });
  } catch (error) {
    console.error('Error saving grades:', error);
    return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // If not localhost, return empty grades
    if (!isLocalhost()) {
      return NextResponse.json({ 
        grades: {},
        updatedAt: new Date().toISOString()
      });
    }

    const courseFilePath = path.join(COURSES_DIR, `${id}.json`);
    
    if (!fs.existsSync(courseFilePath)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const courseData = JSON.parse(fs.readFileSync(courseFilePath, 'utf8'));
    
    return NextResponse.json({ 
      grades: courseData.grades || {},
      updatedAt: courseData.updatedAt 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}
