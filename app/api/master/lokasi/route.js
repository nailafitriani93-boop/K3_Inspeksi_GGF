import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const wilayahRaw =
      searchParams.get("noWilayah") ??
      searchParams.get("wilayahNama");

    if (!wilayahRaw) {
      return Response.json([]);
    }

    const wilayahValue =
      String(wilayahRaw).trim();

    /*
     * Ambil semua master wilayah beserta lokasi.
     *
     * Kita tidak menggunakan regexp_replace pada
     * nama_wilayah di SQL agar aman jika kolom
     * nama_wilayah bertipe SMALLINT.
     */
    const rows = await prisma.$queryRaw`
      SELECT
        ml.id_lokasi,
        ml.nama_lokasi,
        ml.wilayah_id,
        mw.nama_wilayah
      FROM public.master_lokasi ml
      INNER JOIN public.master_wilayah mw
        ON mw.id_wilayah = ml.wilayah_id
      ORDER BY ml.nama_lokasi
    `;

    /*
     * =====================================================
     * FILTER WILAYAH
     * =====================================================
     */

    const hasil = rows.filter((row) => {
      const namaWilayah =
        String(
          row.nama_wilayah ?? ""
        ).trim();

      if (!namaWilayah) {
        return false;
      }

      /*
       * ===================================================
       * WILAYAH 1 - 7
       * ===================================================
       */
      const angkaMatch =
        namaWilayah.match(/\d+/);

      if (angkaMatch) {
        const nomor =
          Number(
            angkaMatch[0]
          );

        if (
          Number.isInteger(nomor) &&
          nomor >= 1 &&
          nomor <= 7
        ) {
          return (
            wilayahValue ===
            String(nomor)
          );
        }
      }

      /*
       * ===================================================
       * NORMALISASI WILAYAH KHUSUS
       * ===================================================
       */
      const normal =
        namaWilayah
          .toLowerCase()
          .replace(/[^a-z]/g, "");

      /*
       * BENGKEL
       */
      if (
        normal.includes("bengkel")
      ) {
        return (
          wilayahValue.toLowerCase() ===
          "bengkel"
        );
      }

      /*
       * MIXING / MIXER
       */
      if (
        normal.includes("mixing") ||
        normal.includes("mixer")
      ) {
        return (
          wilayahValue.toLowerCase() ===
          "mixing"
        );
      }

      /*
       * DIPPING / DIPING
       */
      if (
        normal.includes("dipping") ||
        normal.includes("diping")
      ) {
        return (
          wilayahValue.toLowerCase() ===
          "dipping"
        );
      }

      return false;
    });

    /*
     * Kirim hanya kolom yang dibutuhkan
     * oleh SearchSelect.
     */
    return Response.json(
      hasil.map((row) => ({
        id_lokasi:
          Number(row.id_lokasi),

        nama_lokasi:
          row.nama_lokasi,

        wilayah_id:
          Number(row.wilayah_id),
      }))
    );

  } catch (e) {
    console.error(
      "GET /api/master/lokasi:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengambil lokasi",
      },
      {
        status: 500,
      }
    );
  }
}