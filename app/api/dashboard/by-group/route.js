import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const noWilayahRaw = searchParams.get("noWilayah") || "";
    const noWilayah = Number(noWilayahRaw);

    if (
      (from &&
        !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
      (to &&
        !/^\d{4}-\d{2}-\d{2}$/.test(to)) ||
      (from && to && from > to)
    ) {
      return Response.json(
        {
          error: "Rentang tanggal tidak valid",
        },
        { status: 400 }
      );
    }

    const clauses = [];

    if (from) {
      clauses.push(
        `t.tanggal_temuan >= '${from}'`
      );
    }

    if (to) {
      clauses.push(
        `t.tanggal_temuan <= '${to}'`
      );
    }

    if (noWilayahRaw && Number.isInteger(noWilayah) && noWilayah >= 1) {
      clauses.push(`(t.no_wilayah = ${noWilayah} OR t.id_wilayah = (
        SELECT id_wilayah
        FROM public.master_wilayah
        WHERE no_wilayah = ${noWilayah}
      ))`);
    }

    const w = clauses.length
      ? `WHERE ${clauses.join(" AND ")}`
      : "";

    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE(g.nama_grup, 'Tanpa Grup') AS nama_grup,

        COUNT(*)::int AS jumlah,

        COUNT(t.*) FILTER (
          WHERE t.status_temuan = 'OPEN'
        )::int AS open,

        COUNT(t.*) FILTER (
          WHERE
            t.status_temuan = 'CLOSE'
        )::int AS close,

        COUNT(*) FILTER (
          WHERE
            (CURRENT_DATE - t.tanggal_temuan) > 7
        )::int AS overdue,

        COUNT(*) FILTER (
          WHERE
            (CURRENT_DATE - t.tanggal_temuan) > 7
        )::int AS terlambat

      FROM public.temuan_k3 t

      LEFT JOIN public.master_grup_temuan g
        ON g.id_grup = t.id_grup

      ${w}

      GROUP BY
        g.id_grup,
        g.nama_grup

      ORDER BY
        jumlah DESC
    `);

    return Response.json(rows);
  } catch (e) {
    console.error(
      "GET /api/dashboard/by-group:",
      e
    );

    return Response.json(
      { error: e.message },
      { status: 500 }
    );
  }
}