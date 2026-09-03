// ============================================================
// FILE: app/api/temuan/data/route.js
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const data =
      await prisma.temuan_k3.findMany({
        orderBy: [
          {
            tanggal_temuan: "desc",
          },
          {
            id_temuan: "desc",
          },
        ],

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
        data: serialize(data),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ERROR GET DATA TEMUAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Gagal mengambil data temuan.",
      },
      {
        status: 500,
      }
    );
  }
}