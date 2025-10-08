"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { X, Save, Loader2 } from "lucide-react";

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

export function CalculatorShadcn({ title, assessments, categories, courseId }: Props) {
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
    const assessment = assessments.find(a => a.id === assessmentId);
    const assessmentName = assessment?.name || 'this assessment';
    
    if (confirm(`Are you sure you want to clear the score for "${assessmentName}"?`)) {
      setScores(prev => {
        const newScores = { ...prev };
        delete newScores[assessmentId];
        return newScores;
      });
    }
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
        backgroundColor: ["#abcca3", "#8bb39a", "#7ba68a", "#6b997a", "#5b8c6a"],
        borderColor: "#FFFFFF",
        borderWidth: 3,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">Track your academic progress</p>
        </div>
        {courseId && (
          <div className="flex items-center gap-2">
            {saving && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </Badge>
            )}
            {!saving && Object.keys(scores).length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Save className="h-3 w-3" />
                Saved
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map((cat) => {
            const catWeight = assessments.filter((a) => a.category === cat).reduce((s, a) => s + a.weight, 0);
            const catAssessments = assessments.filter((a) => a.category === cat);
            
            return (
              <Card key={cat}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cat}</span>
                    <Badge variant="secondary">{catWeight.toFixed(1)}%</Badge>
                  </CardTitle>
                  <CardDescription>
                    {catAssessments.length} assessments in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment</TableHead>
                        <TableHead className="w-32">Your Score</TableHead>
                        <TableHead className="w-32">Max Points</TableHead>
                        <TableHead className="w-32 text-right">Contribution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catAssessments.map((a) => {
                        const earned = scores[a.id]?.earned;
                        const max = scores[a.id]?.max ?? a.max;
                        let contrib = 0;
                        if (earned !== undefined && !Number.isNaN(earned) && max > 0) {
                          const clamped = Math.min(Math.max(earned, 0), max);
                          contrib = (clamped / max) * a.weight;
                        }
                        return (
                          <TableRow key={a.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{a.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Weight: {a.weight}%
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={earned ?? ''}
                                  onChange={(e) => setScores((s) => ({ 
                                    ...s, 
                                    [a.id]: { ...(s[a.id] ?? {}), earned: Number(e.target.value) } 
                                  }))}
                                  min={0}
                                  placeholder="Score"
                                  className="flex-1"
                                />
                                {earned !== undefined && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearAssessment(a.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={max}
                                onChange={(e) => setScores((s) => ({ 
                                  ...s, 
                                  [a.id]: { ...(s[a.id] ?? {}), max: Number(e.target.value) } 
                                }))}
                                min={0}
                                placeholder="Max"
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <div className="font-medium">{contrib.toFixed(2)}%</div>
                                <div className="text-sm text-muted-foreground">
                                  {earned !== undefined && !Number.isNaN(earned) && max > 0 
                                    ? `${((earned / max) * 100).toFixed(1)}% of ${a.weight}%`
                                    : `0% of ${a.weight}%`
                                  }
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Overall Grade Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Overall Grade</CardTitle>
              <div className="text-4xl font-bold text-primary">{overall.toFixed(2)}%</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completedAssessments} of {assessments.length}</span>
                </div>
                <Progress value={(completedAssessments / assessments.length) * 100} className="h-2 [&>div]:bg-accent" />
              </div>
              
              {completedAssessments > 0 && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Current Standing</div>
                  <div className="text-xl font-semibold">{(standing * 100).toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">
                    Average on completed work
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <Doughnut 
                  data={data} 
                  options={{ 
                    cutout: "70%", 
                    maintainAspectRatio: false, 
                    plugins: { 
                      legend: { position: "bottom" } 
                    } 
                  }} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Assessment Weights Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Weights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{assessment.name}</div>
                      <div className="text-xs text-muted-foreground">{assessment.category}</div>
                    </div>
                    <Badge variant="outline">{assessment.weight}%</Badge>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{assessments.reduce((sum, a) => sum + a.weight, 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
