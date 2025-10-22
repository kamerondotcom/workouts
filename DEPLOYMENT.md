# Deployment Guide for Vercel

This guide walks you through deploying your Workout Tracker application to Vercel.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a Git repository

## Step 1: Push Code to GitHub

If you haven't already, initialize a git repository and push your code:

```bash
git init
git add .
git commit -m "Initial commit - Workout Tracker"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Next.js project

## Step 3: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)

1. In your Vercel project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Follow the prompts to create your database
5. Vercel will automatically add `DATABASE_URL` and other environment variables to your project

### Option B: External PostgreSQL Provider

If using an external provider (Supabase, Neon, Railway, etc.):

1. Create a PostgreSQL database with your provider
2. Get the connection string
3. In Vercel project settings, go to "Environment Variables"
4. Add a new variable:
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string
   - Environment: Production, Preview, and Development

## Step 4: Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (or `prisma generate && next build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install`

The `vercel.json` file in your project already configures these.

## Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 1-2 minutes)
3. Once deployed, you'll get a URL like `https://your-project.vercel.app`

## Step 6: Run Database Migrations

After your first deployment, you need to set up the database schema:

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Link your project:

   ```bash
   vercel link
   ```

3. Pull environment variables:

   ```bash
   vercel env pull .env.local
   ```

4. Run migrations:

   ```bash
   npx prisma migrate deploy
   ```

   Or push the schema:

   ```bash
   npx prisma db push
   ```

### Method 2: Using Prisma Data Platform

1. Sign up at [cloud.prisma.io](https://cloud.prisma.io)
2. Connect your database
3. Run migrations through the web interface

### Method 3: Direct Database Connection

1. Use a database client (like TablePlus, DBeaver, or pgAdmin)
2. Connect using your database credentials
3. Run the SQL from `prisma/migrations/` manually

## Step 7: Test Your Deployment

1. Visit your deployed URL
2. Try importing a CSV file
3. Verify workouts are displayed correctly
4. Check the GraphQL endpoint at `/api/graphql`

## Continuous Deployment

Vercel automatically deploys:

- **Production**: Every push to your `main` branch
- **Preview**: Every push to other branches or pull requests

## Environment Variables

Essential environment variables:

```env
DATABASE_URL="postgresql://..."
```

Optional environment variables:

```env
NODE_ENV="production"
```

## Troubleshooting

### Build Failures

If the build fails:

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - Prisma Client not generated → Add `prisma generate` to build command
   - TypeScript errors → Fix locally and push

### Database Connection Errors

- Verify `DATABASE_URL` is set correctly
- Ensure database accepts connections from Vercel's IP range
- Check if database provider requires SSL (add `?sslmode=require` to connection string)

### Prisma Issues

If Prisma Client is not found:

1. Ensure `postinstall` script in `package.json` includes `prisma generate`
2. Or add to build command: `prisma generate && next build`

### CSV Import Not Working

- Check file upload limits (Vercel has a 4.5MB limit for serverless functions)
- For large files, consider using Edge Functions or increasing timeout

## Performance Optimization

### Database Connection Pooling

For production, use connection pooling:

1. Add Prisma Data Proxy or use your database provider's pooler
2. Update `DATABASE_URL` with pooled connection string

### Edge Functions

For better global performance, consider deploying API routes as Edge Functions:

```typescript
export const runtime = "edge";
```

Add this to your API routes if they're simple enough for Edge runtime.

## Monitoring

1. Check Vercel Analytics for performance metrics
2. Use Vercel Logs for debugging
3. Set up error tracking (Sentry, LogRocket, etc.)

## Updating Your Deployment

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push
```

Vercel will automatically build and deploy the new version.

## Custom Domain

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Wait for SSL certificate to be issued (automatic)

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)

## Support

If you encounter issues:

- Check [Vercel Discussions](https://github.com/vercel/vercel/discussions)
- Review [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- Contact Vercel Support through the dashboard
