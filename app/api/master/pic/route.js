import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        mp.id_pic,
        mp.nama_pic
      FROM public.master_pic mp
      WHERE mp.aktif = TRUE
      ORDER BY mp.nama_pic
    `;

    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/master/pic:", e);
    return Response.json({ error: e?.message || "Gagal mengambil PIC" }, { status: 500 });
  }
}

export async function POST(req) {
  let body = {};

  try {
    body = await req.json();

    const nama = String(body?.nama_pic ?? "").trim();
    if (!nama) {
      return Response.json(
        { error: "Nama inspector wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.$queryRaw`
      SELECT id_pic, nama_pic, aktif
      FROM public.master_pic
      WHERE LOWER(TRIM(nama_pic)) = LOWER(TRIM(${nama}))
      LIMIT 1
    `;

    if (existing.length && existing[0].aktif) {
      return Response.json(
        { error: `Inspector "${existing[0].nama_pic}" sudah tersedia.` },
        { status: 409 }
      );
    }

    if (existing.length) {
      const restored = await prisma.$queryRaw`
        UPDATE public.master_pic
        SET aktif = TRUE
        WHERE id_pic = ${Number(existing[0].id_pic)}
        RETURNING id_pic, nama_pic
      `;

      return Response.json(restored[0], { status: 201 });
    }

    const rows = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(827361, 1)
      `;

      const nextId = await tx.$queryRaw`
        SELECT COALESCE(MAX(id_pic), 0) + 1 AS id_pic
        FROM public.master_pic
      `;

      return tx.$queryRaw`
        INSERT INTO public.master_pic (id_pic, nama_pic, wilayah_id, aktif)
        VALUES (${Number(nextId[0].id_pic)}, ${nama}, NULL, TRUE)
        RETURNING id_pic, nama_pic
      `;
    });

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    console.error("POST /api/master/pic:", e);
    return Response.json(
      { error: e?.message || "Gagal menambah inspector" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { error: "ID inspector tidak valid." },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw`
      UPDATE public.master_pic
      SET aktif = FALSE
      WHERE id_pic = ${id}
      RETURNING id_pic, nama_pic
    `;

    if (!rows.length) {
      return Response.json(
        { error: "Inspector tidak ditemukan." },
        { status: 404 }
      );
    }

    return Response.json(rows[0]);
  } catch (e) {
    console.error("DELETE /api/master/pic:", e);
    return Response.json(
      { error: e?.message || "Gagal menghapus inspector" },
      { status: 500 }
    );
  }
}
