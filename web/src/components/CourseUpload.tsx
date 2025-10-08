"use client";
import { useState, useRef } from 'react';
import { Button, Card, Group, Text, TextInput, Stack, FileInput, Alert, Progress } from '@mantine/core';
import { IconUpload, IconFile, IconAlertCircle, IconBrain } from '@tabler/icons-react';

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

      setStatusMessage('Analyzing course outline with Google Gemini AI...');

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
    <Card withBorder padding="lg" radius="md">
      <Stack gap="md">
        <Group gap="sm">
          <IconBrain size={20} color="#3b82f6" />
          <Text size="lg" fw={600}>Upload Course Outline</Text>
        </Group>
        
        <Text size="sm" c="dimmed">
          Upload a PDF or HTML course outline and Google Gemini AI will automatically extract assessment information to create your grade calculator.
        </Text>
        
        <TextInput
          label="Course Name"
          placeholder="e.g., MATH 135, CS 101"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          required
        />

        <div>
          <Text size="sm" fw={500} mb="xs">Course Outline File</Text>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: file ? '#f0f9ff' : '#fafafa',
              borderColor: file ? '#3b82f6' : '#ccc',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.html,.htm"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            
            {file ? (
              <Group justify="center" gap="sm">
                <IconFile size={24} color="#3b82f6" />
                <Text c="blue" fw={500}>{file.name}</Text>
              </Group>
            ) : (
              <Group justify="center" gap="sm">
                <IconUpload size={24} color="#666" />
                <Text c="dimmed">
                  Drag and drop your course outline here, or click to browse
                </Text>
              </Group>
            )}
          </div>
          <Text size="xs" c="dimmed" mt="xs">
            Supported formats: PDF, PNG, JPG, HTML
          </Text>
        </div>

        {isUploading && (
          <div>
            <Text size="sm" mb="xs">{statusMessage}</Text>
            <Progress value={uploadProgress} animated />
          </div>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          loading={isUploading}
          disabled={!file || !courseName.trim()}
          fullWidth
          leftSection={!isUploading ? <IconBrain size={16} /> : undefined}
        >
          {isUploading ? 'Processing with Google Gemini...' : 'Create Grade Calculator'}
        </Button>
      </Stack>
    </Card>
  );
}
