import { prisma } from "@/lib/db";
import {
  simpanFotoBase64,
  hapusFoto,
} from "@/lib/upload";

function safeDate(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v)
  );
}

function serializeBigInt(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "bigint" ? Number(v) : v
    )
  );
}

function normalizeWilayah(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

async function cariWilayah(value) {
  const input = normalizeWilayah(value);

  if (!input) return null;

  const angkaMatch = input.match(/\d+/);

  if (angkaMatch) {
    const nomor = Number(angkaMatch[0]);

    if (Number.isInteger(nomor)) {
      const result = await prisma.$queryRaw`
        SELECT
          id_wilayah,
          no_wilayah,
          nama_wilayah
        FROM public.master_wilayah
        WHERE no_wilayah = ${nomor}
        LIMIT 1
      `;

      if (result[0]) return result[0];
    }
  }

  if (input.includes("bengkel")) {
    const result = await prisma.$queryRaw`
      SELECT
        id_wilayah,
        no_wilayah,
        nama_wilayah
      FROM public.master_wilayah
      WHERE LOWER(nama_wilayah::text) LIKE '%bengkel%'
      LIMIT 1
    `;

    if (result[0]) return result[0];
  }

  if (
    input.includes("mixing") ||
    input.includes("mixer")
  ) {
    const result = await prisma.$queryRaw`
      SELECT
        id_wilayah,
        no_wilayah,
        nama_wilayah
      FROM public.master_wilayah
      WHERE LOWER(nama_wilayah::text) LIKE '%mix%'
      LIMIT 1
    `;

    if (result[0]) return result[0];
  }

  if (
    input.includes("dipping") ||
    input.includes("diping")
  ) {
    const result = await prisma.$queryRaw`
      SELECT
        id_wilayah,
        no_wilayah,
        nama_wilayah
      FROM public.master_wilayah
      WHERE LOWER(nama_wilayah::text) LIKE '%dip%'
      LIMIT 1
    `;

    if (result[0]) return result[0];
  }

  return null;
}

export async function POST(req) {
  let fotoUrl = null;

  try {
    const b = await req.json();

    const required = [
      "tanggal_inspeksi",
      "no_wilayah",
      "id_lokasi",
      "id_mandor",
      "id_aktivitas",
      "hasil_inspeksi",
    ];

    for (const k of required) {
      if (
        b[k] === undefined ||
        b[k] === null ||
        b[k] === ""
      ) {
        return Response.json(
          {
            error: `Field ${k} wajib diisi`,
          },
          {
            status: 400,
          }
        );
      }
    }

    if (!safeDate(b.tanggal_inspeksi)) {
      return Response.json(
        {
          error: "Tanggal inspeksi tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "ADA_TEMUAN",
        "TIDAK_ADA_TEMUAN",
      ].includes(b.hasil_inspeksi)
    ) {
      return Response.json(
        {
          error:
            "Hasil inspeksi harus ADA_TEMUAN atau TIDAK_ADA_TEMUAN",
        },
        {
          status: 400,
        }
      );
    }

    const wilayahInput = String(
      b.no_wilayah ?? ""
    ).trim();

    const wilayahData =
      await cariWilayah(wilayahInput);

    if (!wilayahData) {
      return Response.json(
        {
          error: `Wilayah "${wilayahInput}" tidak ditemukan dalam master wilayah`,
        },
        {
          status: 400,
        }
      );
    }

    const idWilayah = Number(
      wilayahData.id_wilayah
    );

    const noWilayah = Number(
      wilayahData.no_wilayah
    );

    if (!Number.isInteger(idWilayah)) {
      return Response.json(
        {
          error: "ID wilayah tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(noWilayah)) {
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

    const idLokasi = Number(
      b.id_lokasi
    );

    const idMandor = Number(
      b.id_mandor
    );

    const idAktivitas = Number(
      b.id_aktivitas
    );

    if (!Number.isInteger(idLokasi)) {
      return Response.json(
        {
          error: "ID lokasi tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(idMandor)) {
      return Response.json(
        {
          error: "ID mandor tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(idAktivitas)) {
      return Response.json(
        {
          error: "ID aktivitas tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    const lokasi = await prisma.$queryRaw`
      SELECT
        id_lokasi,
        wilayah_id
      FROM public.master_lokasi
      WHERE id_lokasi = ${idLokasi}
      LIMIT 1
    `;

    if (!lokasi[0]) {
      return Response.json(
        {
          error:
            `Lokasi dengan ID ${idLokasi} tidak ditemukan`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number(lokasi[0].wilayah_id) !==
      idWilayah
    ) {
      return Response.json(
        {
          error:
            `Lokasi tidak sesuai dengan wilayah yang dipilih. Wilayah ${noWilayah}, lokasi berada di wilayah lain.`,
        },
        {
          status: 400,
        }
      );
    }

    const mandor = await prisma.$queryRaw`
      SELECT
        id_mandor
      FROM public.master_mandor
      WHERE id_mandor = ${idMandor}
      LIMIT 1
    `;

    if (!mandor[0]) {
      return Response.json(
        {
          error:
            `Mandor dengan ID ${idMandor} tidak ditemukan`,
        },
        {
          status: 400,
        }
      );
    }

    const aktivitas = await prisma.$queryRaw`
      SELECT
        id_aktivitas
      FROM public.master_aktivitas
      WHERE id_aktivitas = ${idAktivitas}
      LIMIT 1
    `;

    if (!aktivitas[0]) {
      return Response.json(
        {
          error:
            `Aktivitas dengan ID ${idAktivitas} tidak ditemukan`,
        },
        {
          status: 400,
        }
      );
    }

    let latitude = null;
    let longitude = null;

    if (
      b.latitude !== undefined &&
      b.latitude !== null &&
      b.latitude !== ""
    ) {
      const parsed = Number(b.latitude);

      if (
        !Number.isFinite(parsed) ||
        parsed < -90 ||
        parsed > 90
      ) {
        return Response.json(
          {
            error: "Latitude tidak valid",
          },
          {
            status: 400,
          }
        );
      }

      latitude = parsed;
    }

    if (
      b.longitude !== undefined &&
      b.longitude !== null &&
      b.longitude !== ""
    ) {
      const parsed = Number(
        b.longitude
      );

      if (
        !Number.isFinite(parsed) ||
        parsed < -180 ||
        parsed > 180
      ) {
        return Response.json(
          {
            error: "Longitude tidak valid",
          },
          {
            status: 400,
          }
        );
      }

      longitude = parsed;
    }

    if (
      !latitude ||
      !longitude
    ) {
      return Response.json(
        {
          error:
            "Koordinat GPS wajib tersedia",
        },
        {
          status: 400,
        }
      );
    }

    if (
      b.hasil_inspeksi ===
        "TIDAK_ADA_TEMUAN" &&
      b.foto_base64
    ) {
      try {
        fotoUrl =
          await simpanFotoBase64(
            b.foto_base64,
            "inspeksi"
          );
      } catch (e) {
        return Response.json(
          {
            error:
              e?.message ||
              "Gagal menyimpan foto inspeksi",
          },
          {
            status: 500,
          }
        );
      }
    }

    const catatan =
      b.catatan_inspeksi ===
        undefined ||
      b.catatan_inspeksi ===
        null
        ? null
        : String(
            b.catatan_inspeksi
          ).trim() || null;

    const created =
      await prisma.inspeksi_k3.create(
        {
          data: {
            tanggal_inspeksi:
              new Date(
                `${b.tanggal_inspeksi}T00:00:00`
              ),

            id_wilayah:
              idWilayah,

            id_lokasi:
              idLokasi,

            id_mandor:
              idMandor,

            id_aktivitas:
              idAktivitas,

            hasil_inspeksi:
              b.hasil_inspeksi,

            catatan_inspeksi:
              catatan,

            foto_inspeksi_url:
              fotoUrl,

            latitude,

            longitude,

            status_inspeksi:
              "SELESAI",
          },
        }
      );

    return Response.json(
      {
        success: true,
        message:
          b.hasil_inspeksi ===
          "TIDAK_ADA_TEMUAN"
            ? "Inspeksi berhasil disimpan tanpa temuan."
            : "Data inspeksi berhasil dibuat.",
        id_inspeksi:
          created.id_inspeksi.toString(),
        data:
          serializeBigInt(
            created
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (fotoUrl) {
      try {
        await hapusFoto(fotoUrl);
      } catch {}
    }

    console.error(
      "POST /api/inspeksi:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Gagal menyimpan data inspeksi",
      },
      {
        status: 500,
      }
    );
  }
}