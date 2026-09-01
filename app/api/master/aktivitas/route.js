import { prisma } from "@/lib/db";

// ============================================================
// GET
// Mengambil semua aktivitas yang masih aktif
// ============================================================

export async function GET() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        id_aktivitas,
        kode_aktivitas,
        nama_aktivitas
      FROM public.master_aktivitas
      WHERE aktif = TRUE
      ORDER BY id_aktivitas
    `;

    const data = rows.map((row) => ({
      id_aktivitas: Number(row.id_aktivitas),
      kode_aktivitas: String(row.kode_aktivitas),
      nama_aktivitas: String(row.nama_aktivitas),
    }));

    return Response.json(data);
  } catch (e) {
    console.error("GET /api/master/aktivitas:", e);

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal mengambil aktivitas",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST
// Menambah aktivitas baru
//
// Frontend hanya mengirim:
// {
//   nama_aktivitas: "Seset Bonggol"
// }
//
// ID dan kode dibuat otomatis oleh database.
// ============================================================

export async function POST(req) {
  let body = {};

  try {
    body = await req.json();

    const nama = String(
      body?.nama_aktivitas ?? ""
    ).trim();

    // ========================================================
    // VALIDASI
    // ========================================================

    if (!nama) {
      return Response.json(
        {
          error:
            "Nama aktivitas wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // CEK AKTIVITAS
    //
    // Jika aktivitas aktif sudah ada → jangan duplikat.
    // Jika aktivitas pernah dihapus/nonaktif → aktifkan kembali.
    // ========================================================

    const existing = await prisma.$queryRaw`
      SELECT
        id_aktivitas,
        kode_aktivitas,
        nama_aktivitas,
        aktif
      FROM public.master_aktivitas
      WHERE LOWER(TRIM(nama_aktivitas))
          = LOWER(TRIM(${nama}))
      LIMIT 1
    `;

    if (existing.length > 0) {
      const row = existing[0];

      // ======================================================
      // JIKA SUDAH AKTIF
      // ======================================================

      if (Boolean(row.aktif)) {
        return Response.json(
          {
            error:
              `Aktivitas "${row.nama_aktivitas}" sudah tersedia.`,

            duplicate: true,

            data: {
              id_aktivitas:
                Number(row.id_aktivitas),

              kode_aktivitas:
                String(row.kode_aktivitas),

              nama_aktivitas:
                String(row.nama_aktivitas),

              aktif: true,
            },
          },
          {
            status: 409,
          }
        );
      }

      // ======================================================
      // JIKA PERNAH DIHAPUS / NONAKTIF
      //
      // Aktifkan kembali.
      // Tidak membuat ID baru.
      // ======================================================

      const restored =
        await prisma.$queryRaw`
          UPDATE public.master_aktivitas
          SET
            aktif = TRUE
          WHERE
            id_aktivitas =
              ${Number(row.id_aktivitas)}
          RETURNING
            id_aktivitas,
            kode_aktivitas,
            nama_aktivitas
        `;

      if (
        !restored ||
        restored.length === 0
      ) {
        throw new Error(
          "Aktivitas gagal diaktifkan kembali."
        );
      }

      const data = {
        id_aktivitas:
          Number(
            restored[0].id_aktivitas
          ),

        kode_aktivitas:
          String(
            restored[0].kode_aktivitas
          ),

        nama_aktivitas:
          String(
            restored[0].nama_aktivitas
          ),
      };

      return Response.json(
        data,
        {
          status: 201,
        }
      );
    }

    // ========================================================
    // INSERT AKTIVITAS BARU
    // ========================================================

    const rows = await prisma.$queryRaw`
      INSERT INTO public.master_aktivitas
        (
          nama_aktivitas,
          aktif
        )
      VALUES
        (
          ${nama},
          TRUE
        )
      RETURNING
        id_aktivitas,
        kode_aktivitas,
        nama_aktivitas
    `;

    if (
      !rows ||
      rows.length === 0
    ) {
      throw new Error(
        "Aktivitas gagal ditambahkan."
      );
    }

    const data = {
      id_aktivitas:
        Number(
          rows[0].id_aktivitas
        ),

      kode_aktivitas:
        String(
          rows[0].kode_aktivitas
        ),

      nama_aktivitas:
        String(
          rows[0].nama_aktivitas
        ),
    };

    return Response.json(
      data,
      {
        status: 201,
      }
    );
  } catch (e) {
    console.error(
      "POST /api/master/aktivitas:",
      e
    );

    const errorMessage =
      String(e?.message || "");

    // ========================================================
    // DUPLICATE DATABASE
    // ========================================================

    if (
      e?.code === "P2010" &&
      (
        errorMessage.includes("23505") ||
        errorMessage.includes("unique")
      )
    ) {
      const namaRequest =
        String(
          body?.nama_aktivitas ?? ""
        ).trim();

      return Response.json(
        {
          error:
            `Aktivitas "${namaRequest}" sudah tersedia.`,

          duplicate: true,
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal menambah aktivitas",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// DELETE
//
// Request:
//
// DELETE /api/master/aktivitas?id=123
//
// CATATAN:
// Aktivitas TIDAK benar-benar dihapus dari database.
// Hanya dibuat:
// aktif = FALSE
//
// Tujuannya supaya data temuan lama yang menggunakan
// id_aktivitas tersebut tetap aman.
// ============================================================

export async function DELETE(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const idRaw =
      searchParams.get("id");

    const id =
      Number(idRaw);

    // ========================================================
    // VALIDASI ID
    // ========================================================

    if (
      !idRaw ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return Response.json(
        {
          error:
            "ID aktivitas tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // CARI AKTIVITAS
    // ========================================================

    const existing =
      await prisma.$queryRaw`
        SELECT
          id_aktivitas,
          kode_aktivitas,
          nama_aktivitas,
          aktif
        FROM public.master_aktivitas
        WHERE
          id_aktivitas =
            ${id}
        LIMIT 1
      `;

    if (
      !existing ||
      existing.length === 0
    ) {
      return Response.json(
        {
          error:
            "Aktivitas tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const aktivitas =
      existing[0];

    // ========================================================
    // CEK SUDAH NONAKTIF
    // ========================================================

    if (!Boolean(aktivitas.aktif)) {
      return Response.json(
        {
          error:
            "Aktivitas sudah tidak aktif.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // CEK APAKAH SUDAH DIGUNAKAN PADA TEMUAN
    //
    // Tidak menghapus data temuan.
    // Aktivitas hanya dinonaktifkan.
    // ========================================================

    const penggunaan =
      await prisma.$queryRaw`
        SELECT COUNT(*)::int AS jumlah
        FROM public.temuan_k3
        WHERE
          id_aktivitas =
            ${id}
      `;

    const jumlahDigunakan =
      Number(
        penggunaan?.[0]?.jumlah || 0
      );

    // ========================================================
    // NONAKTIFKAN AKTIVITAS
    // ========================================================

    const updated =
      await prisma.$queryRaw`
        UPDATE public.master_aktivitas
        SET
          aktif = FALSE
        WHERE
          id_aktivitas =
            ${id}
        RETURNING
          id_aktivitas,
          kode_aktivitas,
          nama_aktivitas,
          aktif
      `;

    if (
      !updated ||
      updated.length === 0
    ) {
      throw new Error(
        "Aktivitas gagal dinonaktifkan."
      );
    }

    return Response.json(
      {
        success: true,

        message:
          `Aktivitas "${aktivitas.nama_aktivitas}" berhasil dihapus.`,

        data: {
          id_aktivitas:
            Number(
              updated[0].id_aktivitas
            ),

          kode_aktivitas:
            String(
              updated[0].kode_aktivitas
            ),

          nama_aktivitas:
            String(
              updated[0].nama_aktivitas
            ),

          aktif: false,

          sudah_digunakan:
            jumlahDigunakan > 0,

          jumlah_penggunaan:
            jumlahDigunakan,
        },
      },
      {
        status: 200,
      }
    );
  } catch (e) {
    console.error(
      "DELETE /api/master/aktivitas:",
      e
    );

    return Response.json(
      {
        error:
          e?.message ||
          "Gagal menghapus aktivitas.",
      },
      {
        status: 500,
      }
    );
  }
}