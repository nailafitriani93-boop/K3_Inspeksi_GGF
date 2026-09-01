import { prisma } from "@/lib/db";
import { hitungDeadline } from "@/lib/deadline";

function safeDate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function serializeBigInt(value) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  if (value && typeof value === "object") {
    const result = {};

    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeBigInt(val);
    }

    return result;
  }

  return value;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const noWilayahRaw = searchParams.get("noWilayah");
    const noWilayah = noWilayahRaw
      ? Number(noWilayahRaw)
      : null;

    const limitRaw = searchParams.get("limit");
    const limitNumber = Number(limitRaw);

    const limit =
      Number.isInteger(limitNumber) &&
      limitNumber > 0 &&
      limitNumber <= 100
        ? limitNumber
        : 25;

    const conditions = [];
    const values = [];

    /*
      ==========================================================
      STATUS
      ==========================================================
    */

    if (
      status &&
      ["OPEN", "CLOSE"].includes(status)
    ) {
      values.push(status);
      conditions.push(
        `t.status_temuan = $${values.length}`
      );
    }

    /*
      ==========================================================
      TANGGAL DARI
      ==========================================================
    */

    if (from && safeDate(from)) {
      values.push(from);
      conditions.push(
        `t.tanggal_temuan >= $${values.length}::date`
      );
    }

    /*
      ==========================================================
      TANGGAL SAMPAI
      ==========================================================
    */

    if (to && safeDate(to)) {
      values.push(to);
      conditions.push(
        `t.tanggal_temuan <= $${values.length}::date`
      );
    }

    /*
      ==========================================================
      WILAYAH
      ==========================================================
    */

    if (
      Number.isInteger(noWilayah) &&
      noWilayah >= 1 &&
      noWilayah <= 7
    ) {
      values.push(noWilayah);

      conditions.push(
        `t.no_wilayah = $${values.length}`
      );
    }

    /*
      ==========================================================
      HANYA TEMUAN OPEN
      ==========================================================
    */

    values.push("OPEN");

    conditions.push(
      `t.status_temuan = $${values.length}`
    );

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    /*
      ==========================================================
      QUERY DASHBOARD

      PENTING:
      Tidak ada t.id_pic.
      Tidak ada master_pic.
      PIC memang sudah dihapus dari sistem.
      ==========================================================
    */

    values.push(limit);

    const sql = `
      SELECT
        t.id_temuan,
        t.tanggal_temuan,
        t.no_wilayah,
        t.id_wilayah,
        t.id_lokasi,
        t.id_mandor,
        t.id_aktivitas,
        t.id_grup,
        t.deskripsi,
        t.latitude,
        t.longitude,
        t.foto_url,
        t.status_temuan,
        t.task_quiz,
        t.created_at,
        t.updated_at,
        t.closed_at,
        t.closed_by,

        ml.nama_lokasi,
        mm.nama_mandor,
        ma.nama_aktivitas,
        mg.nama_grup,

        CASE
          WHEN t.latitude IS NOT NULL
           AND t.longitude IS NOT NULL
          THEN
            'https://www.google.com/maps?q='
            || t.latitude::text
            || ','
            || t.longitude::text
          ELSE NULL
        END AS gmaps_url

      FROM public.temuan_k3 t

      LEFT JOIN public.master_lokasi ml
        ON ml.id_lokasi = t.id_lokasi

      LEFT JOIN public.master_mandor mm
        ON mm.id_mandor = t.id_mandor

      LEFT JOIN public.master_aktivitas ma
        ON ma.id_aktivitas = t.id_aktivitas

      LEFT JOIN public.master_grup_temuan mg
        ON mg.id_grup = t.id_grup

      ${where}

      ORDER BY
        t.tanggal_temuan ASC,
        t.created_at ASC,
        t.id_temuan ASC

      LIMIT $${values.length}
    `;

    const rows = await prisma.$queryRawUnsafe(
      sql,
      ...values
    );

    /*
      ==========================================================
      TAMBAHKAN DATA DEADLINE
      ==========================================================
    */

    const result = rows.map((row) => {
      const data = {
        ...row,

        nama_wilayah: row.no_wilayah
          ? `Wilayah ${row.no_wilayah}`
          : null,

        ...hitungDeadline(
          row.tanggal_temuan,
          row.status_temuan
        ),
      };

      return serializeBigInt(data);
    });

    return Response.json(result);

  } catch (e) {
    console.error(
      "GET /api/dashboard/oldest-open:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengambil temuan OPEN",
      },
      {
        status: 500,
      }
    );
  }
}