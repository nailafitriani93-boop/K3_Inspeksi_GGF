import { prisma } from "@/lib/db";
import {
  simpanFotoBase64,
  hapusFoto,
} from "@/lib/upload";
import { hitungDeadline } from "@/lib/deadline";

/* =========================================================
   HELPER
========================================================= */

function safeDate(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v)
  );
}

function serializeBigInt(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "bigint"
        ? Number(v)
        : v
    )
  );
}

/* =========================================================
   NORMALISASI WILAYAH
========================================================= */

function normalizeWilayah(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/* =========================================================
   CARI WILAYAH
========================================================= */

async function cariWilayah(value) {
  const input = normalizeWilayah(value);

  if (!input) {
    return null;
  }

  /* =======================================================
     1. WILAYAH ANGKA
  ======================================================= */

  const angkaMatch =
    input.match(/\d+/);

  if (angkaMatch) {
    const nomor =
      Number(
        angkaMatch[0]
      );

    if (
      Number.isInteger(nomor)
    ) {
      const result =
        await prisma.$queryRaw`
          SELECT
            id_wilayah,
            no_wilayah,
            nama_wilayah

          FROM public.master_wilayah

          WHERE
            no_wilayah =
            ${nomor}

          LIMIT 1
        `;

      if (result[0]) {
        return result[0];
      }
    }
  }

  /* =======================================================
     2. BENGKEL
  ======================================================= */

  if (
    input.includes("bengkel")
  ) {
    const result =
      await prisma.$queryRaw`
        SELECT
          id_wilayah,
          no_wilayah,
          nama_wilayah

        FROM public.master_wilayah

        WHERE
          LOWER(
            nama_wilayah::text
          ) LIKE '%bengkel%'

        LIMIT 1
      `;

    if (result[0]) {
      return result[0];
    }
  }

  /* =======================================================
     3. MIXING / MIXER
  ======================================================= */

  if (
    input.includes("mixing") ||
    input.includes("mixer")
  ) {
    const result =
      await prisma.$queryRaw`
        SELECT
          id_wilayah,
          no_wilayah,
          nama_wilayah

        FROM public.master_wilayah

        WHERE
          LOWER(
            nama_wilayah::text
          ) LIKE '%mix%'

        LIMIT 1
      `;

    if (result[0]) {
      return result[0];
    }
  }

  /* =======================================================
     4. DIPPING / DIPING
  ======================================================= */

  if (
    input.includes("dipping") ||
    input.includes("diping")
  ) {
    const result =
      await prisma.$queryRaw`
        SELECT
          id_wilayah,
          no_wilayah,
          nama_wilayah

        FROM public.master_wilayah

        WHERE
          LOWER(
            nama_wilayah::text
          ) LIKE '%dip%'

        LIMIT 1
      `;

    if (result[0]) {
      return result[0];
    }
  }

  return null;
}

/* =========================================================
   GET DATA TEMUAN
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const status =
      searchParams.get("status");

    const from =
      searchParams.get("from");

    const to =
      searchParams.get("to");

    const noWilayahRaw =
      searchParams.get("noWilayah");

    const noWilayahInput =
      noWilayahRaw !== null &&
      noWilayahRaw !== ""
        ? String(
            noWilayahRaw
          ).trim()
        : null;

    const clauses = [];

    /* =====================================================
       FILTER STATUS
    ===================================================== */

    if (
      status &&
      ["OPEN", "CLOSE"].includes(
        status
      )
    ) {
      clauses.push(
        `t.status_temuan = '${status.replaceAll(
          "'",
          "''"
        )}'`
      );
    }

    /* =====================================================
       FILTER TANGGAL MULAI
    ===================================================== */

    if (
      from &&
      safeDate(from)
    ) {
      clauses.push(
        `t.tanggal_temuan >= '${from}'`
      );
    }

    /* =====================================================
       FILTER TANGGAL AKHIR
    ===================================================== */

    if (
      to &&
      safeDate(to)
    ) {
      clauses.push(
        `t.tanggal_temuan <= '${to}'`
      );
    }

    /* =====================================================
       FILTER WILAYAH
    ===================================================== */

    if (
      noWilayahInput !== null
    ) {
      const wilayah =
        await cariWilayah(
          noWilayahInput
        );

      if (wilayah) {
        const nomorWilayah =
          Number(
            wilayah.no_wilayah
          );

        if (
          Number.isInteger(
            nomorWilayah
          )
        ) {
          clauses.push(
            `t.no_wilayah = ${nomorWilayah}`
          );
        }
      } else {
        clauses.push(
          `1 = 0`
        );
      }
    }

    const where =
      clauses.length
        ? `WHERE ${clauses.join(
            " AND "
          )}`
        : "";

    /* =====================================================
       QUERY DATA TEMUAN
    ===================================================== */

    const rows =
      await prisma.$queryRawUnsafe(`
        SELECT
          t.*,

          mw.nama_wilayah,

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
              'https://www.google.com/maps?q=' ||
              t.latitude ||
              ',' ||
              t.longitude
            ELSE NULL
          END AS gmaps_url

        FROM public.temuan_k3 t

        LEFT JOIN public.master_wilayah mw
          ON mw.id_wilayah =
             t.id_wilayah

        LEFT JOIN public.master_lokasi ml
          ON ml.id_lokasi =
             t.id_lokasi

        LEFT JOIN public.master_mandor mm
          ON mm.id_mandor =
             t.id_mandor

        LEFT JOIN public.master_aktivitas ma
          ON ma.id_aktivitas =
             t.id_aktivitas

        LEFT JOIN public.master_grup_temuan mg
          ON mg.id_grup =
             t.id_grup

        ${where}

        ORDER BY
          t.tanggal_temuan DESC,
          t.created_at DESC,
          t.id_temuan DESC
      `);

    return Response.json(
      serializeBigInt(
        rows.map((r) => ({
          ...r,

          nama_wilayah:
            r.nama_wilayah ||
            (
              r.no_wilayah !== null &&
              r.no_wilayah !== undefined
                ? `Wilayah ${r.no_wilayah}`
                : null
            ),

          ...hitungDeadline(
            r.tanggal_temuan,
            r.status_temuan
          ),
        }))
      )
    );

  } catch (e) {
    console.error(
      "GET /api/temuan:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengambil data temuan",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST SIMPAN TEMUAN
========================================================= */

export async function POST(req) {
  try {
    const b =
      await req.json();

    /* =====================================================
       VALIDASI FIELD WAJIB
    ===================================================== */

    const required = [
      "tanggal_temuan",
      "no_wilayah",
      "id_lokasi",
      "id_mandor",
      "id_aktivitas",
      "deskripsi",
    ];

    for (
      const k of required
    ) {
      if (
        b[k] === undefined ||
        b[k] === null ||
        b[k] === ""
      ) {
        return Response.json(
          {
            error:
              `Field ${k} wajib diisi`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       TENTUKAN STATUS

       ADA TEMUAN:
       id_grup ada
       status OPEN

       INSPEKSI TANPA TEMUAN:
       id_grup kosong
       status CLOSE
    ===================================================== */

    const adaGrupTemuan =
      b.id_grup !== undefined &&
      b.id_grup !== null &&
      b.id_grup !== "";

    const statusTemuan =
      adaGrupTemuan
        ? "OPEN"
        : "CLOSE";

    /* =====================================================
       ID INSPEKSI
    ===================================================== */

    let idInspeksi = null;

    if (
      b.id_inspeksi !== undefined &&
      b.id_inspeksi !== null &&
      b.id_inspeksi !== ""
    ) {
      try {
        idInspeksi =
          BigInt(
            b.id_inspeksi
          );
      } catch {
        return Response.json(
          {
            error:
              "ID inspeksi tidak valid",
          },
          {
            status: 400,
          }
        );
      }

      const inspeksiData =
        await prisma.$queryRaw`
          SELECT
            id_inspeksi

          FROM public.inspeksi_k3

          WHERE
            id_inspeksi =
            ${idInspeksi}

          LIMIT 1
        `;

      if (
        !inspeksiData[0]
      ) {
        return Response.json(
          {
            error:
              "Data inspeksi tidak ditemukan",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       VALIDASI TANGGAL
    ===================================================== */

    if (
      !safeDate(
        b.tanggal_temuan
      )
    ) {
      return Response.json(
        {
          error:
            "Tanggal temuan tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       WILAYAH
    ===================================================== */

    const wilayahInput =
      String(
        b.no_wilayah ?? ""
      ).trim();

    if (!wilayahInput) {
      return Response.json(
        {
          error:
            "Wilayah tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    const wilayahData =
      await cariWilayah(
        wilayahInput
      );

    if (!wilayahData) {
      return Response.json(
        {
          error:
            `Wilayah "${wilayahInput}" tidak ditemukan dalam master wilayah`,
        },
        {
          status: 400,
        }
      );
    }

    const idWilayah =
      Number(
        wilayahData.id_wilayah
      );

    const noWilayah =
      Number(
        wilayahData.no_wilayah
      );

    const namaWilayah =
      String(
        wilayahData.nama_wilayah ??
        wilayahInput
      ).trim();

    if (
      !Number.isInteger(
        idWilayah
      )
    ) {
      return Response.json(
        {
          error:
            "ID wilayah tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        noWilayah
      )
    ) {
      return Response.json(
        {
          error:
            "Nomor wilayah pada master database tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       LATITUDE
    ===================================================== */

    const latitude =
      b.latitude !== undefined &&
      b.latitude !== null &&
      b.latitude !== ""
        ? Number(
            b.latitude
          )
        : null;

    /* =====================================================
       LONGITUDE
    ===================================================== */

    const longitude =
      b.longitude !== undefined &&
      b.longitude !== null &&
      b.longitude !== ""
        ? Number(
            b.longitude
          )
        : null;

    if (
      latitude !== null &&
      !Number.isFinite(
        latitude
      )
    ) {
      return Response.json(
        {
          error:
            "Latitude tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      longitude !== null &&
      !Number.isFinite(
        longitude
      )
    ) {
      return Response.json(
        {
          error:
            "Longitude tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      latitude !== null &&
      (
        latitude < -90 ||
        latitude > 90
      )
    ) {
      return Response.json(
        {
          error:
            "Latitude harus berada antara -90 sampai 90",
        },
        {
          status: 400,
        }
      );
    }

    if (
      longitude !== null &&
      (
        longitude < -180 ||
        longitude > 180
      )
    ) {
      return Response.json(
        {
          error:
            "Longitude harus berada antara -180 sampai 180",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       FOTO WAJIB
    ===================================================== */

    if (
      !b.foto_base64
    ) {
      return Response.json(
        {
          error:
            "Foto temuan wajib diunggah",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ID LOKASI
    ===================================================== */

    const idLokasi =
      Number(
        b.id_lokasi
      );

    if (
      !Number.isInteger(
        idLokasi
      )
    ) {
      return Response.json(
        {
          error:
            "ID lokasi tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDASI LOKASI
    ===================================================== */

    const lokasiData =
      await prisma.$queryRaw`
        SELECT
          ml.id_lokasi,
          ml.nama_lokasi,
          ml.wilayah_id

        FROM public.master_lokasi ml

        WHERE
          ml.id_lokasi =
          ${idLokasi}

          AND

          ml.wilayah_id =
          ${idWilayah}

        LIMIT 1
      `;

    if (
      !lokasiData[0]
    ) {
      return Response.json(
        {
          error:
            `Lokasi tidak sesuai dengan wilayah ${namaWilayah}. ` +
            `Silakan pilih lokasi dari wilayah yang dipilih.`,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ID MANDOR
    ===================================================== */

    const idMandor =
      Number(
        b.id_mandor
      );

    if (
      !Number.isInteger(
        idMandor
      )
    ) {
      return Response.json(
        {
          error:
            "ID mandor tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ID AKTIVITAS
    ===================================================== */

    const idAktivitas =
      Number(
        b.id_aktivitas
      );

    if (
      !Number.isInteger(
        idAktivitas
      )
    ) {
      return Response.json(
        {
          error:
            "ID aktivitas tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ID GRUP TEMUAN

       Boleh NULL untuk inspeksi tanpa temuan
    ===================================================== */

    let idGrup = null;

    if (adaGrupTemuan) {
      idGrup =
        Number(
          b.id_grup
        );

      if (
        !Number.isInteger(
          idGrup
        )
      ) {
        return Response.json(
          {
            error:
              "ID grup temuan tidak valid",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       DESKRIPSI
    ===================================================== */

    const deskripsi =
      String(
        b.deskripsi ?? ""
      ).trim();

    if (!deskripsi) {
      return Response.json(
        {
          error:
            "Deskripsi temuan wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SIMPAN FOTO
    ===================================================== */

    let fotoUrl;

    try {
      fotoUrl =
        await simpanFotoBase64(
          b.foto_base64
        );
    } catch (err) {
      return Response.json(
        {
          error:
            err?.message ||
            "Gagal menyimpan foto",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       INSERT TEMUAN
    ===================================================== */

    try {
      const result =
        await prisma.$queryRaw`
          INSERT INTO public.temuan_k3
          (
            id_inspeksi,
            tanggal_temuan,
            no_wilayah,
            id_wilayah,
            id_lokasi,
            id_mandor,
            id_aktivitas,
            id_grup,
            deskripsi,
            latitude,
            longitude,
            foto_url,
            status_temuan,
            task_quiz
          )

          VALUES
          (
            ${idInspeksi},

            ${b.tanggal_temuan}::date,

            ${noWilayah},

            ${idWilayah},

            ${idLokasi},

            ${idMandor},

            ${idAktivitas},

            ${idGrup},

            ${deskripsi},

            ${latitude},

            ${longitude},

            ${fotoUrl},

            ${statusTemuan},

            ${
              Array.isArray(
                b.task_quiz
              )
                ? JSON.stringify(
                    b.task_quiz
                  )
                : null
            }::jsonb
          )

          RETURNING *
        `;

      /* =================================================
         RESPONSE BERHASIL

         PESAN HANYA:
         "Inspeksi berhasil disimpan"
      ================================================= */

      return Response.json(
        {
          success: true,
          message: "Inspeksi berhasil disimpan",
          data: serializeBigInt(
            result[0]
          ),
        },
        {
          status: 201,
        }
      );

    } catch (err) {

      if (fotoUrl) {
        await hapusFoto(
          fotoUrl
        );
      }

      throw err;
    }

  } catch (e) {
    console.error(
      "POST /api/temuan:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal menyimpan temuan",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH UPDATE STATUS
========================================================= */

export async function PATCH(req) {
  try {
    const b =
      await req.json();

    /* =====================================================
       VALIDASI STATUS
    ===================================================== */

    if (
      !b.id_temuan ||
      !["OPEN", "CLOSE"].includes(
        b.status_temuan
      )
    ) {
      return Response.json(
        {
          error:
            "id_temuan dan status OPEN/CLOSE wajib",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       FOTO BARU UNTUK CLOSE
    ===================================================== */

    let fotoBaruUrl = null;

    if (
      b.foto_close_base64
    ) {
      try {
        fotoBaruUrl =
          await simpanFotoBase64(
            b.foto_close_base64
          );
      } catch (err) {
        return Response.json(
          {
            error:
              err?.message ||
              "Gagal menyimpan foto close",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       UPDATE TEMUAN
    ===================================================== */

    const result =
      await prisma.$queryRaw`
        UPDATE public.temuan_k3

        SET

          status_temuan =
            ${b.status_temuan},

          closed_at =
            CASE
              WHEN
                ${b.status_temuan} =
                'CLOSE'
              THEN
                CURRENT_TIMESTAMP
              ELSE
                NULL
            END,

          closed_by =
            CASE
              WHEN
                ${b.status_temuan} =
                'CLOSE'
              THEN
                ${b.closed_by ?? "User"}
              ELSE
                NULL
            END,

          foto_close_url =
            CASE
              WHEN
                ${b.status_temuan} =
                'OPEN'
              THEN
                NULL

              WHEN
                ${fotoBaruUrl}::text
                IS NOT NULL
              THEN
                ${fotoBaruUrl}

              ELSE
                foto_close_url
            END,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE
          id_temuan =
          ${b.id_temuan}

        RETURNING *
      `;

    /* =====================================================
       TEMUAN TIDAK DITEMUKAN
    ===================================================== */

    if (
      !result[0]
    ) {
      if (fotoBaruUrl) {
        await hapusFoto(
          fotoBaruUrl
        );
      }

      return Response.json(
        {
          error:
            "Temuan tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       BERHASIL UPDATE
    ===================================================== */

    return Response.json(
      {
        success: true,
        message: "Status temuan berhasil diperbarui",
        data: serializeBigInt(
          result[0]
        ),
      }
    );

  } catch (e) {
    console.error(
      "PATCH /api/temuan:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengubah status temuan",
      },
      {
        status: 500,
      }
    );
  }
}