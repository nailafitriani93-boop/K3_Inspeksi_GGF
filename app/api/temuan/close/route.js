// ============================================================
// FILE: app/api/temuan/close/route.js
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function dataUrlToBuffer(dataUrl) {
  if (
    typeof dataUrl !== "string" ||
    !dataUrl.startsWith("data:image/")
  ) {
    throw new Error(
      "Format foto tidak valid."
    );
  }

  const match =
    dataUrl.match(
      /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/
    );

  if (!match) {
    throw new Error(
      "Format foto tidak valid."
    );
  }

  const extension =
    match[1].toLowerCase() === "jpeg"
      ? "jpg"
      : match[1].toLowerCase();

  const buffer = Buffer.from(
    match[2],
    "base64"
  );

  return {
    extension,
    buffer,
  };
}

function serialize(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const result = {};

    for (const [key, val] of Object.entries(
      value
    )) {
      result[key] = serialize(val);
    }

    return result;
  }

  return value;
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    const idTemuan = body?.id_temuan;
    const keterangan =
      String(
        body?.keterangan_close || ""
      ).trim();

    const fotoBase64 =
      body?.foto_close_base64;

    const closedBy =
      String(
        body?.closed_by || ""
      ).trim();

    if (!idTemuan) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ID temuan wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (!keterangan) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Keterangan tindak lanjut wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fotoBase64) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Foto setelah perbaikan wajib diunggah.",
        },
        {
          status: 400,
        }
      );
    }

    if (!closedBy) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Data pengguna yang melakukan close tidak ditemukan.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.temuan_k3.findUnique({
        where: {
          id_temuan: BigInt(
            String(idTemuan)
          ),
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Data temuan tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      String(
        existing.status_temuan || ""
      ).toUpperCase() === "CLOSE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Temuan ini sudah berstatus CLOSE.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      extension,
      buffer,
    } = dataUrlToBuffer(
      fotoBase64
    );

    if (
      buffer.length >
      8 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ukuran foto terlalu besar. Maksimal 8 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const uploadDirectory =
      path.join(
        process.cwd(),
        "public",
        "uploads",
        "temuan-close"
      );

    await fs.mkdir(
      uploadDirectory,
      {
        recursive: true,
      }
    );

    const randomName =
      crypto
        .randomBytes(12)
        .toString("hex");

    const fileName =
      `close-${String(
        idTemuan
      )}-${randomName}.${extension}`;

    const filePath =
      path.join(
        uploadDirectory,
        fileName
      );

    await fs.writeFile(
      filePath,
      buffer
    );

    const fotoCloseUrl =
      `/uploads/temuan-close/${fileName}`;

    const updated =
      await prisma.temuan_k3.update({
        where: {
          id_temuan: BigInt(
            String(idTemuan)
          ),
        },

        data: {
          status_temuan: "CLOSE",

          closed_at:
            new Date(),

          closed_by:
            closedBy,

          foto_close_url:
            fotoCloseUrl,
        },

        include: {
          master_wilayah: {
            select: {
              id_wilayah: true,
              no_wilayah: true,
              nama_wilayah: true,
            },
          },

          master_lokasi: {
            select: {
              id_lokasi: true,
              nama_lokasi: true,
            },
          },

          master_mandor: {
            select: {
              id_mandor: true,
              nama_mandor: true,
            },
          },

          master_aktivitas: {
            select: {
              id_aktivitas: true,
              kode_aktivitas: true,
              nama_aktivitas: true,
            },
          },

          master_grup_temuan: {
            select: {
              id_grup: true,
              kode_grup: true,
              nama_grup: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Temuan berhasil ditindaklanjuti dan ditutup.",
        data: serialize(updated),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ERROR CLOSE TEMUAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Gagal melakukan close temuan.",
      },
      {
        status: 500,
      }
    );
  }
}