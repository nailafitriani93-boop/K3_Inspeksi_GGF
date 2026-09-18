import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { writeActivityLog } from "@/lib/activity-log";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API LOGIN AKTIF"
  });
}

export async function POST(request) {
  try {
    /*
    =========================================
    AMBIL REQUEST
    =========================================
    */

    const body = await request.json();

    const username = String(
      body?.username || ""
    ).trim();

    const password = String(
      body?.password || ""
    );

    /*
    =========================================
    VALIDASI USERNAME
    =========================================
    */

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username wajib diisi."
        },
        {
          status: 400
        }
      );
    }

    /*
    =========================================
    VALIDASI PASSWORD
    =========================================
    */

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password wajib diisi."
        },
        {
          status: 400
        }
      );
    }

    /*
    =========================================
    CARI USER
    =========================================
    */

    const user = await prisma.users.findUnique({
      where: {
        username
      }
    });

    /*
    =========================================
    USER TIDAK DITEMUKAN
    =========================================
    */

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau password salah."
        },
        {
          status: 401
        }
      );
    }

    /*
    =========================================
    CEK AKTIF
    =========================================
    */

    if (!user.aktif) {
      return NextResponse.json(
        {
          success: false,
          message: "Akun Anda sedang tidak aktif."
        },
        {
          status: 403
        }
      );
    }

    /*
    =========================================
    CEK ROLE
    =========================================
    */

    const role = String(
      user.role || ""
    ).toUpperCase();

    if (
      ![
        "ADMIN",
        "INSPECTOR",
        "ADMIN_INSPECTOR",
        "ADMIN_INSPEKSI",
        "ADMIN_DEVELOPER",
        "ADMIN_SISTEM_MUTU",
        "TEAM_WILAYAH",
        "PIC",
        "VIEWER",
      ].includes(role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Role akun tidak memiliki akses."
        },
        {
          status: 403
        }
      );
    }

    /*
    =========================================
    CEK PASSWORD
    =========================================
    */

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau password salah."
        },
        {
          status: 401
        }
      );
    }

    /*
    =========================================
    DATA USER
    =========================================
    */

    const userData = {
      id_user: user.id_user,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      email: user.email || "",
      role,

      akses_dashboard:
        Boolean(user.akses_dashboard),

      akses_form_inspeksi:
        Boolean(user.akses_form_inspeksi),

      akses_data_temuan:
        Boolean(user.akses_data_temuan),

      kelola_user:
        Boolean(user.kelola_user),
    };

    /*
    =========================================
    LOGIN BERHASIL
    =========================================
    */

    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil.",
        user: userData
      },
      { status: 200 }
    );

    const token = await createSession({
      id: user.id_user,
      username: user.username,
      nama: user.nama_lengkap,
      role,

      akses_dashboard:
        Boolean(user.akses_dashboard),

      akses_form_inspeksi:
        Boolean(user.akses_form_inspeksi),

      akses_data_temuan:
        Boolean(user.akses_data_temuan),

      kelola_user:
        Boolean(user.kelola_user),
    });

    response.cookies.set("k3_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    await writeActivityLog(
      userData,
      "LOGIN",
      `Login berhasil ke sistem sebagai ${role}.`
    );

    return response;
  } catch (error) {
    console.error(
      "================================="
    );

    console.error("ERROR LOGIN");

    console.error(
      "================================="
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server."
      },
      {
        status: 500
      }
    );
  }
}