import { prisma } from "@/lib/db";
import {
  buatWorkbookTemuan,
  workbookKeBuffer,
  buatPdfTemuan,
} from "@/lib/exporters";

// GET /api/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=OPEN|CLOSE&noWilayah=1-7&format=xlsx|pdf
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const noWilayahRaw = searchParams.get("noWilayah");
    const noWilayah = noWilayahRaw
      ? Number(noWilayahRaw)
      : null;

    const format = (
      searchParams.get("format") || "xlsx"
    ).toLowerCase();

    // =========================================================
    // VALIDASI PARAMETER
    // =========================================================

    if (
      !from ||
      !to ||
      !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to)
    ) {
      return Response.json(
        {
          error:
            "from dan to wajib berupa tanggal YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    if (from > to) {
      return Response.json(
        {
          error:
            "Tanggal dari tidak boleh lebih besar dari tanggal sampai",
        },
        { status: 400 }
      );
    }

    if (
      !["xlsx", "pdf"].includes(format)
    ) {
      return Response.json(
        {
          error:
            "Format export harus xlsx atau pdf",
        },
        { status: 400 }
      );
    }

    if (
      status &&
      !["OPEN", "CLOSE"].includes(status)
    ) {
      return Response.json(
        {
          error: "Status tidak valid",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // FILTER QUERY
    //
    // $1 dan $2 diberi ::date karena parameter dari URL
    // berupa string, sedangkan tanggal_temuan adalah DATE.
    // =========================================================

    const clauses = [
      `t.tanggal_temuan >= $1::date`,
      `t.tanggal_temuan <= $2::date`,
    ];

    const params = [
      from,
      to,
    ];

    if (status) {
      params.push(status);

      clauses.push(
        `t.status_temuan = $${params.length}`
      );
    }

    if (
      Number.isInteger(noWilayah) &&
      noWilayah >= 1 &&
      noWilayah <= 7
    ) {
      params.push(noWilayah);

      clauses.push(
        `t.no_wilayah = $${params.length}`
      );
    }

    // =========================================================
    // QUERY DATA TEMUAN
    //
    // TIDAK menggunakan t.id_pic secara langsung.
    // =========================================================

    const sql = `
      SELECT
        t.*,

        ml.nama_lokasi,

        mp.nama_pic,

        mm.nama_mandor,

        ma.nama_aktivitas,

        mg.nama_grup,

        CASE
          WHEN t.latitude IS NOT NULL
           AND t.longitude IS NOT NULL
          THEN
            'https://www.google.com/maps?q='
            || t.latitude
            || ','
            || t.longitude
          ELSE NULL
        END AS gmaps_url

      FROM public.temuan_k3 t

      LEFT JOIN public.master_lokasi ml
        ON ml.id_lokasi = t.id_lokasi

      LEFT JOIN public.master_pic mp
        ON mp.id_pic::text =
          COALESCE(
            to_jsonb(t)->>'id_pic',
            to_jsonb(t)->>'pic_id',
            to_jsonb(t)->>'id_pic_inspeksi',
            to_jsonb(t)->>'pic'
          )

      LEFT JOIN public.master_mandor mm
        ON mm.id_mandor = t.id_mandor

      LEFT JOIN public.master_aktivitas ma
        ON ma.id_aktivitas = t.id_aktivitas

      LEFT JOIN public.master_grup_temuan mg
        ON mg.id_grup = t.id_grup

      WHERE ${clauses.join(" AND ")}

      ORDER BY
        t.tanggal_temuan,
        t.created_at
    `;

    // =========================================================
    // DEBUG
    // =========================================================

    console.log(
      "===================================="
    );

    console.log(
      "EXPORT TEMUAN K3"
    );

    console.log(
      "FROM:",
      from
    );

    console.log(
      "TO:",
      to
    );

    console.log(
      "STATUS:",
      status || "SEMUA"
    );

    console.log(
      "WILAYAH:",
      noWilayah || "SEMUA"
    );

    console.log(
      "FORMAT:",
      format
    );

    console.log(
      "===================================="
    );

    // =========================================================
    // AMBIL DATA
    // =========================================================

    const rows =
      await prisma.$queryRawUnsafe(
        sql,
        ...params
      );

    console.log(
      `EXPORT: ${rows.length} data ditemukan`
    );

    // =========================================================
    // EXPORT PDF
    // =========================================================

    if (format === "pdf") {
      const buf =
        buatPdfTemuan({
          judul:
            "Rekap Temuan Inspeksi K3 - Great Giant Foods",

          subjudul:
            `Periode ${from} s/d ${to}` +
            `${
              status
                ? ` - Status ${status}`
                : ""
            }` +
            `${
              Number.isInteger(
                noWilayah
              )
                ? ` - Wilayah ${noWilayah}`
                : ""
            }`,

          rows,
        });

      return new Response(
        buf,
        {
          headers: {
            "Content-Type":
              "application/pdf",

            "Content-Disposition":
              `attachment; filename="rekap-temuan-${from}-${to}.pdf"`,

            "Content-Length":
              String(buf.length),
          },
        }
      );
    }

    // =========================================================
    // EXPORT EXCEL
    // =========================================================
    //
    // PENTING:
    //
    // buatWorkbookTemuan() sekarang ASYNC karena membaca
    // file template Excel menggunakan ExcelJS.
    //
    // Karena itu WAJIB menggunakan await.
    // =========================================================

    const wb =
      await buatWorkbookTemuan(
        rows
      );

    const buf =
      await workbookKeBuffer(
        wb
      );

    console.log(
      `EXPORT XLSX: ${buf.length} bytes`
    );

    return new Response(
      buf,
      {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="rekap-temuan-${from}-${to}.xlsx"`,

          "Content-Length":
            String(buf.length),

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (e) {
    console.error(
      "===================================="
    );

    console.error(
      "GET /api/export ERROR"
    );

    console.error(e);

    console.error(
      "===================================="
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Terjadi kesalahan saat melakukan export",
      },
      {
        status: 500,
      }
    );
  }
}