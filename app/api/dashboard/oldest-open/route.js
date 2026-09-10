import { prisma } from "@/lib/db";
import { hitungDeadline } from "@/lib/deadline";

/*
  ==========================================================
  VALIDASI TANGGAL
  ==========================================================
*/

function safeDate(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v)
  );
}

/*
  ==========================================================
  FORMAT TANGGAL DATABASE
  ==========================================================
*/

function formatTanggalDatabase(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) {
      return null;
    }

    /*
      YYYY-MM-DD
    */

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {
      return text;
    }

    /*
      ISO datetime
    */

    const match = text.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

    if (match) {
      return match[1];
    }

    return null;
  }

  /*
    PostgreSQL DATE bisa dikembalikan
    sebagai Date object.
  */

  if (value instanceof Date) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    return value
      .toISOString()
      .slice(0, 10);
  }

  return null;
}

/*
  ==========================================================
  SERIALIZE BIGINT
  ==========================================================
*/

function serializeBigInt(value) {
  if (
    typeof value === "bigint"
  ) {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(
      serializeBigInt
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    if (value instanceof Date) {
      return formatTanggalDatabase(
        value
      );
    }

    const result = {};

    for (
      const [key, val] of
      Object.entries(value)
    ) {
      result[key] =
        serializeBigInt(val);
    }

    return result;
  }

  return value;
}

/*
  ==========================================================
  NAMA WILAYAH
  ==========================================================

  NOMOR WILAYAH:

  1  = Wilayah 1
  2  = Wilayah 2
  3  = Wilayah 3
  4  = Wilayah 4
  5  = Wilayah 5
  6  = Wilayah 6
  7  = Wilayah 7
  8  = Bengkel
  9  = Mixing
  10 = Dipping

  Nama dari master_wilayah menjadi prioritas.
*/

function getNamaWilayah(
  noWilayah,
  namaMaster
) {
  const nomor =
    Number(noWilayah);

  /*
    Prioritas pertama:
    nama dari master_wilayah.
  */

  if (
    namaMaster &&
    String(
      namaMaster
    ).trim()
  ) {
    return String(
      namaMaster
    ).trim();
  }

  /*
    Wilayah 1-7
  */

  if (
    nomor >= 1 &&
    nomor <= 7
  ) {
    return `Wilayah ${nomor}`;
  }

  /*
    Area khusus
  */

  if (nomor === 8) {
    return "Bengkel";
  }

  if (nomor === 9) {
    return "Mixing";
  }

  if (nomor === 10) {
    return "Dipping";
  }

  return null;
}

/*
  ==========================================================
  GET
  ==========================================================
*/

export async function GET(req) {
  try {
    const {
      searchParams,
    } = new URL(req.url);

    const from =
      searchParams.get(
        "from"
      );

    const to =
      searchParams.get(
        "to"
      );

    const noWilayahRaw =
      searchParams.get(
        "noWilayah"
      );

    const noWilayah =
      noWilayahRaw !== null &&
      noWilayahRaw !== ""
        ? Number(
            noWilayahRaw
          )
        : null;

    const limitRaw =
      searchParams.get(
        "limit"
      );

    const limitNumber =
      Number(limitRaw);

    const limit =
      Number.isInteger(
        limitNumber
      ) &&
      limitNumber > 0 &&
      limitNumber <= 100
        ? limitNumber
        : 25;

    const conditions = [];
    const values = [];

    /*
      ========================================================
      TANGGAL DARI
      ========================================================
    */

    if (
      from &&
      safeDate(from)
    ) {
      values.push(from);

      conditions.push(
        `t.tanggal_temuan >= $${values.length}::date`
      );
    }

    /*
      ========================================================
      TANGGAL SAMPAI
      ========================================================
    */

    if (
      to &&
      safeDate(to)
    ) {
      values.push(to);

      conditions.push(
        `t.tanggal_temuan <= $${values.length}::date`
      );
    }

    /*
      ========================================================
      WILAYAH
      ========================================================

      DULU hanya 1-7.

      SEKARANG:
      1-7  = Wilayah 1-7
      8    = Bengkel
      9    = Mixing
      10   = Dipping
      ========================================================
    */

    if (
      Number.isInteger(
        noWilayah
      ) &&
      noWilayah >= 1 &&
      noWilayah <= 10
    ) {
      values.push(
        noWilayah
      );

      conditions.push(
        `t.no_wilayah = $${values.length}`
      );
    }

    /*
      ========================================================
      HANYA TEMUAN OPEN
      ========================================================

      Endpoint ini memang untuk
      Temuan OPEN.
    */

    values.push(
      "OPEN"
    );

    conditions.push(
      `t.status_temuan = $${values.length}`
    );

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    /*
      ========================================================
      LIMIT
      ========================================================
    */

    values.push(
      limit
    );

    /*
      ========================================================
      QUERY
      ========================================================
    */

    const sql = `
      SELECT
        t.id_temuan,

        t.tanggal_temuan,

        t.no_wilayah,

        /*
          AMBIL NAMA WILAYAH
          LANGSUNG DARI MASTER
        */

        mw.nama_wilayah
          AS nama_wilayah,

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
          WHEN
            t.latitude IS NOT NULL
            AND
            t.longitude IS NOT NULL
          THEN
            'https://www.google.com/maps?q='
            || t.latitude::text
            || ','
            || t.longitude::text
          ELSE NULL
        END AS gmaps_url

      FROM public.temuan_k3 t

      /*
        ======================================================
        MASTER WILAYAH
        ======================================================
      */

      LEFT JOIN public.master_wilayah mw
        ON mw.no_wilayah =
          t.no_wilayah

      /*
        ======================================================
        MASTER LOKASI
        ======================================================
      */

      LEFT JOIN public.master_lokasi ml
        ON ml.id_lokasi =
          t.id_lokasi

      /*
        ======================================================
        MASTER MANDOR
        ======================================================
      */

      LEFT JOIN public.master_mandor mm
        ON mm.id_mandor =
          t.id_mandor

      /*
        ======================================================
        MASTER AKTIVITAS
        ======================================================
      */

      LEFT JOIN public.master_aktivitas ma
        ON ma.id_aktivitas =
          t.id_aktivitas

      /*
        ======================================================
        MASTER GRUP
        ======================================================
      */

      LEFT JOIN public.master_grup_temuan mg
        ON mg.id_grup =
          t.id_grup

      ${where}

      ORDER BY
        t.tanggal_temuan ASC,
        t.created_at ASC,
        t.id_temuan ASC

      LIMIT $${values.length}
    `;

    const rows =
      await prisma.$queryRawUnsafe(
        sql,
        ...values
      );

    /*
      ========================================================
      FORMAT HASIL
      ========================================================
    */

    const result =
      rows.map(
        (row) => {
          const tanggalTemuan =
            formatTanggalDatabase(
              row.tanggal_temuan
            );

          const namaWilayah =
            getNamaWilayah(
              row.no_wilayah,
              row.nama_wilayah
            );

          const data = {
            ...row,

            /*
              Tanggal tetap YYYY-MM-DD.
            */

            tanggal_temuan:
              tanggalTemuan,

            /*
              Nama wilayah FINAL.
            */

            nama_wilayah:
              namaWilayah,

            /*
              Deadline tetap memakai
              fungsi lama.
            */

            ...hitungDeadline(
              tanggalTemuan,
              row.status_temuan
            ),
          };

          return serializeBigInt(
            data
          );
        }
      );

    /*
      ========================================================
      DEBUG
      ========================================================
    */

    console.log(
      "DATA /api/dashboard/oldest-open:",
      result.map(
        (item) => ({
          id_temuan:
            item.id_temuan,

          tanggal_temuan:
            item.tanggal_temuan,

          no_wilayah:
            item.no_wilayah,

          nama_wilayah:
            item.nama_wilayah,

          nama_lokasi:
            item.nama_lokasi,

          status_temuan:
            item.status_temuan,
        })
      )
    );

    return Response.json(
      result
    );

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