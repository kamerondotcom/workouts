const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function resetKameronPassword() {
  try {
    // Reset password for kamerondotcom@mac.com
    const hashedPassword = await bcrypt.hash("password", 12);

    const user = await prisma.user.update({
      where: { email: "kamerondotcom@mac.com" },
      data: { password: hashedPassword },
    });

    console.log("Password reset for user:", user.email);
    console.log("New password: password");
  } catch (error) {
    console.error("Error resetting password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetKameronPassword();
