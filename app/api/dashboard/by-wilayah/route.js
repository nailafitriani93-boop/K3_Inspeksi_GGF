import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) || (from && to && from > to)) {
      return Response.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
    }
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        w.no_wilayah,
        'Wilayah ' || w.no_wilayah AS nama_wilayah,
        COUNT(t.id_temuan)::int AS total,
        COUNT(t.id_temuan) FILTER (WHERE t.status_temuan = 'OPEN')::int AS open,
        COUNT(t.id_temuan) FILTER (WHERE t.status_temuan = 'CLOSE')::int AS close
      FROM generate_series(1,7) AS w(no_wilayah)
      LEFT JOIN public.temuan_k3 t
        ON t.no_wilayah = w.no_wilayah
        AND ${from ? `t.tanggal_temuan >= '${from}'` : "TRUE"}
        AND ${to ? `t.tanggal_temuan <= '${to}'` : "TRUE"}
      GROUP BY w.no_wilayah
      ORDER BY w.no_wilayah
    `);
    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/dashboard/by-wilayah:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
