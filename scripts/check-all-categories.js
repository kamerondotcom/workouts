const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAllCategories() {
  try {
    console.log("🔍 Checking all categories in the database...");

    // Get all categories
    const allCategories = await prisma.category.findMany({
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    console.log(`\n📂 Found ${allCategories.length} categories total:`);
    allCategories.forEach((category, index) => {
      console.log(
        `  ${index + 1}. ${category.name} (${category.color}) - User: ${
          category.user.email
        }`
      );
    });

    // Get all workout session categories
    const sessionCategories = await prisma.workoutSessionCategory.findMany({
      include: {
        session: {
          select: { workoutType: true, location: true, date: true },
        },
        category: {
          select: { name: true, color: true },
        },
      },
    });

    console.log(
      `\n🔗 Found ${sessionCategories.length} workout session category assignments:`
    );
    sessionCategories.forEach((sc, index) => {
      console.log(
        `  ${index + 1}. Session: ${sc.session.workoutType} - Category: ${
          sc.category.name
        }`
      );
    });

    // Check if any sessions have categories
    const sessionsWithCategories = await prisma.workoutSession.findMany({
      where: {
        categories: {
          some: {},
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    console.log(
      `\n🏋️ Sessions with categories: ${sessionsWithCategories.length}`
    );
    sessionsWithCategories.forEach((session, index) => {
      console.log(
        `  ${index + 1}. ${session.workoutType} (${session.location})`
      );
      session.categories.forEach((cat) => {
        console.log(`    - ${cat.category.name} (${cat.category.color})`);
      });
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllCategories();
