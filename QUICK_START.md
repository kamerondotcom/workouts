# Quick Start Guide

Get your Workout Tracker up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies (if not already done)

```bash
npm install
```

### 2. Configure Database

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/workouts_db?schema=public"
```

**Don't have PostgreSQL?** Use a free hosted option:

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) - Free tier available
- [Supabase](https://supabase.com/) - 500MB free
- [Neon](https://neon.tech/) - Free tier available

### 3. Set Up Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Start the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Import Your Workouts

1. Use the CSV import form on the home page
2. Or test with the provided `sample-workout.csv` file

## 📋 CSV Format

Your CSV should have these columns:

| Column               | Example              |
| -------------------- | -------------------- |
| Date                 | 2025-10-21           |
| Location             | The Yard Gym         |
| Workout Type         | Functional Strength  |
| Duration (min)       | 48                   |
| Active Calories      | 374                  |
| Total Calories       | 465                  |
| Avg Heart Rate (bpm) | 133                  |
| Effort (1–10)        | 7                    |
| Component            | Component 1          |
| Exercise             | 5 Barbell Back Squat |
| Notes                | (optional)           |

## 🎯 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Database
npx prisma studio       # Open database GUI
npx prisma generate     # Generate Prisma Client
npx prisma db push      # Sync schema to database
npx prisma migrate dev  # Create a migration

# Deployment
vercel                  # Deploy to Vercel
```

## 🔧 Troubleshooting

### "Can't reach database server"

- Check your `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running (if using local database)

### "Prisma Client not found"

```bash
npx prisma generate
```

### TypeScript errors in IDE

- Restart your editor's TypeScript server
- Or: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

## 📊 GraphQL API

Access the GraphQL API at: `http://localhost:3000/api/graphql`

**Example Query:**

```graphql
query {
  workouts(limit: 10) {
    id
    date
    location
    exercise
    duration
  }
}
```

## 🚢 Deploy to Vercel

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add Vercel Postgres from Storage tab
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Learn More

- [README.md](./README.md) - Full documentation
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

## 💡 Tips

- Use `sample-workout.csv` to test the import functionality
- Open Prisma Studio (`npx prisma studio`) to view your data
- The app supports dark mode automatically
- All workouts are grouped by date and component

## 🐛 Still Having Issues?

1. Delete `node_modules` and reinstall:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Reset the database (⚠️ deletes all data):

   ```bash
   npx prisma migrate reset
   ```

3. Check the logs:
   - Browser console for frontend errors
   - Terminal for backend errors

## ✨ Features

- ✅ CSV Import
- ✅ GraphQL API
- ✅ Beautiful UI with Tailwind CSS
- ✅ Dark Mode Support
- ✅ PostgreSQL Database
- ✅ Vercel-Ready
- ✅ TypeScript
- ✅ Responsive Design

Happy tracking! 💪
