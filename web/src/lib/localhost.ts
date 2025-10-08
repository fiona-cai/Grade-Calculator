// Utility function to check if running on localhost
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check if we're in development mode
    return process.env.NODE_ENV === 'development';
  }
  
  // Client-side: check the hostname
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '::1';
}

// Utility function to get demo data for non-localhost environments
export function getDemoCourses() {
  return [
    {
      id: 'demo-math-135',
      name: 'MATH 135 - Calculus I',
      assessments: [
        { id: 'quiz1', name: 'Quiz 1', category: 'Quizzes', max: 100, weight: 5 },
        { id: 'quiz2', name: 'Quiz 2', category: 'Quizzes', max: 100, weight: 5 },
        { id: 'quiz3', name: 'Quiz 3', category: 'Quizzes', max: 100, weight: 5 },
        { id: 'quiz4', name: 'Quiz 4', category: 'Quizzes', max: 100, weight: 5 },
        { id: 'midterm', name: 'Midterm Exam', category: 'Exams', max: 100, weight: 30 },
        { id: 'final', name: 'Final Exam', category: 'Exams', max: 100, weight: 50 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-cs-101',
      name: 'CS 101 - Introduction to Programming',
      assessments: [
        { id: 'hw1', name: 'Homework 1', category: 'Assignments', max: 100, weight: 10 },
        { id: 'hw2', name: 'Homework 2', category: 'Assignments', max: 100, weight: 10 },
        { id: 'hw3', name: 'Homework 3', category: 'Assignments', max: 100, weight: 10 },
        { id: 'project1', name: 'Project 1', category: 'Projects', max: 100, weight: 20 },
        { id: 'project2', name: 'Project 2', category: 'Projects', max: 100, weight: 20 },
        { id: 'final', name: 'Final Exam', category: 'Exams', max: 100, weight: 30 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
