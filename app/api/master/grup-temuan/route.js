import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        id_grup,
        kode_grup,
        nama_grup,
        aktif
      FROM public.master_grup_temuan
      WHERE aktif = TRUE
      ORDER BY id_grup ASC
    `);

    return Response.json(
      rows.map((row) => ({
        id_grup: Number(row.id_grup),
        kode_grup: row.kode_grup,
        nama_grup: row.nama_grup,
        aktif: row.aktif,
      }))
    );
  } catch (error) {
    console.error("ERROR GET /api/master/grup-temuan:", error);

    return Response.json(
      {
        error: error?.message || "Gagal mengambil data grup temuan",
      },
      { status: 500 }
    );
  }
}