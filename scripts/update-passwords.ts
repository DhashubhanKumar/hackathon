import { prisma } from "../lib/db";

async function main() {
    console.log("Updating test account passwords...");

    // Update 'a@gmail.com' and 'b@gmail.com' to have password 'dhashu'
    const users = ['a@gmail.com', 'b@gmail.com'];

    for (const email of users) {
        try {
            await prisma.user.update({
                where: { email },
                data: { password: 'dhashu' }
            });
            console.log(`Updated password for ${email}`);
        } catch (error) {
            console.error(`Failed to update ${email}: User might not exist.`);
        }
    }

    console.log("Done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
