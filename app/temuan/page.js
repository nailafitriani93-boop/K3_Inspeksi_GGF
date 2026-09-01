"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const WILAYAH_OPSI = [1, 2, 3, 4, 5, 6, 7];

function localDate() {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

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

function BadgeDeadline({
  status,
  sisaHari,
  overdue,
  deadline,
}) {
  if (status !== "OPEN") {
    return (
      <span className="status close">
        CLOSE
      </span>
    );
  }

  let cls = "aman";
  let teks = `${sisaHari} hari lagi`;

  if (overdue) {
    cls = "overdue";
    teks = `Terlambat ${Math.abs(
      sisaHari
    )} hari`;
  } else if (sisaHari <= 2) {
    cls = "mendesak";

    teks =
      sisaHari === 0
        ? "Jatuh tempo hari ini"
        : `${sisaHari} hari lagi`;
  }

  return (
    <span
      className={`deadline-badge ${cls}`}
      title={`Deadline: ${deadline}`}
    >
      {teks}
    </span>
  );
}

export default function Temuan() {
  const [rows, setRows] = useState([]);

  const [status, setStatus] = useState("");

  const [noWilayah, setNoWilayah] =
    useState("");

  const [scope, setScope] =
    useState("all");

  const [selectedDay, setSelectedDay] =
    useState(localDate());

  const [month, setMonth] =
    useState(localDate().slice(0, 7));

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [err, setErr] = useState("");

  const [fotoModal, setFotoModal] =
    useState("");

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

  function buildQuery() {
    const p = new URLSearchParams();

    const {
      from: a,
      to: b,
    } = activeRange();

    if (status) {
      p.set("status", status);
    }

    if (noWilayah) {
      p.set("noWilayah", noWilayah);
    }

    if (a) {
      p.set("from", a);
    }

    if (b) {
      p.set("to", b);
    }

    return p.toString();
  }

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
      setErr("");

      const q = buildQuery();

      const r = await fetch(
        `/api/temuan${q ? `?${q}` : ""}`
      );

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.error);
      }

      setRows(d);
    } catch (e) {
      setErr(
        e?.message ||
          "Gagal mengambil data temuan."
      );
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, noWilayah]);

  async function toggle(row) {
    const next =
      row.status_temuan === "OPEN"
        ? "CLOSE"
        : "OPEN";

    if (
      next === "CLOSE" &&
      !confirm(
        `Tutup temuan #${row.id_temuan}?`
      )
    ) {
      return;
    }

    const r = await fetch(
      "/api/temuan",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id_temuan: row.id_temuan,
          status_temuan: next,
          closed_by: "User",
        }),
      }
    );

    const d = await r.json();

    if (!r.ok) {
      setErr(d.error);
    } else {
      load();
    }
  }

  function exportFile(format) {
    const {
      from: a,
      to: b,
    } = activeRange();

    if (!a || !b) {
      setErr(
        "Untuk export pilih 1 Hari, Jangka Waktu, atau Bulanan terlebih dahulu."
      );

      return;
    }

    if (a > b) {
      setErr(
        "Tanggal dari tidak boleh lebih besar dari tanggal sampai."
      );

      return;
    }

    const p = new URLSearchParams({
      from: a,
      to: b,
      format,
    });

    if (status) {
      p.set("status", status);
    }

    if (noWilayah) {
      p.set("noWilayah", noWilayah);
    }

    window.open(
      `/api/export?${p.toString()}`,
      "_blank"
    );
  }

  return (
    <main className="shell">

      {/* HEADER */}

      <header className="topbar">

        <div className="brand">

          <div className="logo">
            GGF
          </div>

          <div>
            <b>
              Data Temuan K3
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

      <div className="main">

        {/* HERO */}

        <div className="hero">

          <div>

            <div className="eyebrow">
              Monitoring
            </div>

            <h1 className="title">
              Data Temuan
            </h1>

            <div className="muted">
              OPEN/CLOSE tersimpan di
              database. Filter dan export
              tidak menghapus data.
            </div>

          </div>

          <Link
            className="btn"
            href="/inspeksi"
          >
            + Temuan
          </Link>

        </div>

        {/* FILTER */}

        <div className="card filterbar">

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            <option value="">
              Semua Status
            </option>

            <option value="OPEN">
              OPEN
            </option>

            <option value="CLOSE">
              CLOSE
            </option>
          </select>

          <select
            value={noWilayah}
            onChange={(e) =>
              setNoWilayah(e.target.value)
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
              />

              <input
                type="date"
                value={to}
                onChange={(e) =>
                  setTo(
                    e.target.value
                  )
                }
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
            />
          )}

          <button
            className="btn secondary"
            onClick={load}
          >
            Terapkan
          </button>

          <button
            className="btn secondary"
            onClick={() =>
              exportFile("xlsx")
            }
          >
            ⬇ Export Excel
          </button>

          <button
            className="btn secondary"
            onClick={() =>
              exportFile("pdf")
            }
          >
            ⬇ Export PDF
          </button>

        </div>

        {err && (
          <div className="error">
            {err}
          </div>
        )}

        {/* TABLE */}

        <div className="card tablewrap">

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
                  Grup
                </th>

                <th>
                  Deskripsi
                </th>

                <th>
                  Foto
                </th>

                <th>
                  Koordinat
                </th>

                <th>
                  Maps
                </th>

                <th>
                  Status
                </th>

                <th>
                  Deadline (7 hari)
                </th>

                <th>
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {rows.map((r) => (

                <tr
                  key={String(
                    r.id_temuan
                  )}
                >

                  <td>
                    {String(
                      r.tanggal_temuan
                    ).slice(0, 10)}
                  </td>

                  <td>
                    {r.nama_wilayah ||
                      "-"}
                  </td>

                  <td>
                    {r.nama_lokasi ||
                      "-"}
                  </td>

                  {/* MANDOR */}
                  <td>
                    {r.nama_mandor ||
                      "-"}
                  </td>

                  <td>
                    {r.nama_grup ||
                      "-"}
                  </td>

                  <td
                    style={{
                      whiteSpace:
                        "normal",
                      minWidth: 260,
                    }}
                  >
                    {r.deskripsi}
                  </td>

                  <td>

                    {r.foto_url ? (

                      <button
                        type="button"
                        className="thumbbtn"
                        onClick={() =>
                          setFotoModal(
                            r.foto_url
                          )
                        }
                      >

                        <img
                          src={
                            r.foto_url
                          }
                          alt="Foto temuan"
                        />

                      </button>

                    ) : (
                      "-"
                    )}

                  </td>

                  <td>
                    {r.latitude !== null &&
                    r.latitude !== undefined &&
                    r.longitude !== null &&
                    r.longitude !== undefined
                      ? `${r.latitude}, ${r.longitude}`
                      : "-"}
                  </td>

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

                  <td>

                    <span
                      className={`status ${
                        r.status_temuan ===
                        "OPEN"
                          ? "open"
                          : "close"
                      }`}
                    >
                      {
                        r.status_temuan
                      }
                    </span>

                  </td>

                  <td>

                    <BadgeDeadline
                      status={
                        r.status_temuan
                      }
                      sisaHari={
                        r.sisaHari
                      }
                      overdue={
                        r.overdue
                      }
                      deadline={
                        r.deadline
                      }
                    />

                  </td>

                  <td>

                    <button
                      className={`btn ${
                        r.status_temuan ===
                        "OPEN"
                          ? ""
                          : "secondary"
                      }`}
                      onClick={() =>
                        toggle(r)
                      }
                    >
                      {r.status_temuan ===
                      "OPEN"
                        ? "Tutup Temuan"
                        : "Buka Kembali"}
                    </button>

                  </td>

                </tr>

              ))}

              {rows.length === 0 && (

                <tr>

                  <td
                    colSpan={12}
                    className="muted"
                    style={{
                      textAlign:
                        "center",
                      padding: 24,
                    }}
                  >
                    Tidak ada data
                    temuan.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* MODAL FOTO */}

      {fotoModal && (

        <div
          className="modalbg"
          onClick={() =>
            setFotoModal("")
          }
        >

          <div
            className="modalimg"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <img
              src={fotoModal}
              alt="Foto temuan"
            />

            <button
              className="btn secondary"
              onClick={() =>
                setFotoModal("")
              }
            >
              Tutup
            </button>

          </div>

        </div>

      )}

    </main>
  );
}