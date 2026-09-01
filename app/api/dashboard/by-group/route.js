import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) || (from && to && from > to)) {
      return Response.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
    }
    const clauses = [];
    if (from) clauses.push(`t.tanggal_temuan >= '${from}'`);
    if (to) clauses.push(`t.tanggal_temuan <= '${to}'`);
    const w = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const rows = await prisma.$queryRawUnsafe(`
      SELECT g.nama_grup, COUNT(t.*)::int jumlah
      FROM public.temuan_k3 t
      JOIN public.master_grup_temuan g ON g.id_grup=t.id_grup
      ${w}
      GROUP BY g.id_grup,g.nama_grup
      ORDER BY jumlah DESC
    `);
    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/dashboard/by-group:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
