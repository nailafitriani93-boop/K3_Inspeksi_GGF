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
        nama_wilayah
      FROM public.master_wilayah
      ORDER BY id_wilayah
    `;

    const hasil = [];

    /*
     * Menyimpan wilayah angka 1-7 agar tidak duplikat.
     */
    const wilayahAngka = new Map();

    /*
     * Menyimpan wilayah khusus agar tidak duplikat.
     */
    const wilayahKhusus = new Map();

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

      /*
       * =====================================================
       * WILAYAH 1 - 7
       * =====================================================
       *
       * Ambil angka dari nama wilayah.
       *
       * Contoh:
       * "Wilayah 1"  -> 1
       * "wilayah01"  -> 1
       * "WIL - 2"    -> 2
       * "3"          -> 3
       */
      const angkaMatch =
        namaAsli.match(/\d+/);

      if (angkaMatch) {
        const no = Number(
          angkaMatch[0]
        );

        if (
          Number.isInteger(no) &&
          no >= 1 &&
          no <= 7
        ) {
          if (!wilayahAngka.has(no)) {
            wilayahAngka.set(no, {
              no_wilayah: String(no),
              nama_wilayah: `Wilayah ${no}`,
              id_wilayah: idWilayah,
            });
          }

          continue;
        }
      }

      /*
       * =====================================================
       * WILAYAH KHUSUS
       * =====================================================
       *
       * Mendukung variasi penulisan:
       *
       * Bengkel
       * bengkel
       *
       * Mixing
       * mixing
       * Mixer
       * mixer
       *
       * Dipping
       * dipping
       * Diping
       * diping
       */
      const normal =
        namaAsli
          .toLowerCase()
          .replace(/[^a-z]/g, "");

      let key = "";
      let label = "";

      if (
        normal.includes("bengkel")
      ) {
        key = "bengkel";
        label = "Bengkel";
      } else if (
        normal.includes("mixing") ||
        normal.includes("mixer")
      ) {
        key = "mixing";
        label = "Mixing";
      } else if (
        normal.includes("dipping") ||
        normal.includes("diping")
      ) {
        key = "dipping";
        label = "Dipping";
      }

      if (key) {
        if (!wilayahKhusus.has(key)) {
          wilayahKhusus.set(key, {
            no_wilayah: key,
            nama_wilayah: label,
            id_wilayah: idWilayah,
          });
        }
      }
    }

    /*
     * =====================================================
     * HASIL AKHIR
     * =====================================================
     *
     * Urutan:
     *
     * Wilayah 1
     * Wilayah 2
     * ...
     * Wilayah 7
     * Bengkel
     * Mixing
     * Dipping
     */

    for (let no = 1; no <= 7; no++) {
      if (wilayahAngka.has(no)) {
        hasil.push(
          wilayahAngka.get(no)
        );
      }
    }

    if (wilayahKhusus.has("bengkel")) {
      hasil.push(
        wilayahKhusus.get("bengkel")
      );
    }

    if (wilayahKhusus.has("mixing")) {
      hasil.push(
        wilayahKhusus.get("mixing")
      );
    }

    if (wilayahKhusus.has("dipping")) {
      hasil.push(
        wilayahKhusus.get("dipping")
      );
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