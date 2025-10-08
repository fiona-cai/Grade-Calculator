"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Stack, 
  Title, 
  Text, 
  Alert, 
  Loader, 
  Center, 
  Button, 
  Group, 
  Card, 
  TextInput, 
  NumberInput, 
  Select,
  ActionIcon,
  Table,
  Badge,
  Divider,
  Tooltip
} from '@mantine/core';
import { IconAlertCircle, IconPlus, IconTrash, IconArrowLeft, IconBrain, IconInfoCircle } from '@tabler/icons-react';
import { Assessment } from '@/components/Calculator';

interface Course {
  id: string;
  name: string;
  assessments: Assessment[];
  createdAt: string;
  updatedAt?: string;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

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
        setAssessments(data.assessments);
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

  const addAssessment = () => {
    const newAssessment: Assessment = {
      id: `assessment-${Date.now()}`,
      name: 'New Assessment',
      category: 'Assignments',
      max: 100,
      weight: 10
    };
    setAssessments(prev => [...prev, newAssessment]);
  };

  const removeAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
  };

  const updateAssessment = (id: string, field: keyof Assessment, value: any) => {
    setAssessments(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const saveCourse = async () => {
    if (!course) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessments: assessments
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save course');
      }

      router.push(`/course/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

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

  const categories = Array.from(new Set(assessments.map(a => a.category)));

  const getTotalWeight = (assessments: any[]) => {
    return assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  };

  const totalWeight = getTotalWeight(assessments);
  const isWeightValid = totalWeight === 100;

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Group gap="md">
          <ActionIcon
            variant="subtle"
            onClick={() => router.back()}
          >
            <IconArrowLeft size={16} />
          </ActionIcon>
          <div>
            <Title order={2}>Edit {course.name}</Title>
            <Text c="dimmed">Modify assessments and weights</Text>
          </div>
        </Group>
        <Group gap="sm">
          <Button variant="subtle" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={saveCourse} loading={saving} disabled={!isWeightValid}>
            Save Changes
          </Button>
        </Group>
      </Group>

      <Alert color="blue" variant="light" icon={<IconBrain size={16} />}>
        <Text size="sm">
          <strong>AI-Generated Assessments:</strong> These assessments were automatically extracted from your course outline. 
          You can edit names, categories, weights, and maximum points to match your actual course requirements.
        </Text>
      </Alert>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Title order={4}>Assessments</Title>
              <Badge variant="light" color={isWeightValid ? "green" : "orange"}>
                {totalWeight.toFixed(1)}% total weight
              </Badge>
              {!isWeightValid && (
                <Tooltip label="Total weight should equal 100% for accurate grade calculations">
                  <IconInfoCircle size={16} color="orange" />
                </Tooltip>
              )}
            </Group>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={addAssessment}
              size="sm"
            >
              Add Assessment
            </Button>
          </Group>

          {!isWeightValid && (
            <Alert color="yellow" variant="light">
              <Text size="sm">
                <strong>Weight Adjustment Needed:</strong> Total weight is {totalWeight.toFixed(1)}%. 
                Adjust individual weights so they add up to 100% for accurate grade calculations.
              </Text>
            </Alert>
          )}

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Max Points</Table.Th>
                <Table.Th>Weight (%)</Table.Th>
                <Table.Th style={{ width: 60 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {assessments.map((assessment) => (
                <Table.Tr key={assessment.id}>
                  <Table.Td>
                    <TextInput
                      value={assessment.name}
                      onChange={(e) => updateAssessment(assessment.id, 'name', e.target.value)}
                      size="sm"
                      placeholder="Assessment name"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select
                      value={assessment.category}
                      onChange={(value) => updateAssessment(assessment.id, 'category', value || '')}
                      data={categories}
                      searchable
                      creatable
                      getCreateLabel={(query) => `+ Create ${query}`}
                      onCreate={(query) => {
                        const newCategory = query;
                        setAssessments(prev => prev.map(a => 
                          a.id === assessment.id ? { ...a, category: newCategory } : a
                        ));
                        return newCategory;
                      }}
                      size="sm"
                      placeholder="Category"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={assessment.max}
                      onChange={(value) => updateAssessment(assessment.id, 'max', Number(value))}
                      min={1}
                      size="sm"
                      placeholder="Max points"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={assessment.weight}
                      onChange={(value) => updateAssessment(assessment.id, 'weight', Number(value))}
                      min={0}
                      max={100}
                      size="sm"
                      placeholder="Weight %"
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeAssessment(assessment.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />
          
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              Total: {assessments.length} assessments, {totalWeight.toFixed(1)}% weight
            </Text>
            <Group gap="sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Normalize weights to 100%
                  const scaleFactor = 100 / totalWeight;
                  setAssessments(prev => prev.map(a => ({
                    ...a,
                    weight: Math.round(a.weight * scaleFactor * 100) / 100
                  })));
                }}
                disabled={totalWeight === 0}
              >
                Normalize to 100%
              </Button>
            </Group>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
