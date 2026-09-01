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
    if (from) clauses.push(`tanggal_temuan >= '${from}'`);
    if (to) clauses.push(`tanggal_temuan <= '${to}'`);
    const w = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        TO_CHAR(DATE_TRUNC('month',tanggal_temuan),'Mon YYYY') bulan,
        DATE_TRUNC('month',tanggal_temuan) sort_bulan,
        COUNT(*)::int jumlah,
        COUNT(*) FILTER(WHERE status_temuan='OPEN')::int open,
        COUNT(*) FILTER(WHERE status_temuan='CLOSE')::int close
      FROM public.temuan_k3
      ${w}
      GROUP BY 1,2
      ORDER BY sort_bulan
    `);
    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/dashboard/monthly:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
