"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  StatusPie,
  MonthlyBar,
  WilayahBar,
} from "@/components/Charts";

const WILAYAH_OPSI = [1, 2, 3, 4, 5, 6, 7];

/*
==========================================================
TANGGAL LOKAL
==========================================================
*/

function localDate() {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

/*
==========================================================
RANGE BULAN
==========================================================
*/

function monthRange(month) {
  const [y, m] = month.split("-").map(Number);

  if (!y || !m) {
    return {
      from: "",
      to: "",
    };
  }

  const last = new Date(y, m, 0).getDate();

  return {
    from: `${y}-${String(m).padStart(2, "0")}-01`,
    to: `${y}-${String(m).padStart(2, "0")}-${last}`,
  };
}

/*
==========================================================
BADGE DEADLINE
==========================================================
*/

function BadgeDeadline({ sisaHari, overdue }) {
  const hari = Number(sisaHari ?? 0);

  let cls = "aman";
  let teks = `${hari} hari lagi`;

  if (overdue) {
    cls = "overdue";
    teks = `Terlambat ${Math.abs(hari)} hari`;
  } else if (hari <= 2) {
    cls = "mendesak";

    if (hari === 0) {
      teks = "Jatuh tempo hari ini";
    } else {
      teks = `${hari} hari lagi`;
    }
  }

  return (
    <span className={`deadline-badge ${cls}`}>
      {teks}
    </span>
  );
}

/*
==========================================================
DASHBOARD
==========================================================
*/

export default function Dashboard() {
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    close: 0,
    closeRate: 0,
    overdue: 0,
  });

  const [monthly, setMonthly] = useState([]);
  const [groups, setGroups] = useState([]);
  const [wilayah, setWilayah] = useState([]);
  const [openList, setOpenList] = useState([]);

  const [scope, setScope] = useState("all");

  const [selectedDay, setSelectedDay] =
    useState(localDate());

  const [month, setMonth] =
    useState(localDate().slice(0, 7));

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [noWilayah, setNoWilayah] =
    useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  /*
  ========================================================
  RANGE AKTIF
  ========================================================
  */

  function activeRange() {
    if (scope === "day") {
      return {
        from: selectedDay,
        to: selectedDay,
      };
    }

    if (scope === "month") {
      return monthRange(month);
    }

    if (scope === "range") {
      return {
        from,
        to,
      };
    }

    return {
      from: "",
      to: "",
    };
  }

  /*
  ========================================================
  QUERY STRING
  ========================================================
  */

  function queryString() {
    const {
      from: a,
      to: b,
    } = activeRange();

    const p = new URLSearchParams();

    if (a) {
      p.set("from", a);
    }

    if (b) {
      p.set("to", b);
    }

    if (noWilayah) {
      p.set("noWilayah", noWilayah);
    }

    return p.toString();
  }

  /*
  ========================================================
  LOAD DASHBOARD
  ========================================================
  */

  async function load() {
    const {
      from: a,
      to: b,
    } = activeRange();

    if (a && b && a > b) {
      setErr(
        "Tanggal dari tidak boleh lebih besar dari tanggal sampai."
      );

      return;
    }

    try {
      setLoading(true);
      setErr("");

      const q = queryString();

      /*
      ------------------------------------------------------
      API DASHBOARD
      ------------------------------------------------------
      */

      const urls = [
        `/api/dashboard/summary${
          q ? `?${q}` : ""
        }`,

        `/api/dashboard/monthly${
          q ? `?${q}` : ""
        }`,

        `/api/dashboard/by-group${
          q ? `?${q}` : ""
        }`,

        `/api/dashboard/by-wilayah${
          q ? `?${q}` : ""
        }`,

        `/api/dashboard/oldest-open?limit=25${
          q ? `&${q}` : ""
        }`,
      ];

      /*
      ------------------------------------------------------
      REQUEST SEMUA API
      ------------------------------------------------------
      */

      const responses = await Promise.all(
        urls.map((url) =>
          fetch(url, {
            cache: "no-store",
          })
        )
      );

      /*
      ------------------------------------------------------
      CEK RESPONSE
      ------------------------------------------------------
      */

      const vals = await Promise.all(
        responses.map(async (response) => {
          let data;

          try {
            data = await response.json();
          } catch {
            throw new Error(
              "Server mengembalikan response yang tidak valid."
            );
          }

          if (!response.ok) {
            throw new Error(
              data?.error ||
                "Gagal memuat dashboard."
            );
          }

          return data;
        })
      );

      /*
      ------------------------------------------------------
      SIMPAN DATA
      ------------------------------------------------------
      */

      setSummary(
        vals[0] || {
          total: 0,
          open: 0,
          close: 0,
          closeRate: 0,
          overdue: 0,
        }
      );

      setMonthly(
        Array.isArray(vals[1])
          ? vals[1]
          : []
      );

      setGroups(
        Array.isArray(vals[2])
          ? vals[2]
          : []
      );

      setWilayah(
        Array.isArray(vals[3])
          ? vals[3]
          : []
      );

      setOpenList(
        Array.isArray(vals[4])
          ? vals[4]
          : []
      );

    } catch (e) {
      console.error(
        "Load dashboard error:",
        e
      );

      setErr(
        e?.message ||
          "Gagal memuat dashboard."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
  ========================================================
  LOAD PERTAMA KALI
  ========================================================
  */

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  ========================================================
  EXPORT DASHBOARD
  ========================================================
  */

  function exportDashboard(format) {
    const {
      from: a,
      to: b,
    } = activeRange();

    if (
      (
        scope === "range" ||
        scope === "day" ||
        scope === "month"
      ) &&
      (!a || !b)
    ) {
      setErr(
        "Lengkapi periode export terlebih dahulu."
      );

      return;
    }

    if (a && b && a > b) {
      setErr(
        "Tanggal dari tidak boleh lebih besar dari tanggal sampai."
      );

      return;
    }

    const p = new URLSearchParams({
      format,
    });

    if (a) {
      p.set("from", a);
    }

    if (b) {
      p.set("to", b);
    }

    if (noWilayah) {
      p.set(
        "noWilayah",
        noWilayah
      );
    }

    window.open(
      `/api/dashboard/export?${p.toString()}`,
      "_blank"
    );
  }

  /*
  ========================================================
  DATA PIE
  ========================================================
  */

  const pie = [
    {
      name: "OPEN",
      value: Number(
        summary?.open || 0
      ),
    },

    {
      name: "CLOSE",
      value: Number(
        summary?.close || 0
      ),
    },
  ];

  /*
  ========================================================
  RENDER
  ========================================================
  */

  return (
    <main className="shell">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="topbar">

        <div className="brand">

          <div className="logo">
            GGF
          </div>

          <div>
            <b>
              Dashboard K3
            </b>

            <span>
              Great Giant Foods
            </span>
          </div>

        </div>

        <nav className="nav">

          <Link href="/dashboard">
            Dashboard
          </Link>

          <Link href="/inspeksi">
            Form Inspeksi
          </Link>

          <Link href="/temuan">
            Data Temuan
          </Link>

        </nav>

      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <div className="main">

        {/* =================================================
            HERO
        ================================================= */}

        <div className="hero">

          <div>

            <div className="eyebrow">
              Monitoring & Analysis
            </div>

            <h1 className="title">
              Dashboard Inspeksi K3
            </h1>

            <div className="muted">
              Semua data tetap tersimpan di
              PostgreSQL. Filter hanya mengatur
              tampilan dan export.
            </div>

          </div>

          <Link
            className="btn"
            href="/inspeksi"
          >
            + Temuan Baru
          </Link>

        </div>

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="card filterbar">

          <select
            value={scope}
            onChange={(e) =>
              setScope(e.target.value)
            }
          >

            <option value="all">
              Semua Data
            </option>

            <option value="day">
              1 Hari
            </option>

            <option value="range">
              Jangka Waktu
            </option>

            <option value="month">
              Bulanan
            </option>

          </select>

          {scope === "day" && (
            <input
              type="date"
              value={selectedDay}
              onChange={(e) =>
                setSelectedDay(
                  e.target.value
                )
              }
              title="Tanggal"
            />
          )}

          {scope === "range" && (
            <>
              <input
                type="date"
                value={from}
                onChange={(e) =>
                  setFrom(
                    e.target.value
                  )
                }
                title="Dari tanggal"
              />

              <input
                type="date"
                value={to}
                onChange={(e) =>
                  setTo(
                    e.target.value
                  )
                }
                title="Sampai tanggal"
              />
            </>
          )}

          {scope === "month" && (
            <input
              type="month"
              value={month}
              onChange={(e) =>
                setMonth(
                  e.target.value
                )
              }
              title="Bulan"
            />
          )}

          {/* =================================================
              FILTER WILAYAH
          ================================================= */}

          <select
            value={noWilayah}
            onChange={(e) =>
              setNoWilayah(
                e.target.value
              )
            }
          >

            <option value="">
              Semua Wilayah
            </option>

            {WILAYAH_OPSI.map((n) => (
              <option
                key={n}
                value={n}
              >
                Wilayah {n}
              </option>
            ))}

          </select>

          {/* =================================================
              BUTTON TERAPKAN
          ================================================= */}

          <button
            className="btn secondary"
            onClick={load}
            disabled={loading}
          >
            {loading
              ? "Memuat..."
              : "Terapkan"}
          </button>

          {/* =================================================
              EXPORT EXCEL
          ================================================= */}

          <button
            className="btn secondary"
            onClick={() =>
              exportDashboard("xlsx")
            }
          >
            ⬇ Excel
          </button>

          {/* =================================================
              EXPORT PDF
          ================================================= */}

          <button
            className="btn secondary"
            onClick={() =>
              exportDashboard("pdf")
            }
          >
            ⬇ PDF
          </button>

        </div>

        {/* =================================================
            INFO FILTER
        ================================================= */}

        <div
          className="muted small"
          style={{
            marginTop: 8,
          }}
        >

          {scope === "all"
            ? "Menampilkan seluruh data."
            : scope === "day"
              ? `Periode: ${selectedDay}`
              : scope === "month"
                ? `Periode: ${
                    activeRange().from
                  } s/d ${
                    activeRange().to
                  }`
                : `Periode: ${
                    from || "-"
                  } s/d ${
                    to || "-"
                  }`}

          {noWilayah
            ? ` • Wilayah ${noWilayah}`
            : ""}

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {err && (
          <div className="error">
            {err}
          </div>
        )}

        {/* =================================================
            METRIC
        ================================================= */}

        <div className="grid4">

          {/* TOTAL */}

          <div className="card metric">

            <div className="label">
              TOTAL TEMUAN
            </div>

            <div className="value">
              {Number(
                summary?.total || 0
              )}
            </div>

            <div className="muted">
              Sesuai filter
            </div>

          </div>

          {/* OPEN */}

          <div className="card metric">

            <div className="label">
              OPEN
            </div>

            <div className="value red">
              {Number(
                summary?.open || 0
              )}
            </div>

            <div className="muted">
              Perlu tindak lanjut
            </div>

          </div>

          {/* CLOSE */}

          <div className="card metric">

            <div className="label">
              CLOSE
            </div>

            <div className="value green">
              {Number(
                summary?.close || 0
              )}
            </div>

            <div className="muted">
              Sudah ditutup
            </div>

          </div>

          {/* CLOSE RATE */}

          <div className="card metric">

            <div className="label">
              CLOSE RATE
            </div>

            <div className="value green">
              {Number(
                summary?.closeRate || 0
              )}
              %
            </div>

            <div className="muted">
              Rasio penyelesaian
            </div>

          </div>

        </div>

        {/* =================================================
            OVERDUE
        ================================================= */}

        <div className="grid4">

          <div
            className="card metric"
            style={{
              gridColumn: "span 4",
            }}
          >

            <div className="label">
              TERLAMBAT (&gt; 7 HARI, MASIH OPEN)
            </div>

            <div className="value red">
              {Number(
                summary?.overdue || 0
              )}
            </div>

            <div className="muted">
              Sesuai periode filter
            </div>

          </div>

        </div>

        {/* =================================================
            CHART STATUS + BULAN
        ================================================= */}

        <div className="layout2">

          <section className="card">

            <h3>
              Status Temuan
            </h3>

            <div className="chartbox">
              <StatusPie
                data={pie}
              />
            </div>

          </section>

          <section className="card">

            <h3>
              Temuan Per Bulan
            </h3>

            <div className="chartbox">
              <MonthlyBar
                data={monthly}
              />
            </div>

          </section>

        </div>

        {/* =================================================
            WILAYAH + GRUP
        ================================================= */}

        <div className="layout2">

          {/* TEMUAN PER WILAYAH */}

          <section className="card">

            <h3>
              Temuan Per Wilayah (1-7)
            </h3>

            <div className="chartbox">
              <WilayahBar
                data={wilayah}
              />
            </div>

          </section>

          {/* TEMUAN BERDASARKAN GRUP */}

          <section className="card">

            <h3>
              Temuan Berdasarkan Grup
            </h3>

            <div className="tablewrap">

              <table className="table">

                <thead>

                  <tr>
                    <th>
                      Grup
                    </th>

                    <th>
                      Jumlah
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {groups.map(
                    (g, index) => (
                      <tr
                        key={
                          g.nama_grup ||
                          index
                        }
                      >

                        <td>
                          {g.nama_grup ||
                            "-"}
                        </td>

                        <td>
                          {Number(
                            g.jumlah || 0
                          )}
                        </td>

                      </tr>
                    )
                  )}

                  {groups.length === 0 && (
                    <tr>

                      <td
                        colSpan={2}
                        className="muted"
                        style={{
                          textAlign:
                            "center",
                          padding: 24,
                        }}
                      >
                        Belum ada data grup.
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>

        {/* =================================================
            TEMUAN OPEN
        ================================================= */}

        <section className="card">

          <h3>
            ⚠️ Temuan OPEN — Status & Deadline
            (SLA 7 Hari)
          </h3>

          <div className="tablewrap">

            <table className="table">

              <thead>

                <tr>

                  <th>
                    Tanggal
                  </th>

                  <th>
                    Wilayah
                  </th>

                  <th>
                    Lokasi
                  </th>

                  {/* PIC DIHAPUS */}

                  <th>
                    Mandor
                  </th>

                  <th>
                    Aktivitas
                  </th>

                  <th>
                    Grup
                  </th>

                  <th>
                    Deskripsi
                  </th>

                  <th>
                    Umur
                  </th>

                  <th>
                    Deadline
                  </th>

                  <th>
                    Maps
                  </th>

                </tr>

              </thead>

              <tbody>

                {openList.map(
                  (r) => (
                    <tr
                      key={String(
                        r.id_temuan
                      )}
                    >

                      {/* TANGGAL */}

                      <td>
                        {String(
                          r.tanggal_temuan ||
                            ""
                        ).slice(
                          0,
                          10
                        )}
                      </td>

                      {/* WILAYAH */}

                      <td>
                        {r.nama_wilayah ||
                          (r.no_wilayah
                            ? `Wilayah ${r.no_wilayah}`
                            : "-")}
                      </td>

                      {/* LOKASI */}

                      <td>
                        {r.nama_lokasi ||
                          "-"}
                      </td>

                      {/* MANDOR */}

                      <td>
                        {r.nama_mandor ||
                          "-"}
                      </td>

                      {/* AKTIVITAS */}

                      <td>
                        {r.nama_aktivitas ||
                          "-"}
                      </td>

                      {/* GRUP */}

                      <td>
                        {r.nama_grup ||
                          "-"}
                      </td>

                      {/* DESKRIPSI */}

                      <td
                        style={{
                          whiteSpace:
                            "normal",
                          minWidth: 260,
                        }}
                      >
                        {r.deskripsi ||
                          "-"}
                      </td>

                      {/* UMUR */}

                      <td>
                        <span className="status open">
                          {Number(
                            r.umur_hari || 0
                          )}{" "}
                          hari
                        </span>
                      </td>

                      {/* DEADLINE */}

                      <td>
                        <BadgeDeadline
                          sisaHari={
                            r.sisaHari
                          }
                          overdue={
                            r.overdue
                          }
                        />
                      </td>

                      {/* GOOGLE MAPS */}

                      <td>

                        {r.gmaps_url ? (
                          <a
                            className="maplink"
                            href={
                              r.gmaps_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            📍 Maps
                          </a>
                        ) : (
                          "-"
                        )}

                      </td>

                    </tr>
                  )
                )}

                {/* =================================================
                    TIDAK ADA DATA
                ================================================= */}

                {openList.length === 0 && (
                  <tr>

                    <td
                      colSpan={10}
                      className="muted"
                      style={{
                        textAlign:
                          "center",
                        padding: 24,
                      }}
                    >
                      Tidak ada temuan OPEN. 🎉
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </main>
  );
}