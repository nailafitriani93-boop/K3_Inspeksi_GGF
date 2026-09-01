import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { hitungDeadline } from "@/lib/deadline";

import fs from "fs";
import path from "path";

/*
|--------------------------------------------------------------------------
| FORMAT TANGGAL
|--------------------------------------------------------------------------
*/

function fmtTanggal(v) {
  if (!v) return "";

  return String(v).slice(0, 10);
}

/*
|--------------------------------------------------------------------------
| MENYIAPKAN DATA TEMUAN
|--------------------------------------------------------------------------
|
| Fungsi ini tetap dipakai oleh PDF dan fungsi lain.
|
*/

export function siapkanBarisTemuan(rows = []) {
  return rows.map((r) => {
    const dl = hitungDeadline(
      r.tanggal_temuan,
      r.status_temuan
    );

    return {
      "ID Temuan":
        r.id_temuan || "",

      "Tanggal Temuan":
        fmtTanggal(
          r.tanggal_temuan
        ),

      "Wilayah":
        r.no_wilayah
          ? `Wilayah ${r.no_wilayah}`
          : "",

      "Lokasi":
        r.nama_lokasi || "",

      "PIC":
        r.nama_pic || "",

      "Mandor":
        r.nama_mandor || "",

      "Aktivitas":
        r.nama_aktivitas || "",

      "Grup Temuan":
        r.nama_grup || "",

      "Deskripsi":
        r.deskripsi || "",

      "Status":
        r.status_temuan || "",

      "Deadline Close (7 hari)":
        dl.deadline || "",

      "Sisa/Lewat Hari":
        dl.sisaHari ?? "",

      "Keterlambatan":
        dl.overdue
          ? "TERLAMBAT"
          : r.status_temuan === "OPEN"
            ? "Dalam Batas"
            : "-",

      "Tanggal Ditutup":
        r.closed_at
          ? String(
              r.closed_at
            ).slice(0, 10)
          : "",

      "Ditutup Oleh":
        r.closed_by || "",

      "Latitude":
        r.latitude || "",

      "Longitude":
        r.longitude || "",

      "Google Maps":
        r.gmaps_url ||
        (
          r.latitude &&
          r.longitude
            ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}`
            : ""
        ),

      "Foto":
        r.foto_url || "",

      "Foto Tindak Lanjut":
        r.foto_close_url || "",
    };
  });
}

/*
|--------------------------------------------------------------------------
| TEMPLATE EXCEL
|--------------------------------------------------------------------------
*/

const TEMPLATE_FILE =
  "LAPORAN INSPEKSI Nopember 25.xlsx";

function getTemplatePath() {
  return path.join(
    process.cwd(),
    "public",
    "templates",
    TEMPLATE_FILE
  );
}

/*
|--------------------------------------------------------------------------
| FORMAT DATA UNTUK TEMPLATE
|--------------------------------------------------------------------------
|
| Template memiliki 13 kolom:
|
| A = Tanggal Temuan
| B = Department
| C = Lokasi
| D = Jenis Temuan
| E = Temuan
| F = Rencana Perbaikan
| G = PIC yg Inspeksi
| H = PIC Penanggung jawab Lokasi temuan
| I = Foto Temuan (Open)
| J = Foto Temuan (Close)
| K = Tanggal target
| L = Status
| M = Tanggal Close
|
|--------------------------------------------------------------------------
*/

function getValue(
  row,
  keys = []
) {
  for (const key of keys) {
    if (
      row &&
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ""
    ) {
      return row[key];
    }
  }

  return "";
}

function toText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const d =
    new Date(value);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return null;
  }

  return d;
}

/*
|--------------------------------------------------------------------------
| MAPPING DATA DATABASE KE TEMPLATE
|--------------------------------------------------------------------------
*/

function mappingTemplateRow(row) {
  return {
    tanggalTemuan:
      getValue(row, [
        "tanggal_temuan",
        "tanggal",
        "tgl_temuan",
      ]),

    department:
      getValue(row, [
        "department",
        "departemen",
        "dept",
        "nama_department",
      ]),

    lokasi:
      getValue(row, [
        "nama_lokasi",
        "lokasi",
      ]),

    jenisTemuan:
      getValue(row, [
        "jenis_temuan",
        "jenis",
        "nama_jenis_temuan",
        "jenisTemuan",
      ]),

    temuan:
      getValue(row, [
        "deskripsi",
        "temuan",
        "uraian_temuan",
        "keterangan",
      ]),

    rencanaPerbaikan:
      getValue(row, [
        "rencana_perbaikan",
        "rencana",
        "tindakan_perbaikan",
        "perbaikan",
      ]),

    picInspeksi:
      getValue(row, [
        "nama_pic",
        "pic_inspeksi",
        "pic",
        "namaPic",
      ]),

    picPenanggungJawab:
      getValue(row, [
        "pic_penanggung_jawab",
        "nama_pic_penanggung_jawab",
        "pic_lokasi",
        "penanggung_jawab",
        "nama_penanggung_jawab",
      ]),

    fotoOpen:
      getValue(row, [
        "foto_url",
        "foto_open",
        "foto_temuan_open",
        "foto_open_url",
        "foto_open_path",
        "dokumentasi_open",
      ]),

    fotoClose:
      getValue(row, [
        "foto_close_url",
        "foto_close",
        "foto_temuan_close",
        "foto_close_path",
        "dokumentasi_close",
      ]),

    tanggalTarget:
      getValue(row, [
        "tanggal_target",
        "target_date",
        "tgl_target",
      ]),

    status:
      getValue(row, [
        "status_temuan",
        "status",
      ]),

    tanggalClose:
      getValue(row, [
        "tanggal_close",
        "tgl_close",
        "closed_at",
      ]),
  };
}

/*
|--------------------------------------------------------------------------
| BORDER TEMPLATE
|--------------------------------------------------------------------------
*/

function createBorder() {
  return {
    top: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },

    left: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },

    bottom: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },

    right: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },
  };
}

/*
|--------------------------------------------------------------------------
| STYLE HEADER
|--------------------------------------------------------------------------
*/

function applyHeaderStyle(
  cell
) {
  cell.font = {
    name: "Cambria",
    size: 10,
    bold: true,
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",

    fgColor: {
      argb: "FFFFC000",
    },
  };

  cell.border =
    createBorder();

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
}

/*
|--------------------------------------------------------------------------
| STYLE DATA
|--------------------------------------------------------------------------
*/

function applyDataStyle(
  cell,
  horizontal = "center",
  vertical = "middle"
) {
  cell.font = {
    name: "Cambria",
    size: 10,
  };

  cell.border =
    createBorder();

  cell.alignment = {
    horizontal,
    vertical,
    wrapText: true,
  };
}

/*
|--------------------------------------------------------------------------
| TINGGI BARIS
|--------------------------------------------------------------------------
*/

function calculateHeight(
  data
) {
  const texts = [
    data.temuan,
    data.rencanaPerbaikan,
    data.picPenanggungJawab,
  ];

  let lines = 1;

  for (const item of texts) {
    const text =
      toText(item);

    if (!text) {
      continue;
    }

    const estimated =
      Math.ceil(
        text.length / 55
      );

    lines =
      Math.max(
        lines,
        estimated
      );
  }

  return Math.min(
    Math.max(
      lines * 15,
      45
    ),
    180
  );
}

/*
|--------------------------------------------------------------------------
| NAMA BULAN
|--------------------------------------------------------------------------
*/

function namaBulan(
  date
) {
  const bulan = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOPEMBER",
    "DESEMBER",
  ];

  return bulan[
    date.getMonth()
  ];
}

/*
|--------------------------------------------------------------------------
| BUAT WORKBOOK TEMUAN
|--------------------------------------------------------------------------
|
| SEKARANG MENGGUNAKAN TEMPLATE EXCEL ASLI.
|
|--------------------------------------------------------------------------
*/

export async function buatWorkbookTemuan(
  rows = [],
  sheetName = "Temuan K3"
) {
  const templatePath =
    getTemplatePath();

  /*
  |--------------------------------------------------------------------------
  | CEK TEMPLATE
  |--------------------------------------------------------------------------
  */

  if (
    !fs.existsSync(
      templatePath
    )
  ) {
    throw new Error(
      `Template Excel tidak ditemukan.

File yang dicari:
${templatePath}

Pastikan file:
${TEMPLATE_FILE}

berada di:
public/templates/`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD TEMPLATE
  |--------------------------------------------------------------------------
  */

  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.readFile(
    templatePath
  );

  /*
  |--------------------------------------------------------------------------
  | SHEET
  |--------------------------------------------------------------------------
  */

  const ws =
    workbook.getWorksheet(
      "Sheet1"
    ) ||
    workbook.worksheets[0];

  if (!ws) {
    throw new Error(
      "Sheet pada template Excel tidak ditemukan."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  const headers = [
    "Tanggal Temuan",
    "Department",
    "Lokasi",
    "Jenis Temuan",
    "Temuan",
    "Rencana Perbaikan",
    "PIC yg Inspeksi",
    "PIC  Penanggung jawab Lokasi temuan",
    "Foto Temuan\n(Open)",
    "Foto Temuan\n(Close)",
    "Tanggal target",
    "Status",
    "Tanggal Close",
  ];

  const headerRow =
    ws.getRow(3);

  headers.forEach(
    (header, index) => {
      const cell =
        headerRow.getCell(
          index + 1
        );

      cell.value =
        header;

      applyHeaderStyle(
        cell
      );
    }
  );

  headerRow.height = 35;

  /*
  |--------------------------------------------------------------------------
  | JUDUL
  |--------------------------------------------------------------------------
  */

  const titleCell =
    ws.getCell("B2");

  if (rows.length > 0) {
    const first =
      mappingTemplateRow(
        rows[0]
      );

    const date =
      toDate(
        first.tanggalTemuan
      );

    if (date) {
      titleCell.value =
        `INSPEKSI ${namaBulan(
          date
        )} ${String(
          date.getFullYear()
        ).slice(-2)}`;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | HAPUS DATA LAMA
  |--------------------------------------------------------------------------
  |
  | Baris 1-3 dipertahankan.
  |
  */

  if (
    ws.rowCount >= 4
  ) {
    ws.spliceRows(
      4,
      ws.rowCount - 3
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ISI DATA
  |--------------------------------------------------------------------------
  */

  let rowNumber = 4;

  for (const raw of rows) {
    const data =
      mappingTemplateRow(
        raw
      );

    const row =
      ws.getRow(
        rowNumber
      );

    /*
    |--------------------------------------------------------------------------
    | A - TANGGAL TEMUAN
    |--------------------------------------------------------------------------
    */

    row.getCell(1).value =
      toDate(
        data.tanggalTemuan
      ) || "";

    row.getCell(1).numFmt =
      "dd/mm/yyyy";

    /*
    |--------------------------------------------------------------------------
    | B - DEPARTMENT
    |--------------------------------------------------------------------------
    */

    row.getCell(2).value =
      toText(
        data.department
      );

    /*
    |--------------------------------------------------------------------------
    | C - LOKASI
    |--------------------------------------------------------------------------
    */

    row.getCell(3).value =
      toText(
        data.lokasi
      );

    /*
    |--------------------------------------------------------------------------
    | D - JENIS TEMUAN
    |--------------------------------------------------------------------------
    */

    row.getCell(4).value =
      toText(
        data.jenisTemuan
      );

    /*
    |--------------------------------------------------------------------------
    | E - TEMUAN
    |--------------------------------------------------------------------------
    */

    row.getCell(5).value =
      toText(
        data.temuan
      );

    /*
    |--------------------------------------------------------------------------
    | F - RENCANA PERBAIKAN
    |--------------------------------------------------------------------------
    */

    row.getCell(6).value =
      toText(
        data.rencanaPerbaikan
      );

    /*
    |--------------------------------------------------------------------------
    | G - PIC INSPEKSI
    |--------------------------------------------------------------------------
    */

    row.getCell(7).value =
      toText(
        data.picInspeksi
      );

    /*
    |--------------------------------------------------------------------------
    | H - PIC PENANGGUNG JAWAB
    |--------------------------------------------------------------------------
    */

    row.getCell(8).value =
      toText(
        data.picPenanggungJawab
      );

    /*
    |--------------------------------------------------------------------------
    | I - FOTO OPEN
    |--------------------------------------------------------------------------
    */

    row.getCell(9).value =
      toText(
        data.fotoOpen
      );

    /*
    |--------------------------------------------------------------------------
    | J - FOTO CLOSE
    |--------------------------------------------------------------------------
    */

    row.getCell(10).value =
      toText(
        data.fotoClose
      );

    /*
    |--------------------------------------------------------------------------
    | K - TANGGAL TARGET
    |--------------------------------------------------------------------------
    */

    row.getCell(11).value =
      toDate(
        data.tanggalTarget
      ) || "";

    row.getCell(11).numFmt =
      "dd/mm/yyyy";

    /*
    |--------------------------------------------------------------------------
    | L - STATUS
    |--------------------------------------------------------------------------
    */

    row.getCell(12).value =
      toText(
        data.status
      );

    /*
    |--------------------------------------------------------------------------
    | M - TANGGAL CLOSE
    |--------------------------------------------------------------------------
    */

    row.getCell(13).value =
      toDate(
        data.tanggalClose
      ) || "";

    row.getCell(13).numFmt =
      "dd/mm/yyyy";

    /*
    |--------------------------------------------------------------------------
    | STYLE DATA
    |--------------------------------------------------------------------------
    */

    for (
      let col = 1;
      col <= 13;
      col++
    ) {
      applyDataStyle(
        row.getCell(col)
      );
    }

    /*
    |--------------------------------------------------------------------------
    | TEMUAN DAN RENCANA
    |--------------------------------------------------------------------------
    */

    row.getCell(5).alignment = {
      horizontal: "left",
      vertical: "top",
      wrapText: true,
    };

    row.getCell(6).alignment = {
      horizontal: "left",
      vertical: "top",
      wrapText: true,
    };

    /*
    |--------------------------------------------------------------------------
    | TINGGI BARIS
    |--------------------------------------------------------------------------
    */

    row.height =
      calculateHeight(
        data
      );

    rowNumber++;
  }

  /*
  |--------------------------------------------------------------------------
  | LEBAR KOLOM
  |--------------------------------------------------------------------------
  */

  const widths = [
    12,
    18,
    22,
    28,
    40,
    34,
    23,
    25,
    22,
    22,
    17,
    14,
    17,
  ];

  widths.forEach(
    (width, index) => {
      ws.getColumn(
        index + 1
      ).width = width;
    }
  );

  /*
  |--------------------------------------------------------------------------
  | FREEZE HEADER
  |--------------------------------------------------------------------------
  */

  ws.views = [
    {
      state: "frozen",
      ySplit: 3,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  ws.autoFilter = {
    from: "A3",
    to: "M3",
  };

  /*
  |--------------------------------------------------------------------------
  | PRINT
  |--------------------------------------------------------------------------
  */

  ws.pageSetup = {
    orientation:
      "landscape",

    fitToPage: true,

    fitToWidth: 1,

    fitToHeight: 0,

    horizontalCentered:
      false,

    verticalCentered:
      false,
  };

  ws.pageSetup.margins =
    {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };

  /*
  |--------------------------------------------------------------------------
  | ULANGI HEADER SAAT PRINT
  |--------------------------------------------------------------------------
  */

  ws.pageSetup.printTitlesRow =
    "3:3";

  /*
  |--------------------------------------------------------------------------
  | PRINT AREA
  |--------------------------------------------------------------------------
  */

  ws.printArea =
    `A1:M${Math.max(
      rowNumber - 1,
      3
    )}`;

  /*
  |--------------------------------------------------------------------------
  | NAMA SHEET
  |--------------------------------------------------------------------------
  */

  if (
    sheetName &&
    sheetName !== "Sheet1"
  ) {
    ws.name =
      sheetName.slice(
        0,
        31
      );
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIVE SHEET
  |--------------------------------------------------------------------------
  */

  workbook.views[0] = {
    activeTab: 0,
  };

  return workbook;
}

/*
|--------------------------------------------------------------------------
| TAMBAH SHEET
|--------------------------------------------------------------------------
|
| Fungsi lama tetap dipertahankan.
|
|--------------------------------------------------------------------------
*/

export function tambahSheet(
  wb,
  rows,
  sheetName
) {
  const ws =
    XLSX.utils.json_to_sheet(
      rows
    );

  ws["!cols"] =
    Object.keys(
      rows[0] || {}
    ).map(() => ({
      wch: 18,
    }));

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    sheetName.slice(0, 31)
  );

  return wb;
}

/*
|--------------------------------------------------------------------------
| WORKBOOK -> BUFFER
|--------------------------------------------------------------------------
*/

export async function workbookKeBuffer(
  wb
) {
  /*
  |--------------------------------------------------------------------------
  | EXCELJS
  |--------------------------------------------------------------------------
  */

  if (
    wb &&
    typeof wb.xlsx?.writeBuffer ===
      "function"
  ) {
    const buffer =
      await wb.xlsx.writeBuffer();

    return Buffer.from(
      buffer
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK UNTUK XLSX LAMA
  |--------------------------------------------------------------------------
  */

  return XLSX.write(
    wb,
    {
      type: "buffer",
      bookType: "xlsx",
    }
  );
}

/*
|--------------------------------------------------------------------------
| PDF
|--------------------------------------------------------------------------
|
| BAGIAN PDF TETAP DIPERTAHANKAN.
|
|--------------------------------------------------------------------------
*/

export function buatPdfTemuan({
  judul,
  subjudul,
  rows,
  ringkasan,
}) {
  const doc =
    new jsPDF({
      orientation:
        "landscape",

      unit: "pt",

      format: "a4",
    });

  const margin = 32;

  /*
  |--------------------------------------------------------------------------
  | JUDUL
  |--------------------------------------------------------------------------
  */

  doc.setFontSize(
    16
  );

  doc.text(
    judul,
    margin,
    40
  );

  /*
  |--------------------------------------------------------------------------
  | SUBJUDUL
  |--------------------------------------------------------------------------
  */

  if (subjudul) {
    doc.setFontSize(
      10
    );

    doc.setTextColor(
      100
    );

    doc.text(
      subjudul,
      margin,
      58
    );

    doc.setTextColor(
      0
    );
  }

  let startY = 72;

  /*
  |--------------------------------------------------------------------------
  | RINGKASAN
  |--------------------------------------------------------------------------
  */

  if (ringkasan) {
    doc.setFontSize(
      11
    );

    doc.text(
      ringkasan,
      margin,
      startY
    );

    startY += 20;
  }

  /*
  |--------------------------------------------------------------------------
  | DATA PDF
  |--------------------------------------------------------------------------
  */

  const data =
    siapkanBarisTemuan(
      rows || []
    );

  /*
  |--------------------------------------------------------------------------
  | HEADER PDF
  |--------------------------------------------------------------------------
  */

  const defaultHeaders = {
    "ID Temuan": "",
    "Tanggal Temuan": "",
    "Wilayah": "",
    "Lokasi": "",
    "PIC": "",
    "Mandor": "",
    "Aktivitas": "",
    "Grup Temuan": "",
    "Deskripsi": "",
    "Status": "",
    "Deadline Close (7 hari)": "",
    "Sisa/Lewat Hari": "",
    "Keterlambatan": "",
    "Tanggal Ditutup": "",
    "Ditutup Oleh": "",
    "Latitude": "",
    "Longitude": "",
    "Google Maps": "",
    "Foto": "",
    "Foto Tindak Lanjut": "",
  };

  const head = [
    Object.keys(
      data[0] ||
        defaultHeaders
    ),
  ];

  /*
  |--------------------------------------------------------------------------
  | BODY PDF
  |--------------------------------------------------------------------------
  */

  const body =
    data.map((r) =>
      Object.values(r).map(
        (v) =>
          v == null
            ? ""
            : String(v)
      )
    );

  /*
  |--------------------------------------------------------------------------
  | TABLE PDF
  |--------------------------------------------------------------------------
  */

  autoTable(doc, {
    head,

    body,

    startY,

    margin: {
      left: margin,
      right: margin,
    },

    styles: {
      fontSize: 6.5,
      cellPadding: 3,
      overflow:
        "linebreak",
    },

    headStyles: {
      fillColor: [
        15,
        98,
        76,
      ],

      textColor: 255,

      fontStyle:
        "bold",
    },

    theme:
      "grid",

    didParseCell:
      function (hookData) {
        /*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */

        if (
          hookData.section ===
          "head"
        ) {
          hookData.cell.styles
            .halign =
            "center";

          hookData.cell.styles
            .valign =
            "middle";
        }

        /*
        |--------------------------------------------------------------------------
        | BODY
        |--------------------------------------------------------------------------
        */

        if (
          hookData.section ===
          "body"
        ) {
          hookData.cell.styles
            .valign =
            "top";
        }
      },
  });

  /*
  |--------------------------------------------------------------------------
  | NOMOR HALAMAN
  |--------------------------------------------------------------------------
  */

  const totalHalaman =
    doc.internal.getNumberOfPages();

  for (
    let i = 1;
    i <= totalHalaman;
    i++
  ) {
    doc.setPage(i);

    doc.setFontSize(
      8
    );

    doc.setTextColor(
      120
    );

    doc.text(
      `Halaman ${i} / ${totalHalaman}`,

      doc.internal.pageSize.getWidth() -
        margin -
        60,

      doc.internal.pageSize.getHeight() -
        16
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RETURN PDF
  |--------------------------------------------------------------------------
  */

  return Buffer.from(
    doc.output(
      "arraybuffer"
    )
  );
}