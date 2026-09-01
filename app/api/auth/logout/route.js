import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout berhasil",
  });

  response.cookies.set("k3_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}