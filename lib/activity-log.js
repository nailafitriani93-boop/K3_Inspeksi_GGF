import { prisma } from "@/lib/db";

let activityLogReady;

async function ensureActivityLogTable() {
  if (!activityLogReady) {
    activityLogReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.activity_logs (
          id BIGSERIAL PRIMARY KEY,
          actor_id INTEGER NULL,
          actor_name VARCHAR(200) NOT NULL,
          actor_username VARCHAR(100) NULL,
          actor_role VARCHAR(50) NULL,
          action VARCHAR(40) NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC)"
      );
    })().catch((error) => {
      activityLogReady = null;
      throw error;
    });
  }

  return activityLogReady;
}

export async function writeActivityLog(session, action, description) {
  try {
    await ensureActivityLogTable();
    await prisma.$executeRaw`
      INSERT INTO public.activity_logs
        (actor_id, actor_name, actor_username, actor_role, action, description)
      VALUES
        (${session?.userId || session?.id_user ? Number(session.userId || session.id_user) : null},
         ${String(session?.nama_lengkap || session?.nama || session?.username || "Sistem")},
         ${session?.username ? String(session.username) : null},
         ${session?.role ? String(session.role) : null},
         ${action}, ${description})
    `;
  } catch (error) {
    // Kegagalan pencatatan tidak boleh menggagalkan aktivitas utama pengguna.
    console.error("Gagal mencatat audit log:", error);
  }
}

export async function getActivityLogs(limit = 100) {
  await ensureActivityLogTable();
  return prisma.$queryRaw`
    SELECT id, actor_name, actor_username, actor_role, action, description, created_at
    FROM public.activity_logs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function clearActivityLogs() {
  await ensureActivityLogTable();
  await prisma.$executeRawUnsafe("TRUNCATE TABLE public.activity_logs");
}
