const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const wilayah = await prisma.master_wilayah.findMany({
    orderBy: {
      id_wilayah: "asc",
    },
  });

  console.table(wilayah);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());