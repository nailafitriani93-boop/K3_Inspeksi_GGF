import { prisma } from "@/lib/db";

function dateOk(v) {
  return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const noWilayahRaw = searchParams.get("noWilayah") || "";
    const noWilayah = Number(noWilayahRaw);
    if (
      !dateOk(from) ||
      !dateOk(to) ||
      (from && to && from > to)
    ) {
      return Response.json(
        { error: "Rentang tanggal tidak valid" },
        { status: 400 }
      );
    }

    const where = [];

    if (from) {
      where.push(`t.tanggal_temuan >= '${from}'`);
    }

    if (to) {
      where.push(`t.tanggal_temuan <= '${to}'`);
    }

    if (
      noWilayahRaw &&
      Number.isInteger(noWilayah) &&
      noWilayah >= 1
    ) {
      where.push(
        `(t.no_wilayah = ${noWilayah} OR t.id_wilayah = (
          SELECT id_wilayah
          FROM public.master_wilayah
          WHERE no_wilayah = ${noWilayah}
        ))`
      );
    }

    const w = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE t.status_temuan = 'OPEN'
        )::int AS open,

        COUNT(*) FILTER (
          WHERE t.status_temuan = 'CLOSE'
        )::int AS close,

        COUNT(*) FILTER (
          WHERE t.status_temuan = 'OPEN'
          AND (CURRENT_DATE - t.tanggal_temuan) > 7
        )::int AS overdue

      FROM public.temuan_k3 t
      ${w}
    `);

    const x = rows[0];

    return Response.json({
      ...x,

      closeRate: x.total
        ? Number(
            ((x.close / x.total) * 100).toFixed(1)
          )
        : 0,
    });
  } catch (e) {
    console.error(
      "GET /api/dashboard/summary:",
      e
    );

    return Response.json(
      { error: e.message },
      { status: 500 }
    );
  }
}