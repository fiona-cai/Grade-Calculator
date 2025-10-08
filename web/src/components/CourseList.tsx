"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, Calendar, Calculator } from "lucide-react";
import Link from 'next/link';
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

interface CourseListProps {
  courses: Course[];
  onCourseDeleted: (courseId: string) => void;
}

export function CourseList({ courses, onCourseDeleted }: CourseListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  // Check if running on localhost
  useEffect(() => {
    setIsLocal(isLocalhost());
  }, []);

  const handleDelete = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      onCourseDeleted(courseId);
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const openDeleteModal = (courseId: string) => {
    setCourseToDelete(courseId);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalWeight = (assessments: Assessment[]) => {
    return assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">
              {isLocal ? 'No courses uploaded yet' : 'Demo Courses Available'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isLocal ? 'Upload a course outline to get started' : 'These are sample courses for demonstration purposes'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">{course.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/course/${course.id}/edit`} className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => openDeleteModal(course.id)}
                      className="text-destructive"
                      disabled={!isLocal}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {course.assessments.length} assessments
                </Badge>
                <Badge variant="outline">
                  {getTotalWeight(course.assessments).toFixed(0)}% total
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(course.createdAt)}</span>
              </div>

              <Button asChild className="w-full bg-accent hover:bg-accent/90 text-white border-accent shadow-sm">
                <Link href={`/course/${course.id}`} className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Open Calculator
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setCourseToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => courseToDelete && handleDelete(courseToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}