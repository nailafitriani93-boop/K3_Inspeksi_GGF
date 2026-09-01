import { prisma } from "@/lib/db";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { buatWorkbookTemuan, tambahSheet, workbookKeBuffer, siapkanBarisTemuan } from "@/lib/exporters";

// GET /api/dashboard/export?from&to&format=xlsx|pdf
// Export ringkasan dashboard: Total/Open/Close, per bulan, per grup, per
// wilayah, dan daftar temuan OPEN (dengan deadline & status keterlambatan).
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = (searchParams.get("format") || "xlsx").toLowerCase();
    const noWilayahRaw = searchParams.get("noWilayah");
    const noWilayah = noWilayahRaw ? Number(noWilayahRaw) : null;

    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return Response.json({ error: "Tanggal dari tidak valid" }, { status: 400 });
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return Response.json({ error: "Tanggal sampai tidak valid" }, { status: 400 });
    }
    if (from && to && from > to) {
      return Response.json({ error: "Tanggal dari tidak boleh lebih besar dari sampai" }, { status: 400 });
    }

    const where = [];
    if (from) where.push(`tanggal_temuan >= '${from.replaceAll("'", "''")}'`);
    if (to) where.push(`tanggal_temuan <= '${to.replaceAll("'", "''")}'`);
    if (Number.isInteger(noWilayah) && noWilayah >= 1 && noWilayah <= 7) {
      where.push(`no_wilayah = ${noWilayah}`);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [summaryRows, byWilayah, byGroup, openRows] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int total,
               COUNT(*) FILTER(WHERE status_temuan='OPEN')::int open,
               COUNT(*) FILTER(WHERE status_temuan='CLOSE')::int close,
               COUNT(*) FILTER(WHERE status_temuan='OPEN' AND (CURRENT_DATE - tanggal_temuan) > 7)::int overdue
        FROM public.temuan_k3 ${w}`),
      prisma.$queryRawUnsafe(`
        SELECT no_wilayah, ('Wilayah ' || no_wilayah) nama_wilayah, COUNT(*)::int total,
               COUNT(*) FILTER(WHERE status_temuan='OPEN')::int open,
               COUNT(*) FILTER(WHERE status_temuan='CLOSE')::int close
        FROM public.temuan_k3 ${w} ${w ? "AND" : "WHERE"} no_wilayah BETWEEN 1 AND 7
        GROUP BY no_wilayah ORDER BY no_wilayah`),
      prisma.$queryRawUnsafe(`
        SELECT mg.nama_grup, COUNT(t.*)::int jumlah
        FROM public.temuan_k3 t
        JOIN public.master_grup_temuan mg ON mg.id_grup = t.id_grup
        ${w}
        GROUP BY mg.id_grup, mg.nama_grup ORDER BY jumlah DESC`),
      prisma.$queryRawUnsafe(`
        SELECT t.*, ml.nama_lokasi, mp.nama_pic, mm.nama_mandor, ma.nama_aktivitas, mg.nama_grup
        FROM public.temuan_k3 t
        LEFT JOIN public.master_lokasi ml ON ml.id_lokasi = t.id_lokasi
        LEFT JOIN public.master_pic mp ON mp.id_pic = t.id_pic
        LEFT JOIN public.master_mandor mm ON mm.id_mandor = t.id_mandor
        LEFT JOIN public.master_aktivitas ma ON ma.id_aktivitas = t.id_aktivitas
        LEFT JOIN public.master_grup_temuan mg ON mg.id_grup = t.id_grup
        WHERE t.status_temuan = 'OPEN'
          ${where.length ? `AND ${where.map((x) => x.replaceAll("tanggal_temuan", "t.tanggal_temuan").replaceAll("no_wilayah", "t.no_wilayah")).join(" AND ")}` : ""}
        ORDER BY t.tanggal_temuan ASC`),
    ]);

    const s = summaryRows[0];
    const ringkasanRows = [{
      "Total Temuan": s.total,
      "OPEN": s.open,
      "CLOSE": s.close,
      "Close Rate (%)": s.total ? Number(((s.close / s.total) * 100).toFixed(1)) : 0,
      "Terlambat (>7 hari)": s.overdue,
    }];

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const margin = 32;
      doc.setFontSize(16);
      doc.text("Dashboard Inspeksi K3 - Great Giant Foods", margin, 40);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Periode ${from || "semua"} s/d ${to || "semua"}`, margin, 58);
      doc.setTextColor(0);

      autoTable(doc, {
        head: [Object.keys(ringkasanRows[0])],
        body: [Object.values(ringkasanRows[0]).map(String)],
        startY: 72,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [15, 98, 76] },
      });

      doc.text("Rekap per Wilayah", margin, doc.lastAutoTable.finalY + 24);
      autoTable(doc, {
        head: [["Wilayah", "Total", "Open", "Close"]],
        body: byWilayah.map((r) => [r.nama_wilayah, r.total, r.open, r.close]),
        startY: doc.lastAutoTable.finalY + 32,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [15, 98, 76] },
      });

      doc.text("Rekap per Grup Temuan", margin, doc.lastAutoTable.finalY + 24);
      autoTable(doc, {
        head: [["Grup Temuan", "Jumlah"]],
        body: byGroup.map((r) => [r.nama_grup, r.jumlah]),
        startY: doc.lastAutoTable.finalY + 32,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [15, 98, 76] },
      });

      doc.addPage("a4", "landscape");
      doc.setFontSize(13);
      doc.text("Daftar Temuan OPEN (Status & Deadline 7 Hari)", margin, 40);

      const dataOpen = siapkanBarisTemuan(openRows);
      autoTable(doc, {
        head: [Object.keys(dataOpen[0] || {
          "ID Temuan": "", "Tanggal Temuan": "", "Wilayah": "", "Lokasi": "", "PIC": "",
          "Deskripsi": "", "Status": "", "Deadline Close (7 hari)": "", "Sisa/Lewat Hari": "", "Keterlambatan": "",
        })],
        body: dataOpen.map((r) => Object.values(r).map((v) => (v == null ? "" : String(v)))),
        startY: 56,
        margin: { left: margin, right: margin },
        styles: { fontSize: 6.5, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [178, 34, 34] },
      });

      const totalHalaman = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalHalaman; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Halaman ${i} / ${totalHalaman}`, doc.internal.pageSize.getWidth() - margin - 60, doc.internal.pageSize.getHeight() - 16);
      }

      const buf = Buffer.from(doc.output("arraybuffer"));
      return new Response(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="dashboard-k3-${from || "all"}-${to || "all"}.pdf"`,
        },
      });
    }

    const wb = buatWorkbookTemuan(openRows, "Temuan OPEN");
    tambahSheet(wb, ringkasanRows, "Ringkasan");
    tambahSheet(
      wb,
      byWilayah.map((r) => ({ Wilayah: r.nama_wilayah, Total: r.total, Open: r.open, Close: r.close })),
      "Per Wilayah"
    );
    tambahSheet(
      wb,
      byGroup.map((r) => ({ "Grup Temuan": r.nama_grup, Jumlah: r.jumlah })),
      "Per Grup"
    );

    const buf = workbookKeBuffer(wb);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dashboard-k3-${from || "all"}-${to || "all"}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("GET /api/dashboard/export:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
