import { prisma } from "@/lib/db";

export async function GET() {
  try {
    /*
     * Ambil data asli dari master_wilayah.
     *
     * Sengaja tidak menggunakan regexp_replace di SQL
     * supaya aman apabila nama_wilayah ternyata bertipe
     * SMALLINT / INTEGER / TEXT.
     */
    const rows = await prisma.$queryRaw`
      SELECT
        id_wilayah,
        no_wilayah,
        nama_wilayah
      FROM public.master_wilayah
      ORDER BY id_wilayah
    `;

    const hasil = [];
    const wilayahTerdaftar = new Set();

    for (const row of rows) {
      const idWilayah = Number(row.id_wilayah);

      if (!Number.isInteger(idWilayah)) {
        continue;
      }

      /*
       * Paksa menjadi string.
       *
       * Ini penting karena nama_wilayah di database
       * bisa saja SMALLINT.
       */
      const namaAsli = String(
        row.nama_wilayah ?? ""
      ).trim();

      if (!namaAsli) {
        continue;
      }

      const normal = namaAsli
        .toLowerCase()
        .replace(/[^a-z]/g, "");

      let label = namaAsli;
      let noWilayah = row.no_wilayah ?? namaAsli;

      if (normal.includes("bengkel")) {
        label = "Bengkel";
      } else if (normal.includes("mixing") || normal.includes("mixer")) {
        label = "Mixing";
      } else if (normal.includes("dipping") || normal.includes("diping")) {
        label = "Dipping";
      } else if (normal.includes("office")) {
        label = "Office";
      } else if (row.no_wilayah !== null && row.no_wilayah !== undefined) {
        const angkaMatch = namaAsli.match(/\d+/);
        if (angkaMatch) {
          label = `Wilayah ${Number(row.no_wilayah)}`;
        }
      }

      // Dashboard memakai nomor wilayah sebagai nilai filter.
      noWilayah = String(row.no_wilayah ?? noWilayah);

      const key = String(noWilayah).toLowerCase();
      if (wilayahTerdaftar.has(key)) continue;

      wilayahTerdaftar.add(key);
      hasil.push({
        no_wilayah: String(noWilayah),
        nama_wilayah: label,
        id_wilayah: idWilayah,
      });

      continue;
    }

    return Response.json(hasil);

  } catch (e) {
    console.error(
      "GET /api/master/wilayah:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengambil wilayah",
      },
      {
        status: 500,
      }
    );
  }
}