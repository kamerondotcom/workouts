const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateToUsers() {
  try {
    console.log("🚀 Starting migration to user system...");

    // 1. Create a default user
    const defaultUser = await prisma.user.create({
      data: {
        email: "user@example.com",
        name: "Default User",
      },
    });

    console.log("✅ Created default user:", defaultUser.id);

    // 2. Update all existing workout sessions to belong to the default user
    const updateResult = await prisma.workoutSession.updateMany({
      where: {
        userId: null, // This will match all existing sessions
      },
      data: {
        userId: defaultUser.id,
      },
    });

    console.log(
      `✅ Updated ${updateResult.count} workout sessions to belong to user ${defaultUser.id}`
    );

    // 3. Verify the migration
    const userWorkouts = await prisma.workoutSession.count({
      where: {
        userId: defaultUser.id,
      },
    });

    console.log(
      `✅ Verification: User ${defaultUser.id} now has ${userWorkouts} workout sessions`
    );

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateToUsers()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
