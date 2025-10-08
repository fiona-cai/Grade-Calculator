# Google AI-Powered Grade Calculator

## 🚀 **Current Status**

The application is now running with **Google Gemini AI** for intelligent course outline parsing. The system uses Google's Gemini 1.5 Flash model with enhanced fallback parsing when needed.

## 🔧 **Features**

### **Smart Course Outline Parsing**
- **AI-Powered**: Uses Google Gemini 1.5 Flash for intelligent parsing
- **Enhanced Fallback**: Sophisticated regex patterns for reliable parsing
- **Multiple Formats**: Supports PDF, HTML, PNG, JPG files
- **Auto-Detection**: Automatically identifies quizzes, exams, assignments, projects

### **Dynamic Grade Calculators**
- **Real-time Calculations**: Live grade updates as you enter scores
- **Category Grouping**: Organizes assessments by type
- **Visual Charts**: Doughnut charts showing grade distribution
- **Weight Validation**: Ensures total weights don't exceed 100%

### **Course Management**
- **Upload & Parse**: Drag-and-drop course outline uploads
- **Edit Assessments**: Modify names, categories, weights, and max points
- **Delete Courses**: Remove courses with confirmation
- **Persistent Storage**: Courses saved locally in JSON format

## 📊 **Enhanced Pattern Recognition**

The fallback parser now recognizes:
- **Quiz Patterns**: "Quiz 1: 10%", "Quiz 1 (10%)", "Quiz 1 - 10%"
- **Exam Patterns**: "Midterm: 30%", "Final Exam: 50%"
- **Assignment Patterns**: "Assignment 1: 15%"
- **Project Patterns**: "Project: 20%"

## 🔑 **API Key Management**

To enable AI parsing:
1. Add your Google AI API key to `.env.local`:
   ```
   GOOGLE_AI_API_KEY=your_api_key_here
   ```
2. Ensure you have sufficient API quota
3. The system will automatically use Google Gemini AI when available

## 🎯 **Usage**

1. **Upload Course**: Click "Add Course" and upload your course outline
2. **Auto-Parse**: System extracts assessment information automatically
3. **Calculate Grades**: Enter your scores and see real-time grade calculations
4. **Edit if Needed**: Use the edit button to modify assessments
5. **Track Progress**: Monitor your grade distribution with visual charts

## 🛠 **Technical Stack**

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Mantine components with modern design
- **Charts**: Chart.js with react-chartjs-2
- **File Processing**: pdf-parse for PDF text extraction
- **AI**: Google Gemini 1.5 Flash
- **Storage**: Local file system with JSON files

The application is fully functional with Google Gemini AI parsing and enhanced fallback pattern matching.