# Smart Grade Calculators

An AI-powered grade calculator that automatically creates personalized grade calculators from course outlines.

## Features

- 🔐 **User Authentication**: Secure Google OAuth login
- 📁 **File Upload**: Support for PDF, HTML, and image files
- 🤖 **AI Parsing**: Automatic extraction of assessment information
- 📊 **Grade Tracking**: Real-time grade calculations with progress tracking
- 💾 **Data Persistence**: Secure cloud storage with Vercel Blob
- 🎨 **Modern UI**: Beautiful interface built with shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **File Storage**: Vercel Blob
- **AI**: Google Gemini API (optional)

## Deployment to Vercel

### 1. Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres recommended)
- Google OAuth credentials
- Vercel Blob storage

### 2. Environment Variables

Set these environment variables in your Vercel dashboard:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Google AI (optional)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

### 3. Database Setup

1. Create a PostgreSQL database
2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`

### 5. Vercel Blob Setup

1. Install Vercel Blob in your Vercel dashboard
2. Get your `BLOB_READ_WRITE_TOKEN`

### 6. Deploy

1. Connect your GitHub repository to Vercel
2. Deploy with the environment variables set
3. Run database migrations after deployment

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth configuration
│   │   └── courses/       # Course management API
│   ├── auth/              # Authentication pages
│   ├── course/            # Course pages
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   └── ...                # Custom components
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database connection
│   └── ai-parser.ts      # AI parsing logic
└── prisma/
    └── schema.prisma     # Database schema
```

## Features in Detail

### User Authentication
- Secure Google OAuth integration
- Session management with NextAuth.js
- Protected routes and API endpoints

### File Management
- Upload course outlines (PDF, HTML, images)
- Secure cloud storage with Vercel Blob
- Automatic file processing and parsing

### AI-Powered Parsing
- Extract assessment information from course outlines
- Automatic weight normalization
- Fallback to regex parsing if AI fails

### Grade Tracking
- Real-time grade calculations
- Progress tracking with visual indicators
- Auto-save functionality
- Individual assessment management

### Modern UI
- Responsive design with Tailwind CSS
- Beautiful components with shadcn/ui
- Custom accent color (#abcca3)
- Smooth animations and transitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details