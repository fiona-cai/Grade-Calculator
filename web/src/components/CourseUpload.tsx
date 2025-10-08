"use client";
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, File, Brain, AlertCircle, Loader2 } from "lucide-react";
import { isLocalhost } from '@/lib/localhost';

interface CourseUploadProps {
  onCourseCreated: (course: any) => void;
}

export function CourseUpload({ onCourseCreated }: CourseUploadProps) {
  const [courseName, setCourseName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLocal, setIsLocal] = useState(false);

  // Check if running on localhost
  useEffect(() => {
    setIsLocal(isLocalhost());
  }, []);

  const handleFileChange = (file: File | null) => {
    setFile(file);
    setError(null);
    
    // Auto-generate course name from filename if not provided
    if (file && !courseName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setCourseName(nameWithoutExt);
    }
  };

  const handleSubmit = async () => {
    if (!file || !courseName.trim()) {
      setError('Please provide both a course name and file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setStatusMessage('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseName', courseName.trim());

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      setStatusMessage('Analyzing course outline with AI...');

      const response = await fetch('/api/courses', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      setStatusMessage('Course created successfully!');
      const course = await response.json();
      onCourseCreated(course);
      
      // Reset form
      setCourseName('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setStatusMessage('');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadProgress(0);
      setStatusMessage('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Warning */}
      {!isLocal && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> Course creation is disabled in demo mode. 
            To create courses, please run this application on localhost.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="courseName">Course Name</Label>
        <Input
          id="courseName"
          placeholder="e.g., MATH 135, CS 101"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Course Outline File</Label>
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${file 
              ? 'border-accent bg-accent/10 text-accent' 
              : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.html,.htm"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <File className="h-6 w-6 text-accent" />
              <span className="font-medium">{file.name}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Drag and drop your course outline here, or click to browse</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Supported formats: PDF, PNG, JPG, HTML
        </p>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{statusMessage}</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!file || !courseName.trim() || isUploading || !isLocal}
        className="w-full bg-accent hover:bg-accent/90 text-white border-accent shadow-sm"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing with AI...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            Create Grade Calculator
          </>
        )}
      </Button>
    </div>
  );
}