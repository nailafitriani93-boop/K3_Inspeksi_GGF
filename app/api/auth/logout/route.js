import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { writeActivityLog } from "@/lib/activity-log";

export async function POST() {
  const token = (await cookies()).get("k3_token")?.value;
  const session = token ? await verifySession(token) : null;
  if (session) {
    await writeActivityLog(session, "LOGOUT", "Logout dari sistem.");
  }
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
