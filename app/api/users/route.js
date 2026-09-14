import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const token = (await cookies()).get("k3_token")?.value;
  const session = token ? await verifySession(token) : null;

  if (
    !session ||
    ![
      "ADMIN",
      "ADMIN_INSPECTOR",
      "ADMIN_DEVELOPER",
    ].includes(String(session.role).toUpperCase())
  ) {
    return null;
  }

  return session;
}

function serializeUser(row) {
  return {
    id_user: Number(row.id_user),
    nama_lengkap: row.nama_lengkap,
    username: row.username,
    email: row.email || "",
    role: row.role,
    aktif: Boolean(row.aktif),
    akses_dashboard: Boolean(row.akses_dashboard),
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Akses Admin diperlukan." }, { status: 403 });
  }

  try {
    const rows = await prisma.$queryRaw`
      SELECT id_user, nama_lengkap, username, email, role, aktif, akses_dashboard
      FROM public.users
      ORDER BY nama_lengkap, username
    `;

    return NextResponse.json(rows.map(serializeUser));
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Gagal mengambil data user." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Akses Admin diperlukan." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const nama = String(body?.nama_lengkap || "").trim();
    const username = String(body?.username || "").trim();
    const email = String(body?.email || "").trim() || null;
    const password = String(body?.password || "");
    const role = String(body?.role || "INSPECTOR").toUpperCase();
    const aksesDashboard = Boolean(body?.akses_dashboard);

    if (!nama || !username || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, username, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email wajib diisi dengan format valid." }, { status: 400 });
    }

    if (!["ADMIN", "INSPECTOR", "ADMIN_INSPECTOR", "ADMIN_DEVELOPER"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await prisma.$queryRaw`
      INSERT INTO public.users
        (nama_lengkap, username, email, password, role, aktif, akses_dashboard)
      VALUES
        (${nama}, ${username}, ${email}, ${passwordHash}, ${role}, TRUE, ${aksesDashboard})
      RETURNING id_user, nama_lengkap, username, email, role, aktif, akses_dashboard
    `;

    return NextResponse.json(serializeUser(rows[0]), { status: 201 });
  } catch (error) {
    const message = String(error?.message || "");
    const duplicate = message.includes("23505") || message.toLowerCase().includes("unique");

    return NextResponse.json(
      { error: duplicate ? "Username atau email sudah digunakan." : message || "Gagal menambah user." },
      { status: duplicate ? 409 : 500 }
    );
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Akses Admin diperlukan." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body?.id_user);
    const nama = String(body?.nama_lengkap || "").trim();
    const username = String(body?.username || "").trim();
    const email = String(body?.email || "").trim() || null;
    const role = String(body?.role || "INSPECTOR").toUpperCase();
    const aksesDashboard = Boolean(body?.akses_dashboard);
    const password = String(body?.password || "");

    if (!Number.isInteger(id) || !nama || !username || !email || !email.includes("@")) {
      return NextResponse.json({ error: "Data user belum lengkap atau tidak valid." }, { status: 400 });
    }

    if (!["ADMIN", "INSPECTOR", "ADMIN_INSPECTOR", "ADMIN_DEVELOPER"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const rows = passwordHash
      ? await prisma.$queryRaw`
          UPDATE public.users
          SET nama_lengkap = ${nama}, username = ${username}, email = ${email},
              role = ${role}, aktif = ${Boolean(body?.aktif)},
              akses_dashboard = ${aksesDashboard}, password = ${passwordHash}
          WHERE id_user = ${id}
          RETURNING id_user, nama_lengkap, username, email, role, aktif, akses_dashboard
        `
      : await prisma.$queryRaw`
          UPDATE public.users
          SET nama_lengkap = ${nama}, username = ${username}, email = ${email},
              role = ${role}, aktif = ${Boolean(body?.aktif)},
              akses_dashboard = ${aksesDashboard}
          WHERE id_user = ${id}
          RETURNING id_user, nama_lengkap, username, email, role, aktif, akses_dashboard
        `;

    if (!rows.length) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(serializeUser(rows[0]));
  } catch (error) {
    const message = String(error?.message || "");
    const duplicate = message.includes("23505") || message.toLowerCase().includes("unique");

    return NextResponse.json(
      { error: duplicate ? "Username atau email sudah digunakan." : message || "Gagal mengubah user." },
      { status: duplicate ? 409 : 500 }
    );
  }
}
