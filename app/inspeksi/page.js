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

  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoDataUrl, setFotoDataUrl] = useState("");
  const [fotoError, setFotoError] = useState("");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [showAktivitasTambah, setShowAktivitasTambah] =
    useState(false);

  const [aktivitasBaru, setAktivitasBaru] = useState({
    nama_aktivitas: "",
  });

  const [savingAktivitas, setSavingAktivitas] =
    useState(false);

  const [deletingAktivitas, setDeletingAktivitas] =
    useState(false);

  const [taskQuiz, setTaskQuiz] = useState([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingAwal, setLoadingAwal] = useState(false);

  const [loadingWilayahData, setLoadingWilayahData] =
    useState(false);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;

    const yakin = window.confirm(
      "Apakah Anda yakin ingin keluar dari akun?"
    );

    if (!yakin) return;

    try {
      setLoggingOut(true);

      /*
       * Logout ke server.
       *
       * Pastikan endpoint:
       * /api/auth/logout
       *
       * menghapus cookie/session login.
       */
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /*
       * Walaupun request logout gagal,
       * user tetap diarahkan ke login.
       */
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

  /* =====================================================
     POPUP PERBAIKAN
  ===================================================== */

  const [showMaintenancePopup, setShowMaintenancePopup] =
    useState(false);

  const [maintenancePage, setMaintenancePage] =
    useState("");

  function bukaPopupPerbaikan(page) {
    setMaintenancePage(page);
    setShowMaintenancePopup(true);
  }

  function tutupPopupPerbaikan() {
    setShowMaintenancePopup(false);
    setMaintenancePage("");
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
      throw new Error(
        d.error || `Gagal memuat ${url}`
      );
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

      setF((old) => ({
        ...old,
        ...draft,
      }));
    } catch {}
  }, []);

  /* =====================================================
     SAVE DRAFT
  ===================================================== */

  useEffect(() => {
    try {
      const draft = {
        ...f,
      };

      delete draft.latitude;
      delete draft.longitude;

      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(draft)
      );
    } catch {}
  }, [f]);

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
          latitude:
            p.coords.latitude.toFixed(7),
          longitude:
            p.coords.longitude.toFixed(7),
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
          latitude:
            p.coords.latitude.toFixed(7),
          longitude:
            p.coords.longitude.toFixed(7),
        }));
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
     FOTO
  ===================================================== */

  async function onPilihFoto(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setFotoError("");

    try {
      const dataUrl =
        await fotoKeDataUrl(file);

      setFotoDataUrl(dataUrl);
      setFotoPreview(dataUrl);
    } catch (err) {
      setFotoError(err.message);
    }
  }

  function hapusFotoDipilih() {
    setFotoDataUrl("");
    setFotoPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  /* =====================================================
     TASK
  ===================================================== */

  function tambahTask() {
    setTaskQuiz((x) => [
      ...x,
      {
        task: "",
        jawaban: "",
        status: "Belum",
      },
    ]);
  }

  function updateTask(i, key, value) {
    setTaskQuiz((x) =>
      x.map((t, idx) =>
        idx === i
          ? {
              ...t,
              [key]: value,
            }
          : t
      )
    );
  }

  function hapusTask(i) {
    setTaskQuiz((x) =>
      x.filter(
        (_, idx) => idx !== i
      )
    );
  }

  /* =====================================================
     TAMBAH AKTIVITAS
  ===================================================== */

  async function tambahAktivitas() {
    const nama =
      aktivitasBaru.nama_aktivitas.trim();

    if (!nama) {
      setErr(
        "Nama aktivitas wajib diisi."
      );

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
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            nama_aktivitas: nama,
          }),
        }
      );

      const d = await r.json();

      if (!r.ok) {
        throw new Error(
          d.error ||
          "Gagal menambah aktivitas"
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
        id_aktivitas:
          d.id_aktivitas,
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
        d = text
          ? JSON.parse(text)
          : {};
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
    setFotoError("");

    if (!fotoDataUrl) {
      setFotoError(
        "Foto bukti temuan wajib diunggah."
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
            task_quiz: taskQuiz,
            foto_base64:
              fotoDataUrl,
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
          "Gagal menyimpan temuan"
        );
      }

      setMsg(
        `Temuan berhasil disimpan dengan status OPEN. Batas waktu tindak lanjut (7 hari): ${new Date(
          new Date(
            f.tanggal_temuan
          ).getTime() +
            7 * 86400000
        )
          .toISOString()
          .slice(0, 10)}.`
      );

      try {
        localStorage.removeItem(
          DRAFT_KEY
        );
      } catch {}

      setF((x) => ({
        ...x,
        id_lokasi: "",
        deskripsi: "",
        latitude: "",
        longitude: "",
      }));

      hapusFotoDipilih();

      setTaskQuiz([]);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">

      {/* =====================================================
          HEADER
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
              Form Inspeksi K3
            </b>

            <span>
              Estate PG 01
            </span>

          </div>

        </div>

        <nav
          className="nav"
          aria-label="Navigasi utama"
        >

          <Link
            href="/inspeksi"
            className="active"
          >
            Form Inspeksi
          </Link>

          <button
            type="button"
            className="nav-maintenance"
            onClick={() =>
              bukaPopupPerbaikan("Dashboard")
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            className="nav-maintenance"
            onClick={() =>
              bukaPopupPerbaikan("Data Temuan")
            }
          >
            Data Temuan
          </button>

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

      </header>


      <div className="main">

        {/* =====================================================
            HERO
        ===================================================== */}

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


        {/* =====================================================
            MESSAGE
        ===================================================== */}

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


        {/* =====================================================
            FORM
        ===================================================== */}

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

            {/* TANGGAL */}

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


            {/* MANDOR */}

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


            {/* WILAYAH */}

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
                  : "Cari wilayah 1-7..."
              }
            />


            {/* LOKASI */}

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


            {/* JUMLAH LOKASI */}

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


            {/* AKTIVITAS */}

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


            {/* GRUP TEMUAN */}

            <SearchSelect
              label="Grup Temuan"
              value={
                f.id_grup
              }
              onChange={(x) =>
                set(
                  "id_grup",
                  x
                )
              }
              options={
                master.grup
              }
              valueKey="id_grup"
              labelKey="nama_grup"
              placeholder="Cari grup temuan..."
            />


            {/* TASK */}

            <div className="field full">

              <div className="taskhead">

                <div>

                  <label>
                    Task
                  </label>

                  <div className="muted small">
                    Tambahkan task jika
                    diperlukan untuk
                    pemeriksaan temuan.
                  </div>

                </div>

                <button
                  type="button"
                  className="btn secondary small"
                  onClick={
                    tambahTask
                  }
                >
                  ＋ Tambah Task
                </button>

              </div>


              {taskQuiz.map(
                (t, i) => (

                  <div
                    className="taskrow"
                    key={i}
                  >

                    <input
                      value={t.task}
                      onChange={(e) =>
                        updateTask(
                          i,
                          "task",
                          e.target.value
                        )
                      }
                      placeholder="Task yang perlu dilakukan"
                    />

                    <input
                      value={t.jawaban}
                      onChange={(e) =>
                        updateTask(
                          i,
                          "jawaban",
                          e.target.value
                        )
                      }
                      placeholder="Jawaban / Catatan"
                    />

                    <select
                      value={
                        t.status
                      }
                      onChange={(e) =>
                        updateTask(
                          i,
                          "status",
                          e.target.value
                        )
                      }
                    >

                      <option>
                        Belum
                      </option>

                      <option>
                        Proses
                      </option>

                      <option>
                        Selesai
                      </option>

                    </select>

                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() =>
                        hapusTask(i)
                      }
                    >
                      Hapus
                    </button>

                  </div>

                )
              )}

            </div>


            {/* DESKRIPSI */}

            <div className="field full">

              <label>
                Deskripsi Temuan
              </label>

              <textarea
                rows="5"
                value={
                  f.deskripsi
                }
                onChange={(e) =>
                  set(
                    "deskripsi",
                    e.target.value
                  )
                }
                placeholder="Jelaskan kondisi/temuan K3..."
                required
              />

            </div>


            {/* GPS */}

            <div className="field">

              <label>
                Latitude
              </label>

              <input
                value={
                  f.latitude
                }
                readOnly
                placeholder="-6.xxxxx"
              />

            </div>


            <div className="field">

              <label>
                Longitude
              </label>

              <input
                value={
                  f.longitude
                }
                readOnly
                placeholder="106.xxxxx"
              />

            </div>


            {/* MAPS */}

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
                        Koordinat GPS
                      </div>

                      <strong>
                        {f.latitude},{" "}
                        {f.longitude}
                      </strong>

                    </div>

                    <button
                      type="button"
                      className="btn"
                      onClick={gps}
                    >
                      Ambil Lokasi Saya
                    </button>

                  </div>

                  <iframe
                    title="Preview lokasi inspeksi"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${f.latitude},${f.longitude}`
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
                      Peta akan tampil otomatis
                      setelah koordinat tersedia.
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


            {/* FOTO */}

            <div className="field full">

              <label>
                Foto Bukti Temuan
                <span className="required-mark">
                  *
                </span>
              </label>

              <div className="photo-box">

                <div className="photoactions">

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    Pilih Foto
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                  >
                    Kamera
                  </button>

                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={
                      onPilihFoto
                    }
                  />

                  <input
                    ref={cameraInputRef}
                    hidden
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={
                      onPilihFoto
                    }
                  />

                </div>

                <div className="photo-help">
                  Upload foto kondisi temuan sebagai bukti inspeksi.
                </div>

              </div>

              {fotoError && (
                <div className="error small">
                  {fotoError}
                </div>
              )}

              {fotoPreview && (

                <div className="fotopreview">

                  <img
                    src={fotoPreview}
                    alt="Pratinjau foto temuan"
                  />

                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={
                      hapusFotoDipilih
                    }
                  >
                    Hapus Foto
                  </button>

                </div>

              )}

            </div>

          </div>


          {/* =====================================================
              SUBMIT
          ===================================================== */}

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
                  Foto bukti temuan wajib tersedia sebelum disimpan.
                </span>

              </div>

            </div>

            <div className="actions submit-actions">

              <button
                className="btn submit-btn"
                type="submit"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? "Menyimpan..."
                  : "Simpan Temuan"}
              </button>

            </div>

          </div>

        </form>


        {/* =====================================================
            NAVIGASI BAWAH
        ===================================================== */}

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

            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                bukaPopupPerbaikan("Dashboard")
              }
            >
              Dashboard
            </button>

            <button
              type="button"
              className="btn"
              onClick={() =>
                bukaPopupPerbaikan("Data Temuan")
              }
            >
              Data Temuan →
            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          POPUP PERBAIKAN
      ===================================================== */}

      {showMaintenancePopup && (

        <div
          className="maintenance-overlay"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              tutupPopupPerbaikan();
            }

          }}
        >

          <div
            className="maintenance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-title"
          >

            <button
              type="button"
              className="maintenance-close"
              onClick={
                tutupPopupPerbaikan
              }
              aria-label="Tutup"
            >
              ×
            </button>

            <div className="maintenance-line" />

            <div className="maintenance-content">

              <span className="maintenance-label">
                PEMBERITAHUAN
              </span>

              <h2 id="maintenance-title">
                {maintenancePage}
              </h2>

              <p>
                Halaman ini sedang dalam
                proses perbaikan dan
                penyempurnaan.
              </p>

              <p className="maintenance-note">
                Silakan kembali menggunakan
                Form Inspeksi K3 untuk
                melakukan input data temuan.
              </p>

              <button
                type="button"
                className="btn maintenance-button"
                onClick={
                  tutupPopupPerbaikan
                }
              >
                Kembali ke Form
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          STYLE
      ===================================================== */}

      <style jsx global>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
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

          --shadow-sm:
            0 2px 8px rgba(20, 45, 29, .05);

          --shadow:
            0 12px 35px rgba(20, 45, 29, .08);

          --shadow-lg:
            0 20px 55px rgba(20, 45, 29, .12);
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
          font-family:
            'Inter',
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;

          color:
            var(--text);
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        .shell {
          min-height: 100vh;

          padding-top: 74px;

          background:
            linear-gradient(
              180deg,
              #f8faf8 0%,
              #f2f6f3 45%,
              #eef4f0 100%
            );

          color:
            var(--text);

          overflow-x: hidden;
        }

        .topbar {
          position: fixed !important;

          top: 0 !important;
          left: 0 !important;
          right: 0 !important;

          width: 100% !important;

          z-index: 99999 !important;

          display: flex;

          align-items: center;

          justify-content: space-between;

          min-height: 74px;

          padding:
            8px
            clamp(18px, 4vw, 64px);

          gap: 25px;

          background:
            rgba(255, 255, 255, .97);

          border-bottom:
            1px solid rgba(20, 55, 33, .08);

          box-shadow:
            0 3px 18px rgba(20, 45, 29, .08);

          backdrop-filter:
            blur(14px);

          -webkit-backdrop-filter:
            blur(14px);

          transform:
            translateZ(0);

          isolation:
            isolate;
        }

        .brand {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 12px;
          flex: 1;
        }

        .brand-logo-link {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo {
          width: 108px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: transparent;
        }

        .logo img {
          width: 100%;
          height: 100%;
          max-width: 108px;
          object-fit: contain;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .brand-text b {
          color: #142119;
          font-size: 15px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
        }

        .brand-text span {
          color: #87918a;
          font-size: 12px;
          line-height: 1.2;
          white-space: nowrap;
        }

        .nav {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end;
          gap: 5px !important;
          flex-shrink: 0 !important;
        }

        .nav a,
        .nav-maintenance,
        .nav-logout {
          position: relative;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          white-space: nowrap !important;

          text-decoration: none;

          color: #34453a;

          padding:
            10px
            14px;

          border-radius: 10px;

          font-size: 13px;

          font-weight: 700;

          transition:
            color .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        .nav-maintenance {
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .nav a:hover,
        .nav-maintenance:hover {
          color: var(--green-700);
          background: #f0f7f2;
          transform: translateY(-1px);
        }

        .nav a.active {
          color: var(--green-700);
          background: #edf7f0;
        }

        .nav a.active::after {
          content: "";

          position: absolute;

          left: 14px;
          right: 14px;
          bottom: 4px;

          height: 2px;

          border-radius: 999px;

          background:
            var(--green-600);
        }

        /* =====================================================
           LOGOUT
        ===================================================== */

        .nav-logout {
          border: 1px solid #d9e3dc;

          color: #a12d2d !important;

          background: #fff5f5;

          cursor: pointer;

          box-shadow: none;
        }

        .nav-logout:hover {
          color: #8f2222 !important;

          background: #ffe9e9;

          border-color: #efcccc;

          transform: translateY(-1px);
        }

        .nav-logout:disabled {
          cursor: not-allowed;

          opacity: .6;

          transform: none;
        }

        .main {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 24px 50px;
        }

        .hero {
          position: relative;

          display: flex !important;

          align-items: center !important;

          justify-content: flex-start !important;

          width: 100%;

          min-height: 260px;

          padding: 48px 54px;

          border-radius: 26px;

          overflow: hidden;

          background:
            linear-gradient(
              115deg,
              #dff2e5 0%,
              #edf8f0 48%,
              #f7faf7 100%
            );

          border:
            1px solid
            rgba(8, 120, 61, .08);

          box-shadow:
            var(--shadow);
        }

        .hero::before {
          content: "";

          position: absolute;

          width: 360px;
          height: 360px;

          right: -130px;
          top: -170px;

          border-radius: 50%;

          background:
            rgba(24, 169, 87, .12);
        }

        .hero::after {
          content: "";

          position: absolute;

          width: 230px;
          height: 230px;

          right: 100px;
          bottom: -170px;

          border-radius: 50%;

          background:
            rgba(8, 120, 61, .07);
        }

        .hero-decoration {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-decoration-one {
          width: 80px;
          height: 80px;
          right: 150px;
          top: 30px;
          border: 1px solid rgba(8, 120, 61, .12);
        }

        .hero-decoration-two {
          width: 18px;
          height: 18px;
          right: 270px;
          bottom: 48px;
          background: rgba(8, 120, 61, .15);
        }

        .hero-content-left {
          position: relative;
          width: 100%;
          max-width: 900px;
          text-align: left !important;
          z-index: 2;
        }

        .hero .eyebrow {
          display: inline-flex;
          align-items: center;

          padding: 7px 13px;

          margin-bottom: 14px;

          border-radius: 999px;

          background: rgba(255, 255, 255, .78);

          border: 1px solid rgba(8, 120, 61, .12);

          color: var(--green-700);

          font-size: 11px;

          font-weight: 800;

          letter-spacing: .09em;
        }

        .hero .title {
          margin: 0 !important;

          color: var(--green-900);

          text-align: left !important;

          white-space: normal !important;

          font-size:
            clamp(42px, 5vw, 64px);

          line-height: 1.02;

          font-weight: 800;

          letter-spacing: -.045em;
        }

        .hero-subtitle {
          margin: 14px 0 0 !important;

          color: #567060;

          font-size: 16px;

          line-height: 1.5;

          font-weight: 500;

          font-style: italic;
        }

        .notice,
        .error {
          width: 100%;

          display: flex;

          align-items: center;

          gap: 10px;

          margin-top: 18px;

          padding: 13px 16px;

          border-radius: 14px;

          font-size: 13px;

          line-height: 1.5;

          box-shadow: var(--shadow-sm);
        }

        .notice {
          background: #eef9f1;
          border: 1px solid #d8efdd;
          color: #167341;
        }

        .error {
          background: var(--danger-bg);
          border: 1px solid #f4d2d2;
          color: var(--danger-text);
        }

        .notice-icon,
        .error-icon {
          width: 24px;
          height: 24px;

          flex: 0 0 24px;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          font-weight: 800;
        }

        .notice-icon {
          background: #d6efdc;
          color: #167341;
        }

        .error-icon {
          background: #f8dada;
          color: #a52c2c;
        }

        .card {
          width: 100%;

          margin-top: 18px;

          padding: 30px;

          border-radius: 24px;

          background: rgba(255, 255, 255, .98);

          border: 1px solid var(--border);

          box-shadow: var(--shadow-lg);

          overflow: hidden;
        }

        .form-section-title {
          display: flex;

          align-items: center;

          gap: 10px;

          margin: 0 0 24px;

          color: var(--green-800);

          font-size: 13px;

          font-weight: 800;

          text-transform: uppercase;

          letter-spacing: .06em;
        }

        .section-line {
          width: 28px;
          height: 3px;

          border-radius: 999px;

          background:
            var(--green-600);
        }

        .formgrid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 20px;
        }

        .field {
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;

          margin-bottom: 8px;

          color: #33443a;

          font-size: 14px;

          font-weight: 700;
        }

        .required-mark {
          margin-left: 3px;
          color: #c52e2e;
        }

        input,
        select,
        textarea {
          width: 100%;

          max-width: 100%;

          border: 1px solid var(--border-dark);

          border-radius: 11px;

          padding: 12px 14px;

          background: #ffffff;

          color: #1e2a22;

          font-family: inherit;

          font-size: 14px;

          outline: none;

          transition:
            border-color .18s ease,
            box-shadow .18s ease,
            background .18s ease;
        }

        input::placeholder,
        textarea::placeholder {
          color: #a1aaa4;
        }

        input:hover,
        select:hover,
        textarea:hover {
          border-color: #b9c8bc;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: var(--green-600);

          background: #ffffff;

          box-shadow:
            0 0 0 3px
            rgba(8, 148, 71, .10);
        }

        input:read-only {
          background: #f7f9f7;
          color: #536158;
        }

        textarea {
          resize: vertical;
          min-height: 130px;
          line-height: 1.6;
        }

        .selectrow {
          display: flex;
          align-items: stretch;
          gap: 8px;
          min-width: 0;
        }

        .selectrow > * {
          min-width: 0;
        }

        .selectrow > :first-child {
          flex: 1;
        }

        .muted {
          color: var(--text-muted);
          opacity: 1;
        }

        .small {
          font-size: 12px;
        }

        .location-count {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #7a877f;
          font-size: 12px;
        }

        .location-dot {
          color: var(--green-600);
          font-size: 10px;
        }

        .btn {
          border: 0;

          border-radius: 10px;

          padding: 11px 16px;

          background: var(--green-700);

          color: #ffffff;

          font-family: inherit;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;

          text-decoration: none;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          white-space: nowrap;

          box-shadow:
            0 3px 8px
            rgba(8, 120, 61, .12);

          transition:
            transform .16s ease,
            box-shadow .16s ease,
            background .16s ease,
            opacity .16s ease;
        }

        .btn:hover {
          background: var(--green-800);

          transform: translateY(-1px);

          box-shadow:
            0 6px 14px
            rgba(8, 120, 61, .16);
        }

        .btn:active {
          transform:
            translateY(1px)
            scale(.985);
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: .55;
          transform: none;
          box-shadow: none;
        }

        .btn.small {
          padding: 9px 12px;
          font-size: 12px;
        }

        .secondary {
          background: #ffffff;

          color: #31513d;

          border: 1px solid #d8e3db;

          box-shadow: none;
        }

        .secondary:hover {
          background: #f1f7f3;

          color: var(--green-700);

          border-color: #c8d9cd;

          box-shadow: none;
        }

        .danger {
          background: #fff0f0;

          color: #a12d2d;

          border: 1px solid #f0d1d1;

          box-shadow: none;
        }

        .danger:hover {
          background: #ffe3e3;

          color: #8f2222;

          box-shadow: none;
        }

        .inlinebox {
          margin-top: 10px;

          padding: 14px;

          display: flex;

          flex-direction: column;

          gap: 10px;

          border-radius: 13px;

          background: #f7faf8;

          border: 1px solid #dce8df;
        }

        .actions {
          display: flex;

          align-items: center;

          gap: 9px;

          flex-wrap: wrap;
        }

        .taskhead {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 12px;
        }

        .taskrow {
          display: grid;

          grid-template-columns:
            1.5fr
            1fr
            150px
            auto;

          gap: 8px;

          margin-bottom: 8px;

          padding: 8px;

          border-radius: 12px;

          background: #f8faf8;

          border: 1px solid #e6ece7;
        }

        .mapbox {
          width: 100%;

          overflow: hidden;

          border-radius: 15px;

          border: 1px solid #d9e3dc;

          background: #f8faf8;
        }

        .map-info {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          padding: 14px 15px;

          flex-wrap: wrap;
        }

        .coordinate-box {
          min-width: 0;
        }

        .coordinate-box strong {
          display: block;

          margin-top: 3px;

          color: #244a32;

          font-size: 13px;
        }

        .mapframe {
          display: block;

          width: 100%;

          min-height: 360px;

          border: 0;

          background: #e9efea;
        }

        .gps-empty {
          padding: 32px 20px;

          border: 1px dashed #c8d7cc;

          border-radius: 14px;

          background: #f8fbf9;

          text-align: center;

          display: flex;

          flex-direction: column;

          align-items: center;

          gap: 9px;
        }

        .gps-empty-icon {
          width: 45px;

          height: 45px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #e6f4e9;

          color: var(--green-700);

          font-size: 10px;

          font-weight: 800;

          letter-spacing: .04em;
        }

        .gps-empty strong {
          display: block;

          color: #274331;

          font-size: 14px;
        }

        .gps-empty p {
          margin: 5px 0 10px;

          color: #839087;

          font-size: 12px;

          line-height: 1.5;
        }

        .photo-box {
          padding: 15px;

          border: 1px dashed #cbd8ce;

          border-radius: 14px;

          background: #f9fbf9;
        }

        .photoactions {
          display: flex;

          gap: 9px;

          flex-wrap: wrap;
        }

        .photo-help {
          margin-top: 9px;

          color: #8a958e;

          font-size: 11px;
        }

        .fotopreview {
          margin-top: 14px;

          display: flex;

          align-items: flex-start;

          gap: 12px;

          flex-wrap: wrap;
        }

        .fotopreview img {
          width: 220px;

          max-width: 100%;

          max-height: 300px;

          object-fit: cover;

          border-radius: 13px;

          border: 1px solid #d9e3dc;

          box-shadow: var(--shadow-sm);
        }

        .submit-area {
          margin-top: 26px;

          padding-top: 20px;

          border-top: 1px solid #e6ece7;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;
        }

        .submit-info {
          display: flex;

          align-items: center;

          gap: 10px;

          min-width: 0;
        }

        .submit-check {
          width: 32px;

          height: 32px;

          flex: 0 0 32px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #e7f5ea;

          color: var(--green-700);

          font-weight: 800;
        }

        .submit-info div {
          display: flex;

          flex-direction: column;

          gap: 2px;
        }

        .submit-info strong {
          color: #34463a;
          font-size: 12px;
        }

        .submit-info span:not(.submit-check) {
          color: #8b968f;

          font-size: 11px;

          line-height: 1.4;
        }

        .submit-actions {
          margin-top: 0;
        }

        .submit-btn {
          min-width: 190px;

          padding: 13px 22px;

          background: var(--green-700);

          box-shadow:
            0 8px 18px
            rgba(8, 120, 61, .18);
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

          background:
            rgba(255, 255, 255, .82);

          border: 1px solid #dfe7e1;

          box-shadow: var(--shadow-sm);
        }

        .navigation-links {
          display: flex;

          gap: 8px;

          flex-wrap: wrap;
        }

        .maintenance-overlay {
          position: fixed;

          inset: 0;

          z-index: 100000;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 20px;

          background:
            rgba(13, 38, 24, .42);

          backdrop-filter: blur(5px);

          -webkit-backdrop-filter: blur(5px);

          animation:
            maintenanceFade .16s ease;
        }

        .maintenance-modal {
          position: relative;

          width: 100%;

          max-width: 430px;

          padding: 0;

          overflow: hidden;

          border-radius: 18px;

          background: #ffffff;

          border: 1px solid #dce5de;

          box-shadow:
            0 24px 60px
            rgba(13, 38, 24, .18);

          animation:
            maintenanceUp .18s ease;
        }

        .maintenance-line {
          width: 100%;

          height: 4px;

          background:
            var(--green-700);
        }

        .maintenance-content {
          padding: 28px 28px 26px;
        }

        .maintenance-label {
          display: inline-block;

          margin-bottom: 10px;

          color: var(--green-700);

          font-size: 10px;

          font-weight: 800;

          letter-spacing: .08em;
        }

        .maintenance-modal h2 {
          margin: 0 0 10px;

          color: var(--green-900);

          font-size: 25px;

          line-height: 1.2;

          font-weight: 800;

          letter-spacing: -.025em;
        }

        .maintenance-modal p {
          margin: 0 0 12px;

          color: #65736a;

          font-size: 13px;

          line-height: 1.6;
        }

        .maintenance-note {
          margin-top: 14px !important;

          padding: 12px 14px;

          border-left: 3px solid #b9d8c1;

          background: #f6faf7;

          color: #526359 !important;
        }

        .maintenance-button {
          width: 100%;

          margin-top: 7px;
        }

        .maintenance-close {
          position: absolute;

          top: 14px;

          right: 14px;

          width: 32px;

          height: 32px;

          display: flex;

          align-items: center;

          justify-content: center;

          border: 0;

          border-radius: 50%;

          background: #f3f6f4;

          color: #65736a;

          font-size: 22px;

          line-height: 1;

          cursor: pointer;

          transition:
            background .16s ease,
            color .16s ease;
        }

        .maintenance-close:hover {
          background: #e8efea;

          color: var(--green-800);
        }

        @keyframes maintenanceFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes maintenanceUp {
          from {
            opacity: 0;

            transform:
              translateY(10px)
              scale(.985);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        /* =====================================================
           RESPONSIVE 900
        ===================================================== */

        @media (max-width: 900px) {

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
              clamp(38px, 7vw, 54px);
          }

          .card {
            padding: 24px;
          }

          .taskrow {
            grid-template-columns:
              1fr 1fr;
          }

          .taskrow .btn {
            width: 100%;
          }

        }

        /* =====================================================
           RESPONSIVE 768
        ===================================================== */

        @media (max-width: 768px) {

          .shell {
            padding-top: 66px !important;
          }

          .topbar {
            min-height: 66px !important;

            padding: 7px 11px !important;

            gap: 8px !important;
          }

          .brand {
            min-width: 0 !important;

            flex: 1 1 auto !important;

            gap: 7px;
          }

          .logo {
            width: 92px !important;

            height: 43px !important;

            flex-basis: 92px !important;
          }

          .logo img {
            max-width: 92px !important;
          }

          .brand-text {
            display: none !important;
          }

          .nav {
            max-width: 63vw;

            overflow-x: auto !important;

            overflow-y: hidden !important;

            scrollbar-width: none;

            gap: 4px !important;

            padding-bottom: 2px;
          }

          .nav::-webkit-scrollbar {
            display: none;
          }

          .nav a,
          .nav-maintenance,
          .nav-login,
          .nav-logout {
            flex: 0 0 auto !important;

            padding:
              8px 9px !important;

            font-size: 10px !important;

            border-radius: 9px !important;
          }

          .nav-logout {
            color: #a12d2d !important;

            background: #fff5f5 !important;
          }

          .nav a.active::after {
            left: 9px;

            right: 9px;

            bottom: 3px;
          }

          .main {
            width: 100% !important;

            padding: 12px !important;
          }

          .hero {
            width: 100% !important;

            min-height: 195px !important;

            padding: 28px 24px !important;

            border-radius: 20px !important;

            justify-content: flex-start !important;

            text-align: left !important;
          }

          .hero::before {
            width: 230px;

            height: 230px;

            right: -110px;

            top: -100px;
          }

          .hero::after {
            width: 160px;

            height: 160px;

            right: 40px;

            bottom: -110px;
          }

          .hero-decoration-one {
            display: none;
          }

          .hero-decoration-two {
            right: 40px;

            bottom: 28px;
          }

          .hero-content-left {
            width: 100% !important;

            text-align: left !important;
          }

          .hero .eyebrow {
            font-size: 9px !important;

            margin-bottom: 10px !important;

            padding: 6px 11px !important;
          }

          .hero .title {
            font-size:
              clamp(30px, 8vw, 42px) !important;

            line-height: 1.05 !important;

            text-align: left !important;

            white-space: normal !important;

            overflow-wrap: anywhere !important;
          }

          .hero-subtitle {
            margin-top: 10px !important;

            font-size: 12px !important;

            line-height: 1.45 !important;
          }

          .notice,
          .error {
            margin-top: 12px;

            padding: 11px 13px;

            border-radius: 11px;

            font-size: 12px;
          }

          .card {
            width: 100% !important;

            max-width: 100% !important;

            padding: 18px !important;

            border-radius: 18px !important;

            margin-top: 12px;
          }

          .form-section-title {
            margin-bottom: 18px;

            font-size: 11px;
          }

          .formgrid {
            grid-template-columns: 1fr !important;

            gap: 15px !important;
          }

          .field,
          .field.full {
            width: 100% !important;

            grid-column: 1 / -1 !important;

            min-width: 0 !important;
          }

          .field label {
            font-size: 13px;
          }

          input,
          select,
          textarea {
            padding: 11px 12px;

            font-size: 13px;
          }

          .selectrow {
            flex-wrap: wrap !important;
          }

          .selectrow > * {
            min-width: 0 !important;
          }

          .selectrow > :first-child {
            width: 100%;

            flex: 1 1 100%;
          }

          .selectrow .btn {
            flex: 1 1 0;

            min-width: 0;
          }

          .taskhead {
            align-items: stretch !important;

            flex-wrap: wrap !important;

            gap: 9px !important;
          }

          .taskhead .btn {
            width: 100%;
          }

          .taskrow {
            grid-template-columns: 1fr !important;

            gap: 7px !important;

            padding: 8px !important;
          }

          .taskrow > * {
            width: 100% !important;

            min-width: 0 !important;
          }

          .map-info {
            align-items: stretch !important;

            flex-direction: column !important;
          }

          .map-info .btn {
            width: 100%;
          }

          .mapframe {
            min-height: 280px !important;
          }

          .gps-empty {
            padding: 25px 15px;
          }

          .photoactions {
            width: 100% !important;

            display: grid !important;

            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 8px !important;
          }

          .photoactions .btn {
            width: 100% !important;

            min-width: 0 !important;

            padding: 11px 5px !important;

            font-size: 11px !important;

            white-space: nowrap !important;
          }

          .fotopreview {
            width: 100% !important;

            display: flex;

            flex-direction: column;

            align-items: stretch;

            gap: 9px;
          }

          .fotopreview img {
            width: 100% !important;

            max-width: 100% !important;

            max-height: 300px;
          }

          .fotopreview .btn {
            width: 100%;
          }

          .submit-area {
            margin-top: 20px;

            padding-top: 17px;

            flex-direction: column;

            align-items: stretch;

            gap: 14px;
          }

          .submit-info {
            align-items: flex-start;
          }

          .submit-btn {
            width: 100%;

            min-width: 0;
          }

          .navigation-card {
            width: 100% !important;

            margin-top: 12px;

            padding: 10px !important;

            display: grid !important;

            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 7px !important;

            align-items: stretch !important;
          }

          .navigation-card > .btn {
            width: 100% !important;

            min-width: 0 !important;

            margin: 0 !important;

            padding: 10px 7px !important;

            font-size: 11px !important;
          }

          .navigation-links {
            width: 100% !important;

            display: contents !important;
          }

          .navigation-links .btn {
            width: 100% !important;

            min-width: 0 !important;

            padding: 10px 7px !important;

            font-size: 11px !important;
          }

          .navigation-links .btn:last-child {
            grid-column: 1 / -1 !important;
          }

          input,
          select,
          textarea,
          button {
            max-width: 100%;
          }

          .maintenance-overlay {
            padding: 15px;
          }

          .maintenance-modal {
            border-radius: 17px;
          }

          .maintenance-content {
            padding: 25px 20px 21px;
          }

          .maintenance-modal h2 {
            font-size: 22px;
          }

        }

        /* =====================================================
           RESPONSIVE 480
        ===================================================== */

        @media (max-width: 480px) {

          .shell {
            padding-top: 60px !important;
          }

          .topbar {
            min-height: 60px !important;

            padding: 7px 8px !important;
          }

          .logo {
            width: 82px !important;

            height: 39px !important;

            flex-basis: 82px !important;
          }

          .logo img {
            max-width: 82px !important;
          }

          .nav {
            max-width: 66vw !important;

            gap: 3px !important;
          }

          .nav a,
          .nav-maintenance,
          .nav-login,
          .nav-logout {
            padding: 7px 6px !important;

            font-size: 9px !important;
          }

          .main {
            padding: 9px !important;
          }

          .hero {
            min-height: 172px !important;

            padding: 23px 19px !important;

            border-radius: 17px !important;
          }

          .hero .eyebrow {
            font-size: 8px !important;

            padding: 5px 9px !important;
          }

          .hero .title {
            font-size: 29px !important;
          }

          .hero-subtitle {
            font-size: 11px !important;
          }

          .card {
            padding: 14px !important;

            border-radius: 16px !important;
          }

          .form-section-title {
            margin-bottom: 15px;
          }

          .field label {
            font-size: 13px !important;
          }

          .selectrow {
            gap: 6px;
          }

          .selectrow .btn {
            padding: 10px 6px;

            font-size: 11px;
          }

          .mapframe {
            min-height: 250px !important;
          }

          .photoactions {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 7px !important;
          }

          .photoactions .btn {
            font-size: 10px !important;

            padding: 10px 4px !important;
          }

          .navigation-card {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 6px !important;

            padding: 8px !important;
          }

          .navigation-card > .btn,
          .navigation-links .btn {
            font-size: 10px !important;

            padding: 9px 4px !important;
          }

          .submit-info {
            gap: 8px;
          }

          .submit-check {
            width: 28px;

            height: 28px;

            flex-basis: 28px;
          }

        }

        /* =====================================================
           RESPONSIVE 390
        ===================================================== */

        @media (max-width: 390px) {

          .shell {
            padding-top: 58px !important;
          }

          .logo {
            width: 74px !important;

            height: 36px !important;

            flex-basis: 74px !important;
          }

          .logo img {
            max-width: 74px !important;
          }

          .nav {
            max-width: 69vw !important;
          }

          .nav a,
          .nav-maintenance,
          .nav-login,
          .nav-logout {
            padding: 6px 5px !important;

            font-size: 8px !important;
          }

          .hero {
            min-height: 158px !important;

            padding: 21px 17px !important;
          }

          .hero .title {
            font-size: 26px !important;
          }

          .hero-subtitle {
            font-size: 10px !important;
          }

          .photoactions {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 6px !important;
          }

          .photoactions .btn {
            font-size: 9px !important;

            padding: 9px 3px !important;
          }

          .navigation-card {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 5px !important;
          }

          .navigation-card > .btn,
          .navigation-links .btn {
            font-size: 9px !important;

            padding: 9px 3px !important;
          }

        }

      `}</style>

    </main>
  );
}