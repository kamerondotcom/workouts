# Setup Guide

This guide will help you set up and run the Workout Tracker application.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or hosted)
- npm or yarn package manager

## Step 1: Install Dependencies

All dependencies are already installed if you've cloned this project. If not, run:

```bash
npm install
```

## Step 2: Set Up Database

### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine if you haven't already
2. Create a new database:
   ```bash
   createdb workouts_db
   ```
3. Update the `.env.local` file with your database connection string:
   ```
   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/workouts_db?schema=public"
   ```

### Option B: Hosted PostgreSQL (Recommended for Vercel)

Use a hosted PostgreSQL service like:

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com/)
- [Neon](https://neon.tech/)
- [Railway](https://railway.app/)

Get your connection string and add it to `.env.local`:

```
DATABASE_URL="your-connection-string-here"
```

## Step 3: Run Database Migrations

Generate the Prisma Client and create database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init
```

If you encounter issues, you can push the schema directly:

```bash
npx prisma db push
```

## Step 4: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Import Workout Data

1. Prepare your CSV file with the following columns:

   - Date
   - Location
   - Workout Type
   - Duration (min)
   - Active Calories
   - Total Calories
   - Avg Heart Rate (bpm)
   - Effort (1–10)
   - Component
   - Exercise
   - Notes

2. Use the provided `sample-workout.csv` as a reference

3. On the home page, click "Choose File" and select your CSV

4. Click "Import CSV" to upload your workouts

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors in your IDE, try:

1. Restart the TypeScript server (in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Database Connection Issues

- Verify your `DATABASE_URL` in `.env.local` is correct
- Ensure PostgreSQL is running (for local databases)
- Check firewall settings if using a hosted database

### Prisma Client Not Found

Run:

```bash
npx prisma generate
```

### Migration Errors

If migrations fail, you can reset the database (⚠️ this deletes all data):

```bash
npx prisma migrate reset
```

## Next Steps

- Explore the GraphQL API at `/api/graphql`
- View your data in Prisma Studio: `npx prisma studio`
- Deploy to Vercel (see README.md for deployment instructions)

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Push schema without creating migration
npx prisma db push

# Reset database
npx prisma migrate reset
```

## Support

If you encounter any issues not covered here, please check:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server)
