const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCategories() {
  try {
    console.log('🔍 Debugging categories and workout sessions...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`, users.map(u => ({ id: u.id, email: u.email })));
    
    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    const userId = users[0].id;
    console.log(`Using user: ${userId}`);
    
    // Get user's categories
    const categories = await prisma.category.findMany({
      where: { userId }
    });
    console.log(`\n📂 User has ${categories.length} categories:`, categories);
    
    // Get user's workout sessions with categories
    const sessions = await prisma.workoutSession.findMany({
      where: { userId },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      take: 5
    });
    
    console.log(`\n🏋️ User has ${sessions.length} workout sessions (showing first 5):`);
    sessions.forEach((session, index) => {
      console.log(`\nSession ${index + 1}: ${session.workoutType} - ${session.location}`);
      console.log(`  Categories: ${session.categories.length}`);
      session.categories.forEach(cat => {
        console.log(`    - ${cat.category.name} (${cat.category.color})`);
      });
    });
    
    // Get exercises for the first session
    if (sessions.length > 0) {
      const firstSession = sessions[0];
      const exercises = await prisma.workoutExercise.findMany({
        where: { sessionId: firstSession.id },
        take: 3
      });
      
      console.log(`\n💪 First session has ${exercises.length} exercises (showing first 3):`);
      exercises.forEach((exercise, index) => {
        console.log(`  ${index + 1}. ${exercise.exercise}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategories();
