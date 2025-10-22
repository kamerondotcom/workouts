const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateUserData() {
  try {
    console.log("🚀 Starting user data migration...");

    // 1. Create a default user first
    const defaultUser = await prisma.user.create({
      data: {
        email: "user@example.com",
        name: "Default User",
      },
    });

    console.log("✅ Created default user:", defaultUser.id);

    // 2. Update all existing workout sessions to have the userId
    // We need to do this in a transaction to ensure data consistency
    const updateResult = await prisma.$transaction(async (tx) => {
      // Get all workout sessions that don't have a userId
      const sessionsWithoutUser = await tx.workoutSession.findMany({
        where: {
          userId: null,
        },
      });

      console.log(`Found ${sessionsWithoutUser.length} sessions to migrate`);

      // Update each session
      for (const session of sessionsWithoutUser) {
        await tx.workoutSession.update({
          where: { id: session.id },
          data: { userId: defaultUser.id },
        });
      }

      return sessionsWithoutUser.length;
    });

    console.log(
      `✅ Updated ${updateResult} workout sessions to belong to user ${defaultUser.id}`
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
migrateUserData()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
