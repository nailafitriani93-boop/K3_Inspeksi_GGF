import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const {
      searchParams,
    } = new URL(req.url);

    const from =
      searchParams.get(
        "from"
      ) || "";

    const to =
      searchParams.get(
        "to"
      ) || "";

    /*
      ==========================================================
      VALIDASI FORMAT TANGGAL
      ==========================================================
    */

    if (
      (from &&
        !/^\d{4}-\d{2}-\d{2}$/.test(
          from
        )) ||
      (to &&
        !/^\d{4}-\d{2}-\d{2}$/.test(
          to
        )) ||
      (from &&
        to &&
        from > to)
    ) {
      return Response.json(
        {
          error:
            "Rentang tanggal tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /*
      ==========================================================
      KONDISI TANGGAL
      ==========================================================

      Tetap menggunakan tanggal temuan.
      Tidak mengubah tampilan frontend.
      ==========================================================
    */

    let dateCondition =
      "";

    if (from) {
      dateCondition +=
        ` AND t.tanggal_temuan >= '${from}'`;
    }

    if (to) {
      dateCondition +=
        ` AND t.tanggal_temuan <= '${to}'`;
    }

    /*
      ==========================================================
      QUERY MASTER WILAYAH
      ==========================================================

      SEMUA wilayah diambil dari master_wilayah.

      Jadi:
      1  = Wilayah 1
      2  = Wilayah 2
      3  = Wilayah 3
      4  = Wilayah 4
      5  = Wilayah 5
      6  = Wilayah 6
      7  = Wilayah 7
      8  = Bengkel
      9  = Mixing / nama sesuai master
      10 = Dipping

      Tidak membuat Wilayah 8.
      ==========================================================
    */

    const rows =
      await prisma.$queryRawUnsafe(`
        SELECT
          w.no_wilayah,

          w.nama_wilayah,

          /*
            TOTAL SEMUA TEMUAN
          */

          COUNT(
            t.id_temuan
          )::int AS total,

          /*
            TEMUAN OPEN
          */

          COUNT(
            t.id_temuan
          )
          FILTER (
            WHERE
              t.status_temuan = 'OPEN'
          )::int AS open,

          /*
            TEMUAN CLOSE
          */

          COUNT(
            t.id_temuan
          )
          FILTER (
            WHERE
              t.status_temuan = 'CLOSE'
          )::int AS close

        FROM
          public.master_wilayah w

        /*
          HUBUNGKAN DENGAN TEMUAN
        */

        LEFT JOIN
          public.temuan_k3 t
          ON
            t.no_wilayah =
              w.no_wilayah
          ${dateCondition}

        GROUP BY
          w.no_wilayah,
          w.nama_wilayah

        /*
          URUTAN BERDASARKAN NOMOR MASTER
        */

        ORDER BY
          w.no_wilayah
      `);

    /*
      ==========================================================
      NORMALISASI DATA
      ==========================================================
    */

    const result =
      rows.map(
        (row) => {
          const noWilayah =
            Number(
              row?.no_wilayah
            );

          let namaWilayah =
            row?.nama_wilayah
              ? String(
                  row.nama_wilayah
                ).trim()
              : "";

          /*
            ====================================================
            FALLBACK NAMA WILAYAH
            ====================================================
          */

          if (
            !namaWilayah
          ) {
            /*
              Wilayah 1-7
            */

            if (
              noWilayah >= 1 &&
              noWilayah <= 7
            ) {
              namaWilayah =
                `Wilayah ${noWilayah}`;
            }

            /*
              Bengkel
            */

            else if (
              noWilayah === 8
            ) {
              namaWilayah =
                "Bengkel";
            }

            /*
              Mixing
            */

            else if (
              noWilayah === 9
            ) {
              namaWilayah =
                "Mixing";
            }

            /*
              Dipping
            */

            else if (
              noWilayah === 10
            ) {
              namaWilayah =
                "Dipping";
            }
          }

          const total =
            Number(
              row?.total || 0
            );

          const open =
            Number(
              row?.open || 0
            );

          const close =
            Number(
              row?.close || 0
            );

          return {
            /*
              ID WILAYAH
            */

            no_wilayah:
              noWilayah,

            /*
              NAMA WILAYAH
            */

            nama_wilayah:
              namaWilayah,

            /*
              TOTAL
            */

            total,

            /*
              OPEN
            */

            open,

            /*
              CLOSE
            */

            close,

            /*
              jumlah dibuat sama dengan
              total supaya kompatibel
              dengan kode frontend lama.
            */

            jumlah:
              total,
          };
        }
      );

    /*
      ==========================================================
      HASIL AKHIR
      ==========================================================
    */

    return Response.json(
      result
    );

  } catch (e) {
    console.error(
      "GET /api/dashboard/by-wilayah:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengambil data temuan per wilayah",
      },
      {
        status: 500,
      }
    );
  }
}