"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalculatorShadcn as Calculator, Assessment } from '@/components/CalculatorShadcn';
import { Brain, Edit, AlertCircle, Loader2 } from "lucide-react";
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  assessments: Assessment[];
  createdAt: string;
  updatedAt?: string;
}

export default function CoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Course not found');
          }
          throw new Error('Failed to fetch course');
        }
        
        const data = await response.json();
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Course not found</AlertDescription>
      </Alert>
    );
  }

  // Extract unique categories from assessments
  const categories = Array.from(new Set(course.assessments.map(a => a.category)));
  const totalWeight = course.assessments.reduce((sum, a) => sum + a.weight, 0);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{course.name} Grade Calculator</CardTitle>
              <CardDescription>
                Created {new Date(course.createdAt).toLocaleDateString()}
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge className="flex items-center gap-1 bg-accent text-white">
                  <Brain className="h-3 w-3" />
                  AI Generated
                </Badge>
                <Badge variant="outline">
                  {course.assessments.length} assessments
                </Badge>
                <Badge variant="outline">
                  {totalWeight.toFixed(0)}% total weight
                </Badge>
              </div>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-white border-accent shadow-sm">
              <Link href={`/course/${courseId}/edit`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Assessments
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Weight Warning */}
      {totalWeight !== 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Total weight is {totalWeight.toFixed(1)}%. 
            You may want to adjust the weights to equal 100% for accurate grade calculations.
          </AlertDescription>
        </Alert>
      )}

      {/* Calculator */}
      <Calculator 
        title=""
        assessments={course.assessments}
        categories={categories}
        courseId={courseId}
      />
    </div>
  );
}
