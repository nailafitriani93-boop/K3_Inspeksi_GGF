const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    where: {
      username: {
        in: ["100001", "100002", "100003", "100004"],
      },
    },
    orderBy: {
      id_user: "asc",
    },
  });

  if (users.length !== 4) {
    throw new Error(
      `Ditemukan ${users.length} user. Seharusnya 4 user: 100001, 100002, 100003, 100004.`
    );
  }

  const esc = (value) => {
    if (value === null || value === undefined) {
      return "NULL";
    }

    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const sql = [
    "BEGIN;",
    "",
    "INSERT INTO users (id_user, username, password, nama_lengkap, email, role, akses_dashboard, aktif, created_at, updated_at) VALUES",
    users
      .map(
        (u) =>
          `(${u.id_user}, ${esc(u.username)}, ${esc(u.password)}, ${esc(
            u.nama_lengkap
          )}, ${esc(u.email)}, ${esc(u.role)}, ${u.akses_dashboard}, ${
            u.aktif
          }, ${esc(u.created_at.toISOString())}, ${esc(
            u.updated_at.toISOString()
          )})`
      )
      .join(",\n") + ";",
    "",
    "SELECT setval('users_id_user_seq', (SELECT MAX(id_user) FROM users));",
    "",
    "COMMIT;",
    "",
  ].join("\n");

  fs.writeFileSync("users_4_local.sql", sql, "utf8");

  console.log("=================================");
  console.log("EXPORT USER BERHASIL");
  console.log("Jumlah user:", users.length);
  console.log("=================================");

  users.forEach((u) => {
    console.log(`${u.username} - ${u.nama_lengkap} - ${u.role}`);
  });

  console.log("=================================");
  console.log("File dibuat: users_4_local.sql");
}

main()
  .catch((err) => {
    console.error("ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });