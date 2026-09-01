import { prisma } from "@/lib/db";
import { simpanFotoBase64, hapusFoto } from "@/lib/upload";
import { hitungDeadline } from "@/lib/deadline";

function safeDate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function serializeBigInt(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "bigint" ? Number(v) : v
    )
  );
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

    const clauses = [];

    if (
      status &&
      ["OPEN", "CLOSE"].includes(status)
    ) {
      clauses.push(
        `t.status_temuan = '${status}'`
      );
    }

    if (from && safeDate(from)) {
      clauses.push(
        `t.tanggal_temuan >= '${from}'`
      );
    }

    if (to && safeDate(to)) {
      clauses.push(
        `t.tanggal_temuan <= '${to}'`
      );
    }

    if (
      Number.isInteger(noWilayah) &&
      noWilayah >= 1 &&
      noWilayah <= 7
    ) {
      clauses.push(
        `t.no_wilayah = ${noWilayah}`
      );
    }

    const where = clauses.length
      ? `WHERE ${clauses.join(" AND ")}`
      : "";

    const rows =
      await prisma.$queryRawUnsafe(`
        SELECT
          t.*,
          ml.nama_lokasi,
          mm.nama_mandor,
          ma.nama_aktivitas,
          mg.nama_grup,

          CASE
            WHEN t.latitude IS NOT NULL
              AND t.longitude IS NOT NULL
            THEN
              'https://www.google.com/maps?q=' ||
              t.latitude || ',' || t.longitude
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
          t.tanggal_temuan DESC,
          t.created_at DESC,
          t.id_temuan DESC
      `);

    return Response.json(
      serializeBigInt(
        rows.map((r) => ({
          ...r,

          nama_wilayah: r.no_wilayah
            ? `Wilayah ${r.no_wilayah}`
            : null,

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

export async function POST(req) {
  try {
    const b = await req.json();

    const required = [
      "tanggal_temuan",
      "no_wilayah",
      "id_lokasi",
      "id_mandor",
      "id_aktivitas",
      "id_grup",
      "deskripsi",
    ];

    for (const k of required) {
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

    if (
      !safeDate(b.tanggal_temuan)
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

    const noWilayah =
      Number(b.no_wilayah);

    if (
      !Number.isInteger(noWilayah) ||
      noWilayah < 1 ||
      noWilayah > 7
    ) {
      return Response.json(
        {
          error:
            "Wilayah tidak valid (harus 1-7)",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // KONVERSI LATITUDE DAN LONGITUDE KE NUMBER
    // =====================================================

    const latitude =
      b.latitude !== undefined &&
      b.latitude !== null &&
      b.latitude !== ""
        ? Number(b.latitude)
        : null;

    const longitude =
      b.longitude !== undefined &&
      b.longitude !== null &&
      b.longitude !== ""
        ? Number(b.longitude)
        : null;

    if (
      latitude !== null &&
      !Number.isFinite(latitude)
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
      !Number.isFinite(longitude)
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
      (latitude < -90 ||
        latitude > 90)
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
      (longitude < -180 ||
        longitude > 180)
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

    // =====================================================
    // FOTO WAJIB
    // =====================================================

    if (!b.foto_base64) {
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

    // =====================================================
    // CEK LOKASI SESUAI WILAYAH
    // PIC TIDAK DIGUNAKAN
    // =====================================================

    const rel =
      await prisma.$queryRaw`
        SELECT
          (
            SELECT COUNT(*)
            FROM public.master_lokasi ml
            JOIN public.master_wilayah mw
              ON mw.id_wilayah =
                 ml.wilayah_id
            WHERE
              ml.id_lokasi =
                ${b.id_lokasi}
              AND
              NULLIF(
                regexp_replace(
                  mw.nama_wilayah,
                  '[^0-9]',
                  '',
                  'g'
                ),
                ''
              )::int =
                ${noWilayah}
          )::int AS lokasi_ok,

          (
            SELECT MIN(id_wilayah)
            FROM public.master_wilayah
            WHERE
              NULLIF(
                regexp_replace(
                  nama_wilayah,
                  '[^0-9]',
                  '',
                  'g'
                ),
                ''
              )::int =
                ${noWilayah}
          ) AS id_wilayah
      `;

    if (
      !rel[0]?.id_wilayah ||
      Number(rel[0].lokasi_ok) !== 1
    ) {
      return Response.json(
        {
          error:
            `Lokasi tidak sesuai dengan Wilayah ${noWilayah}. ` +
            `Silakan pilih lokasi dari wilayah yang dipilih.`,
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // SIMPAN FOTO
    // =====================================================

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

    // =====================================================
    // INSERT TEMUAN
    // =====================================================

    try {
      const result =
        await prisma.$queryRaw`
          INSERT INTO public.temuan_k3
          (
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
            ${b.tanggal_temuan}::date,
            ${noWilayah},
            ${Number(
              rel[0].id_wilayah
            )},
            ${b.id_lokasi},
            ${b.id_mandor},
            ${b.id_aktivitas},
            ${b.id_grup},
            ${String(
              b.deskripsi
            ).trim()},
            ${latitude},
            ${longitude},
            ${fotoUrl},
            'OPEN',
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

      return Response.json(
        serializeBigInt(result[0]),
        {
          status: 201,
        }
      );
    } catch (err) {
      await hapusFoto(fotoUrl);
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

export async function PATCH(req) {
  try {
    const b = await req.json();

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

    let fotoBaruUrl = null;

    if (b.foto_close_base64) {
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
              THEN CURRENT_TIMESTAMP
              ELSE NULL
            END,

          closed_by =
            CASE
              WHEN
                ${b.status_temuan} =
                'CLOSE'
              THEN
                ${b.closed_by ?? "User"}
              ELSE NULL
            END,

          foto_close_url =
            CASE
              WHEN
                ${b.status_temuan} =
                'OPEN'
              THEN NULL

              WHEN
                ${fotoBaruUrl}::text
                IS NOT NULL
              THEN ${fotoBaruUrl}

              ELSE foto_close_url
            END,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE
          id_temuan =
            ${b.id_temuan}

        RETURNING *
      `;

    if (!result[0]) {
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

    return Response.json(
      serializeBigInt(result[0])
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