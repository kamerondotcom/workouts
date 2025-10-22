const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function transferWorkouts() {
  try {
    console.log("🔄 Transferring workouts to kamerondotcom@mac.com...");

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { email: "kamerondotcom@mac.com" },
    });

    if (!targetUser) {
      console.error("❌ Target user not found!");
      return;
    }

    console.log(`✅ Found target user: ${targetUser.email} (${targetUser.id})`);

    // Find the default user with all the workouts
    const defaultUser = await prisma.user.findUnique({
      where: { email: "user@example.com" },
      include: {
        workoutSessions: true,
      },
    });

    if (!defaultUser) {
      console.error("❌ Default user not found!");
      return;
    }

    console.log(
      `📊 Default user has ${defaultUser.workoutSessions.length} workouts`
    );

    // Transfer all workouts to the new user
    const updateResult = await prisma.workoutSession.updateMany({
      where: {
        userId: defaultUser.id,
      },
      data: {
        userId: targetUser.id,
      },
    });

    console.log(
      `✅ Transferred ${updateResult.count} workouts to ${targetUser.email}`
    );

    // Verify the transfer
    const newUserWorkouts = await prisma.workoutSession.count({
      where: {
        userId: targetUser.id,
      },
    });

    const defaultUserWorkouts = await prisma.workoutSession.count({
      where: {
        userId: defaultUser.id,
      },
    });

    console.log(`\n📈 Verification:`);
    console.log(`   ${targetUser.email}: ${newUserWorkouts} workouts`);
    console.log(`   ${defaultUser.email}: ${defaultUserWorkouts} workouts`);

    console.log("\n🎉 Transfer completed successfully!");
  } catch (error) {
    console.error("❌ Transfer failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

transferWorkouts();
