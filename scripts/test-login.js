const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log("User found:", {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password.substring(0, 20) + "...",
    });

    // Test common passwords
    const passwords = ["password123", "password", "123456", "test123", "admin"];

    for (const password of passwords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`Password "${password}": ${isValid ? "VALID" : "invalid"}`);
    }
  } catch (error) {
    console.error("Error testing login:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
