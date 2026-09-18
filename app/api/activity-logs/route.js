import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { clearActivityLogs, getActivityLogs } from "@/lib/activity-log";

async function requireAdmin() {
  const token = (await cookies()).get("k3_token")?.value;
  const session = token ? await verifySession(token) : null;
  const role = String(session?.role || "").toUpperCase();
  const allowed = role === "ADMIN_DEVELOPER" || role === "ADMIN" ||
    (role === "ADMIN_SISTEM_MUTU" && Boolean(session?.kelola_user));
  return allowed ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Akses Admin diperlukan." }, { status: 403 });
  }

  try {
    const logs = await getActivityLogs();
    return NextResponse.json(logs.map((log) => ({
      ...log,
      id: Number(log.id),
    })));
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Gagal mengambil audit log." }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Akses Admin diperlukan." }, { status: 403 });
  }

  try {
    await clearActivityLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Gagal menghapus audit log." }, { status: 500 });
  }
}
