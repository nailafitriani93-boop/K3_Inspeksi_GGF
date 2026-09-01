// Aturan bisnis: setiap temuan K3 wajib ditindaklanjuti (CLOSE) maksimal 7 hari
// sejak tanggal_temuan. Helper ini dipakai di semua API yang menampilkan
// deadline / status keterlambatan (oldest-open, dashboard, export, temuan list).

export const SLA_HARI = 7;

/**
 * @param {string|Date} tanggalTemuan
 * @param {string} statusTemuan "OPEN" | "CLOSE"
 */
export function hitungDeadline(tanggalTemuan, statusTemuan) {
  const tgl = new Date(tanggalTemuan);
  if (Number.isNaN(tgl.getTime())) {
    return { deadline: null, sisaHari: null, overdue: false, urgensi: "unknown" };
  }

  const deadline = new Date(tgl);
  deadline.setDate(deadline.getDate() + SLA_HARI);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineOnly = new Date(deadline);
  deadlineOnly.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const sisaHari = Math.round((deadlineOnly.getTime() - today.getTime()) / msPerDay);

  const isOpen = String(statusTemuan).toUpperCase() === "OPEN";
  const overdue = isOpen && sisaHari < 0;

  let urgensi = "aman"; // aman | mendesak | overdue | selesai
  if (!isOpen) urgensi = "selesai";
  else if (sisaHari < 0) urgensi = "overdue";
  else if (sisaHari <= 2) urgensi = "mendesak";

  return {
    deadline: deadline.toISOString().slice(0, 10),
    sisaHari,
    overdue,
    urgensi,
  };
}
