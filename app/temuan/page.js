// ============================================================
// FILE: app/temuan/page.js
// ============================================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const WILAYAH = [
  "Semua Wilayah",
  "Wilayah 1",
  "Wilayah 2",
  "Wilayah 3",
  "Wilayah 4",
  "Wilayah 5",
  "Wilayah 6",
  "Wilayah 7",
  "Bengkel",
  "Mixing",
  "Dipping",
  "Office",
];

const STATUS = ["Semua Status", "OPEN", "CLOSE"];
const CLOSE_ALLOWED_ROLES = [
  "ADMIN_DEVELOPER",
  "ADMIN",
  "ADMIN_INSPECTOR",
  "ADMIN_INSPEKSI",
  "INSPECTOR",
];
const GRUP_TEMUAN = [
  "Semua Grup",
  "APD",
  "Bangunan",
  "Fasilitas Kantor",
  "Unit",
];

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11A8.1 8.1 0 0 0 5.3 6.2L3.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 4.5V8H7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13A8.1 8.1 0 0 0 18.7 17.8L20.5 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 19.5V16H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatTanggal(value) {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isTemuanTerlambat(item) {
  const status = String(
    item?.status_temuan || "OPEN"
  ).toUpperCase();

  if (status === "CLOSE" || !item?.tanggal_temuan) {
    return false;
  }

  const tanggalTemuan = new Date(
    item.tanggal_temuan
  );

  if (Number.isNaN(tanggalTemuan.getTime())) {
    return false;
  }

  const batasTerlambat = new Date();
  batasTerlambat.setDate(
    batasTerlambat.getDate() - 7
  );

  return tanggalTemuan < batasTerlambat;
}

function wilayahLabel(item) {
  const rawNama =
    item?.master_wilayah?.nama_wilayah ||
    item?.nama_wilayah;

  if (rawNama) {
    const label = String(rawNama).trim();

    if (
      label.toLowerCase() === "mixer" ||
      label.toLowerCase() === "mixing"
    ) {
      return "Mixing";
    }

    return label;
  }

  if (item?.no_wilayah) {
    return `Wilayah ${item.no_wilayah}`;
  }

  return "-";
}

function fotoDataUrl(file, maxSize = 1400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(
            maxSize / width,
            maxSize / height
          );

          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Browser tidak mendukung canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        resolve(
          canvas.toDataURL("image/jpeg", quality)
        );
      };

      img.onerror = () => {
        reject(new Error("Foto tidak dapat dibaca."));
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca foto."));
    };

    reader.readAsDataURL(file);
  });
}

export default function DataTemuanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [periode, setPeriode] = useState("Semua Data");
  const [periodeDari, setPeriodeDari] = useState("");
  const [periodeSampai, setPeriodeSampai] = useState("");
  const [wilayah, setWilayah] = useState("Semua Wilayah");
  const [status, setStatus] = useState("Semua Status");
  const [grup, setGrup] = useState("Semua Grup");
  const [search, setSearch] = useState("");

  const [selectedTemuan, setSelectedTemuan] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [closeSuccess, setCloseSuccess] = useState("");

  const [keteranganClose, setKeteranganClose] = useState("");
  const [fotoClose, setFotoClose] = useState("");
  const [fotoCloseName, setFotoCloseName] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const profileRef = useRef(null);

  // ============================================================
  // USER
  // ============================================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("k3_user") ||
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

      if (!saved) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(saved);

      if (!user?.username) {
        window.location.href = "/login";
        return;
      }

      setCurrentUser(user);
    } catch (err) {
      console.error(err);
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();

        if (response.ok && result.success && result.user) {
          setCurrentUser(result.user);
        }
      })
      .catch(() => {});
  }, []);

  // ============================================================
  // CLOSE PROFILE
  // ============================================================

  useEffect(() => {
    function outside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", outside);

    return () => {
      document.removeEventListener("mousedown", outside);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && selectedTemuan) {
        tutupDetail();
      }
    }

    if (selectedTemuan) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedTemuan]);

  // ============================================================
  // LOAD DATA
  // ============================================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/temuan/data",
        {
          cache: "no-store",
        }
      );

const responseText = await response.text();

let result;

try {
  result = JSON.parse(responseText);
} catch {
  throw new Error(
    "API /api/temuan/data tidak mengembalikan JSON. Periksa error pada route API."
  );
}

if (!response.ok) {
  throw new Error(
    result?.error ||
      "Gagal mengambil data temuan."
  );
}

