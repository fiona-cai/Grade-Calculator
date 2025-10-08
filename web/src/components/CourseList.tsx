"use client";
import { useState, useEffect } from 'react';
import { Card, Grid, Group, Text, Title, Button, Stack, Badge, Menu, ActionIcon, Modal } from '@mantine/core';
import { IconDots, IconTrash, IconEdit, IconCalendar } from '@tabler/icons-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  assessments: any[];
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

  const getTotalWeight = (assessments: any[]) => {
    return assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  };

  if (courses.length === 0) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Stack align="center" gap="md">
          <Text size="lg" c="dimmed">No courses uploaded yet</Text>
          <Text size="sm" c="dimmed">Upload a course outline to get started</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Grid>
        {courses.map((course) => (
          <Grid.Col key={course.id} span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder padding="lg" radius="md" h="100%">
              <Stack gap="md" h="100%">
                <Group justify="space-between" align="flex-start">
                  <Title order={4} style={{ flex: 1 }}>
                    {course.name}
                  </Title>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        component={Link}
                        href={`/course/${course.id}/edit`}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => openDeleteModal(course.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>

                <Group gap="xs">
                  <Badge variant="light" color="blue">
                    {course.assessments.length} assessments
                  </Badge>
                  <Badge variant="light" color="green">
                    {getTotalWeight(course.assessments).toFixed(0)}% total
                  </Badge>
                </Group>

                <Group gap="xs" c="dimmed">
                  <IconCalendar size={14} />
                  <Text size="sm">
                    Created {formatDate(course.createdAt)}
                  </Text>
                </Group>

                <Button
                  component={Link}
                  href={`/course/${course.id}`}
                  fullWidth
                  mt="auto"
                >
                  Open Calculator
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCourseToDelete(null);
        }}
        title="Delete Course"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete this course? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => {
                setDeleteModalOpen(false);
                setCourseToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => courseToDelete && handleDelete(courseToDelete)}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
