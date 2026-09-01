const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      username: "budi.kabag",
      password: "123456",
      nama_lengkap: "Budi Santoso",
      role: "KABAG",
    },

    {
      username: "andi.kasie",
      password: "123456",
      nama_lengkap: "Andi Wijaya",
      role: "KASIE",
    },

    {
      username: "rina.kanwil",
      password: "123456",
      nama_lengkap: "Rina Sari",
      role: "KANWIL",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.users.upsert({
      where: {
        username: user.username,
      },

      update: {
        password: hashedPassword,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktif: true,
      },

      create: {
        username: user.username,
        password: hashedPassword,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktif: true,
      },
    });

    console.log(`User ${user.username} berhasil dibuat`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });