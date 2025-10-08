import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isLocalhost, getDemoCourses } from '@/lib/localhost';

const COURSES_DIR = path.join(process.cwd(), 'data', 'courses');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // If not localhost, return demo course
    if (!isLocalhost()) {
      const demoCourses = getDemoCourses();
      const demoCourse = demoCourses.find(course => course.id === id) || demoCourses[0];
      return NextResponse.json(demoCourse);
    }

    const courseFilePath = path.join(COURSES_DIR, `${id}.json`);
    
    if (!fs.existsSync(courseFilePath)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const courseData = JSON.parse(fs.readFileSync(courseFilePath, 'utf8'));
    return NextResponse.json({ id, ...courseData });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // If not localhost, return success without saving
    if (!isLocalhost()) {
      return NextResponse.json({ message: 'Demo mode - changes not saved' });
    }

    const courseFilePath = path.join(COURSES_DIR, `${id}.json`);
    
    if (!fs.existsSync(courseFilePath)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const updates = await request.json();
    const existingData = JSON.parse(fs.readFileSync(courseFilePath, 'utf8'));
    
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(courseFilePath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ id, ...updatedData });
  } catch {
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // If not localhost, return success without deleting
    if (!isLocalhost()) {
      return NextResponse.json({ message: 'Demo mode - course not deleted' });
    }

    const courseFilePath = path.join(COURSES_DIR, `${id}.json`);
    
    if (!fs.existsSync(courseFilePath)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Get course data to find associated files
    const courseData = JSON.parse(fs.readFileSync(courseFilePath, 'utf8'));
    
    // Delete course JSON file
    fs.unlinkSync(courseFilePath);
    
    // Delete associated file if it exists
    if (courseData.fileName) {
      const filePath = path.join(COURSES_DIR, courseData.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
