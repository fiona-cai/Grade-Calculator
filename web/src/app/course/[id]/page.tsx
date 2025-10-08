"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Stack, Title, Text, Alert, Loader, Center, Button, Group, Badge } from '@mantine/core';
import { IconAlertCircle, IconEdit, IconBrain } from '@tabler/icons-react';
import { Calculator, Assessment } from '@/components/Calculator';
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
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading course...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        {error}
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        Course not found
      </Alert>
    );
  }

  // Extract unique categories from assessments
  const categories = Array.from(new Set(course.assessments.map(a => a.category)));
  const totalWeight = course.assessments.reduce((sum, a) => sum + a.weight, 0);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{course.name} Grade Calculator</Title>
          <Text c="dimmed" size="sm">
            Created {new Date(course.createdAt).toLocaleDateString()}
          </Text>
          <Group gap="xs" mt="xs">
            <Badge variant="light" color="blue" leftSection={<IconBrain size={12} />}>
              AI Generated
            </Badge>
            <Badge variant="light" color="green">
              {course.assessments.length} assessments
            </Badge>
            <Badge variant="light" color="orange">
              {totalWeight.toFixed(0)}% total weight
            </Badge>
          </Group>
        </div>
        <Button
          component={Link}
          href={`/course/${courseId}/edit`}
          leftSection={<IconEdit size={16} />}
          variant="outline"
        >
          Edit Assessments
        </Button>
      </Group>

      {totalWeight !== 100 && (
        <Alert color="yellow" variant="light">
          <Text size="sm">
            <strong>Note:</strong> Total weight is {totalWeight.toFixed(1)}%. 
            You may want to adjust the weights to equal 100% for accurate grade calculations.
          </Text>
        </Alert>
      )}

      <Calculator 
        title=""
        assessments={course.assessments}
        categories={categories}
        courseId={courseId}
      />
    </Stack>
  );
}
