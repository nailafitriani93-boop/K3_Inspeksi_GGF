import { prisma } from "@/lib/db";

function dateOk(v) { return !v || /^\d{4}-\d{2}-\d{2}$/.test(v); }

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const noWilayah = Number(searchParams.get("noWilayah"));

    if (!dateOk(from) || !dateOk(to) || (from && to && from > to)) {
      return Response.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
    }

    const where = [];
    if (from) where.push(`tanggal_temuan >= '${from}'`);
    if (to) where.push(`tanggal_temuan <= '${to}'`);
    if (Number.isInteger(noWilayah) && noWilayah >= 1 && noWilayah <= 7) {
      where.push(`no_wilayah = ${noWilayah}`);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int total,
        COUNT(*) FILTER(WHERE status_temuan='OPEN')::int open,
        COUNT(*) FILTER(WHERE status_temuan='CLOSE')::int close,
        COUNT(*) FILTER(WHERE status_temuan='OPEN' AND (CURRENT_DATE - tanggal_temuan) > 7)::int overdue
      FROM public.temuan_k3 ${w}
    `);

    const x = rows[0];
    return Response.json({
      ...x,
      closeRate: x.total ? Number(((x.close / x.total) * 100).toFixed(1)) : 0,
    });
  } catch (e) {
    console.error("GET /api/dashboard/summary:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