setData(
  Array.isArray(result?.data)
    ? result.data
    : []
);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Gagal mengambil data temuan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!data.length || !currentUser?.username) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("temuan");
    const item = data.find((row) => String(row.id_temuan) === String(id));

    if (item && params.get("action") === "close") {
      bukaClose(item);
      window.history.replaceState({}, "", "/temuan");
    }
  }, [data, currentUser]);

  // ============================================================
  // GROUP OPTION
  // ============================================================

  const grupOptions = GRUP_TEMUAN;

  function refreshData() {
    setPeriode("Semua Data");
    setPeriodeDari("");
    setPeriodeSampai("");
    setWilayah("Semua Wilayah");
    setStatus("Semua Status");
    setGrup("Semua Grup");
    setSearch("");
    setPage(1);
    loadData();
  }

  // ============================================================
  // FILTER
  // ============================================================

  const filteredData = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return data.filter((item) => {
      const namaWilayah =
        wilayahLabel(item);

      const namaLokasi =
        item?.master_lokasi
          ?.nama_lokasi || "";

      const namaGrup =
        item?.master_grup_temuan
          ?.nama_grup || "";

      const namaMandor =
        item?.master_mandor
          ?.nama_mandor || "";

      const deskripsi =
        item?.deskripsi || "";

      const nomorWilayah =
        Number(item?.no_wilayah || 0);

      const statusTemuan =
        String(
          item?.status_temuan || "OPEN"
        ).toUpperCase();

      const searchMatch =
        !keyword ||
        namaWilayah
          .toLowerCase()
          .includes(keyword) ||
        namaLokasi
          .toLowerCase()
          .includes(keyword) ||
        namaGrup
          .toLowerCase()
          .includes(keyword) ||
        namaMandor
          .toLowerCase()
          .includes(keyword) ||
        deskripsi
          .toLowerCase()
          .includes(keyword) ||
        String(item?.id_temuan || "")
          .toLowerCase()
          .includes(keyword);

      const wilayahMatch =
        wilayah === "Semua Wilayah" ||
        (wilayah.startsWith("Wilayah ") &&
          nomorWilayah ===
            Number(
              wilayah.replace(
                "Wilayah ",
                ""
              )
            )) ||
        (!wilayah.startsWith("Wilayah ") &&
          namaWilayah.toLowerCase() ===
            wilayah.toLowerCase());

      const statusMatch =
        status === "Semua Status" ||
        statusTemuan === status;

      const grupMatch =
        grup === "Semua Grup" ||
        namaGrup === grup;

      let periodeMatch = true;

      if (periode === "Pilih Waktu") {
        const date = new Date(item?.tanggal_temuan);

        if (Number.isNaN(date.getTime())) {
          periodeMatch = false;
        } else {
          const tanggal = date.toISOString().slice(0, 10);

          periodeMatch =
            (!periodeDari || tanggal >= periodeDari) &&
            (!periodeSampai || tanggal <= periodeSampai);
        }
      } else if (periode !== "Semua Data") {
        const date = new Date(
          item?.tanggal_temuan
        );

        const now = new Date();

        if (periode === "Bulan Ini") {
          periodeMatch =
            date.getMonth() ===
              now.getMonth() &&
            date.getFullYear() ===
              now.getFullYear();
        }

        if (periode === "3 Bulan") {
          const batas = new Date();
          batas.setMonth(
            batas.getMonth() - 3
          );

          periodeMatch = date >= batas;
        }

        if (periode === "6 Bulan") {
          const batas = new Date();
          batas.setMonth(
            batas.getMonth() - 6
          );

          periodeMatch = date >= batas;
        }

        if (periode === "1 Tahun") {
          const batas = new Date();
          batas.setFullYear(
            batas.getFullYear() - 1
          );

          periodeMatch = date >= batas;
        }
      }

      return (
        searchMatch &&
        wilayahMatch &&
        statusMatch &&
        grupMatch &&
        periodeMatch
      );
    });
  }, [
    data,
    search,
    wilayah,
    status,
    grup,
    periode,
    periodeDari,
    periodeSampai,
  ]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredData.length / perPage
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const displayedData = useMemo(() => {
    const start =
      (page - 1) * perPage;

    return filteredData.slice(
      start,
      start + perPage
    );
  }, [
    filteredData,
    page,
    perPage,
  ]);

  // ============================================================
  // DETAIL
  // ============================================================

  function lihatDetail(item) {
    setSelectedTemuan(item);
    setDetailOpen(true);
    setCloseOpen(false);
    setCloseError("");
    setCloseSuccess("");
  }

  function tutupDetail() {
    setDetailOpen(false);
    setCloseOpen(false);
    setSelectedTemuan(null);
  }

  // ============================================================
  // OPEN CLOSE FORM
  // ============================================================

  function bukaClose(item) {
    const currentRole = String(
      currentUser?.role || ""
    ).toUpperCase();

    if (!CLOSE_ALLOWED_ROLES.includes(currentRole)) {
      setCloseError(
        "Role pengguna tidak memiliki akses untuk melakukan tindak lanjut dan close temuan."
      );

      setSelectedTemuan(item);
      setDetailOpen(true);
      setCloseOpen(false);

      return;
    }

    setSelectedTemuan(item);
    setDetailOpen(true);
    setCloseOpen(true);
    setCloseError("");
    setCloseSuccess("");
    setKeteranganClose("");
    setFotoClose("");
    setFotoCloseName("");
  }

  // ============================================================
  // FOTO CLOSE
  // ============================================================

  async function handleFotoClose(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      ![
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setCloseError(
        "Format foto harus JPG, JPEG, PNG, atau WEBP."
      );

      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setCloseError(
        "Ukuran foto maksimal 8 MB."
      );

      return;
    }

    try {
      setCloseError("");

      const compressed =
        await fotoDataUrl(file);

      setFotoClose(compressed);
      setFotoCloseName(file.name);
    } catch (err) {
      setCloseError(
        err?.message ||
          "Gagal memproses foto."
      );
    }
  }

  // ============================================================
  // SIMPAN CLOSE
  // ============================================================

  async function simpanClose() {
    if (!selectedTemuan) return;

    const currentRole = String(
      currentUser?.role || ""
    ).toUpperCase();

    if (!CLOSE_ALLOWED_ROLES.includes(currentRole)) {
      setCloseError(
        "Role pengguna tidak memiliki akses untuk melakukan close temuan."
      );

      return;
    }

    if (!keteranganClose.trim()) {
      setCloseError(
        "Keterangan tindak lanjut wajib diisi."
      );

      return;
    }

    if (!fotoClose) {
      setCloseError(
        "Foto setelah perbaikan wajib diunggah."
      );

      return;
    }

    try {
      setCloseLoading(true);
      setCloseError("");
      setCloseSuccess("");

      const response = await fetch(
        "/api/temuan/close",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id_temuan:
              selectedTemuan.id_temuan,
            keterangan_close:
              keteranganClose.trim(),
            foto_close_base64:
              fotoClose,
            closed_by:
              currentUser?.nama_lengkap ||
              currentUser?.username ||
              currentRole,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Gagal melakukan close temuan."
        );
      }

      setCloseSuccess(
        "Temuan berhasil ditindaklanjuti dan ditutup."
      );

      await loadData();

      const updated = {
        ...selectedTemuan,
        status_temuan: "CLOSE",
        closed_at:
          result?.data?.closed_at ||
          new Date().toISOString(),
        closed_by:
          result?.data?.closed_by ||
          currentUser?.nama_lengkap,
        foto_close_url:
          result?.data?.foto_close_url ||
          "",
      };

      setSelectedTemuan(updated);

      setTimeout(() => {
        setCloseOpen(false);
        setCloseSuccess("");
        setKeteranganClose("");
        setFotoClose("");
        setFotoCloseName("");
      }, 900);
    } catch (err) {
      console.error(err);

      setCloseError(
        err?.message ||
          "Gagal melakukan close temuan."
      );
    } finally {
      setCloseLoading(false);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  function handleLogout() {
    localStorage.removeItem("k3_user");
    localStorage.removeItem("user");
    localStorage.removeItem("k3_remember");
    sessionStorage.removeItem("user");

    window.location.href = "/login";
  }

  // ============================================================
  // EXPORT
  // ============================================================

  function exportParams(format) {
    const params = new URLSearchParams();
    params.set("format", format);

    params.set(
      "ids",
      filteredData
        .map((item) => item.id_temuan)
        .join(",")
    );

    return params.toString();
  }

  function exportExcel() {
    window.open(
      `/api/export?${exportParams("xlsx")}`,
      "_blank"
    );
  }

  function exportPdf() {
    window.open(
      `/api/export?${exportParams("pdf")}`,
      "_blank"
    );
  }

  const roleCode = String(currentUser?.role || "")
    .trim()
    .toUpperCase();
  const canUsers =
    roleCode === "ADMIN_DEVELOPER" ||
    Boolean(currentUser?.kelola_user);

  return (
    <>
      <style jsx global>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap'
        );

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }

        body {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          background:
            linear-gradient(
              180deg,
              #f2f9f3 0%,
              #f8fbf8 100%
            );

          color: #10271b;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        /* ======================================================
           NAVBAR
        ====================================================== */

        .temuan-page {
          min-height: 100vh;
          background:
            linear-gradient(
              180deg,
              #eef8f0 0%,
              #f8fbf8 100%
            );
        }

        .topbar {
          position: fixed;
          z-index: 99999;
          top: 0;
          left: 0;
          right: 0;

          height: 76px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 58px;

          background: rgba(
            255,
            255,
            255,
            0.98
          );

          border-bottom:
            1px solid #e4ebe6;

          box-shadow:
            0 2px 12px
            rgba(
              24,
              58,
              39,
              0.05
            );
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 17px;

          min-width: 300px;
        }

        .logo {
          width: 100px;
          height: 49px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;
        }

        .logo img {
          width: 100%;
          height: 100%;

          object-fit: contain;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .brand-text b {
          font-size: 16px;
          line-height: 20px;
          font-weight: 800;
          color: #17251d;
        }

        .brand-text span {
          font-size: 12px;
          line-height: 16px;
          color: #7c8982;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px !important;

          height: 100%;
        }

        .nav > a {
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding:
            0 16px;

          border-radius: 11px;

          color: #34443b;

          font-size: 13px;
          font-weight: 700;

          white-space: nowrap;

          transition:
            background .2s ease,
            color .2s ease;
        }

        .nav > a:hover {
          background: #f1f7f2;
          color: #087f3e;
        }

        .nav > a.active {
          color: #087f3e;
          background: #edf8f0;

          box-shadow:
            inset 0 -2px 0 #0b9449;
        }

        /* ======================================================
           PROFILE
        ====================================================== */

        .profile-wrapper {
          position: relative;
          margin-left: 8px;
        }

        .profile-button {
          min-width: 145px;
          height: 44px;

          display: flex;
          align-items: center;
          gap: 10px;

          padding:
            4px 12px 4px 6px;

          border:
            1px solid #dfe8e2;

          border-radius: 12px;

          background: #ffffff;

          cursor: pointer;

          color: #18281f;
        }

        .profile-button:hover {
          border-color: #bcd8c5;
          background: #fbfefc;
        }

        .profile-icon {
          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #099447;
          color: white;
        }

        .profile-icon svg {
          width: 20px;
          height: 20px;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          min-width: 0;
        }

        .profile-info strong {
          max-width: 85px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          font-size: 12px;
          line-height: 15px;
        }

        .profile-info span {
          font-size: 9px;
          line-height: 12px;
          color: #7b8780;
        }

        .profile-chevron {
          margin-left: auto;
          color: #718078;
          font-size: 14px;
          transition: transform .2s ease;
        }

        .profile-chevron.open {
          transform: rotate(180deg);
        }

        .profile-popup {
          position: absolute;
          top: 52px;
          right: 0;

          width: 300px;

          padding: 16px;

          background: #ffffff;

          border:
            1px solid #e1e9e3;

          border-radius: 15px;

          box-shadow:
            0 18px 45px
            rgba(
              20,
              55,
              35,
              0.14
            );

          animation:
            profileIn
            .18s ease-out;
        }

        @keyframes profileIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-avatar {
          width: 43px;
          height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex: 0 0 auto;

          border-radius: 50%;

          background: linear-gradient(135deg, #18843c, #0a9b4d);
          color: #fff;

          font-size: 18px;
          font-weight: 800;
        }

        .profile-symbol {
          width: 18px;
          height: 18px;
          display: block;
        }

        .profile-header-info {
          min-width: 0;

          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .profile-header-info strong {
          font-size: 13px;
          line-height: 18px;
        }

        .profile-header-info span {
          font-size: 10px;
          color: #6c7c73;
          font-weight: 700;
        }

        .profile-divider {
          height: 1px;
          background: #edf1ee;
          margin: 14px 0;
        }

        .profile-detail {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 11px;
        }

        .profile-label {
          font-size: 10px;
          color: #89948d;
        }

        .profile-detail strong {
          font-size: 12px;
        }

        .role-badge {
          width: fit-content;

          padding:
            4px 9px;

          border-radius: 7px;

          font-size: 10px;
          font-weight: 800;
        }

        .role-kasie {
          color: #087f3e;
          background: #e7f6eb;
        }

        .role-kabag {
          color: #2563a8;
          background: #e9f2ff;
        }

        .profile-logout {
          width: 100%;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          border:
            1px solid #ead7d7;

          border-radius: 9px;

          background: #fff7f7;

          color: #b62e2e;

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;
        }

        .profile-logout:hover {
          background: #fff0f0;
        }

        .profile-logout svg {
          width: 16px;
          height: 16px;
        }

        /* ======================================================
           MAIN
        ====================================================== */

        .page-content {
          padding:
            96px 22px 35px;

          max-width: 1660px;
          margin: 0 auto;
        }

        .temuan-add-finding-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }

        .temuan-add-finding {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 8px;
          min-height: 0;
          height: auto;
          border-radius: 5px;
          border: 1px solid #08783d;
          color: #08783d;
          background: #edf7f0;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          text-decoration: none;
          white-space: nowrap;
        }

        .temuan-add-finding:hover {
          color: #ffffff;
          background: #08783d;
        }

        .workspace {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .main-column {
          min-width: 0;
          flex: 1;
        }

        /* ======================================================
           FILTER CARD
        ====================================================== */

        .filter-card {
          position: relative;
          background: #ffffff;

          border:
            1px solid #dfe7e1;

          border-radius: 15px;

          padding:
            42px 16px 16px;

          box-shadow:
            0 5px 18px
            rgba(
              31,
              72,
              46,
              0.045
            );

          margin-bottom: 16px;
        }

        .filter-grid {
          display: grid;

          grid-template-columns:
            1fr
            1fr
            1fr
            1fr
            1.2fr
            auto
            auto
            auto;

          gap: 10px;

          align-items: end;
        }

        .filter-field {
          min-width: 0;
        }

        .filter-field label {
          display: block;

          margin:
            0 0 7px 1px;

          font-size: 10px;
          font-weight: 800;

          text-transform: uppercase;

          color: #66746c;
        }

        .filter-field select,
        .filter-date-input,
        .search-input {
          width: 100%;
          height: 38px;

          padding:
            0 11px;

          border:
            1px solid #d6e0d9;

          border-radius: 9px;

          background: #ffffff;

          color: #27372e;

          outline: none;

          font-size: 12px;
        }

        .filter-field select:focus,
        .filter-date-input:focus,
        .search-input:focus {
          border-color: #72b98a;

          box-shadow:
            0 0 0 3px
            rgba(
              20,
              151,
              73,
              .08
            );
        }

        .search-box {
          position: relative;
          min-width: 180px;
        }

        .search-input {
          padding-right: 37px;
        }

        .search-icon {
          position: absolute;

          right: 11px;
          bottom: 10px;

          width: 17px;
          height: 17px;

          color: #6f7c75;

          pointer-events: none;
        }

        .btn {
          height: 38px;

          padding:
            0 15px;

          border:
            1px solid #d8e1da;

          border-radius: 9px;

          background: #ffffff;

          color: #25362c;

          font-size: 11px;
          font-weight: 800;

          cursor: pointer;

          white-space: nowrap;
        }

        .btn:hover {
          background: #f6faf7;
        }

        .filter-refresh-button {
          width: 38px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .filter-refresh-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .filter-refresh-top {
          position: absolute;
          top: 8px;
          right: 16px;
          width: 30px;
          height: 30px;
          border-radius: 8px;
        }

        .btn-primary {
          border-color: #238c48;
          background: #238c48;
          color: #ffffff;
        }

        .btn-primary:hover {
          background: #1b7d3e;
        }

        /* ======================================================
           TABLE CARD
        ====================================================== */

        .table-card {
          background: #ffffff;

          border:
            1px solid #dfe7e1;

          border-radius: 15px;

          padding:
            16px;

          box-shadow:
            0 5px 18px
            rgba(
              31,
              72,
              46,
              0.045
            );
        }

        .section-title {
          margin: 0 0 15px;

          font-size: 16px;
          font-weight: 800;

          color: #13271c;
        }

        .table-wrapper {
          width: 100%;

          overflow-x: auto;

          border:
            1px solid #dfe7e1;

          border-radius: 8px;
        }

        table {
          width: 100%;

          min-width: 980px;

          border-collapse: collapse;
        }

        thead th {
          height: 36px;

          padding:
            0 10px;

          background: #f4f8f5;

          border-bottom:
            1px solid #dfe7e1;

          color: #26382e;

          font-size: 10px;
          font-weight: 800;

          text-align: left;

          white-space: nowrap;
        }

        tbody td {
          height: 56px;

          padding:
            7px 10px;

          border-bottom:
            1px solid #edf1ee;

          color: #425048;

          font-size: 11px;

          vertical-align: middle;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover {
          background: #fbfdfb;
        }

        .col-no {
          width: 52px;
          text-align: center;
        }

        .col-date {
          width: 125px;
        }

        .col-wilayah {
          width: 110px;
        }

        .col-lokasi {
          width: 185px;
        }

        .col-grup {
          width: 165px;
        }

        .col-status {
          width: 95px;
        }

        .col-pelapor {
          width: 150px;
        }

        .col-action {
          width: 110px;
          text-align: center;
        }

        .mobile-leading-action {
          display: none;
        }

        .ellipsis {
          max-width: 170px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-width: 48px;

          padding:
            4px 8px;

          border-radius: 7px;

          font-size: 9px;
          font-weight: 900;
        }

        .status-open {
          background: #fff3d5;
          color: #ec9700;
        }

        .status-close {
          background: #e2f5e7;
          color: #16833e;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 7px;
        }

        .icon-btn {
          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #dce5df;

          border-radius: 8px;

          background: #ffffff;

          color: #4c5b53;

          cursor: pointer;
        }

        .icon-btn:hover {
          background: #f2faf4;
          color: #07833f;
          border-color: #b9d9c3;
        }

        .icon-btn.green {
          color: #078a41;
        }

        .icon-btn.detail-open {
          background: #fff3d5;
          border-color: #f2cf75;
          color: #d88a00;
        }

        .icon-btn.detail-close {
          background: #e2f5e7;
          border-color: #a8d8b5;
          color: #16833e;
        }

        .icon-btn.detail-late {
          background: #252b27;
          border-color: #252b27;
          color: #ffffff;
        }

        .icon-btn.detail-open:hover {
          background: #ffe8ad;
          border-color: #e8b84f;
          color: #b86f00;
        }

        .icon-btn.detail-close:hover {
          background: #ccebd4;
          border-color: #8bc79b;
          color: #116d34;
        }

        .icon-btn.detail-late:hover {
          background: #111512;
          border-color: #111512;
          color: #ffffff;
        }

        .icon-btn svg {
          width: 17px;
          height: 17px;
        }

        /* ======================================================
           PAGINATION
        ====================================================== */

        .table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding-top: 16px;

          font-size: 11px;
          color: #68766e;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .page-btn {
          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #e0e7e2;

          border-radius: 7px;

          background: #ffffff;

          color: #45534b;

          cursor: pointer;

          font-size: 11px;
        }

        .page-btn:hover:not(:disabled) {
          background: #f3faf5;
        }

        .page-btn.active {
          background: #159447;
          color: #ffffff;
          border-color: #159447;
          font-weight: 800;
        }

        .page-btn:disabled {
          opacity: .4;
          cursor: default;
        }

        .page-size {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .page-size select {
          height: 34px;

          border:
            1px solid #dfe7e1;

          border-radius: 8px;

          background: #ffffff;

          padding:
            0 8px;

          font-size: 11px;
        }

        /* ======================================================
           EMPTY / LOADING
        ====================================================== */

        .empty {
          padding: 60px 20px;

          text-align: center;

          color: #7b8981;

          font-size: 12px;
        }

        .error-box {
          padding: 11px 13px;

          margin-bottom: 12px;

          border:
            1px solid #f1cccc;

          border-radius: 9px;

          background: #fff6f6;

          color: #b32626;

          font-size: 12px;
        }

        .success-box {
          padding: 11px 13px;

          margin-bottom: 12px;

          border:
            1px solid #c5e5ce;

          border-radius: 9px;

          background: #f0fbf3;

          color: #19733b;

          font-size: 12px;
        }

        /* ======================================================
           RIGHT DETAIL PANEL
        ====================================================== */

        .side-column {
          width: 420px;
          flex: 0 0 420px;

          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(20, 35, 25, 0.42);
          overflow-y: auto;
          pointer-events: auto;
        }

        .detail-modal-content {
          width: min(100%, 760px);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          border-radius: 16px;
          position: relative;
          z-index: 1;
          pointer-events: auto;
        }

        .detail-modal-content .side-column {
          width: 100%;
          flex: 0 0 auto;
          pointer-events: auto;
        }

        .side-card {
          background: #ffffff;

          border:
            1px solid #dfe7e1;

          border-radius: 13px;

          padding: 15px;

          box-shadow:
            0 5px 18px
            rgba(
              31,
              72,
              46,
              0.045
            );

          animation:
            panelIn
            .2s ease-out;
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateX(8px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .side-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 13px;
        }

        .side-title {
          margin: 0;

          font-size: 14px;
          font-weight: 800;
        }

        .close-x {
          width: 28px;
          height: 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: none;

          background: transparent;

          color: #56635c;

          font-size: 22px;

          cursor: pointer;
        }

        .detail-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 16px;
        }

        .finding-number {
          display: inline-flex;

          padding:
            6px 9px;

          border-radius: 7px;

          background: #e4f3e8;

          color: #147a3c;

          font-size: 10px;
          font-weight: 900;
        }

        .detail-grid {
          display: grid;

          grid-template-columns:
            125px 1fr;

          gap: 7px 8px;

          margin-bottom: 16px;
        }

        .detail-grid .label {
          color: #25372d;

          font-size: 11px;
          font-weight: 800;
        }

        .detail-grid .value {
          color: #56635b;

          font-size: 11px;

          min-width: 0;
        }

        .detail-description {
          margin:
            0 0 13px;
        }

        .detail-description h4,
        .photo-title {
          margin:
            0 0 7px;

          font-size: 11px;
          font-weight: 800;
        }

        .detail-description p {
          margin: 0;

          color: #536159;

          font-size: 11px;
          line-height: 1.55;
        }

        .photo-box {
          width: 100%;

          min-height: 120px;

          border-radius: 8px;

          overflow: hidden;

          background: #f3f6f4;

          border:
            1px solid #e0e7e2;
        }

        .photo-box img {
          display: block;

          width: 100%;
          max-height: 240px;

          object-fit: cover;
        }

        .no-photo {
          height: 120px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #8a968f;

          font-size: 11px;
        }

        .side-actions {
          display: grid;

          grid-template-columns:
            1fr 1.25fr;

          gap: 10px;

          margin-top: 15px;
        }

        .side-action {
          height: 38px;

          border:
            1px solid #d8e1db;

          border-radius: 8px;

          background: #ffffff;

          cursor: pointer;

          color: #304138;

          font-size: 11px;
          font-weight: 800;
        }

        .side-action.primary {
          background: #168d43;
          color: white;
          border-color: #168d43;
        }

        .side-action.primary:hover {
          background: #11783a;
        }

        /* ======================================================
           CLOSE FORM
        ====================================================== */

        .close-card {
          background: #ffffff;

          border:
            1px solid #dfe7e1;

          border-radius: 13px;

          padding: 15px;

          box-shadow:
            0 5px 18px
            rgba(
              31,
              72,
              46,
              0.045
            );

          animation:
            panelIn
            .2s ease-out;
        }

        .close-label {
          display: block;

          margin-bottom: 7px;

          color: #25372d;

          font-size: 11px;
          font-weight: 800;
        }

        .close-textarea {
          width: 100%;

          min-height: 82px;

          resize: vertical;

          padding:
            9px 10px;

          border:
            1px solid #d7e1da;

          border-radius: 8px;

          outline: none;

          color: #435148;

          font-size: 11px;

          line-height: 1.5;
        }

        .close-textarea:focus {
          border-color: #6bb486;

          box-shadow:
            0 0 0 3px
            rgba(
              19,
              145,
              67,
              .07
            );
        }

        .upload-row {
          display: flex;
          align-items: center;
          gap: 10px;

          min-height: 40px;

          border:
            1px solid #d7e1da;

          border-radius: 8px;

          padding:
            4px 7px;
        }

        .upload-button {
          height: 30px;

          padding:
            0 10px;

          border:
            1px solid #d3e0d7;

          border-radius: 6px;

          background: #eef7f0;

          color: #32453a;

          cursor: pointer;

          font-size: 10px;
          font-weight: 700;

          white-space: nowrap;
        }

        .upload-name {
          min-width: 0;

          flex: 1;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          font-size: 10px;

          color: #66736c;
        }

        .close-photo-preview {
          position: relative;

          width: 100%;
          height: 110px;

          margin-top: 9px;

          border-radius: 8px;

          overflow: hidden;

          background: #f2f6f3;

          border:
            1px solid #e1e8e3;
        }

        .close-photo-preview img {
          width: 100%;
          height: 100%;

          object-fit: cover;
        }

        .close-photo-remove {
          position: absolute;

          top: 7px;
          right: 7px;

          width: 27px;
          height: 27px;

          border: none;

          border-radius: 50%;

          background:
            rgba(
              255,
              255,
              255,
              .92
            );

          color: #b83232;

          cursor: pointer;
        }

        .file-help {
          margin-top: 6px;

          color: #8a958e;

          font-size: 9px;
        }

        .close-form-actions {
          display: grid;

          grid-template-columns:
            1fr 1.35fr;

          gap: 10px;

          margin-top: 15px;
        }

        .close-save {
          height: 38px;

          border: none;

          border-radius: 8px;

          background: #168d43;

          color: white;

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;
        }

        .close-save:hover:not(:disabled) {
          background: #11783a;
        }

        .close-save:disabled {
          opacity: .6;
          cursor: default;
        }

        .close-cancel {
          height: 38px;

          border:
            1px solid #d8e1db;

          border-radius: 8px;

          background: #ffffff;

          color: #33443a;

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 1200px) {
          .topbar {
            padding:
              0 25px;
          }

          .filter-grid {
            grid-template-columns:
              repeat(4, 1fr);
          }

          .side-column {
            width: 370px;
            flex-basis: 370px;
          }
        }

        @media (max-width: 950px) {
          .topbar {
            height: 72px;
          }

          .brand {
            min-width: auto;
          }

          .brand-text {
            display: none;
          }

          .nav {
            overflow-x: auto;
            justify-content: flex-end;
          }

          .nav > a {
            padding:
              0 11px;
          }

          .profile-button {
            min-width: 44px;
            width: 44px;
            padding: 4px;
            justify-content: center;
          }

          .profile-info,
          .profile-chevron {
            display: none;
          }

          .filter-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .workspace {
            flex-direction: column;
          }

          .side-column {
            width: 100%;
            flex-basis: auto;
          }
        }

        @media (max-width: 650px) {
          .topbar {
            padding:
              0 12px;

            gap: 8px;
          }

          .logo {
            width: 75px;
            height: 42px;
          }

          .nav {
            gap: 2px;
          }

          .nav > a {
            padding:
              0 8px;

            font-size: 10px;
          }

          .page-content {
            padding:
              88px 10px 20px;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .table-card,
          .filter-card {
            padding: 12px;
          }

          .table-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .pagination {
            justify-content: center;
          }

          .page-size {
            justify-content: flex-end;
          }

          .profile-popup {
            position: fixed;

            top: 65px;
            right: 10px;

            width:
              calc(100vw - 20px);

            max-width: 320px;
          }

          .side-column {
            width: 100%;
            position: fixed;
            inset: 0;
            z-index: 1000;
            box-sizing: border-box;
            padding: 12px;
            overflow-y: auto;
            background: rgba(20, 35, 25, .28);
          }

          .detail-modal-overlay {
            padding: 12px;
          }

          .detail-modal-content {
            width: 100%;
            max-height: calc(100vh - 24px);
          }

          .detail-modal-content .side-column {
            position: static;
            inset: auto;
            overflow: visible;
            background: transparent;
          }

          .side-card,
          .close-card {
            width: min(100%, 520px);
            margin: 0 auto;
          }

          .upload-row {
            flex-wrap: wrap;
          }

          .upload-row .upload-name {
            flex-basis: 100%;
          }

          .mobile-leading-action {
            display: table-cell;
          }

          .desktop-action {
            display: none;
          }
        }

        /* ============================================================
   NAVBAR DESKTOP
   SAMAKAN DENGAN INSPEKSI & DASHBOARD
   MOBILE TIDAK DIUBAH
   ============================================================ */

@media (min-width: 901px) {

  .temuan-page .topbar {
    font-family: "Inter", Arial, sans-serif !important;
    height: 78px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;

    gap: 20px !important;

    padding: 10px clamp(18px, 4vw, 54px) !important;
  }

  .temuan-page .brand {
    display: flex !important;
    align-items: center !important;

    gap: 12px !important;

    min-width: 0 !important;
  }

  .temuan-page .brand .logo {
    width: 110px !important;
    height: 52px !important;

    flex: 0 0 110px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    overflow: hidden !important;
  }

  .temuan-page .brand .logo img {
    display: block !important;

    width: 100% !important;
    max-width: 110px !important;
    height: auto !important;

    object-fit: contain !important;
  }

  .temuan-page .brand-text {
    display: flex !important;
    flex-direction: column !important;

    gap: 2px !important;

    min-width: 0 !important;

    font-family: "Inter", Arial, sans-serif !important;
  }

  .temuan-page .brand-text b {
    font-family: "Inter", Arial, sans-serif !important;

    font-size: 15px !important;
    line-height: 1.2 !important;
    font-weight: 800 !important;

    white-space: nowrap !important;
  }

  .temuan-page .brand-text span {
    font-family: "Inter", Arial, sans-serif !important;

    font-size: 11px !important;
    line-height: 1.2 !important;
    font-weight: 600 !important;

    white-space: nowrap !important;
  }

  .temuan-page .nav {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;

    gap: 7px !important;

    height: auto !important;

    flex: 0 0 auto !important;

    font-family: "Poppins", sans-serif !important;
    font-weight: 600 !important;
  }

  .temuan-page .nav > a {
    position: relative !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;

    min-height: 42px !important;
    height: 42px !important;

    padding: 10px 13px !important;

    border: 0 !important;
    border-radius: 10px !important;

    background: transparent !important;

    color: #5f6c64 !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;

    text-decoration: none !important;
    white-space: nowrap !important;

    transition:
      background .16s ease,
      color .16s ease,
      transform .16s ease !important;
  }

  .temuan-page .nav > a:hover {
    background: #f1f6f2 !important;
    color: #123d25 !important;
  }

  .temuan-page .nav > a.active {
    min-width: 112px !important;

    color: #08783d !important;

    background: #edf8f1 !important;

    box-shadow: inset 0 -2px 0 #0b9449 !important;
    border-radius: 10px !important;
  }

  .temuan-page .profile-wrapper {
    position: relative !important;

    display: flex !important;
    align-items: center !important;

    flex: 0 0 auto !important;

    margin-left: 0 !important;
  }

  .temuan-page .profile-button {
    min-width: 145px !important;

    width: auto !important;

    height: 44px !important;
    min-height: 44px !important;

    display: flex !important;
    align-items: center !important;

    gap: 9px !important;

    padding: 4px 10px 4px 7px !important;

    border-radius: 12px !important;

    font-family: "Poppins", sans-serif !important;
    font-weight: 600 !important;
  }

  .temuan-page .profile-icon {
    width: 34px !important;
    height: 34px !important;

    min-width: 34px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    border-radius: 50% !important;
  }

  .temuan-page .profile-info {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;

    min-width: 0 !important;

    gap: 0 !important;
  }

  .temuan-page .profile-info strong {
    max-width: 85px !important;

    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    line-height: 1.2 !important;
  }

  .temuan-page .profile-info > span {
    margin-top: 4px !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 8px !important;
    font-weight: 600 !important;
    line-height: 1.2 !important;
  }

  .temuan-page .profile-chevron {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    margin-left: 2px !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 8px !important;
    font-weight: 600 !important;

    line-height: 1 !important;
  }

}

        .mobile-menu-wrapper,
        .mobile-menu-button {
          display: none;
        }

        @media (max-width: 768px) {
          .temuan-page .brand-text {
            display: flex !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            flex-direction: column !important;
            gap: 2px !important;
          }

          .temuan-page .brand-text b {
            font-size: 12px !important;
            line-height: 1.15 !important;
            white-space: nowrap !important;
          }

          .temuan-page .brand-text span {
            font-size: 8px !important;
            line-height: 1.15 !important;
            white-space: normal !important;
          }

          .temuan-page .nav {
            position: fixed !important;
            top: 66px !important;
            left: 10px !important;
            right: 10px !important;
            display: none !important;
            flex-direction: column !important;
            height: auto !important;
            width: auto !important;
            max-width: none !important;
            min-width: 0 !important;
            align-items: stretch !important;
            gap: 5px !important;
            padding: 10px !important;
            background: #ffffff !important;
            border: 1px solid #dfe7e1 !important;
            border-radius: 14px !important;
            box-shadow: 0 12px 30px rgba(24, 45, 32, 0.14) !important;
            overflow: visible !important;
            z-index: 1200 !important;
          }

          .temuan-page .nav.mobile-nav-open {
            display: flex !important;
            height: auto !important;
            bottom: auto !important;
            justify-content: flex-start !important;
          }

          .temuan-page .nav > a {
            width: 100% !important;
            min-height: 42px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding: 10px 12px !important;
            border-radius: 9px !important;
          }

          .temuan-page .nav .profile-wrapper {
            display: flex !important;
            width: 100% !important;
            margin-left: 0 !important;
          }

          .temuan-page .nav .profile-button {
            width: 100% !important;
            min-width: 0 !important;
            height: 42px !important;
            min-height: 42px !important;
            justify-content: flex-start !important;
            padding: 6px 12px !important;
            border-radius: 9px !important;
          }

          .temuan-page .nav .profile-info {
            display: flex !important;
          }

          .temuan-page .nav .profile-popup {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(298px, calc(100vw - 20px)) !important;
          }

          .temuan-page .nav .nav-logout {
            display: flex !important;
            width: 100% !important;
            min-height: 42px !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding: 10px 12px !important;
            border-radius: 9px !important;
          }

          .temuan-page .mobile-menu-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
          }

          .temuan-page .mobile-menu-button {
            width: 42px !important;
            height: 42px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            padding: 0 !important;
            border: 1px solid #dfe7e1 !important;
            border-radius: 10px !important;
            background: #ffffff !important;
          }

          .temuan-page .mobile-menu-button span {
            display: block !important;
            width: 20px !important;
            height: 2px !important;
            background: #087f3f !important;
            border-radius: 999px !important;
          }

          .temuan-page .mobile-menu-button-open span:nth-child(1) {
            transform: translateY(7px) rotate(45deg) !important;
          }

          .temuan-page .mobile-menu-button-open span:nth-child(2) {
            opacity: 0 !important;
          }

          .temuan-page .mobile-menu-button-open span:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg) !important;
          }
        }

        /* Keep the Data Temuan navbar identical to Form Inspeksi. */
        .temuan-page .profile-button > .profile-avatar {
          width: 34px !important;
          height: 34px !important;
          min-width: 34px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 34px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #18843c, #0a9b4d) !important;
          color: #ffffff !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 14px !important;
          font-weight: 600 !important;
        }

        .temuan-page .profile-avatar .profile-symbol {
          width: 18px !important;
          height: 18px !important;
        }

        .temuan-page .profile-button > .profile-info {
          min-width: 0 !important;
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          gap: 0 !important;
          overflow: hidden !important;
        }

        .temuan-page .profile-info strong {
          max-width: 85px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.05 !important;
        }

        .temuan-page .profile-info small {
          margin-top: 4px !important;
          color: #7b8780 !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 8px !important;
          font-weight: 600 !important;
          line-height: 1.05 !important;
        }

        .temuan-page .profile-button > .profile-chevron {
          margin-left: 2px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #718078 !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 8px !important;
          line-height: 1 !important;
          transform: translateY(-1px) !important;
        }

        .temuan-page .nav-logout {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: auto !important;
          min-width: 0 !important;
          flex: 0 0 auto !important;
          box-sizing: border-box !important;
          min-height: 30px !important;
          height: 30px !important;
          border: 1px solid #d9e3dc !important;
          padding: 5px 9px !important;
          border-radius: 7px !important;
          background: #ffffff !important;
          color: #304037 !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          line-height: 1.1 !important;
          white-space: nowrap !important;
        }

        .temuan-page .nav-logout:hover {
          background: #f7faf8 !important;
          color: #087f3e !important;
          border-color: #cbd8cf !important;
        }

        .temuan-page .nav > a.nav-users-button {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 27px !important;
          height: 27px !important;
          padding: 0 10px !important;
          gap: 5px !important;
          border: 1px solid #16833f !important;
          border-radius: 7px !important;
          background: #16833f !important;
          color: #ffffff !important;
          text-decoration: none !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          line-height: 1.1 !important;
          white-space: nowrap !important;
        }

        .temuan-page .nav > a.nav-users-button:hover {
          background: #117236 !important;
          border-color: #117236 !important;
          color: #ffffff !important;
        }

        @media (max-width: 768px) {
          .temuan-page .topbar {
            font-family: "Inter", Arial, sans-serif !important;
            min-height: 66px !important;
            height: 66px !important;
            padding: 7px 11px !important;
            gap: 8px !important;
          }

          .temuan-page .brand {
            flex: 0 0 auto !important;
            gap: 0 !important;
          }

          .temuan-page .brand .logo {
            width: 82px !important;
            height: 40px !important;
            flex: 0 0 82px !important;
          }

          .temuan-page .brand .logo img {
            width: 100% !important;
            max-width: 82px !important;
          }

          .temuan-page .brand-text {
            display: flex !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            flex-direction: column !important;
            gap: 2px !important;
            line-height: 1.15 !important;
            font-family: "Inter", Arial, sans-serif !important;
          }

          .temuan-page .brand-text b {
            font-size: 12px !important;
            line-height: 1.15 !important;
          }

          .temuan-page .brand-text span {
            font-size: 8px !important;
            line-height: 1.15 !important;
            white-space: normal !important;
          }

          .temuan-page .profile-button > .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
            font-size: 11px !important;
          }

          .temuan-page .profile-info strong {
            font-size: 8px !important;
          }

          .temuan-page .profile-info small {
            margin-top: 2px !important;
            font-size: 6px !important;
          }

          .temuan-page .profile-button > .profile-chevron {
            font-size: 6px !important;
          }

          .temuan-page .nav-logout {
            min-height: 36px !important;
            padding: 7px 9px !important;
          }

          .temuan-page .mobile-menu-button {
            width: 42px !important;
            height: 42px !important;
            border-radius: 10px !important;
          }
        }

        @media (max-width: 480px) {
          .temuan-page .topbar {
            min-height: 60px !important;
            height: 60px !important;
            padding: 7px 8px !important;
            gap: 5px !important;
          }

          .temuan-page .brand .logo {
            width: 82px !important;
            height: 39px !important;
            flex-basis: 82px !important;
          }

          .temuan-page .brand .logo img {
            max-width: 82px !important;
          }

          .temuan-page .nav {
            top: 60px !important;
            max-width: 77vw !important;
            gap: 3px !important;
          }
        }

        @media (max-width: 650px) {
          .temuan-page {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
          }

          .temuan-page .topbar {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .temuan-page .brand {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            max-width: calc(100% - 52px) !important;
          }

          .temuan-page .brand-text {
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .temuan-page .mobile-menu-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
          }

          .temuan-page .mobile-menu-button {
            position: static !important;
            transform: none !important;
          }

          .temuan-page .page-content,
          .temuan-page .workspace,
          .temuan-page .main-column {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .temuan-page .filter-card {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 44px 12px 12px !important;
            margin-bottom: 12px !important;
            border-radius: 12px !important;
          }

          .temuan-page .filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px 10px !important;
            min-width: 0 !important;
          }

          .temuan-page .filter-grid > * {
            min-width: 0 !important;
            max-width: 100% !important;
          }

          .temuan-page .search-box {
            min-width: 0 !important;
          }

          .temuan-page .filter-field label {
            margin-bottom: 5px !important;
            font-size: 9px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .temuan-page .filter-field select,
          .temuan-page .search-input {
            box-sizing: border-box !important;
            min-width: 0 !important;
            max-width: 100% !important;
            height: 42px !important;
            font-size: 12px !important;
          }

          .temuan-page .filter-refresh-top {
            top: 8px !important;
            right: 12px !important;
            width: 30px !important;
            height: 30px !important;
          }

          .temuan-page .filter-grid .search-box,
          .temuan-page .filter-grid > .btn-primary {
            grid-column: 1 / -1 !important;
          }

          .temuan-page .filter-grid > .btn {
            box-sizing: border-box !important;
            min-width: 0 !important;
            width: 100% !important;
            min-height: 42px !important;
            height: 42px !important;
          }

          .temuan-page .table-card {
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .temuan-page .table-wrapper {
            max-width: 100% !important;
            overflow-x: auto !important;
            overscroll-behavior-x: contain;
          }
        }
        .temuan-page .nav-logout-icon {
          display: none;
        }

        @media (max-width: 768px) {
          .temuan-page .nav .nav-logout {
            display: none !important;
          }

          .temuan-page .nav .profile-wrapper {
            width: auto !important;
            flex: 0 0 auto !important;
          }

          .temuan-page .nav .profile-button {
            width: 38px !important;
            min-width: 38px !important;
            height: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
          }

          .temuan-page .nav .profile-info,
          .temuan-page .nav .profile-chevron {
            display: none !important;
          }

          .temuan-page .nav .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
          }

          .temuan-page .nav .nav-logout {
            display: none !important;
          }

          .temuan-page .nav > a.nav-page {
            font-family: "Poppins", sans-serif !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      <main className="temuan-page">

        {/* ======================================================
            NAVBAR
        ====================================================== */}

        <header className="topbar">

          <div className="brand">

            <Link
              href="/temuan"
              className="brand-logo-link"
              aria-label="Data Temuan"
            >
              <div className="logo">
                <img
                  src="/ggf-estate-pg01.png"
                  alt="Sistem Manajemen Informasi Estate PG1"
                />
              </div>
            </Link>

            <div className="brand-text">
              <b>Data Temuan</b>
              <span>Sistem Manajemen Informasi Estate PG1</span>
            </div>

          </div>

          <nav
            className={`nav ${showMobileNav ? "mobile-nav-open" : ""}`}
            aria-label="Navigasi utama"
          >

            <Link href="/dashboard" className="nav-page">
              Dashboard
            </Link>

            <Link
              href="/temuan"
              className="nav-page active"
            >
              Data Temuan
            </Link>

            <Link href="/inspeksi" className="nav-page">
              Form Inspeksi
            </Link>

            <div
              className="profile-wrapper"
              ref={profileRef}
            >

              <button
                type="button"
                className="profile-button"
                onClick={() =>
                  setProfileOpen(
                    (value) => !value
                  )
                }
              >

                <span className="profile-avatar">
                  <svg className="profile-symbol" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.2" fill="currentColor" />
                    <path d="M5.5 19.2c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5" fill="currentColor" />
                  </svg>
                </span>

                <span className="profile-info">
                  <strong>
                    {currentUser?.nama_lengkap ||
                      "Pengguna"}
                  </strong>

                  <small>
                    {currentUser?.role ||
                      "-"}
                  </small>
                </span>

                <span
                  className="profile-chevron"
                >
                  ▴
                </span>

              </button>

              {profileOpen && (
                <div className="profile-popup">

                  <div className="profile-popup-header">

                    <div className="profile-avatar">
                      <svg className="profile-symbol" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="8" r="3.2" fill="currentColor" />
                        <path d="M5.5 19.2c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="profile-header-info">
                      <strong>
                        {currentUser?.nama_lengkap ||
                          "Pengguna"}
                      </strong>

                      <span>
                        {currentUser?.role ||
                          "-"}
                      </span>
                    </div>

                  </div>

                  <div className="profile-divider" />

                  <div className="profile-detail">
                    <span className="profile-label">
                      Nama Lengkap
                    </span>

                    <strong>
                      {currentUser?.nama_lengkap ||
                        "-"}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span className="profile-label">
                      Username
                    </span>

                    <strong>
                      {currentUser?.username ||
                        "-"}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span className="profile-label">
                      Role
                    </span>

                    <span
                      className={`role-badge ${
                        currentUser?.role ===
                        "KABAG"
                          ? "role-kabag"
                          : "role-kasie"
                      }`}
                    >
                      {currentUser?.role ||
                        "-"}
                    </span>
                  </div>

                  <div className="profile-divider" />

                  <button
                    type="button"
                    className="profile-logout"
                    onClick={
                      handleLogout
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4Zm5.59 4.59L14.17 10H21v2h-6.83l1.42 1.41L14.17 14l-3.41-3.41L14.17 7l1.42 1.59Z"
                        fill="currentColor"
                      />
                    </svg>

                    Logout
                  </button>

                </div>
              )}

            </div>

            <button
              type="button"
              className="nav-logout"
              onClick={handleLogout}
            >
              <svg className="nav-logout-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4Zm5.59 4.59L14.17 10H21v2h-6.83l1.42 1.41L14.17 14l-3.41-3.41L14.17 7l1.42 1.59Z" fill="currentColor" />
              </svg>
              <span className="nav-logout-label">Logout</span>
            </button>

            {canUsers && (
              <Link
                href="/users"
                className="nav-users-button"
                onClick={() => setProfileOpen(false)}
              >
                <span className="dashboard-add-finding-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
                    <path
                      d="M12 3.5 19 6v5.1c0 4.4-2.8 7.8-7 9.4-4.2-1.6-7-5-7-9.4V6l7-2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m8.7 12.2 2.1 2.1 4.5-4.6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Kelola User
              </Link>
            )}

          </nav>

          <div className="mobile-menu-wrapper">
            <button
              type="button"
              className={`mobile-menu-button ${showMobileNav ? "mobile-menu-button-open" : ""}`}
              onClick={() => setShowMobileNav((value) => !value)}
              aria-label={showMobileNav ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={showMobileNav}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

        </header>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div className="page-content">

          <div className="temuan-add-finding-row">
            <Link
              href="/inspeksi"
              className="temuan-add-finding"
            >
              + Tambah Temuan
            </Link>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="workspace">

            {/* ==================================================
                LEFT
            ================================================== */}

            <div className="main-column">

              {/* FILTER */}

              <section className="filter-card">

                <button
                  type="button"
                  className="btn filter-refresh-button filter-refresh-top"
                  onClick={refreshData}
                  disabled={loading}
                  title="Refresh Data"
                  aria-label="Refresh Data"
                >
                  <RefreshIcon />
                </button>

                <div className="filter-grid">

                  <div className="filter-field">
                    <label>
                      Tampilan Periode
                    </label>

                    <select
                      value={periode}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPeriode(value);
                        if (value !== "Pilih Waktu") {
                          setPeriodeDari("");
                          setPeriodeSampai("");
                        }
                        setPage(1);
                      }}
                    >
                      <option>
                        Semua Data
                      </option>
                      <option>
                        Bulan Ini
                      </option>
                      <option>
                        3 Bulan
                      </option>
                      <option>
                        6 Bulan
                      </option>
                      <option>
                        1 Tahun
                      </option>
                      <option>
                        Pilih Waktu
                      </option>
                    </select>
                  </div>

                  {periode === "Pilih Waktu" && (
                    <>
                      <div className="filter-field">
                        <label>
                          Dari
                        </label>

                        <input
                          className="filter-date-input"
                          type="date"
                          value={periodeDari}
                          onChange={(e) => {
                            setPeriodeDari(e.target.value);
                            setPage(1);
                          }}
                        />
                      </div>

                      <div className="filter-field">
                        <label>
                          Sampai
                        </label>

                        <input
                          className="filter-date-input"
                          type="date"
                          value={periodeSampai}
                          min={periodeDari || undefined}
                          onChange={(e) => {
                            setPeriodeSampai(e.target.value);
                            setPage(1);
                          }}
                        />
                      </div>
                    </>
                  )}

                  <div className="filter-field">
                    <label>
                      Wilayah
                    </label>

                    <select
                      value={wilayah}
                      onChange={(e) => {
                        setWilayah(
                          e.target.value
                        );
                        setPage(1);
                      }}
                    >
                      {WILAYAH.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="filter-field">
                    <label>
                      Status Temuan
                    </label>

                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(
                          e.target.value
                        );
                        setPage(1);
                      }}
                    >
                      {STATUS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="filter-field">
                    <label>
                      Grup Temuan
                    </label>

                    <select
                      value={grup}
                      onChange={(e) => {
                        setGrup(
                          e.target.value
                        );
                        setPage(1);
                      }}
                    >
                      {grupOptions.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="filter-field search-box">
                    <label>
                      Cari Temuan
                    </label>

                    <input
                      className="search-input"
                      value={search}
                      onChange={(e) => {
                        setSearch(
                          e.target.value
                        );
                        setPage(1);
                      }}
                      placeholder="Cari temuan..."
                    />

                    <svg
                      className="search-icon"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />

                      <path
                        d="m16 16 5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setPage(1);
                    }}
                  >
                    Terapkan
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={
                      exportExcel
                    }
                  >
                    ↓ Excel
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={
                      exportPdf
                    }
                  >
                    ↓ PDF
                  </button>

                </div>

              </section>

              {/* TABLE */}

              <section className="table-card">

                <h2 className="section-title">
                  Daftar Temuan
                </h2>

                <div className="table-wrapper">

                  <table>

                    <thead>
                      <tr>

                        <th className="col-no">
                          No
                        </th>

                        <th className="col-action mobile-leading-action">
                          Detail
                        </th>

                        <th className="col-date">
                          Tanggal Temuan
                        </th>

                        <th className="col-wilayah">
                          Wilayah
                        </th>

                        <th className="col-lokasi">
                          Lokasi
                        </th>

                        <th className="col-grup">
                          Grup Temuan
                        </th>

                        <th className="col-status">
                          Status
                        </th>

                        <th className="col-pelapor">
                          Terlapor
                        </th>

                        <th className="col-action desktop-action">
                          Aksi
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {loading ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="empty"
                          >
                            Memuat data temuan...
                          </td>
                        </tr>
                      ) : displayedData.length ===
                        0 ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="empty"
                          >
                            Belum ada data temuan.
                          </td>
                        </tr>
                      ) : (
                        displayedData.map(
                          (item, index) => {

                            const nomor =
                              (page - 1) *
                                perPage +
                              index +
                              1;

                            const itemStatus =
                              String(
                                item?.status_temuan ||
                                  "OPEN"
                              ).toUpperCase();
                            const detailButtonClass =
                              itemStatus === "CLOSE"
                                ? "detail-close"
                                : isTemuanTerlambat(item)
                                  ? "detail-late"
                                  : "detail-open";

                            const terlapor =
                              item?.master_mandor
                                ?.nama_mandor ||
                              "-";

                            return (
                              <tr
                                key={String(
                                  item.id_temuan
                                )}
                              >

                                <td className="col-no">
                                  {nomor}
                                </td>

                                <td className="col-action mobile-leading-action">
                                  <button
                                    type="button"
                                    className={`icon-btn ${detailButtonClass}`}
                                    title="Lihat Detail"
                                    onClick={() => lihatDetail(item)}
                                  >
                                    <svg viewBox="0 0 24 24">
                                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                      <circle cx="12" cy="12" r="2.7" fill="currentColor" />
                                    </svg>
                                  </button>
                                </td>

                                <td>
                                  {formatTanggal(
                                    item.tanggal_temuan
                                  )}
                                </td>

                                <td>
                                  {wilayahLabel(
                                    item
                                  )}
                                </td>

                                <td>
                                  <div className="ellipsis">
                                    {item
                                      ?.master_lokasi
                                      ?.nama_lokasi ||
                                      "-"}
                                  </div>
                                </td>

                                <td>
                                  <div className="ellipsis">
                                    {item
                                      ?.master_grup_temuan
                                      ?.nama_grup ||
                                      "-"}
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={`status-badge ${
                                      itemStatus ===
                                      "CLOSE"
                                        ? "status-close"
                                        : "status-open"
                                    }`}
                                  >
                                    {itemStatus}
                                  </span>
                                </td>

                                <td>
                                  <div className="ellipsis">
                                    {terlapor}
                                  </div>
                                </td>

                                <td className="desktop-action">

                                  <div className="action-buttons">

                                    {/* MATA */}

                                    <button
                                      type="button"
                                      className={`icon-btn ${detailButtonClass}`}
                                      title="Lihat Detail"
                                      onClick={() =>
                                        lihatDetail(
                                          item
                                        )
                                      }
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        />

                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="2.7"
                                          fill="currentColor"
                                        />
                                      </svg>
                                    </button>

                                    {/* TINDAK LANJUT */}

                                    {itemStatus !==
                                      "CLOSE" && (
                                      <button
                                        type="button"
                                        className="icon-btn"
                                        title="Tindak Lanjut / Close"
                                        onClick={() =>
                                          bukaClose(
                                            item
                                          )
                                        }
                                      >
                                        <svg
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            d="M12 3v18M3 12h18"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                      </button>
                                    )}

                                  </div>

                                </td>

                              </tr>
                            );
                          }
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* FOOTER */}

                <div className="table-footer">

                  <div>
                    Menampilkan{" "}
                    {filteredData.length ===
                    0
                      ? 0
                      : (page - 1) *
                          perPage +
                        1}{" "}
                    -{" "}
                    {Math.min(
                      page * perPage,
                      filteredData.length
                    )}{" "}
                    dari{" "}
                    {filteredData.length}{" "}
                    data
                  </div>

                  <div className="pagination">

                    <button
                      type="button"
                      className="page-btn"
                      disabled={
                        page <= 1
                      }
                      onClick={() =>
                        setPage(
                          (p) =>
                            Math.max(
                              1,
                              p - 1
                            )
                        )
                      }
                    >
                      ‹
                    </button>

                    {Array.from(
                      {
                        length:
                          Math.min(
                            totalPages,
                            3
                          ),
                      },
                      (_, index) => {
                        const pageNumber =
                          index + 1;

                        return (
                          <button
                            key={
                              pageNumber
                            }
                            type="button"
                            className={`page-btn ${
                              page ===
                              pageNumber
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setPage(
                                pageNumber
                              )
                            }
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                    )}

                    <button
                      type="button"
                      className="page-btn"
                      disabled={
                        page >=
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          (p) =>
                            Math.min(
                              totalPages,
                              p + 1
                            )
                        )
                      }
                    >
                      ›
                    </button>

                  </div>

                  <div className="page-size">
                    <span>
                      Tampilkan
                    </span>

                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(
                          Number(
                            e.target.value
                          )
                        );
                        setPage(1);
                      }}
                    >
                      <option value="8">
                        8
                      </option>

                      <option value="10">
                        10
                      </option>

                      <option value="20">
                        20
                      </option>

                      <option value="50">
                        50
                      </option>
                    </select>

                    <span>
                      data
                    </span>
                  </div>

                </div>

              </section>

            </div>

            {/* ==================================================
                RIGHT SIDE
            ================================================== */}

            {selectedTemuan && (
              <div
                className="detail-modal-overlay"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    tutupDetail();
                  }
                }}
              >
                <div
                  className="detail-modal-content"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <aside className="side-column">

                {/* ==================================================
                    DETAIL TEMUAN
                ================================================== */}

                {detailOpen && (
                  <section className="side-card">

                    <div className="side-title-row">

                      <h3 className="side-title">
                        Detail Temuan
                      </h3>

                      <button
                        type="button"
                        className="close-x"
                        onClick={
                          tutupDetail
                        }
                      >
                        ×
                      </button>

                    </div>

                    <div className="detail-top">

                      <span className="finding-number">
                        #{String(
                          selectedTemuan.id_temuan
                        )}
                      </span>

                      <span
                        className={`status-badge ${
                          String(
                            selectedTemuan.status_temuan ||
                              "OPEN"
                          ).toUpperCase() ===
                          "CLOSE"
                            ? "status-close"
                            : "status-open"
                        }`}
                      >
                        {String(
                          selectedTemuan.status_temuan ||
                            "OPEN"
                        ).toUpperCase()}
                      </span>

                    </div>

                    <div className="detail-grid">

                      <span className="label">
                        Tanggal Temuan
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {formatTanggal(
                          selectedTemuan.tanggal_temuan
                        )}
                      </span>

                      <span className="label">
                        Wilayah
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {wilayahLabel(
                          selectedTemuan
                        )}
                      </span>

                      <span className="label">
                        Lokasi
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {selectedTemuan
                          ?.master_lokasi
                          ?.nama_lokasi ||
                          "-"}
                      </span>

                      <span className="label">
                        Grup Temuan
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {selectedTemuan
                          ?.master_grup_temuan
                          ?.nama_grup ||
                          "-"}
                      </span>

                      <span className="label">
                        Aktivitas
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {selectedTemuan
                          ?.master_aktivitas
                          ?.nama_aktivitas ||
                          "-"}
                      </span>

                      <span className="label">
                        Mandor
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {selectedTemuan
                          ?.master_mandor
                          ?.nama_mandor ||
                          "-"}
                      </span>

                      <span className="label">
                        Inspector
                      </span>

                      <span className="value">
                        :
                        {" "}
                        {selectedTemuan?.task_quiz?.inspector_names?.join(", ") ||
                          selectedTemuan?.task_quiz?.inspector_ids?.join(", ") ||
                          "-"}
                      </span>

                    </div>

                    <div className="detail-description">

                      <h4>
                        Deskripsi Temuan
                      </h4>

                      <p>
                        {selectedTemuan?.deskripsi ||
                          "Tidak ada deskripsi."}
                      </p>

                    </div>

                    <div>

                      <div className="photo-title">
                        Foto Temuan (Saat Inspeksi)
                      </div>

                      <div className="photo-box">

                        {selectedTemuan?.foto_url ? (
                          <img
  src={
    selectedTemuan.foto_url
      ? selectedTemuan.foto_url.startsWith("/")
        ? selectedTemuan.foto_url
        : `/${selectedTemuan.foto_url}`
      : ""
  }
  alt="Foto temuan"
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>
                        ) : (
                          <div className="no-photo">
                            Tidak ada foto temuan.
                          </div>
                        )}

                      </div>

                    </div>

                    {String(
                      selectedTemuan.status_temuan ||
                        "OPEN"
                    ).toUpperCase() ===
                      "CLOSE" && (
                      <div
                        style={{
                          marginTop: 12,
                        }}
                      >

                        <div className="photo-title">
                          Foto Setelah Perbaikan
                        </div>

                        <div className="photo-box">

                          {selectedTemuan
                            .foto_close_url ? (
                            <img
                              src={
                                selectedTemuan.foto_close_url
                              }
                              alt="Foto close temuan"
                            />
                          ) : (
                            <div className="no-photo">
                              Tidak ada foto close.
                            </div>
                          )}

                        </div>

                      </div>
                    )}

                    <div className="side-actions">

                      <button
                        type="button"
                        className="side-action"
                        onClick={
                          tutupDetail
                        }
                      >
                        Tutup
                      </button>

                      {String(
                        selectedTemuan.status_temuan ||
                          "OPEN"
                      ).toUpperCase() !==
                        "CLOSE" && (
                        <button
                          type="button"
                          className="side-action primary"
                          onClick={() =>
                            bukaClose(
                              selectedTemuan
                            )
                          }
                        >
                          Tindak Lanjut /
                          Close Temuan
                        </button>
                      )}

                    </div>

                  </section>
                )}

                {/* ==================================================
                    CLOSE FORM
                ================================================== */}

                {closeOpen &&
                  String(
                    selectedTemuan.status_temuan ||
                      "OPEN"
                  ).toUpperCase() !==
                    "CLOSE" && (
                    <section className="close-card">

                      <div className="side-title-row">

                        <h3 className="side-title">
                          Tindak Lanjut / Close Temuan
                        </h3>

                        <button
                          type="button"
                          className="close-x"
                          onClick={() =>
                            setCloseOpen(
                              false
                            )
                          }
                        >
                          ×
                        </button>

                      </div>

                      {closeError && (
                        <div className="error-box">
                          {closeError}
                        </div>
                      )}

                      {closeSuccess && (
                        <div className="success-box">
                          {closeSuccess}
                        </div>
                      )}

                      <label className="close-label">
                        Tindak Lanjut / Keterangan
                      </label>

                      <textarea
                        className="close-textarea"
                        value={
                          keteranganClose
                        }
                        onChange={(e) =>
                          setKeteranganClose(
                            e.target.value
                          )
                        }
                        placeholder="Jelaskan tindak lanjut/perbaikan yang telah dilakukan..."
                      />

                      <div
                        style={{
                          marginTop: 13,
                        }}
                      >

                        <label className="close-label">
                          Foto Setelah Perbaikan
                          (Foto Close)
                        </label>

                        <div className="upload-row">

                          <input
                            ref={
                              fileInputRef
                            }
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={
                              handleFotoClose
                            }
                            style={{
                              display:
                                "none",
                            }}
                          />

                          <button
                            type="button"
                            className="upload-button"
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                          >
                            Pilih Foto
                          </button>

                          <input
                            ref={
                              cameraInputRef
                            }
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={
                              handleFotoClose
                            }
                            style={{
                              display:
                                "none",
                            }}
                          />

                          <button
                            type="button"
                            className="upload-button"
                            onClick={() =>
                              cameraInputRef.current?.click()
                            }
                          >
                            Buka Kamera
                          </button>

                          <span className="upload-name">
                            {fotoCloseName ||
                              "Belum ada foto dipilih"}
                          </span>

                        </div>

                        <div className="file-help">
                          * Format JPG, JPEG,
                          PNG, WEBP. Maksimal 8MB
                        </div>

                        {fotoClose && (
                          <div className="close-photo-preview">

                            <img
                              src={fotoClose}
                              alt="Preview foto close"
                            />

                            <button
                              type="button"
                              className="close-photo-remove"
                              onClick={() => {
                                setFotoClose(
                                  ""
                                );

                                setFotoCloseName(
                                  ""
                                );

                                if (
                                  fileInputRef.current
                                ) {
                                  fileInputRef.current.value =
                                    "";
                                }

                                if (
                                  cameraInputRef.current
                                ) {
                                  cameraInputRef.current.value =
                                    "";
                                }
                              }}
                            >
                              ×
                            </button>

                          </div>
                        )}

                      </div>

                      <div className="close-form-actions">

                        <button
                          type="button"
                          className="close-cancel"
                          onClick={() =>
                            setCloseOpen(
                              false
                            )
                          }
                        >
                          Batal
                        </button>

                        <button
                          type="button"
                          className="close-save"
                          disabled={
                            closeLoading
                          }
                          onClick={
                            simpanClose
                          }
                        >
                          {closeLoading
                            ? "Menyimpan..."
                            : "Simpan & Close Temuan"}
                        </button>

                      </div>

                    </section>
                  )}

                  </aside>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </>
  );
}