const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'rahul@socialrunner.app';
  const password = 'SocialRunner2025!';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('Default user already exists:', email);
    return;
  }

  // Hash password with 12 rounds (same as authService)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create default user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Rahul Prakash Menon',
      isActive: true
    }
  });

  console.log('Default user created:', user.email);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
