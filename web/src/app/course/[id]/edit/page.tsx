"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Trash2, Brain, Info, Loader2 } from "lucide-react";
import { Assessment } from '@/components/CalculatorShadcn';

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

  const addAssessment = () => {
    const newAssessment: Assessment = {
      id: `assessment-${Date.now()}`,
      name: `Assessment ${assessments.length + 1}`,
      category: 'Assignments',
      max: 100,
      weight: 10
    };
    setAssessments([...assessments, newAssessment]);
  };

  const removeAssessment = (id: string) => {
    setAssessments(assessments.filter(a => a.id !== id));
  };

  const updateAssessment = (id: string, field: keyof Assessment, value: any) => {
    setAssessments(assessments.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

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
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Course not found</AlertDescription>
      </Alert>
    );
  }

  const categories = Array.from(new Set(assessments.map(a => a.category)));
  const totalWeight = assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  const isWeightValid = totalWeight === 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit {course.name}</h1>
            <p className="text-muted-foreground">Modify assessments and weights</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={saveCourse} disabled={!isWeightValid || saving} className="bg-accent hover:bg-accent/90 text-white border-accent shadow-sm">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* AI Info Alert */}
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>AI-Generated Assessments:</strong> These assessments were automatically extracted from your course outline. 
          You can edit names, categories, weights, and maximum points to match your actual course requirements.
        </AlertDescription>
      </Alert>

      {/* Assessments Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Assessments</CardTitle>
              <Badge variant={isWeightValid ? "default" : "secondary"}>
                {totalWeight.toFixed(1)}% total weight
              </Badge>
              {!isWeightValid && (
                <Info className="h-4 w-4 text-orange-500" title="Total weight should equal 100% for accurate grade calculations" />
              )}
            </div>
            <Button onClick={addAssessment} size="sm" className="bg-accent hover:bg-accent/90 text-white border-accent shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isWeightValid && (
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Weight Adjustment Needed:</strong> Total weight is {totalWeight.toFixed(1)}%. 
                Adjust individual weights so they add up to 100% for accurate grade calculations.
              </AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Max Points</TableHead>
                <TableHead>Weight (%)</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    <Input
                      value={assessment.name}
                      onChange={(e) => updateAssessment(assessment.id, 'name', e.target.value)}
                      placeholder="Assessment name"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={assessment.category}
                      onValueChange={(value) => updateAssessment(assessment.id, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Create new category</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={assessment.max}
                      onChange={(e) => updateAssessment(assessment.id, 'max', Number(e.target.value))}
                      min={1}
                      placeholder="Max points"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={assessment.weight}
                      onChange={(e) => updateAssessment(assessment.id, 'weight', Number(e.target.value))}
                      min={0}
                      max={100}
                      placeholder="Weight %"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssessment(assessment.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total: {assessments.length} assessments, {totalWeight.toFixed(1)}% weight
            </p>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}