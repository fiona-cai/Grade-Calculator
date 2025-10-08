"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, Grid, Group, NumberInput, Stack, Table, Text, Title, Badge, Loader, ActionIcon } from "@mantine/core";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { IconX } from "@tabler/icons-react";

Chart.register(ArcElement, Tooltip, Legend);

export type Assessment = {
  id: string;
  name: string;
  category: string;
  max: number;
  weight: number; // percentage points
};

type Props = {
  title: string;
  assessments: Assessment[];
  categories: string[];
  courseId?: string;
};

export function Calculator({ title, assessments, categories, courseId }: Props) {
  const [scores, setScores] = useState<Record<string, { earned?: number; max?: number }>>({});
  const [saving, setSaving] = useState(false);

  // Load saved grades when component mounts
  useEffect(() => {
    if (courseId) {
      const loadGrades = async () => {
        try {
          const response = await fetch(`/api/courses/${courseId}/grades`);
          if (response.ok) {
            const data = await response.json();
            if (data.grades) {
              setScores(data.grades);
            }
          }
        } catch (error) {
          console.error('Failed to load grades:', error);
        }
      };
      loadGrades();
    }
  }, [courseId]);

  // Save grades when scores change (with debouncing)
  useEffect(() => {
    if (courseId && Object.keys(scores).length > 0) {
      const timeoutId = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/courses/${courseId}/grades`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scores),
          });
        } catch (error) {
          console.error('Failed to save grades:', error);
        } finally {
          setSaving(false);
        }
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [scores, courseId]);

  const clearAssessment = (assessmentId: string) => {
    setScores(prev => {
      const newScores = { ...prev };
      delete newScores[assessmentId];
      return newScores;
    });
  };

  const { totalWeightedScore, totalWeightOfCompleted, contributions, completedAssessments } = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeightOfCompleted = 0;
    let completedAssessments = 0;
    const contributions: Record<string, number> = Object.fromEntries(categories.map((c) => [c, 0]));

    for (const a of assessments) {
      const earnedRaw = scores[a.id]?.earned;
      const maxRaw = scores[a.id]?.max ?? a.max;
      if (earnedRaw !== undefined && !Number.isNaN(earnedRaw) && maxRaw > 0) {
        const earned = Math.min(Math.max(earnedRaw, 0), maxRaw);
        const score = earned / maxRaw;
        const weighted = score * a.weight;
        totalWeightedScore += weighted;
        totalWeightOfCompleted += a.weight;
        completedAssessments++;
        contributions[a.category] = (contributions[a.category] ?? 0) + weighted;
      }
    }

    return { totalWeightedScore, totalWeightOfCompleted, contributions, completedAssessments };
  }, [assessments, categories, scores]);

  const overall = totalWeightedScore; // 0..100
  const standing = totalWeightOfCompleted > 0 ? (totalWeightedScore / totalWeightOfCompleted) : 0;

  const data = {
    labels: categories,
    datasets: [
      {
        label: "Weighted Contribution",
        data: categories.map((c) => contributions[c] ?? 0),
        backgroundColor: ["#3B82F6", "#93C5FD", "#0F172A", "#10B981", "#F59E0B"],
        borderColor: "#FFFFFF",
        borderWidth: 3,
      },
    ],
  };

  return (
    <Stack>
      <Group justify="space-between" align="center">
        <Title order={2}>{title}</Title>
        {courseId && (
          <Group gap="xs">
            {saving && (
              <Badge variant="light" color="blue" leftSection={<Loader size={12} />}>
                Saving...
              </Badge>
            )}
            {!saving && Object.keys(scores).length > 0 && (
              <Badge variant="light" color="green">
                Saved
              </Badge>
            )}
          </Group>
        )}
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            {categories.map((cat) => {
              const catWeight = assessments.filter((a) => a.category === cat).reduce((s, a) => s + a.weight, 0);
              return (
                <Stack key={cat} gap="xs">
                  <Title order={4}>{cat} ({catWeight.toFixed(2)}%)</Title>
                  <Card withBorder padding="sm">
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Assessment</Table.Th>
                          <Table.Th style={{ width: 140 }}>Your Score</Table.Th>
                          <Table.Th style={{ width: 140 }}>Max Points</Table.Th>
                          <Table.Th style={{ textAlign: "right", width: 140 }}>Grade Contribution</Table.Th>
                          <Table.Th style={{ width: 60 }}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {assessments.filter((a) => a.category === cat).map((a) => {
                          const earned = scores[a.id]?.earned;
                          const max = scores[a.id]?.max ?? a.max;
                          let contrib = 0;
                          if (earned !== undefined && !Number.isNaN(earned) && max > 0) {
                            const clamped = Math.min(Math.max(earned, 0), max);
                            contrib = (clamped / max) * a.weight;
                          }
                          return (
                            <Table.Tr key={a.id}>
                              <Table.Td>
                                <div>
                                  <Text fw={500}>{a.name}</Text>
                                  <Text size="xs" c="dimmed">Weight: {a.weight}%</Text>
                                </div>
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  value={earned ?? ''}
                                  onChange={(v) => setScores((s) => ({ ...s, [a.id]: { ...(s[a.id] ?? {}), earned: Number(v) } }))}
                                  min={0}
                                  thousandSeparator
                                  placeholder="Score"
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  value={max}
                                  onChange={(v) => setScores((s) => ({ ...s, [a.id]: { ...(s[a.id] ?? {}), max: Number(v) } }))}
                                  min={0}
                                  thousandSeparator
                                  placeholder="Max"
                                />
                              </Table.Td>
                              <Table.Td style={{ textAlign: "right" }}>
                                <div>
                                  <Text fw={500}>{contrib.toFixed(2)}%</Text>
                                  <Text size="xs" c="dimmed">
                                    {earned !== undefined && !Number.isNaN(earned) && max > 0 
                                      ? `${((earned / max) * 100).toFixed(1)}% of ${a.weight}%`
                                      : `0% of ${a.weight}%`
                                    }
                                  </Text>
                                </div>
                              </Table.Td>
                              <Table.Td>
                                {earned !== undefined && (
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => clearAssessment(a.id)}
                                    title="Clear score"
                                  >
                                    <IconX size={14} />
                                  </ActionIcon>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Card>
                </Stack>
              );
            })}
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Card withBorder>
              <Stack align="center">
                <Text c="dimmed">Current Overall Grade</Text>
                <Title order={1} c="blue">{overall.toFixed(2)}%</Title>
                <Text size="sm" c="dimmed">
                  Current Standing ({completedAssessments} of {assessments.length} completed)
                </Text>
                <Title order={3}>{(standing * 100).toFixed(2)}%</Title>
                {completedAssessments > 0 && (
                  <Text size="xs" c="dimmed" ta="center">
                    Average performance on completed work
                  </Text>
                )}
                <div style={{ width: 260, height: 260 }}>
                  <Doughnut data={data} options={{ cutout: "70%", maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
                </div>
              </Stack>
            </Card>

            <Card withBorder>
              <Stack gap="sm">
                <Title order={4}>Assessment Weights</Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Assessment</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Weight</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {assessments.map((assessment) => (
                      <Table.Tr key={assessment.id}>
                        <Table.Td>
                          <Text size="sm">{assessment.name}</Text>
                          <Text size="xs" c="dimmed">{assessment.category}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: "right" }}>
                          <Text fw={500}>{assessment.weight}%</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Text size="xs" c="dimmed" ta="center">
                  Total: {assessments.reduce((sum, a) => sum + a.weight, 0).toFixed(1)}%
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}



