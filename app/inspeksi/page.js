"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SearchSelect from "@/components/SearchSelect";

const cfg = [
  ["mandor", "Mandor", "id_mandor", "nama_mandor"],
];

const DRAFT_KEY = "k3-inspeksi-draft-v2";

const FORM_AWAL = {
  tanggal_temuan: new Date().toISOString().slice(0, 10),
  no_wilayah: "",
  id_lokasi: "",
  id_mandor: "",
  id_aktivitas: "",
  id_grup: "",
  deskripsi: "",
  latitude: "",
  longitude: "",
  hasil_inspeksi: "TIDAK_ADA_TEMUAN",
};

function fotoKeDataUrl(file, maxWidth = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Gagal membaca file foto"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () =>
        reject(new Error("File bukan gambar yang valid"));

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

export default function Inspeksi() {
  const [master, setMaster] = useState({
    aktivitas: [],
    grup: [],
    wilayah: [],
    lokasi: [],
    mandor: [],
  });

  const [f, setF] = useState(FORM_AWAL);

  const [selectedTemuan, setSelectedTemuan] = useState([]);

  const [fotoInspeksi, setFotoInspeksi] = useState({
    fotoDataUrl: "",
    fotoPreview: "",
    fotoError: "",
  });

  const [titikTersimpan, setTitikTersimpan] = useState({
    latitude: "",
    longitude: "",
  });

  const [showAktivitasTambah, setShowAktivitasTambah] =
    useState(false);

  const [aktivitasBaru, setAktivitasBaru] = useState({
    nama_aktivitas: "",
  });

  const [savingAktivitas, setSavingAktivitas] = useState(false);
  const [deletingAktivitas, setDeletingAktivitas] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingAwal, setLoadingAwal] = useState(false);
  const [loadingWilayahData, setLoadingWilayahData] =
    useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  /* =====================================================
     REVISI NAVBAR
  ===================================================== */

  const [showProfile, setShowProfile] = useState(false);
const [showMobileNav, setShowMobileNav] = useState(false);
const profileRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setShowProfile(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setShowProfile(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  async function logout() {
    if (loggingOut) return;

    const yakin = window.confirm(
      "Apakah Anda yakin ingin keluar dari akun?"
    );

    if (!yakin) return;

    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
    } finally {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}

      try {
        sessionStorage.clear();
      } catch {}

      window.location.replace("/login");
    }
  }

  function set(k, v) {
    setF((x) => ({
      ...x,
      [k]: v,
    }));
  }

  async function ambilJson(url) {
    const r = await fetch(url);
    const text = await r.text();

    let d = {};

    try {
      d = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `API ${url} mengembalikan respons tidak valid (${r.status})`
      );
    }

    if (!r.ok) {
      throw new Error(d.error || `Gagal memuat ${url}`);
    }

    return d;
  }

  /* =====================================================
     LOAD DRAFT
  ===================================================== */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);

      if (!raw) return;

      const draft = JSON.parse(raw);

      const {
        selectedTemuan: draftTemuan,
        titikTersimpan: draftTitik,
        fotoInspeksi: draftFotoInspeksi,
        ...formDraft
      } = draft;

      setF((old) => ({
        ...old,
        ...formDraft,
      }));

      if (Array.isArray(draftTemuan)) {
        setSelectedTemuan(
          draftTemuan.map((item) => ({
            ...item,
            status:
              item.status === "CLOSE"
                ? "CLOSE"
                : "OPEN",
            fotoDataUrl: "",
            fotoPreview: "",
            fotoError: "",
          }))
        );
      }

      if (
        draftTitik?.latitude &&
        draftTitik?.longitude
      ) {
        setTitikTersimpan({
          latitude: draftTitik.latitude,
          longitude: draftTitik.longitude,
        });
      }

      if (draftFotoInspeksi) {
        setFotoInspeksi({
          fotoDataUrl: "",
          fotoPreview: "",
          fotoError: "",
        });
      }
    } catch {}
  }, []);

  /* =====================================================
     SAVE DRAFT
  ===================================================== */

  useEffect(() => {
    try {
      const draft = {
        ...f,

        selectedTemuan: selectedTemuan.map((item) => ({
          id_grup: item.id_grup,
          nama_grup: item.nama_grup,
          deskripsi: item.deskripsi,
          status: item.status || "OPEN",
        })),

        titikTersimpan,

        fotoInspeksi: {
          fotoDataUrl: "",
          fotoPreview: "",
          fotoError: "",
        },
      };

      delete draft.latitude;
      delete draft.longitude;
      delete draft.id_grup;
      delete draft.deskripsi;

      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(draft)
      );
    } catch {}
  }, [f, selectedTemuan, titikTersimpan]);

  /* =====================================================
     LOAD MASTER
  ===================================================== */

  useEffect(() => {
    async function loadMasterAwal() {
      try {
        setLoadingAwal(true);
        setErr("");

        const [
          aktivitas,
          grup,
          wilayah,
          mandor,
        ] = await Promise.all([
          ambilJson("/api/master/aktivitas"),
          ambilJson("/api/master/grup-temuan"),
          ambilJson("/api/master/wilayah"),
          ambilJson("/api/master/mandor"),
        ]);

        setMaster((old) => ({
          ...old,
          aktivitas,
          grup,
          wilayah,
          mandor,
        }));
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingAwal(false);
      }
    }

    loadMasterAwal();
  }, []);

  /* =====================================================
     LOAD LOKASI BERDASARKAN WILAYAH
  ===================================================== */

  useEffect(() => {
    if (!f.no_wilayah) {
      setMaster((old) => ({
        ...old,
        lokasi: [],
      }));

      setF((old) => ({
        ...old,
        id_lokasi: "",
      }));

      return;
    }

    async function loadLokasi() {
      try {
        setLoadingWilayahData(true);
        setErr("");

        setF((old) => ({
          ...old,
          id_lokasi: "",
        }));

        const lokasi = await ambilJson(
          `/api/master/lokasi?noWilayah=${f.no_wilayah}`
        );

        setMaster((old) => ({
          ...old,
          lokasi,
        }));
      } catch (e) {
        setErr(e.message);

        setMaster((old) => ({
          ...old,
          lokasi: [],
        }));
      } finally {
        setLoadingWilayahData(false);
      }
    }

    loadLokasi();
  }, [f.no_wilayah]);

  /* =====================================================
     GPS OTOMATIS
  ===================================================== */

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((x) => ({
          ...x,
          latitude: p.coords.latitude.toFixed(7),
          longitude: p.coords.longitude.toFixed(7),
        }));
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  /* =====================================================
     GPS MANUAL
  ===================================================== */

  function gps() {
    if (!navigator.geolocation) {
      return setErr(
        "Browser tidak mendukung GPS"
      );
    }

    setErr("");

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((x) => ({
          ...x,
          latitude: p.coords.latitude.toFixed(7),
          longitude: p.coords.longitude.toFixed(7),
        }));

        setMsg(
          'Lokasi GPS terbaru berhasil diambil. Tekan "Simpan Titik Ini" agar titik ini dikunci untuk temuan.'
        );
      },
      (e) => {
        setErr(e.message);
      },
      {
        enableHighAccuracy: true,
      }
    );
  }

  /* =====================================================
     SIMPAN TITIK GPS
  ===================================================== */

  function simpanTitikGps() {
    if (!f.latitude || !f.longitude) {
      setErr(
        "Ambil lokasi GPS terlebih dahulu sebelum menyimpan titik."
      );

      return;
    }

    setTitikTersimpan({
      latitude: f.latitude,
      longitude: f.longitude,
    });

    setErr("");

    setMsg(
      `Titik GPS tersimpan: ${f.latitude}, ${f.longitude}. Titik ini tidak akan berubah meskipun Anda berpindah tempat sampai Anda menyimpan titik baru.`
    );
  }

  /* =====================================================
     FOTO BUKTI INSPEKSI
     KHUSUS UNTUK INSPEKSI TANPA TEMUAN
  ===================================================== */

  async function onPilihFotoInspeksi(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setFotoInspeksi((old) => ({
      ...old,
      fotoError: "",
    }));

    try {
      const dataUrl = await fotoKeDataUrl(file);

      setFotoInspeksi({
        fotoDataUrl: dataUrl,
        fotoPreview: dataUrl,
        fotoError: "",
      });
    } catch (error) {
      setFotoInspeksi({
        fotoDataUrl: "",
        fotoPreview: "",
        fotoError: error.message,
      });
    } finally {
      e.target.value = "";
    }
  }

  function hapusFotoInspeksi() {
    setFotoInspeksi({
      fotoDataUrl: "",
      fotoPreview: "",
      fotoError: "",
    });
  }

  function bukaInputFotoInspeksi(mode) {
    const input = document.getElementById(
      `foto-inspeksi-${mode}`
    );

    input?.click();
  }

  /* =====================================================
     HASIL INSPEKSI
  ===================================================== */

  function ubahHasilInspeksi(value) {
    setF((old) => ({
      ...old,
      hasil_inspeksi: value,
    }));

    setErr("");
    setMsg("");

    if (value === "TIDAK_ADA_TEMUAN") {
      setSelectedTemuan([]);
    }
  }

  /* =====================================================
     CHECKLIST GRUP TEMUAN
  ===================================================== */

  function toggleGrupTemuan(idGrup) {
    setSelectedTemuan((current) => {
      const exists = current.some(
        (item) =>
          String(item.id_grup) ===
          String(idGrup)
      );

      if (exists) {
        return current.filter(
          (item) =>
            String(item.id_grup) !==
            String(idGrup)
        );
      }

      const grup = master.grup.find(
        (item) =>
          String(item.id_grup) ===
          String(idGrup)
      );

      if (!grup) return current;

      return [
        ...current,
        {
          id_grup: grup.id_grup,
          nama_grup: grup.nama_grup,
          deskripsi: "",
          status: "OPEN",
          fotoDataUrl: "",
          fotoPreview: "",
          fotoError: "",
        },
      ];
    });

    setErr("");
    setMsg("");
  }

  function updateTemuan(index, key, value) {
    setSelectedTemuan((current) =>
      current.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  async function onPilihFotoTemuan(e, index) {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedTemuan((current) =>
      current.map((item, idx) =>
        idx === index
          ? {
              ...item,
              fotoError: "",
            }
          : item
      )
    );

    try {
      const dataUrl = await fotoKeDataUrl(file);

      setSelectedTemuan((current) =>
        current.map((item, idx) =>
          idx === index
            ? {
                ...item,
                fotoDataUrl: dataUrl,
                fotoPreview: dataUrl,
                fotoError: "",
              }
            : item
        )
      );
    } catch (error) {
      setSelectedTemuan((current) =>
        current.map((item, idx) =>
          idx === index
            ? {
                ...item,
                fotoError: error.message,
              }
            : item
        )
      );
    } finally {
      e.target.value = "";
    }
  }

  function hapusFotoTemuan(index) {
    setSelectedTemuan((current) =>
      current.map((item, idx) =>
        idx === index
          ? {
              ...item,
              fotoDataUrl: "",
              fotoPreview: "",
              fotoError: "",
            }
          : item
      )
    );
  }

  function bukaInputFoto(index, mode) {
    const input = document.getElementById(
      `foto-temuan-${mode}-${index}`
    );

    input?.click();
  }

  /* =====================================================
     TAMBAH AKTIVITAS
  ===================================================== */

  async function tambahAktivitas() {
    const nama =
      aktivitasBaru.nama_aktivitas.trim();

    if (!nama) {
      setErr("Nama aktivitas wajib diisi.");
      return;
    }

    setSavingAktivitas(true);
    setErr("");
    setMsg("");

    try {
      const r = await fetch(
        "/api/master/aktivitas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama_aktivitas: nama,
          }),
        }
      );

      const d = await r.json();

      if (!r.ok) {
        throw new Error(
          d.error || "Gagal menambah aktivitas"
        );
      }

      setMaster((old) => ({
        ...old,

        aktivitas: [
          ...old.aktivitas,
          d,
        ].sort((a, b) =>
          String(
            a.kode_aktivitas
          ).localeCompare(
            String(
              b.kode_aktivitas
            ),
            undefined,
            {
              numeric: true,
            }
          )
        ),
      }));

      setF((old) => ({
        ...old,
        id_aktivitas: d.id_aktivitas,
      }));

      setAktivitasBaru({
        nama_aktivitas: "",
      });

      setShowAktivitasTambah(false);

      setMsg(
        `Aktivitas "${d.nama_aktivitas}" berhasil ditambahkan. Kode otomatis: ${d.kode_aktivitas}.`
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingAktivitas(false);
    }
  }

  /* =====================================================
     HAPUS AKTIVITAS
  ===================================================== */

  async function hapusAktivitas() {
    if (!f.id_aktivitas) {
      setErr(
        "Pilih aktivitas yang ingin dihapus terlebih dahulu."
      );

      return;
    }

    const aktivitasDipilih =
      master.aktivitas.find(
        (a) =>
          String(a.id_aktivitas) ===
          String(f.id_aktivitas)
      );

    if (!aktivitasDipilih) {
      setErr(
        "Aktivitas yang dipilih tidak ditemukan."
      );

      return;
    }

    const namaAktivitas =
      aktivitasDipilih.nama_aktivitas ||
      "aktivitas ini";

    const yakin = window.confirm(
      `Yakin ingin menghapus aktivitas "${namaAktivitas}"?\n\nData aktivitas akan dihapus dari master.`
    );

    if (!yakin) return;

    setDeletingAktivitas(true);
    setErr("");
    setMsg("");

    try {
      const r = await fetch(
        `/api/master/aktivitas?id=${encodeURIComponent(
          f.id_aktivitas
        )}`,
        {
          method: "DELETE",
        }
      );

      const text = await r.text();

      let d = {};

      try {
        d = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `API hapus aktivitas mengembalikan respons tidak valid (${r.status})`
        );
      }

      if (!r.ok) {
        throw new Error(
          d.error ||
            "Gagal menghapus aktivitas"
        );
      }

      setMaster((old) => ({
        ...old,

        aktivitas:
          old.aktivitas.filter(
            (a) =>
              String(a.id_aktivitas) !==
              String(f.id_aktivitas)
          ),
      }));

      setF((old) => ({
        ...old,
        id_aktivitas: "",
      }));

      setMsg(
        `Aktivitas "${namaAktivitas}" berhasil dihapus.`
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setDeletingAktivitas(false);
    }
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function submit(e) {
    e.preventDefault();

    setMsg("");
    setErr("");

    const latitudeTersimpan =
      titikTersimpan.latitude ||
      f.latitude;

    const longitudeTersimpan =
      titikTersimpan.longitude ||
      f.longitude;

    if (
      !latitudeTersimpan ||
      !longitudeTersimpan
    ) {
      setErr(
        "Titik koordinat belum tersedia. Ambil lokasi GPS lalu simpan titik terlebih dahulu."
      );

      return;
    }

    /* ===================================================
       MODE 1
       INSPEKSI SAJA / TIDAK ADA TEMUAN
    =================================================== */

    if (
      f.hasil_inspeksi ===
      "TIDAK_ADA_TEMUAN"
    ) {
      if (!fotoInspeksi.fotoDataUrl) {
        setErr(
          "Foto bukti inspeksi dan sosialisasi wajib diambil atau dipilih."
        );

        return;
      }

      setSubmitting(true);

      try {
        const r = await fetch(
          "/api/temuan",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...f,

              id_grup: null,

              deskripsi:
                "Inspeksi dan sosialisasi telah selesai dilakukan. Tidak ditemukan temuan K3.",

              status: "SELESAI",

              latitude:
                latitudeTersimpan,

              longitude:
                longitudeTersimpan,

              task_quiz: [],

              foto_base64:
                fotoInspeksi.fotoDataUrl,

              jenis_inspeksi:
                "INSPEKSI_SAJA",

              hasil_inspeksi:
                "TIDAK_ADA_TEMUAN",
            }),
          }
        );

        const text = await r.text();

        let d = {};

        try {
          d = text
            ? JSON.parse(text)
            : {};
        } catch {
          throw new Error(
            `API simpan inspeksi mengembalikan respons tidak valid (${r.status})`
          );
        }

        if (!r.ok) {
          throw new Error(
            d.error ||
              "Gagal menyimpan hasil inspeksi"
          );
        }

        setMsg(
          `Inspeksi berhasil disimpan.`
        );

        try {
          localStorage.removeItem(
            DRAFT_KEY
          );
        } catch {}

        setF((x) => ({
          ...x,
          id_lokasi: "",
          id_grup: "",
          deskripsi: "",
          latitude: "",
          longitude: "",
          hasil_inspeksi:
            "TIDAK_ADA_TEMUAN",
        }));

        setSelectedTemuan([]);

        setFotoInspeksi({
          fotoDataUrl: "",
          fotoPreview: "",
          fotoError: "",
        });

        setTitikTersimpan({
          latitude: "",
          longitude: "",
        });
      } catch (error) {
        setErr(error.message);
      } finally {
        setSubmitting(false);
      }

      return;
    }

    /* ===================================================
       MODE 2
       ADA TEMUAN
    =================================================== */

    if (!selectedTemuan.length) {
      setErr(
        "Pilih minimal satu grup temuan terlebih dahulu."
      );

      return;
    }

    const temuanTanpaDeskripsi =
      selectedTemuan.find(
        (item) =>
          !item.deskripsi.trim()
      );

    if (temuanTanpaDeskripsi) {
      setErr(
        `Deskripsi temuan untuk grup "${temuanTanpaDeskripsi.nama_grup}" wajib diisi.`
      );

      return;
    }

    const temuanTanpaFoto =
      selectedTemuan.find(
        (item) =>
          !item.fotoDataUrl
      );

    if (temuanTanpaFoto) {
      setErr(
        `Foto untuk grup "${temuanTanpaFoto.nama_grup}" wajib diambil atau dipilih.`
      );

      return;
    }

    const temuanTanpaStatus =
      selectedTemuan.find(
        (item) =>
          !item.status
      );

    if (temuanTanpaStatus) {
      setErr(
        `Status OPEN/CLOSE untuk grup "${temuanTanpaStatus.nama_grup}" wajib dipilih.`
      );

      return;
    }

    setSubmitting(true);

    try {
      let berhasil = 0;
      let jumlahOpen = 0;
      let jumlahClose = 0;

      for (const item of selectedTemuan) {
        const status =
          item.status === "CLOSE"
            ? "CLOSE"
            : "OPEN";

        const r = await fetch(
          "/api/temuan",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...f,

              id_grup:
                item.id_grup,

              deskripsi:
                item.deskripsi.trim(),

              status,

              latitude:
                latitudeTersimpan,

              longitude:
                longitudeTersimpan,

              task_quiz: [],

              foto_base64:
                item.fotoDataUrl,

              jenis_inspeksi:
                "ADA_TEMUAN",

              hasil_inspeksi:
                "ADA_TEMUAN",
            }),
          }
        );

        const text = await r.text();

        let d = {};

        try {
          d = text
            ? JSON.parse(text)
            : {};
        } catch {
          throw new Error(
            `API simpan temuan mengembalikan respons tidak valid (${r.status})`
          );
        }

        if (!r.ok) {
          throw new Error(
            d.error ||
              `Gagal menyimpan grup temuan "${item.nama_grup}"`
          );
        }

        berhasil += 1;

        if (status === "OPEN") {
          jumlahOpen += 1;
        }

        if (status === "CLOSE") {
          jumlahClose += 1;
        }
      }

      const batas =
        new Date(
          new Date(
            f.tanggal_temuan
          ).getTime() +
            7 * 86400000
        )
          .toISOString()
          .slice(0, 10);

      setMsg(
        `${berhasil} temuan berhasil disimpan. Batas waktu tindak lanjut untuk temuan OPEN (7 hari).`
      );

      try {
        localStorage.removeItem(
          DRAFT_KEY
        );
      } catch {}

      setF((x) => ({
        ...x,
        id_lokasi: "",
        id_grup: "",
        deskripsi: "",
        latitude: "",
        longitude: "",
        hasil_inspeksi:
          "TIDAK_ADA_TEMUAN",
      }));

      setSelectedTemuan([]);

      setFotoInspeksi({
        fotoDataUrl: "",
        fotoPreview: "",
        fotoError: "",
      });

      setTitikTersimpan({
        latitude: "",
        longitude: "",
      });
    } catch (error) {
      setErr(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="topbar">

        <div className="brand">

          <Link
            href="/inspeksi"
            className="brand-logo-link"
            aria-label="Form Inspeksi K3"
          >
            <div className="logo">
              <img
                src="/ggf-estate-pg01.png"
                alt="GGF Estate PG 01"
              />
            </div>
          </Link>

          <div className="brand-text">
            <b>
              Form Inspeksi
            </b>

            <span>
              Estate PG 01
            </span>
          </div>

        </div>

       <nav
  className={`nav ${
    showMobileNav ? "mobile-nav-open" : ""
  }`}
  aria-label="Navigasi utama"
>

          <Link
            href="/inspeksi"
            className="nav-page active"
          >
            Form Inspeksi
          </Link>

          <Link
            href="/dashboard"
            className="nav-page"
          >
            Dashboard
          </Link>

          <Link
            href="/temuan"
            className="nav-page"
          >
            Data Temuan
          </Link>

          {/* PROFILE */}

          <div
            className="profile-wrapper"
            ref={profileRef}
          >

            <button
              type="button"
              className={`profile-button ${
                showProfile
                  ? "profile-open"
                  : ""
              }`}
              onClick={() =>
                setShowProfile(
                  (x) => !x
                )
              }
              aria-expanded={
                showProfile
              }
            >

              <span className="profile-avatar">
                N
              </span>

              <span className="profile-info">

                <strong>
                  Nirwati
                </strong>

                <small>
                  KASIE
                </small>

              </span>

              <span className="profile-chevron">
                ▴
              </span>

            </button>

            {showProfile && (

              <div className="profile-popup">

                <div className="profile-popup-head">

                  <div className="profile-popup-avatar">
                    N
                  </div>

                  <div className="profile-popup-name">

                    <strong>
                      Nirwati
                    </strong>

                    <span>
                      KASIE
                    </span>

                  </div>

                </div>

                <div className="profile-divider" />

                <div className="profile-detail">

                  <span>
                    Nama Lengkap
                  </span>

                  <strong>
                    Nirwati
                  </strong>

                </div>

                <div className="profile-detail">

                  <span>
                    Username
                  </span>

                  <strong>
                    nirwati.kasie
                  </strong>

                </div>

                <div className="profile-detail">

                  <span>
                    Role
                  </span>

                  <strong className="role-badge">
                    KASIE
                  </strong>

                </div>

                <div className="profile-divider" />

                <button
                  type="button"
                  className="popup-logout"
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  disabled={
                    loggingOut
                  }
                >

                  <span className="logout-icon">
                    ⇥
                  </span>

                  <span>
                    {loggingOut
                      ? "Keluar..."
                      : "Logout"}
                  </span>

                </button>

              </div>

            )}

          </div>

          {/* LOGOUT */}

          <button
            type="button"
            className="nav-logout"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Keluar..."
              : "Logout"}
          </button>

        </nav>

              <div className="mobile-menu-wrapper">
          <button
            type="button"
            className={`mobile-menu-button ${
              showMobileNav
                ? "mobile-menu-button-open"
                : ""
            }`}
            onClick={() =>
              setShowMobileNav((x) => !x)
            }
            aria-label={
              showMobileNav
                ? "Tutup menu navigasi"
                : "Buka menu navigasi"
            }
            aria-expanded={showMobileNav}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

      </header>

      <div className="main">

        <section className="hero">

          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />

          <div className="hero-content-left">

            <div className="eyebrow">
              INPUT TEMUAN
            </div>

            <h1 className="title">
              Form Inspeksi K3
            </h1>

            <p className="hero-subtitle">
              Safety First, Healthy Worker,
              Productive Work
            </p>

          </div>

        </section>

        {msg && (
          <div className="notice">
            <span className="notice-icon">
              ✓
            </span>

            <span>
              {msg}
            </span>
          </div>
        )}

        {err && (
          <div className="error">
            <span className="error-icon">
              !
            </span>

            <span>
              {err}
            </span>
          </div>
        )}

        <form
          className="card"
          onSubmit={submit}
        >

          <div className="form-section-title">
            <div className="section-line" />

            <span>
              Informasi Temuan
            </span>
          </div>

          <div className="formgrid">

            <div className="field">

              <label>
                Tanggal Temuan
              </label>

              <input
                type="date"
                value={
                  f.tanggal_temuan
                }
                onChange={(e) =>
                  set(
                    "tanggal_temuan",
                    e.target.value
                  )
                }
                required
              />

            </div>

            {cfg.map(
              ([
                k,
                l,
                v,
                n,
              ]) => (
                <SearchSelect
                  key={k}
                  label={l}
                  value={f[v]}
                  onChange={(x) =>
                    set(v, x)
                  }
                  options={
                    master[k]
                  }
                  valueKey={v}
                  labelKey={n}
                  placeholder={
                    `Cari ${l.toLowerCase()}...`
                  }
                />
              )
            )}

            <SearchSelect
              label="Wilayah"
              value={
                f.no_wilayah
              }
              onChange={(value) =>
                set(
                  "no_wilayah",
                  value
                )
              }
              options={
                master.wilayah
              }
              valueKey="no_wilayah"
              labelKey="nama_wilayah"
              placeholder={
                loadingAwal
                  ? "Memuat wilayah..."
                  : "Cari wilayah..."
              }
            />

            <SearchSelect
              label="Lokasi"
              value={
                f.id_lokasi
              }
              onChange={(value) =>
                set(
                  "id_lokasi",
                  value
                )
              }
              options={
                master.lokasi
              }
              disabled={
                !f.no_wilayah ||
                loadingWilayahData
              }
              valueKey="id_lokasi"
              labelKey="nama_lokasi"
              placeholder={
                !f.no_wilayah
                  ? "Pilih wilayah terlebih dahulu..."
                  : loadingWilayahData
                  ? "Memuat lokasi..."
                  : "Cari lokasi..."
              }
            />

            {f.no_wilayah &&
              !loadingWilayahData && (
                <div className="field full">

                  <div className="location-count">

                    <span className="location-dot">
                      ●
                    </span>

                    <span>
                      {master.lokasi.length} lokasi
                      tersedia untuk Wilayah{" "}
                      {f.no_wilayah}.
                    </span>

                  </div>

                </div>
              )}

            <div className="field">

              <label>
                Aktivitas
              </label>

              <div className="selectrow">

                <SearchSelect
                  label=""
                  value={
                    f.id_aktivitas
                  }
                  onChange={(x) =>
                    set(
                      "id_aktivitas",
                      x
                    )
                  }
                  options={
                    master.aktivitas
                  }
                  valueKey="id_aktivitas"
                  labelKey="nama_aktivitas"
                  placeholder="Cari aktivitas..."
                />

                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    setShowAktivitasTambah(
                      (x) => !x
                    )
                  }
                >
                  ＋ Tambah
                </button>

                <button
                  type="button"
                  className="btn danger"
                  onClick={
                    hapusAktivitas
                  }
                  disabled={
                    !f.id_aktivitas ||
                    deletingAktivitas
                  }
                >
                  {deletingAktivitas
                    ? "Menghapus..."
                    : "🗑 Hapus"}
                </button>

              </div>

              {showAktivitasTambah && (
                <div className="inlinebox">

                  <input
                    value={
                      aktivitasBaru.nama_aktivitas
                    }
                    onChange={(e) =>
                      setAktivitasBaru({
                        nama_aktivitas:
                          e.target.value,
                      })
                    }
                    placeholder="Nama aktivitas"
                    autoFocus
                  />

                  <div className="actions">

                    <button
                      type="button"
                      className="btn"
                      onClick={
                        tambahAktivitas
                      }
                      disabled={
                        savingAktivitas
                      }
                    >
                      {savingAktivitas
                        ? "Menyimpan..."
                        : "Simpan Aktivitas"}
                    </button>

                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setShowAktivitasTambah(
                          false
                        );

                        setAktivitasBaru({
                          nama_aktivitas:
                            "",
                        });

                        setErr("");
                      }}
                    >
                      Batal
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* =====================================================
                HASIL INSPEKSI
            ===================================================== */}

            <div className="field full">

              <div className="inspection-result">

                <div className="inspection-result-head">

                  <div>

                    <label>
                      Hasil Inspeksi
                      <span className="required-mark">
                        *
                      </span>
                    </label>

                    <div className="muted small">
                      Tentukan apakah inspeksi hanya selesai tanpa temuan atau ditemukan temuan K3.
                    </div>

                  </div>

                </div>

                <div className="inspection-options">

                  <label
                    className={`inspection-option ${
                      f.hasil_inspeksi ===
                      "TIDAK_ADA_TEMUAN"
                        ? "selected"
                        : ""
                    }`}
                  >

                    <input
                      type="radio"
                      name="hasil_inspeksi"
                      value="TIDAK_ADA_TEMUAN"
                      checked={
                        f.hasil_inspeksi ===
                        "TIDAK_ADA_TEMUAN"
                      }
                      onChange={(e) =>
                        ubahHasilInspeksi(
                          e.target.value
                        )
                      }
                    />

                    <span className="inspection-radio">
                      {f.hasil_inspeksi ===
                      "TIDAK_ADA_TEMUAN"
                        ? "✓"
                        : ""}
                    </span>

                    <span className="inspection-option-text">

                      <strong>
                        Inspeksi
                      </strong>

                      <small>
                        Tidak ada temuan — inspeksi dan sosialisasi
                      </small>

                    </span>

                    <span className="inspection-status selesai">
                      SELESAI
                    </span>

                  </label>

                  <label
                    className={`inspection-option ${
                      f.hasil_inspeksi ===
                      "ADA_TEMUAN"
                        ? "selected"
                        : ""
                    }`}
                  >

                    <input
                      type="radio"
                      name="hasil_inspeksi"
                      value="ADA_TEMUAN"
                      checked={
                        f.hasil_inspeksi ===
                        "ADA_TEMUAN"
                      }
                      onChange={(e) =>
                        ubahHasilInspeksi(
                          e.target.value
                        )
                      }
                    />

                    <span className="inspection-radio">
                      {f.hasil_inspeksi ===
                      "ADA_TEMUAN"
                        ? "✓"
                        : ""}
                    </span>

                    <span className="inspection-option-text">

                      <strong>
                        Temuan inspeksi
                      </strong>

                      <small>
                        Pilih grup temuan
                      </small>

                    </span>

                    <span className="inspection-status temuan">
                      TEMUAN
                    </span>

                  </label>

                </div>

              </div>

            </div>

            {/* =====================================================
                FOTO BUKTI INSPEKSI
                HANYA MUNCUL UNTUK INSPEKSI TANPA TEMUAN
            ===================================================== */}

            {f.hasil_inspeksi ===
              "TIDAK_ADA_TEMUAN" && (

              <div className="field full">

                <div className="inspection-proof">

                  <div className="inspection-proof-head">

                    <div>

                      <label>
                        Foto Bukti Inspeksi & Sosialisasi
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <div className="muted small">
                        Foto digunakan sebagai bukti bahwa inspeksi dan sosialisasi telah dilakukan meskipun tidak ditemukan temuan.
                      </div>

                    </div>

                    <span className="inspection-status selesai">
                      SELESAI
                    </span>

                  </div>

                  <div className="photo-box">

                    <div className="photoactions">

                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() =>
                          bukaInputFotoInspeksi(
                            "pilih"
                          )
                        }
                      >
                        Pilih Foto
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() =>
                          bukaInputFotoInspeksi(
                            "kamera"
                          )
                        }
                      >
                        Kamera
                      </button>

                      <input
                        id="foto-inspeksi-pilih"
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={
                          onPilihFotoInspeksi
                        }
                      />

                      <input
                        id="foto-inspeksi-kamera"
                        hidden
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={
                          onPilihFotoInspeksi
                        }
                      />

                    </div>

                    <div className="photo-help">
                      Wajib mengunggah minimal satu foto sebagai bukti inspeksi dan sosialisasi.
                    </div>

                  </div>

                  {fotoInspeksi.fotoError && (

                    <div className="error small">
                      {
                        fotoInspeksi.fotoError
                      }
                    </div>

                  )}

                  {fotoInspeksi.fotoPreview && (

                    <div className="fotopreview">

                      <img
                        src={
                          fotoInspeksi.fotoPreview
                        }
                        alt="Pratinjau foto bukti inspeksi"
                      />

                      <button
                        type="button"
                        className="btn secondary small"
                        onClick={
                          hapusFotoInspeksi
                        }
                      >
                        Hapus Foto
                      </button>

                    </div>

                  )}

                </div>

              </div>

            )}

            {/* =====================================================
                CHECKLIST GRUP TEMUAN
                HANYA MUNCUL JIKA ADA TEMUAN
            ===================================================== */}

            {f.hasil_inspeksi ===
              "ADA_TEMUAN" && (

              <div className="field full">

                <div className="temuan-workspace">

                  <div className="temuan-selector-panel">

                    <div className="temuan-head">

                      <div>

                        <label>
                          Grup Temuan
                        </label>

                        <div className="muted small">
                          Checklist semua jenis temuan yang ditemukan. Setiap temuan wajib memiliki deskripsi, foto, dan status OPEN/CLOSE.
                        </div>

                      </div>

                      <div className="temuan-count">
                        {selectedTemuan.length} dipilih
                      </div>

                    </div>

                    <div className="grup-checklist">

                      {master.grup.length === 0 ? (

                        <div className="grup-empty">

                          {loadingAwal
                            ? "Memuat grup temuan..."
                            : "Belum ada grup temuan."}

                        </div>

                      ) : (

                        master.grup.map(
                          (grup, grupIndex) => {

                            const selectedIndex =
                              selectedTemuan.findIndex(
                                (item) =>
                                  String(
                                    item.id_grup
                                  ) ===
                                  String(
                                    grup.id_grup
                                  )
                              );

                            const checked =
                              selectedIndex !== -1;

                            const item =
                              checked
                                ? selectedTemuan[
                                    selectedIndex
                                  ]
                                : null;

                            return (

                              <div
                                className={`grup-item ${
                                  checked
                                    ? "checked"
                                    : ""
                                }`}
                                key={
                                  grup.id_grup
                                }
                              >

                                <label className="grup-check">

                                  <input
                                    type="checkbox"
                                    checked={
                                      checked
                                    }
                                    onChange={() =>
                                      toggleGrupTemuan(
                                        grup.id_grup
                                      )
                                    }
                                  />

                                  <span className="checkmark">
                                    {checked
                                      ? "✓"
                                      : ""}
                                  </span>

                                  <span className="grup-check-text">

                                    <strong>
                                      {
                                        grup.nama_grup
                                      }
                                    </strong>

                                    <small>
                                      {checked
                                        ? "Temuan dipilih — isi detail di bawah"
                                        : "Klik untuk memilih"}
                                    </small>

                                  </span>

                                </label>

                                {checked &&
                                  item && (

                                    <div className="temuan-card">

                                      <div className="temuan-card-title">

                                        <div className="temuan-number">
                                          {grupIndex + 1}
                                        </div>

                                        <div>

                                          <strong>
                                            {
                                              item.nama_grup
                                            }
                                          </strong>

                                          <span>
                                            Detail temuan
                                          </span>

                                        </div>

                                        <button
                                          type="button"
                                          className="btn danger small"
                                          onClick={() =>
                                            toggleGrupTemuan(
                                              item.id_grup
                                            )
                                          }
                                        >
                                          Hapus
                                        </button>

                                      </div>

                                      <div className="temuan-card-body">

                                        <div className="temuan-description">

                                          <label>
                                            Deskripsi Temuan
                                            <span className="required-mark">
                                              *
                                            </span>
                                          </label>

                                          <textarea
                                            rows="5"
                                            value={
                                              item.deskripsi
                                            }
                                            onChange={(e) =>
                                              updateTemuan(
                                                selectedIndex,
                                                "deskripsi",
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Jelaskan kondisi temuan ${item.nama_grup}...`}
                                            required
                                          />

                                        </div>

                                        <div className="temuan-photo">

                                          <label>
                                            Foto Temuan
                                            <span className="required-mark">
                                              *
                                            </span>
                                          </label>

                                          <div className="photo-box temuan-photo-box">

                                            <div className="photoactions">

                                              <button
                                                type="button"
                                                className="btn secondary"
                                                onClick={() =>
                                                  bukaInputFoto(
                                                    selectedIndex,
                                                    "pilih"
                                                  )
                                                }
                                              >
                                                Pilih Foto
                                              </button>

                                              <button
                                                type="button"
                                                className="btn"
                                                onClick={() =>
                                                  bukaInputFoto(
                                                    selectedIndex,
                                                    "kamera"
                                                  )
                                                }
                                              >
                                                Kamera
                                              </button>

                                              <input
                                                id={`foto-temuan-pilih-${selectedIndex}`}
                                                hidden
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                  onPilihFotoTemuan(
                                                    e,
                                                    selectedIndex
                                                  )
                                                }
                                              />

                                              <input
                                                id={`foto-temuan-kamera-${selectedIndex}`}
                                                hidden
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) =>
                                                  onPilihFotoTemuan(
                                                    e,
                                                    selectedIndex
                                                  )
                                                }
                                              />

                                            </div>

                                            <div className="photo-help">
                                              Foto khusus untuk temuan{" "}
                                              {
                                                item.nama_grup
                                              }.
                                            </div>

                                          </div>

                                          {item.fotoError && (

                                            <div className="error small">
                                              {
                                                item.fotoError
                                              }
                                            </div>

                                          )}

                                          {item.fotoPreview && (

                                            <div className="fotopreview">

                                              <img
                                                src={
                                                  item.fotoPreview
                                                }
                                                alt={`Pratinjau foto ${item.nama_grup}`}
                                              />

                                              <button
                                                type="button"
                                                className="btn secondary small"
                                                onClick={() =>
                                                  hapusFotoTemuan(
                                                    selectedIndex
                                                  )
                                                }
                                              >
                                                Hapus Foto
                                              </button>

                                            </div>

                                          )}

                                          {/* STATUS OPEN / CLOSE */}

                                          <div className="temuan-status-box">

                                            <label>
                                              Status Temuan
                                              <span className="required-mark">
                                                *
                                              </span>
                                            </label>

                                            <div className="status-options">

                                              <label
                                                className={`status-option open ${
                                                  item.status ===
                                                  "OPEN"
                                                    ? "selected"
                                                    : ""
                                                }`}
                                              >

                                                <input
                                                  type="radio"
                                                  name={`status-temuan-${selectedIndex}`}
                                                  value="OPEN"
                                                  checked={
                                                    item.status ===
                                                    "OPEN"
                                                  }
                                                  onChange={() =>
                                                    updateTemuan(
                                                      selectedIndex,
                                                      "status",
                                                      "OPEN"
                                                    )
                                                  }
                                                />

                                                <span className="status-radio">
                                                  {item.status ===
                                                  "OPEN"
                                                    ? "✓"
                                                    : ""}
                                                </span>

                                                <span>
                                                  <strong>
                                                    OPEN
                                                  </strong>

                                                  <small>
                                                    Perlu tindak lanjut
                                                  </small>
                                                </span>

                                              </label>

                                              <label
                                                className={`status-option close ${
                                                  item.status ===
                                                  "CLOSE"
                                                    ? "selected"
                                                    : ""
                                                }`}
                                              >

                                                <input
                                                  type="radio"
                                                  name={`status-temuan-${selectedIndex}`}
                                                  value="CLOSE"
                                                  checked={
                                                    item.status ===
                                                    "CLOSE"
                                                  }
                                                  onChange={() =>
                                                    updateTemuan(
                                                      selectedIndex,
                                                      "status",
                                                      "CLOSE"
                                                    )
                                                  }
                                                />

                                                <span className="status-radio">
                                                  {item.status ===
                                                  "CLOSE"
                                                    ? "✓"
                                                    : ""}
                                                </span>

                                                <span>
                                                  <strong>
                                                    CLOSE
                                                  </strong>

                                                  <small>
                                                    Sudah selesai
                                                  </small>
                                                </span>

                                              </label>

                                            </div>

                                          </div>

                                        </div>

                                      </div>

                                    </div>

                                  )}

                              </div>

                            );
                          }
                        )

                      )}

                    </div>

                  </div>

                </div>

              </div>

            )}

            {/* =====================================================
                LOKASI & PETA
            ===================================================== */}

            <div className="field full">

              <label>
                Lokasi & Peta
              </label>

              {f.latitude &&
              f.longitude ? (

                <div className="mapbox">

                  <div className="map-info">

                    <div className="coordinate-box">

                      <div className="small muted">
                        {titikTersimpan.latitude
                          ? "Titik GPS Tersimpan"
                          : "Koordinat GPS Saat Ini"}
                      </div>

                      <strong>
                        {(
                          titikTersimpan.latitude ||
                          f.latitude
                        )},{" "}
                        {(
                          titikTersimpan.longitude ||
                          f.longitude
                        )}
                      </strong>

                      <div className="small gps-status">
                        {titikTersimpan.latitude
                          ? "Titik dikunci dan tidak mengikuti perpindahan Anda."
                          : "Titik belum dikunci. Simpan titik ini sebelum menyimpan inspeksi."}
                      </div>

                    </div>

                    <div className="gps-actions">

                      <button
                        type="button"
                        className="btn secondary"
                        onClick={gps}
                      >
                        Ambil Lokasi Saya
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={
                          simpanTitikGps
                        }
                      >
                        {titikTersimpan.latitude
                          ? "Simpan Titik Baru"
                          : "Simpan Titik Ini"}
                      </button>

                    </div>

                  </div>

                  <iframe
                    title="Preview lokasi inspeksi"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${
                        titikTersimpan.latitude ||
                        f.latitude
                      },${
                        titikTersimpan.longitude ||
                        f.longitude
                      }`
                    )}&z=17&output=embed`}
                    className="mapframe"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                </div>

              ) : (

                <div className="gps-empty">

                  <div className="gps-empty-icon">
                    GPS
                  </div>

                  <div>

                    <strong>
                      Lokasi GPS belum tersedia
                    </strong>

                    <p>
                      Menunggu izin/lokasi GPS.
                      Setelah lokasi didapat, simpan titik agar koordinat tidak berubah saat Anda berpindah tempat.
                    </p>

                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={gps}
                  >
                    Ambil Lokasi Saya
                  </button>

                </div>

              )}

            </div>

          </div>

          <div className="submit-area">

            <div className="submit-info">

              <span className="submit-check">
                ✓
              </span>

              <div>

                <strong>
                  Pastikan data sudah benar
                </strong>

                <span>
                  {f.hasil_inspeksi ===
                  "TIDAK_ADA_TEMUAN"
                    ? "Inspeksi tanpa temuan wajib memiliki foto bukti inspeksi dan sosialisasi."
                    : "Setiap grup temuan yang dipilih wajib memiliki deskripsi, foto, dan status OPEN/CLOSE."}
                </span>

              </div>

            </div>

            <div className="actions submit-actions">

              <button
                className="btn submit-btn"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Menyimpan..."
                  : f.hasil_inspeksi ===
                    "TIDAK_ADA_TEMUAN"
                  ? "Simpan Inspeksi"
                  : "Simpan Temuan"}

              </button>

            </div>

          </div>

        </form>

        <div className="navigation-card">

          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              window.history.back()
            }
          >
            ← Kembali
          </button>

          <div className="navigation-links">

            <Link
              href="/dashboard"
              className="btn secondary"
            >
              Dashboard
            </Link>

            <Link
              href="/temuan"
              className="btn"
            >
              Data Temuan →
            </Link>

          </div>

        </div>

      </div>

      <style jsx global>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600&display=swap'
        );

        :root {
          --green-900: #0d2618;
          --green-800: #123d25;
          --green-700: #08783d;
          --green-600: #079447;
          --green-500: #18a957;
          --green-soft: #edf8f1;
          --green-soft-2: #f5faf6;
          --text: #17231a;
          --text-soft: #5d6b62;
          --text-muted: #87928b;
          --border: #dce5de;
          --border-dark: #ccd8cf;
          --white: #ffffff;
          --danger-bg: #fff1f1;
          --danger-text: #a52c2c;
          --shadow-sm: 0 2px 8px rgba(20,45,29,.05);
          --shadow: 0 12px 35px rgba(20,45,29,.08);
          --shadow-lg: 0 20px 55px rgba(20,45,29,.12);
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #f4f7f4;
        }

        body {
          font-family: "Inter", Arial, sans-serif;
          color: var(--text);
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .shell {
          min-height: 100vh;
          padding-top: 78px;
          background:
            linear-gradient(
              180deg,
              #f6f8f6 0%,
              #edf3ee 100%
            );
        }

        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 10px clamp(18px,4vw,54px);
          background: rgba(255,255,255,.96);
          border-bottom: 1px solid #e3eae5;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-logo-link {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .logo {
          width: 110px;
          height: 52px;
          flex: 0 0 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo img {
          display: block;
          width: 100%;
          max-width: 110px;
          height: auto;
          object-fit: contain;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1.2;
        }

        .brand-text b {
          color: var(--green-900);
          font-size: 15px;
          font-weight: 800;
        }

        .brand-text span {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: "Poppins", sans-serif;
          font-weight: 600;
        }

        .nav-page {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border: 0;
          border-radius: 10px;
          padding: 10px 13px;
          background: transparent;
          color: #5f6c64;
          font-family: "Poppins", sans-serif;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition:
            background .16s ease,
            color .16s ease,
            transform .16s ease;
        }

        .nav-page:hover {
          background: #f1f6f2;
          color: var(--green-800);
        }

        .nav-page.active {
          min-width: 112px;
          color: var(--green-700);
          background: #edf8f1;
          border-bottom: 2px solid var(--green-600);
          border-radius: 10px;
        }

        .nav-page.active::after {
          display: none;
        }

        .profile-wrapper {
          position: relative;
          flex: 0 0 auto;
        }

        .profile-button {
          min-width: 145px;
          height: 44px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 4px 10px 4px 7px;
          border: 1px solid #dbe5de;
          border-radius: 12px;
          background: #ffffff;
          color: var(--green-900);
          font-family: "Poppins", sans-serif;
          font-weight: 600;
          text-align: left;
          transition:
            background .16s ease,
            border-color .16s ease,
            box-shadow .16s ease;
        }

        .profile-button:hover,
        .profile-button.profile-open {
          background: #f8fbf9;
          border-color: #cbdacf;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--green-600);
          color: #ffffff;
          font-family: "Poppins", sans-serif;
          font-size: 14px;
          font-weight: 600;
        }

        .profile-info {
          min-width: 0;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.05;
        }

        .profile-info strong {
          overflow: hidden;
          color: #25362c;
          font-family: "Poppins", sans-serif;
          font-size: 11px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-info small {
          margin-top: 4px;
          color: #7c8981;
          font-family: "Poppins", sans-serif;
          font-size: 8px;
          font-weight: 600;
        }

        .profile-chevron {
          margin-left: 2px;
          color: #7c8981;
          font-size: 8px;
          line-height: 1;
          transform: translateY(-1px);
        }

        .profile-popup {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 1100;
          width: 298px;
          padding: 16px;
          border: 1px solid #dfe6e1;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 18px 40px
            rgba(24,45,32,.13);
          animation: profilePopupIn .14s ease-out;
        }

        @keyframes profilePopupIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-popup-head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 1px 0 3px;
        }

        .profile-popup-avatar {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--green-600);
          color: #ffffff;
          font-family: "Poppins", sans-serif;
          font-size: 17px;
          font-weight: 600;
        }

        .profile-popup-name {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .profile-popup-name strong {
          color: #26382d;
          font-family: "Poppins", sans-serif;
          font-size: 13px;
          font-weight: 600;
        }

        .profile-popup-name span {
          color: #7b8980;
          font-family: "Poppins", sans-serif;
          font-size: 9px;
          font-weight: 600;
        }

        .profile-divider {
          width: 100%;
          height: 1px;
          margin: 11px 0;
          background: #e7ece8;
        }

        .profile-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 11px;
        }

        .profile-detail:last-of-type {
          margin-bottom: 0;
        }

        .profile-detail > span {
          color: #89948d;
          font-family: "Poppins", sans-serif;
          font-size: 9px;
          font-weight: 500;
        }

        .profile-detail > strong {
          color: #26382d;
          font-family: "Poppins", sans-serif;
          font-size: 11px;
          font-weight: 600;
        }

        .role-badge {
          width: fit-content;
          padding: 4px 8px;
          border-radius: 6px;
          background: #e7f6eb;
          color: var(--green-700) !important;
          font-family: "Poppins", sans-serif;
          font-size: 9px !important;
          font-weight: 600 !important;
        }

        .popup-logout {
          width: 100%;
          min-height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #f0d2d2;
          border-radius: 10px;
          background: #fff8f8;
          color: #b42e2e;
          font-family: "Poppins", sans-serif;
          font-size: 11px;
          font-weight: 600;
          transition:
            background .16s ease,
            border-color .16s ease;
        }

        .popup-logout:hover {
          background: #fff0f0;
          border-color: #ebc2c2;
        }

        .popup-logout:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .logout-icon {
          font-size: 14px;
          font-weight: 600;
        }

        .nav-logout {
          min-height: 42px;
          border: 1px solid #d9e3dc;
          border-radius: 10px;
          padding: 10px 15px;
          background: #ffffff;
          color: #304037;
          font-family: "Poppins", sans-serif;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          transition:
            background .16s ease,
            color .16s ease,
            border-color .16s ease;
        }

        .nav-logout:hover {
          background: #f7faf8;
          color: var(--green-800);
          border-color: #cbd8cf;
        }

        .nav-logout:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .main {
          width: min(1180px,calc(100% - 36px));
          margin: 0 auto;
          padding: 28px 0 50px;
        }

        .hero {
          position: relative;
          min-height: 260px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 45px clamp(30px,6vw,64px);
          border-radius: 26px;
          background:
            linear-gradient(
              135deg,
              #0b6e36 0%,
              #079447 52%,
              #16a957 100%
            );
          box-shadow:
            0 18px 50px
            rgba(10,100,49,.18);
        }

        .hero::before {
          content: "";
          position: absolute;
          width: 330px;
          height: 330px;
          right: -120px;
          top: -140px;
          border-radius: 50%;
          background: rgba(255,255,255,.08);
        }

        .hero::after {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          right: 8%;
          bottom: -150px;
          border-radius: 50%;
          background: rgba(255,255,255,.06);
        }

        .hero-decoration {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,.08);
        }

        .hero-decoration-one {
          width: 70px;
          height: 70px;
          right: 28%;
          top: 30px;
        }

        .hero-decoration-two {
          width: 28px;
          height: 28px;
          right: 15%;
          bottom: 46px;
        }

        .hero-content-left {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          color: #e9fff1;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .hero .title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px,6vw,64px);
          line-height: 1;
          font-weight: 800;
          letter-spacing: -.045em;
        }

        .hero-subtitle {
          margin: 14px 0 0;
          color: rgba(255,255,255,.85);
          font-size: 15px;
          font-weight: 500;
        }

        .notice,
        .error {
          margin-top: 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 13px;
          font-size: 13px;
          line-height: 1.5;
        }

        .notice {
          background: #eefaf2;
          border: 1px solid #cfe9d7;
          color: #166b39;
        }

        .notice-icon {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #d5f1df;
          font-weight: 800;
        }

        .error {
          background: var(--danger-bg);
          border: 1px solid #f1caca;
          color: var(--danger-text);
        }

        .error-icon {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #ffdcdc;
          font-weight: 800;
        }

        .card {
          margin-top: 18px;
          padding: clamp(22px,4vw,34px);
          border: 1px solid #e0e8e2;
          border-radius: 22px;
          background: rgba(255,255,255,.95);
          box-shadow: var(--shadow);
        }

        .form-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          color: var(--green-800);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .section-line {
          width: 34px;
          height: 3px;
          border-radius: 999px;
          background: var(--green-700);
        }

        .formgrid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 19px;
        }

        .field {
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: #34443a;
          font-size: 12px;
          font-weight: 700;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 11px;
          outline: none;
          background: #ffffff;
          color: var(--text);
          padding: 11px 13px;
          font-size: 13px;
          transition:
            border-color .16s ease,
            box-shadow .16s ease;
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(7,148,71,.65);
          box-shadow:
            0 0 0 3px
            rgba(7,148,71,.09);
        }

        .selectrow {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .selectrow > :first-child {
          flex: 1 1 auto;
          min-width: 0;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 10px 15px;
          border: 0;
          border-radius: 10px;
          background: var(--green-700);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition:
            transform .16s ease,
            background .16s ease,
            box-shadow .16s ease;
        }

        .btn:hover {
          background: var(--green-800);
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: .6;
          cursor: not-allowed;
          transform: none;
        }

        .btn.secondary {
          background: #f0f5f1;
          color: #35513f;
          border: 1px solid #dce6df;
        }

        .btn.secondary:hover {
          background: #e6eee8;
        }

        .btn.danger {
          background: #fff1f1;
          color: #b13333;
          border: 1px solid #f0d0d0;
        }

        .btn.danger:hover {
          background: #ffe7e7;
        }

        .btn.small {
          min-height: 36px;
          padding: 8px 11px;
          font-size: 11px;
        }

        .inlinebox {
          margin-top: 10px;
          padding: 12px;
          border-radius: 13px;
          background: #f7faf8;
          border: 1px dashed #cbd9cf;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .inlinebox .actions {
          margin-top: 10px;
        }

        .location-count {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border-radius: 10px;
          background: #f3f8f4;
          color: #52665a;
          font-size: 12px;
        }

        .location-dot {
          color: var(--green-600);
        }

        /* =====================================================
           HASIL INSPEKSI
        ===================================================== */

        .inspection-result {
          padding: 14px;
          border: 1px solid #e1e9e3;
          border-radius: 16px;
          background: #fbfdfb;
        }

        .inspection-result-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .inspection-options {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 10px;
        }

        .inspection-option {
          position: relative;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border: 1px solid #dce6df;
          border-radius: 13px;
          background: #ffffff;
          cursor: pointer;
          transition:
            border-color .16s ease,
            background .16s ease,
            box-shadow .16s ease;
        }

        .inspection-option:hover {
          border-color: #b9cfbf;
        }

        .inspection-option.selected {
          border-color: #9ac9a8;
          background: #f5fbf7;
          box-shadow:
            0 5px 16px
            rgba(18,90,43,.06);
        }

        .inspection-option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .inspection-radio {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #cbd8cf;
          border-radius: 50%;
          background: #ffffff;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
        }

        .inspection-option.selected .inspection-radio {
          border-color: var(--green-700);
          background: var(--green-700);
        }

        .inspection-option-text {
          min-width: 0;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
        }

        .inspection-option-text strong {
          color: var(--green-800);
          font-size: 12px;
        }

        .inspection-option-text small {
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 10px;
          line-height: 1.4;
        }

        .inspection-status {
          flex: 0 0 auto;
          padding: 5px 8px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .inspection-status.selesai {
          background: #e7f6eb;
          color: var(--green-700);
        }

        .inspection-status.temuan {
          background: #fff4df;
          color: #a66a11;
        }

        /* =====================================================
           FOTO BUKTI INSPEKSI
        ===================================================== */

        .inspection-proof {
          padding: 14px;
          border: 1px solid #dce7df;
          border-radius: 16px;
          background: #f8fcf9;
        }

        .inspection-proof-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        /* =====================================================
           TEMUAN
        ===================================================== */

        .temuan-workspace {
          display: block;
          width: 100%;
        }

        .temuan-selector-panel {
          min-width: 0;
          padding: 14px;
          border: 1px solid #e1e9e3;
          border-radius: 16px;
          background: #fbfdfb;
        }

        .temuan-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .temuan-count {
          flex: 0 0 auto;
          padding: 7px 10px;
          border-radius: 999px;
          background: #eaf6ee;
          color: var(--green-700);
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .grup-checklist {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .grup-item {
          min-width: 0;
          padding: 10px;
          border: 1px solid #dce6df;
          border-radius: 14px;
          background: #ffffff;
          transition:
            border-color .16s ease,
            background .16s ease,
            box-shadow .16s ease;
        }

        .grup-item.checked {
          border-color: #9ac9a8;
          background: #f8fcf9;
          box-shadow:
            0 5px 16px
            rgba(18,90,43,.06);
        }

        .grup-check {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 7px 5px;
          cursor: pointer;
        }

        .grup-check input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .checkmark {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #cbd8cf;
          border-radius: 7px;
          background: #ffffff;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          transition:
            background .16s ease,
            border-color .16s ease;
        }

        .grup-item.checked .checkmark {
          border-color: var(--green-700);
          background: var(--green-700);
        }

        .grup-check-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .grup-check-text strong {
          color: var(--green-800);
          font-size: 12px;
          line-height: 1.35;
        }

        .grup-check-text small {
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .grup-empty {
          padding: 18px;
          border: 1px dashed #cbd8cf;
          border-radius: 13px;
          background: #f8faf8;
          color: var(--text-muted);
          text-align: center;
          font-size: 12px;
        }

        .temuan-card {
          margin-top: 8px;
          overflow: hidden;
          border: 1px solid #dce7df;
          border-radius: 13px;
          background: #ffffff;
          box-shadow: var(--shadow-sm);
        }

        .temuan-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5ece6;
          background: #f7faf8;
        }

        .temuan-number {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #e2f2e7;
          color: var(--green-700);
          font-size: 11px;
          font-weight: 800;
        }

        .temuan-card-title > div:nth-child(2) {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1 1 auto;
        }

        .temuan-card-title strong {
          color: var(--green-800);
          font-size: 13px;
        }

        .temuan-card-title span {
          margin-top: 2px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .temuan-card-body {
          display: grid;
          grid-template-columns:
            minmax(0,1.15fr)
            minmax(300px,.85fr);
          gap: 14px;
          padding: 12px;
        }

        .temuan-description,
        .temuan-photo {
          min-width: 0;
        }

        .temuan-photo-box {
          min-height: 100%;
        }

        .temuan-photo-box .photoactions {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
        }

        /* =====================================================
           STATUS OPEN / CLOSE
        ===================================================== */

        .temuan-status-box {
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid #e4ebe6;
        }

        .temuan-status-box > label {
          display: block;
          margin-bottom: 7px;
          color: #34443a;
          font-size: 12px;
          font-weight: 700;
        }

        .status-options {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
        }

        .status-option {
          position: relative;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px;
          border: 1px solid #dce5de;
          border-radius: 10px;
          background: #ffffff;
          cursor: pointer;
          transition:
            border-color .16s ease,
            background .16s ease;
        }

        .status-option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .status-option.selected.open {
          border-color: #d7b76b;
          background: #fffaf0;
        }

        .status-option.selected.close {
          border-color: #9ac9a8;
          background: #f4fbf6;
        }

        .status-radio {
          width: 20px;
          height: 20px;
          flex: 0 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #cbd8cf;
          border-radius: 50%;
          background: #ffffff;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
        }

        .status-option.selected.open .status-radio {
          border-color: #a66a11;
          background: #a66a11;
        }

        .status-option.selected.close .status-radio {
          border-color: var(--green-700);
          background: var(--green-700);
        }

        .status-option > span:last-child {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .status-option strong {
          font-size: 11px;
        }

        .status-option.open strong {
          color: #a66a11;
        }

        .status-option.close strong {
          color: var(--green-700);
        }

        .status-option small {
          margin-top: 2px;
          color: var(--text-muted);
          font-size: 9px;
        }

        .gps-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gps-status {
          margin-top: 5px;
          line-height: 1.4;
        }

        .mapbox {
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid #dce5de;
          background: #f8faf8;
        }

        .map-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 15px;
          background: #f7faf8;
          border-bottom: 1px solid #e1e8e3;
        }

        .coordinate-box strong {
          display: block;
          margin-top: 3px;
          color: var(--green-800);
          font-size: 13px;
        }

        .mapframe {
          display: block;
          width: 100%;
          min-height: 380px;
          border: 0;
        }

        .gps-empty {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 30px 22px;
          border-radius: 14px;
          border: 1px dashed #cbd8cf;
          background: #f8faf8;
        }

        .gps-empty-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #e8f5eb;
          color: var(--green-700);
          font-size: 11px;
          font-weight: 800;
        }

        .gps-empty strong {
          color: var(--green-800);
        }

        .gps-empty p {
          margin: 4px 0 0;
          color: #78867d;
          font-size: 12px;
          line-height: 1.5;
        }

        .gps-empty .btn {
          margin-left: auto;
          white-space: nowrap;
        }

        .required-mark {
          margin-left: 4px;
          color: #cf3f3f;
        }

        .photo-box {
          padding: 14px;
          border-radius: 14px;
          background: #f8faf8;
          border: 1px dashed #cbd8cf;
        }

        .photoactions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .photo-help {
          margin-top: 9px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .fotopreview {
          margin-top: 12px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .fotopreview img {
          width: 260px;
          max-width: 60%;
          max-height: 320px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #dce5de;
        }

        .submit-area {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid #e5ece6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .submit-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .submit-check {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8f5eb;
          color: var(--green-700);
          font-weight: 800;
        }

        .submit-info strong,
        .submit-info span {
          display: block;
        }

        .submit-info strong {
          color: var(--green-800);
          font-size: 12px;
        }

        .submit-info span {
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .submit-btn {
          min-width: 150px;
        }

        .submit-btn:hover {
          background: var(--green-800);
        }

        .navigation-card {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,.82);
          border: 1px solid #dfe7e1;
          box-shadow: var(--shadow-sm);
        }

        .navigation-links {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .muted {
          color: var(--text-muted);
        }

        .small {
          font-size: 11px;
        }

        @media (max-width: 1100px) {

          .profile-button {
            min-width: 132px;
          }

          .nav-page {
            padding-left: 10px;
            padding-right: 10px;
          }

          .nav-page.active {
            min-width: 104px;
          }

          .nav-logout {
            padding-left: 12px;
            padding-right: 12px;
          }

        }

        @media (max-width: 900px) {

          .temuan-card-body {
            grid-template-columns:
              minmax(0,1fr);
          }

          .gps-actions {
            justify-content: stretch;
          }

          .gps-actions .btn {
            flex: 1 1 180px;
          }

          .shell {
            padding-top: 74px;
          }

          .topbar {
            padding: 8px 20px;
          }

          .main {
            padding: 20px 16px 40px;
          }

          .hero {
            min-height: 230px;
            padding: 38px 36px;
          }

          .hero .title {
            font-size:
              clamp(38px,7vw,54px);
          }

        }
/* CSS desktop yang sudah ada */

.mobile-menu-wrapper,
.mobile-menu-button {
  display: none !important;
}

@media (max-width: 768px) {

  /* CSS HP kamu */
        @media (max-width: 768px) {

          html,
          body {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .shell {
            width: 100%;
            min-width: 0;
            padding-top: 62px !important;
          }

          .topbar {
            min-height: 62px !important;
            padding: 7px 12px !important;
            gap: 10px !important;
          }

          .brand {
            flex: 0 0 auto !important;
            gap: 0 !important;
          }

          .logo {
            width: 82px !important;
            height: 40px !important;
            flex: 0 0 82px !important;
          }

          .logo img {
            width: 100% !important;
            max-width: 82px !important;
          }

          .brand-text {
            display: none !important;
          }

         .nav {
  position: fixed !important;
  top: 62px !important;
  left: 10px !important;
  right: 10px !important;

  display: none !important;
  flex-direction: column !important;

  width: auto !important;
  max-width: none !important;
  min-width: 0 !important;

  align-items: stretch !important;
  gap: 5px !important;

  padding: 10px !important;

  background: #ffffff !important;
  border: 1px solid #dfe7e1 !important;
  border-radius: 14px !important;

  box-shadow:
    0 12px 30px rgba(24, 45, 32, 0.14) !important;

  overflow: visible !important;
  z-index: 1200 !important;
}

.nav.mobile-nav-open {
  display: flex !important;
}

.mobile-menu-wrapper {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;
}

.mobile-menu-button {
  width: 42px !important;
  height: 42px !important;

  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;

  gap: 5px !important;

  padding: 0 !important;
  margin: 0 !important;

  border: 1px solid #dfe7e1 !important;
  border-radius: 10px !important;

  background: #ffffff !important;
}

.mobile-menu-button span {
  display: block !important;

  width: 20px !important;
  height: 2px !important;

  background: #087f3f !important;
  border-radius: 999px !important;
}

.mobile-menu-button-open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg) !important;
}

.mobile-menu-button-open span:nth-child(2) {
  opacity: 0 !important;
}

.mobile-menu-button-open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg) !important;
}

.nav .profile-wrapper,
.nav .nav-logout {
  display: none !important;
}

.nav .nav-page {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 42px !important;

  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;

  padding: 10px 12px !important;

  border-radius: 9px !important;

  white-space: nowrap !important;
}

.nav .nav-page.active {
  min-width: 0 !important;
}

          .nav::-webkit-scrollbar {
            display: none;
          }

          .nav-page,
          .nav-logout {
            flex: 0 0 auto !important;
            padding: 7px 8px !important;
            font-family: "Poppins", sans-serif !important;
            font-size: 9px !important;
            font-weight: 600 !important;
            border-radius: 8px !important;
          }

          .nav-page.active {
            min-width: auto !important;
          }

          .profile-wrapper {
            flex: 0 0 auto !important;
          }

          .profile-button {
            min-width: 84px !important;
            width: 84px !important;
            height: 36px !important;
            padding: 3px 6px 3px 4px !important;
            gap: 5px !important;
            border-radius: 9px !important;
          }

          .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            flex-basis: 28px !important;
            font-size: 11px !important;
          }

          .profile-info strong {
            font-size: 8px !important;
          }

          .profile-info small {
            margin-top: 2px !important;
            font-size: 6px !important;
          }

          .profile-chevron {
            font-size: 6px !important;
          }

          .profile-popup {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(298px,calc(100vw - 20px)) !important;
          }

          .nav-logout {
            min-height: 36px !important;
            padding: 7px 9px !important;
          }

          .main {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10px 12px 32px !important;
          }

          .hero {
            min-height: 170px !important;
            padding: 24px 20px !important;
            border-radius: 18px !important;
          }

          .hero::before {
            width: 190px;
            height: 190px;
            right: -90px;
            top: -85px;
          }

          .hero::after {
            width: 130px;
            height: 130px;
            right: 25px;
            bottom: -95px;
          }

          .hero-decoration-one {
            display: none;
          }

          .hero-decoration-two {
            right: 26px;
            bottom: 22px;
          }

          .hero .eyebrow {
            margin-bottom: 8px !important;
            padding: 5px 9px !important;
            font-size: 8px !important;
          }

          .hero .title {
            font-size:
              clamp(27px,8vw,36px) !important;
            line-height: 1.08 !important;
          }

          .hero-subtitle {
            margin-top: 8px !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }

          .notice,
          .error {
            margin-top: 10px !important;
            padding: 9px 11px !important;
            border-radius: 10px !important;
            font-size: 11px !important;
          }

          .card {
            width: 100% !important;
            max-width: 100% !important;
            margin-top: 10px !important;
            padding: 16px !important;
            border-radius: 16px !important;
          }

          .form-section-title {
            margin-bottom: 15px !important;
            font-size: 10px !important;
          }

          .formgrid {
            grid-template-columns:
              minmax(0,1fr) !important;
            gap: 12px !important;
          }

          .field,
          .field.full,
          .search-select-wrapper {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            grid-column: 1 / -1 !important;
          }

          .field label,
          .search-select-label {
            margin-bottom: 6px !important;
            font-size: 12px !important;
          }

          input,
          select,
          textarea {
            min-width: 0 !important;
            max-width: 100% !important;
            padding: 10px 12px !important;
            font-size: 12px !important;
          }

          textarea {
            min-height: 105px !important;
          }

          .selectrow {
            width: 100% !important;
            display: grid !important;
            grid-template-columns:
              minmax(0,1fr)
              minmax(0,1fr) !important;
            align-items: stretch !important;
            gap: 7px !important;
          }

          .selectrow > * {
            min-width: 0 !important;
            max-width: 100% !important;
          }

          .selectrow > :first-child {
            width: 100% !important;
            grid-column: 1 / -1 !important;
          }

          .selectrow .btn {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 40px !important;
            padding: 9px 8px !important;
            font-size: 11px !important;
            white-space: nowrap !important;
          }

          .inlinebox {
            width: 100% !important;
          }

          .inlinebox .actions {
            display: grid !important;
            grid-template-columns:
              repeat(2,minmax(0,1fr)) !important;
            gap: 7px !important;
          }

          .inlinebox .actions .btn {
            width: 100% !important;
          }

          .location-count {
            padding: 9px 11px !important;
            font-size: 11px !important;
          }

         .inspection-options {
  display: flex !important;
  flex-direction: row !important;
  gap: 10px !important;
  width: 100% !important;
}

.inspection-option {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  align-items: flex-start !important;
}

          .inspection-status {
            margin-left: auto;
          }

          .inspection-proof-head {
            align-items: flex-start !important;
          }

          .temuan-head {
            align-items: stretch !important;
            flex-direction: column !important;
            gap: 7px !important;
          }

          .temuan-count {
            align-self: flex-start !important;
          }

          .temuan-card-title {
            align-items: flex-start !important;
          }

          .temuan-card-title .btn {
            margin-left: auto !important;
          }

          .temuan-card-body {
            grid-template-columns:
              minmax(0,1fr) !important;
            padding: 11px !important;
            gap: 11px !important;
          }

          .status-options {
            grid-template-columns:
              minmax(0,1fr) !important;
          }
          
        .map-info {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
}

         .gps-actions {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0,1fr)) !important;
  width: 100% !important;
  gap: 7px !important;
}

.gps-actions .btn {
  width: 100% !important;
}

          .photoactions {
            display: grid !important;
            grid-template-columns:
              repeat(2,minmax(0,1fr)) !important;
            gap: 7px !important;
          }

          .photoactions .btn {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 40px !important;
            padding: 9px 6px !important;
            font-size: 10px !important;
            white-space: nowrap !important;
          }

          .fotopreview {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }

          .fotopreview img,
          .fotopreview .btn {
            width: 100% !important;
            max-width: 100% !important;
          }

          .fotopreview img {
            max-height: 280px !important;
          }

          .submit-area {
            margin-top: 18px !important;
            padding-top: 15px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }

          .submit-btn {
            width: 100% !important;
          }

          .navigation-card {
            width: 100% !important;
            margin-top: 10px !important;
            padding: 8px !important;
            display: grid !important;
            grid-template-columns:
              repeat(2,minmax(0,1fr)) !important;
            gap: 7px !important;
          }

          .navigation-card > .btn,
          .navigation-links .btn {
            width: 100% !important;
            min-width: 0 !important;
            padding: 9px 6px !important;
            font-size: 10px !important;
          }

          .navigation-links {
            display: contents !important;
          }

          .navigation-links .btn:last-child {
            grid-column: 1 / -1 !important;
          }

          input,
          select,
          textarea,
          button {
            max-width: 100% !important;
          }

        }

        @media (max-width: 480px) {

          .shell {
            padding-top: 58px !important;
          }

          .topbar {
            min-height: 58px !important;
            padding: 6px 9px !important;
          }

          .logo {
            width: 76px !important;
            height: 37px !important;
            flex-basis: 76px !important;
          }

          .logo img {
            max-width: 76px !important;
          }

          .nav-page,
          .nav-logout {
            padding: 6px 7px !important;
            font-family: "Poppins", sans-serif !important;
            font-size: 8px !important;
            font-weight: 600 !important;
          }

          .profile-button {
            min-width: 78px !important;
            width: 78px !important;
          }

          .profile-popup {
            top: 57px !important;
          }

          .main {
            padding: 8px 10px 28px !important;
          }

          .card {
            padding: 14px !important;
          }

          .formgrid {
            gap: 11px !important;
          }

          .selectrow {
            gap: 6px !important;
          }

        }

        @media (max-width: 390px) {

          .logo {
            width: 70px !important;
            height: 34px !important;
            flex-basis: 70px !important;
          }

          .logo img {
            max-width: 70px !important;
          }

          .nav-page,
          .nav-logout {
            padding: 6px 5px !important;
            font-family: "Poppins", sans-serif !important;
            font-size: 8px !important;
            font-weight: 600 !important;
          }

          .profile-button {
            min-width: 73px !important;
            width: 73px !important;
            padding-right: 4px !important;
          }

          .profile-avatar {
            width: 26px !important;
            height: 26px !important;
            flex-basis: 26px !important;
          }

          .profile-info strong {
            font-size: 7px !important;
          }

          .profile-info small {
            font-size: 5px !important;
          }

          .card {
            padding: 12px !important;
          }

        }

      `}</style>

    </main>
  );
}