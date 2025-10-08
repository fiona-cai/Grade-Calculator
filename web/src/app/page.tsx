"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, User } from "lucide-react";
import { CourseUpload } from "@/components/CourseUpload";
import { CourseList } from "@/components/CourseList";
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  name: string;
  assessments: any[];
  createdAt: string;
  updatedAt?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchCourses = async () => {
    if (status !== "authenticated") return;
    
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [status]);

  const handleCourseCreated = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
    setShowUpload(false);
  };

  const handleCourseDeleted = (courseId: string) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect to sign in
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <div></div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Smart Grade Calculators</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your course outline and let AI automatically create a personalized grade calculator for you.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{session?.user?.name || session?.user?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Course</CardTitle>
          <CardDescription>
            Upload a course outline (PDF, image, or HTML) to automatically generate a grade calculator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showUpload ? (
            <Button 
              onClick={() => setShowUpload(true)}
              className="w-full bg-accent hover:bg-accent/90 text-white border-accent shadow-sm h-12 text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Course
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Upload Course Outline</h3>
                <Button 
                  variant="outline"
                  onClick={() => setShowUpload(false)}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
              <CourseUpload onCourseCreated={handleCourseCreated} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>
            Manage and track your academic progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading courses...</p>
          ) : (
            <CourseList 
              courses={courses} 
              onCourseDeleted={handleCourseDeleted}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
