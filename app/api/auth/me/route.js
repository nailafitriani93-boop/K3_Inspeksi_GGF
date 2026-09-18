import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  throw new Error("JWT_SECRET belum tersedia di .env");
}

const secret = new TextEncoder().encode(secretKey);

export async function GET(request) {
  try {
    const token = request.cookies.get("k3_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        {
          status: 401,
        }
      );
    }

    // Token hanya digunakan untuk memastikan session/login valid
    const { payload } = await jwtVerify(token, secret);

    const username = String(payload.username || "").trim();

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Session tidak memiliki username",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // AMBIL DATA USER TERBARU LANGSUNG DARI DATABASE
    // =========================================================
    const dbUser = await prisma.users.findUnique({
      where: {
        username,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan",
        },
        {
          status: 401,
        }
      );
    }

    if (!dbUser.aktif) {
      return NextResponse.json(
        {
          success: false,
          message: "Akun Anda sedang tidak aktif",
        },
        {
          status: 403,
        }
      );
    }

    // =========================================================
    // KIRIM PERMISSION TERBARU DARI DATABASE
    // =========================================================
    return NextResponse.json({
      success: true,

      user: {
        id_user: dbUser.id_user,

        username: dbUser.username,

        nama_lengkap: dbUser.nama_lengkap || "",

        role: String(dbUser.role || "").toUpperCase(),

        akses_dashboard: Boolean(dbUser.akses_dashboard),

        akses_form_inspeksi: Boolean(
          dbUser.akses_form_inspeksi
        ),

        akses_data_temuan: Boolean(
          dbUser.akses_data_temuan
        ),

        kelola_user: Boolean(dbUser.kelola_user),
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("ERROR AUTH ME");
    console.error("=================================");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Session tidak valid",
      },
      {
        status: 401,
      }
    );
  }
}