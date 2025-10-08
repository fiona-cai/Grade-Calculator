"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { CourseUpload } from "@/components/CourseUpload";
import { CourseList } from "@/components/CourseList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isLocalhost } from '@/lib/localhost';

interface Assessment {
  id: string;
  name: string;
  category: string;
  max: number;
  weight: number;
}

interface Course {
  id: string;
  name: string;
  assessments: Assessment[];
  createdAt: string;
  updatedAt?: string;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  // Check if running on localhost
  useEffect(() => {
    setIsLocal(isLocalhost());
  }, []);

  const fetchCourses = async () => {
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
  }, []);

  const handleCourseCreated = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
    setShowUpload(false);
  };

  const handleCourseDeleted = (courseId: string) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Smart Grade Calculators</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your course outline and let AI automatically create a personalized grade calculator for you.
        </p>
      </div>

      {/* Demo Mode Warning */}
      {!isLocal && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> You&apos;re viewing a demo version. Course creation and data storage are only available when running locally. 
            To use all features, please run this application on localhost.
          </AlertDescription>
        </Alert>
      )}

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
              disabled={!isLocal}
              className="w-full bg-accent hover:bg-accent/90 text-white border-accent shadow-sm h-12 text-lg disabled:opacity-50"
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
