# Deployment Guide for Smart Grade Calculators

## Quick Deploy to Vercel

### 1. Prerequisites Setup

#### Database (Vercel Postgres)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or go to your existing project
3. Go to Storage tab → Create Database → Postgres
4. Copy the `DATABASE_URL` connection string

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set Application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local development)
7. Copy Client ID and Client Secret

#### Vercel Blob Storage
1. In your Vercel project dashboard
2. Go to Storage tab → Create Database → Blob
3. Copy the `BLOB_READ_WRITE_TOKEN`

#### Google AI API (Optional)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Copy the API key

### 2. Environment Variables

Set these in your Vercel project settings:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="generate-a-random-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Google AI (optional)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

### 3. Deploy Steps

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Set build command: `npm run build`
   - Set output directory: `.next`

2. **Deploy**
   - Deploy your project
   - Wait for build to complete

3. **Database Migration**
   - After deployment, run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
   - Or use Vercel CLI:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

### 4. Post-Deployment Setup

1. **Test Authentication**
   - Visit your deployed app
   - Try signing in with Google
   - Verify redirect works correctly

2. **Test File Upload**
   - Upload a course outline
   - Verify file is stored in Vercel Blob
   - Check database for course record

3. **Test Grade Calculator**
   - Create a course
   - Add some grades
   - Verify calculations work

### 5. Troubleshooting

#### Common Issues:

**Database Connection Error**
- Check `DATABASE_URL` is correct
- Ensure database is accessible from Vercel
- Run migrations: `npx prisma migrate deploy`

**Authentication Not Working**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches exactly
- Ensure `NEXTAUTH_URL` is set correctly

**File Upload Failing**
- Check `BLOB_READ_WRITE_TOKEN` is valid
- Verify Vercel Blob storage is enabled
- Check file size limits

**Build Errors**
- Check all dependencies are installed
- Verify TypeScript compilation
- Check for missing environment variables

### 6. Production Checklist

- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Google OAuth configured
- [ ] Vercel Blob storage enabled
- [ ] Authentication working
- [ ] File upload working
- [ ] Grade calculations working
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Performance optimized

### 7. Monitoring

Monitor your application:
- Vercel Analytics for performance
- Database connection pool usage
- Blob storage usage
- Error logs in Vercel dashboard

### 8. Scaling Considerations

- Database connection pooling
- CDN for static assets
- Caching strategies
- Rate limiting for API endpoints
- File size limits
- User session management

## Local Development

For local development, create a `.env.local` file with the same variables:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/gradecalculator"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

Then run:
```bash
npm install
npx prisma migrate dev
npm run dev
```
