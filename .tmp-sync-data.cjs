const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const tables = [
  ["master_wilayah", "id_wilayah"],
  ["master_aktivitas", "id_aktivitas"],
  ["master_grup_temuan", "id_grup"],
  ["master_mandor", "id_mandor"],
  ["master_lokasi", "id_lokasi"],
  ["master_pic", "id_pic"],
  ["users", "id_user"],
  ["inspeksi_k3", "id_inspeksi"],
  ["temuan_k3", "id_temuan"],
];

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString().replace("T", " ").replace("Z", "+00")}'`;
  if (typeof value === "object") return `'${JSON.stringify(value).replaceAll("'", "''")}'`;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

(async () => {
  const chunks = ["BEGIN;"];
  for (const [table, primaryKey] of tables) {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM public.${table}`);
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const assignments = columns
      .filter((column) => column !== primaryKey)
      .map((column) => `\"${column}\" = EXCLUDED.\"${column}\"`)
      .join(", ");
    for (const row of rows) {
      const values = columns.map((column) => quote(row[column])).join(", ");
      chunks.push(
        `INSERT INTO public.\"${table}\" (\"${columns.join('\", \"')}\") VALUES (${values}) ON CONFLICT (\"${primaryKey}\") DO UPDATE SET ${assignments};`
      );
    }
    chunks.push(`SELECT setval(pg_get_serial_sequence('public.\"${table}\"', '${primaryKey}'), COALESCE((SELECT MAX(\"${primaryKey}\") FROM public.\"${table}\"), 1), true) WHERE pg_get_serial_sequence('public.\"${table}\"', '${primaryKey}') IS NOT NULL;`);
  }
  chunks.push("COMMIT;");
  fs.writeFileSync(".tmp-local-data-sync.sql", chunks.join("\n"));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
