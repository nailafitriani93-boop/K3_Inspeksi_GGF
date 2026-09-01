import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET
);

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

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      success: true,
      user: {
        id_user: payload.id_user,
        username: payload.username,
        nama_lengkap: payload.nama_lengkap,
        role: payload.role,
      },
    });
  } catch (error) {
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