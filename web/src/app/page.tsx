"use client";
import { useState, useEffect } from 'react';
import { Stack, Title, Text, Divider, Group, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { CourseUpload } from "@/components/CourseUpload";
import { CourseList } from "@/components/CourseList";

interface Course {
  id: string;
  name: string;
  assessments: any[];
  createdAt: string;
  updatedAt?: string;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1}>Google Gemini AI-Powered Grade Calculators</Title>
          <Text c="dimmed">Upload course outlines and let Google Gemini AI automatically extract assessment information to create personalized grade calculators</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setShowUpload(true)}
        >
          Add Course
        </Button>
      </Group>

      {showUpload && (
        <>
          <CourseUpload onCourseCreated={handleCourseCreated} />
          <Divider />
        </>
      )}

      <div>
        <Title order={2} mb="md">Your Courses</Title>
        {loading ? (
          <Text c="dimmed">Loading courses...</Text>
        ) : (
          <CourseList 
            courses={courses} 
            onCourseDeleted={handleCourseDeleted}
          />
        )}
      </div>
    </Stack>
  );
}
