const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword() {
    const email = '16000rpm@gmail.com';
    const newPassword = 'SocialRunner2025';

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the user's password
        const user = await prisma.user.update({
            where: { email },
            data: { passwordHash: hashedPassword }
        });

        console.log(`Password reset successfully for user: ${user.email}`);
    } catch (error) {
        console.error('Failed to reset password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
