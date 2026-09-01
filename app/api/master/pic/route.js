import { prisma } from "@/lib/db";

// Sama seperti /api/master/lokasi: menerima ?noWilayah=1..7 (angka).
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const noWilayahRaw = searchParams.get("noWilayah") ?? searchParams.get("wilayahNama");
    const noWilayah = Number(noWilayahRaw);

    if (!noWilayahRaw || !Number.isInteger(noWilayah) || noWilayah < 1 || noWilayah > 7) {
      return Response.json([]);
    }

    const rows = await prisma.$queryRaw`
      SELECT
        mp.id_pic,
        mp.nama_pic,
        mp.wilayah_id
      FROM public.master_pic mp
      INNER JOIN public.master_wilayah mw
        ON mw.id_wilayah = mp.wilayah_id
      WHERE NULLIF(regexp_replace(mw.nama_wilayah, '[^0-9]', '', 'g'), '')::int = ${noWilayah}
      ORDER BY mp.nama_pic
    `;

    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/master/pic:", e);
    return Response.json({ error: e?.message || "Gagal mengambil PIC" }, { status: 500 });
  }
}
