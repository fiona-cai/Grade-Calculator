"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Grid, Group, NumberInput, Stack, Table, Text, Title } from "@mantine/core";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

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
};

export function Calculator({ title, assessments, categories }: Props) {
  const [scores, setScores] = useState<Record<string, { earned?: number; max?: number }>>({});

  const { totalWeightedScore, totalWeightOfCompleted, contributions } = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeightOfCompleted = 0;
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
        contributions[a.category] = (contributions[a.category] ?? 0) + weighted;
      }
    }

    return { totalWeightedScore, totalWeightOfCompleted, contributions };
  }, [assessments, categories, scores]);

  const overall = totalWeightedScore; // 0..100
  const standing = totalWeightOfCompleted > 0 ? (totalWeightedScore / totalWeightOfCompleted) * 100 : 0;

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
      <Title order={2}>{title}</Title>

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
                          <Table.Th>Item</Table.Th>
                          <Table.Th style={{ width: 140 }}>Score</Table.Th>
                          <Table.Th style={{ width: 140 }}>Max</Table.Th>
                          <Table.Th style={{ textAlign: "right", width: 140 }}>Contribution</Table.Th>
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
                              <Table.Td>{a.name}</Table.Td>
                              <Table.Td>
                                <NumberInput
                                  value={earned ?? ''}
                                  onChange={(v) => setScores((s) => ({ ...s, [a.id]: { ...(s[a.id] ?? {}), earned: Number(v) } }))}
                                  min={0}
                                  thousandSeparator
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  value={max}
                                  onChange={(v) => setScores((s) => ({ ...s, [a.id]: { ...(s[a.id] ?? {}), max: Number(v) } }))}
                                  min={0}
                                  thousandSeparator
                                />
                              </Table.Td>
                              <Table.Td style={{ textAlign: "right" }}>{contrib.toFixed(2)}%</Table.Td>
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
          <Card withBorder>
            <Stack align="center">
              <Text c="dimmed">Current Overall Grade</Text>
              <Title order={1} c="blue">{overall.toFixed(2)}%</Title>
              <Text size="sm" c="dimmed">Current Standing (completed items)</Text>
              <Title order={3}>{standing.toFixed(2)}%</Title>
              <div style={{ width: 260, height: 260 }}>
                <Doughnut data={data} options={{ cutout: "70%" as any, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              </div>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}



