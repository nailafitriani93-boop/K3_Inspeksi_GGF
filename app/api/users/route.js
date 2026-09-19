import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  verifySession,
  createSession,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeActivityLog } from "@/lib/activity-log";

async function requireAdmin() {
  const token = (await cookies()).get("k3_token")?.value;
  const session = token ? await verifySession(token) : null;

  const canManageUsers = Boolean(session?.kelola_user);

  if (!session || !canManageUsers) {
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
    no_hp: row.no_hp || "",
    role: row.role,
    aktif: Boolean(row.aktif),

    akses_dashboard: Boolean(row.akses_dashboard),
    akses_form_inspeksi: Boolean(row.akses_form_inspeksi),
    akses_data_temuan: Boolean(row.akses_data_temuan),
    kelola_user: Boolean(row.kelola_user),
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Akses Admin diperlukan." },
      { status: 403 }
    );
  }

  try {
    const rows = await prisma.$queryRaw`
      SELECT
        id_user,
        nama_lengkap,
        username,
        email,
        no_hp,
        role,
        aktif,
        akses_dashboard,
        akses_form_inspeksi,
        akses_data_temuan,
        kelola_user
      FROM public.users
      ORDER BY nama_lengkap, username
    `;

    return NextResponse.json(rows.map(serializeUser));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Gagal mengambil data user.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json(
      { error: "Akses Admin diperlukan." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const nama = String(
      body?.nama_lengkap || ""
    ).trim();

    const username = String(
      body?.username || ""
    ).trim();

    const email =
      String(body?.email || "").trim() || null;

    const noHp =
      String(body?.no_hp || "").trim() || null;

    const password = String(
      body?.password || ""
    );

    const role = String(
      body?.role || "INSPECTOR"
    ).toUpperCase();

    const aktif = Boolean(body?.aktif);

    const aksesDashboard = Boolean(
      body?.akses_dashboard
    );

    const aksesFormInspeksi = Boolean(
      body?.akses_form_inspeksi
    );

    const aksesDataTemuan = Boolean(
      body?.akses_data_temuan
    );

    const kelolaUser = Boolean(
      body?.kelola_user
    );

    if (!nama || !username || !password) {
      return NextResponse.json(
        {
          error:
            "Nama lengkap, username, dan password wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (email && !email.includes("@")) {
      return NextResponse.json(
        {
          error: "Format email tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "ADMIN",
        "INSPECTOR",
        "ADMIN_INSPECTOR",
        "ADMIN_DEVELOPER",
        "ADMIN_SISTEM_MUTU",
        "TEAM_WILAYAH",
        "PIC",
        "VIEWER",
      ].includes(role)
    ) {
      return NextResponse.json(
        {
          error: "Role tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const rows = await prisma.$queryRaw`
      INSERT INTO public.users
        (
          nama_lengkap,
          username,
          email,
          no_hp,
          password,
          role,
          aktif,
          akses_dashboard,
          akses_form_inspeksi,
          akses_data_temuan,
          kelola_user
        )
      VALUES
        (
          ${nama},
          ${username},
          ${email},
          ${noHp},
          ${passwordHash},
          ${role},
          ${aktif},
          ${aksesDashboard},
          ${aksesFormInspeksi},
          ${aksesDataTemuan},
          ${kelolaUser}
        )
      RETURNING
        id_user,
        nama_lengkap,
        username,
        email,
        no_hp,
        role,
        aktif,
        akses_dashboard,
        akses_form_inspeksi,
        akses_data_temuan,
        kelola_user
    `;

    const user = serializeUser(rows[0]);

    await writeActivityLog(
      session,
      "TAMBAH_USER",
      `Menambahkan user ${user.nama_lengkap} (@${user.username}) dengan role ${user.role}.`
    );

    return NextResponse.json(
      user,
      {
        status: 201,
      }
    );
  } catch (error) {
    const message = String(
      error?.message || ""
    );

    const duplicate =
      message.includes("23505") ||
      message.toLowerCase().includes("unique");

    return NextResponse.json(
      {
        error: duplicate
          ? "Username atau email sudah digunakan."
          : message ||
            "Gagal menambah user.",
      },
      {
        status: duplicate ? 409 : 500,
      }
    );
  }
}

export async function PATCH(request) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json(
      { error: "Akses Admin diperlukan." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const id = Number(body?.id_user);

    const nama = String(
      body?.nama_lengkap || ""
    ).trim();

    const username = String(
      body?.username || ""
    ).trim();

    const email =
      String(body?.email || "").trim() || null;

    const noHp =
      String(body?.no_hp || "").trim() || null;

    const role = String(
      body?.role || "INSPECTOR"
    ).toUpperCase();

    const aktif = Boolean(body?.aktif);

    const aksesDashboard = Boolean(
      body?.akses_dashboard
    );

    const aksesFormInspeksi = Boolean(
      body?.akses_form_inspeksi
    );

    const aksesDataTemuan = Boolean(
      body?.akses_data_temuan
    );

    const kelolaUser = Boolean(
      body?.kelola_user
    );

    const password = String(
      body?.password || ""
    );

    if (
      !Number.isInteger(id) ||
      !nama ||
      !username ||
      (email && !email.includes("@"))
    ) {
      return NextResponse.json(
        {
          error:
            "Data user belum lengkap atau tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "ADMIN",
        "INSPECTOR",
        "ADMIN_INSPECTOR",
        "ADMIN_DEVELOPER",
        "ADMIN_SISTEM_MUTU",
        "TEAM_WILAYAH",
        "PIC",
        "VIEWER",
      ].includes(role)
    ) {
      return NextResponse.json(
        {
          error: "Role tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const passwordHash = password
      ? await bcrypt.hash(password, 10)
      : null;

    const rows = passwordHash
      ? await prisma.$queryRaw`
          UPDATE public.users
          SET
            nama_lengkap = ${nama},
            username = ${username},
            email = ${email},
            no_hp = ${noHp},
            role = ${role},
            aktif = ${aktif},
            akses_dashboard = ${aksesDashboard},
            akses_form_inspeksi = ${aksesFormInspeksi},
            akses_data_temuan = ${aksesDataTemuan},
            kelola_user = ${kelolaUser},
            password = ${passwordHash}
          WHERE id_user = ${id}
          RETURNING
            id_user,
            nama_lengkap,
            username,
            email,
            no_hp,
            role,
            aktif,
            akses_dashboard,
            akses_form_inspeksi,
            akses_data_temuan,
            kelola_user
        `
      : await prisma.$queryRaw`
          UPDATE public.users
          SET
            nama_lengkap = ${nama},
            username = ${username},
            email = ${email},
            no_hp = ${noHp},
            role = ${role},
            aktif = ${aktif},
            akses_dashboard = ${aksesDashboard},
            akses_form_inspeksi = ${aksesFormInspeksi},
            akses_data_temuan = ${aksesDataTemuan},
            kelola_user = ${kelolaUser}
          WHERE id_user = ${id}
          RETURNING
            id_user,
            nama_lengkap,
            username,
            email,
            no_hp,
            role,
            aktif,
            akses_dashboard,
            akses_form_inspeksi,
            akses_data_temuan,
            kelola_user
        `;

    if (!rows.length) {
      return NextResponse.json(
        {
          error: "User tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const user = serializeUser(rows[0]);

    await writeActivityLog(
      session,
      "UBAH_USER",
      `Memperbarui user ${user.nama_lengkap} (@${user.username}); role ${user.role}, status ${user.aktif ? "aktif" : "nonaktif"}, akses dashboard ${user.akses_dashboard ? "aktif" : "nonaktif"}, akses form inspeksi ${user.akses_form_inspeksi ? "aktif" : "nonaktif"}, akses data temuan ${user.akses_data_temuan ? "aktif" : "nonaktif"}, kelola akses ${user.kelola_user ? "aktif" : "nonaktif"}.`
    );

    const response = NextResponse.json(user);

    /*
     * Jika user yang diubah adalah user yang sedang login,
     * perbarui token session agar hak akses terbaru langsung berlaku.
     */
    if (
      Number(session.id_user) ===
      Number(user.id_user)
    ) {
      const token = await createSession({
        id_user: user.id_user,
        id: user.id_user,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        nama: user.nama_lengkap,
        email: user.email,
        role: user.role,

        akses_dashboard:
          user.akses_dashboard,

        akses_form_inspeksi:
          user.akses_form_inspeksi,

        akses_data_temuan:
          user.akses_data_temuan,

        kelola_user:
          user.kelola_user,
      });

      response.cookies.set(
        "k3_token",
        token,
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.NODE_ENV ===
            "production",
          path: "/",
        }
      );
    }

    return response;
  } catch (error) {
    const message = String(
      error?.message || ""
    );

    const duplicate =
      message.includes("23505") ||
      message.toLowerCase().includes("unique");

    return NextResponse.json(
      {
        error: duplicate
          ? "Username atau email sudah digunakan."
          : message ||
            "Gagal mengubah user.",
      },
      {
        status: duplicate ? 409 : 500,
      }
    );
  }
}