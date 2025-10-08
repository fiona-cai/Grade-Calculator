import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const course = await prisma.course.findFirst({
      where: {
        id: id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ grades: course.grades || {} });
  } catch (error) {
    console.error('Error loading grades:', error);
    return NextResponse.json({ error: 'Failed to load grades' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const grades = await request.json();

    const course = await prisma.course.findFirst({
      where: {
        id: id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: id },
      data: {
        grades: grades,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Grades saved successfully', 
      grades: updatedCourse.grades 
    });
  } catch (error) {
    console.error('Error saving grades:', error);
    return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
  }
}