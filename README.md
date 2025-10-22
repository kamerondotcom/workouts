# 💪 Workout Tracker

A modern workout tracking application built with Next.js, GraphQL, and PostgreSQL. Import your workout data from CSV files and visualize your fitness journey with a beautiful, responsive interface.

## Features

- 📊 **CSV Import**: Upload workout data from CSV files
- 🔍 **GraphQL API**: Efficient data querying with GraphQL
- 💾 **PostgreSQL Database**: Robust data storage with Prisma ORM
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🚀 **Vercel Ready**: Optimized for easy deployment on Vercel
- 🌙 **Dark Mode**: Full dark mode support

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/workouts_db?schema=public"
```

For Vercel deployment, the `DATABASE_URL` will be automatically provided by Vercel Postgres.

3. Set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## CSV Format

Your CSV file should have the following columns:

- `Date`: Workout date (YYYY-MM-DD format)
- `Location`: Workout location
- `Workout Type`: Type of workout
- `Duration (min)`: Duration in minutes
- `Active Calories`: Active calories burned
- `Total Calories`: Total calories burned
- `Avg Heart Rate (bpm)`: Average heart rate
- `Effort (1–10)`: Effort level on a scale of 1-10
- `Component`: Workout component/section
- `Exercise`: Exercise name
- `Notes`: Additional notes (optional)

### Example CSV:

```csv
Date,Location,Workout Type,Duration (min),Active Calories,Total Calories,Avg Heart Rate (bpm),Effort (1–10),Component,Exercise,Notes
2025-10-21,The Yard Gym,Functional Strength,48,374,465,133,7,Component 1,5 Barbell Back Squat,
2025-10-21,The Yard Gym,Functional Strength,48,374,465,133,7,Component 1,10 Banded Lat Pulldown,
```

## GraphQL API

The GraphQL API is available at `/api/graphql`. You can explore the API using the built-in GraphQL playground when running the development server.

### Example Queries

**Get all workouts:**

```graphql
query {
  workouts(limit: 10) {
    id
    date
    location
    workoutType
    exercise
    duration
    activeCalories
  }
}
```

**Get workouts by date:**

```graphql
query {
  workoutsByDate(date: "2025-10-21") {
    id
    exercise
    component
    effort
  }
}
```

## Deployment to Vercel

1. Push your code to GitHub

2. Import your project to Vercel

3. Add Vercel Postgres to your project:

   - Go to the "Storage" tab in your Vercel project
   - Create a new Postgres database
   - The `DATABASE_URL` environment variable will be automatically configured

4. Run database migrations in Vercel:

   - Go to Settings → Environment Variables
   - Add your database connection string if not using Vercel Postgres
   - Run migrations through Vercel CLI or use Prisma Studio

5. Deploy! 🚀

## Project Structure

```
workouts/
├── app/
│   ├── api/
│   │   ├── graphql/        # GraphQL API endpoint
│   │   └── import/         # CSV import endpoint
│   ├── components/         # React components
│   │   ├── ApolloProvider.tsx
│   │   ├── CSVImport.tsx
│   │   └── WorkoutList.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── graphql/
│   │   ├── schema.ts       # GraphQL schema
│   │   └── resolvers.ts    # GraphQL resolvers
│   ├── apollo-client.ts    # Apollo Client configuration
│   └── prisma.ts           # Prisma client
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## Database Schema

The `Workout` model includes:

- `id`: Unique identifier
- `date`: Workout date
- `location`: Workout location
- `workoutType`: Type of workout
- `duration`: Duration in minutes
- `activeCalories`: Active calories burned
- `totalCalories`: Total calories burned
- `avgHeartRate`: Average heart rate in bpm
- `effort`: Effort level (1-10)
- `component`: Workout component/section
- `exercise`: Exercise name
- `notes`: Optional notes
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
