"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  StatusPie,
  MonthlyBar,
  WilayahBar,
} from "@/components/Charts";

function localDate() {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function monthRange(month) {
  const [y, m] = String(month || "")
    .split("-")
    .map(Number);

  if (!y || !m) {
    return {
      from: "",
      to: "",
    };
  }

  const last = new Date(y, m, 0).getDate();

  return {
    from: `${y}-${String(m).padStart(2, "0")}-01`,
    to: `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function formatPercent(value) {
  const n = Number(value || 0);

  return `${n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function getGroupName(row) {
  return (
    row?.nama_grup ||
    row?.nama_grup_temuan ||
    row?.grup_temuan ||
    row?.name ||
    "-"
  );
}

function getGroupTotal(row) {
  return Number(
    row?.jumlah ??
      row?.jumlah_temuan ??
      row?.total ??
      row?.count ??
      0
  );
}

function getGroupOpen(row) {
  return Number(
    row?.open ??
      row?.jumlah_open ??
      row?.open_07_hari ??
      row?.open_0_7_hari ??
      0
  );
}

function getGroupClose(row) {
  return Number(
    row?.close ??
      row?.jumlah_close ??
      0
  );
}

function getGroupWarning(row) {
  return Number(
    row?.warning ??
      row?.jumlah_warning ??
      row?.overdue ??
      row?.terlambat ??
      0
  );
}

function getWilayahName(row) {
  return (
    row?.nama_wilayah ||
    (row?.no_wilayah
      ? `Wilayah ${row.no_wilayah}`
      : "-")
  );
}

function BadgeDeadline({ sisaHari, overdue }) {
  const hari = Number(sisaHari ?? 0);

  if (overdue) {
    return (
      <span className="k3d-deadline k3d-deadline-danger">
        Terlambat {Math.abs(hari)} hari
      </span>
    );
  }

  if (hari <= 2) {
    return (
      <span className="k3d-deadline k3d-deadline-warning">
        {hari === 0
          ? "Jatuh tempo hari ini"
          : `${hari} hari lagi`}
      </span>
    );
  }

  return (
    <span className="k3d-deadline k3d-deadline-safe">
      {hari} hari lagi
    </span>
  );
}

function SummaryIcon({ type }) {
  if (type === "total") {
    return (
      <span className="k3d-summary-icon k3d-icon-blue">
        ▤
      </span>
    );
  }

  if (type === "open") {
    return (
      <span className="k3d-summary-icon k3d-icon-orange">
        !
      </span>
    );
  }

  if (type === "close") {
    return (
      <span className="k3d-summary-icon k3d-icon-green">
        ✓
      </span>
    );
  }

  if (type === "late") {
    return (
      <span className="k3d-summary-icon k3d-icon-dark">
        ◷
      </span>
    );
  }

  return (
    <span className="k3d-summary-icon k3d-icon-green">
      ▥
    </span>
  );
}

/* =========================================================
   ICON USER
========================================================= */

function UserIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 21C20 17.6863 17.3137 15 14 15H10C6.68629 15 4 17.6863 4 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/* =========================================================
   CHEVRON ICON
========================================================= */

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   CLOSE ICON
========================================================= */

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   CALENDAR ICON
========================================================= */

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M7 3.5V7M17 3.5V7M3.5 9.5H20.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   REFRESH ICON
========================================================= */

function RefreshIcon() {
  return (
    <svg
      width="18"
      height="18"
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

/* =========================================================
   PROFILE DATA
========================================================= */

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const possibleKeys = [
    "user",
    "authUser",
    "currentUser",
    "loginUser",
    "loggedUser",
    "userData",
    "k3User",
  ];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          return parsed;
        }
      } catch {
        return {
          nama_lengkap: raw,
          nama: raw,
          username: raw,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getUserName(user) {
  return (
    user?.nama_lengkap ||
    user?.namaLengkap ||
    user?.full_name ||
    user?.fullName ||
    user?.nama ||
    user?.name ||
    user?.username ||
    "Haris"
  );
}

function getUserRole(user) {
  return (
    user?.role ||
    user?.nama_role ||
    user?.role_name ||
    user?.roleName ||
    user?.jabatan ||
    "Mandor"
  );
}

function getInitial(name) {
  const cleanName = String(name || "").trim();

  if (!cleanName) {
    return "U";
  }

  const words = cleanName.split(/\s+/);

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase();
}

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
  const [masterWilayah, setMasterWilayah] = useState([]);
  const [openList, setOpenList] = useState([]);

  const [selectedOpen, setSelectedOpen] = useState(null);

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

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [user, setUser] = useState({
    nama_lengkap: "Haris",
    role: "Mandor",
  });

  const profileRef = useRef(null);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [profileOpen]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [profileOpen]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedOpen(null);
      }
    }

    if (selectedOpen) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [selectedOpen]);

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

  useEffect(() => {
    async function loadMasterWilayah() {
      try {
        const response = await fetch(
          "/api/master/wilayah",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Gagal memuat master wilayah."
          );
        }

        setMasterWilayah(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Load master wilayah error:",
          error
        );

        setMasterWilayah([]);
      }
    }

    loadMasterWilayah();
  }, []);

  function queryString() {
    const {
      from: activeFrom,
      to: activeTo,
    } = activeRange();

    const params = new URLSearchParams();

    if (activeFrom) {
      params.set("from", activeFrom);
    }

    if (activeTo) {
      params.set("to", activeTo);
    }

    if (noWilayah) {
      params.set(
        "noWilayah",
        noWilayah
      );
    }

    return params.toString();
  }

  async function load() {
    const {
      from: activeFrom,
      to: activeTo,
    } = activeRange();

    if (
      activeFrom &&
      activeTo &&
      activeFrom > activeTo
    ) {
      setErr(
        "Tanggal dari tidak boleh lebih besar dari tanggal sampai."
      );

      return;
    }

    try {
      setLoading(true);
      setErr("");

      const q = queryString();

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

      const responses = await Promise.all(
        urls.map((url) =>
          fetch(url, {
            cache: "no-store",
          })
        )
      );

      const values = await Promise.all(
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

      setSummary(
        values[0] || {
          total: 0,
          open: 0,
          close: 0,
          closeRate: 0,
          overdue: 0,
        }
      );

      setMonthly(
        Array.isArray(values[1])
          ? values[1]
          : []
      );

      setGroups(
        Array.isArray(values[2])
          ? values[2]
          : []
      );

      setWilayah(
        Array.isArray(values[3])
          ? values[3]
          : []
      );

      setOpenList(
        Array.isArray(values[4])
          ? [...values[4]].sort((a, b) => {
              const dateA = new Date(
                a?.tanggal_temuan || 0
              ).getTime();

              const dateB = new Date(
                b?.tanggal_temuan || 0
              ).getTime();

              if (dateB !== dateA) {
                return dateB - dateA;
              }

              return (
                Number(b?.id_temuan || 0) -
                Number(a?.id_temuan || 0)
              );
            })
          : []
      );
    } catch (error) {
      console.error(
        "Load dashboard error:",
        error
      );

      setErr(
        error?.message ||
          "Gagal memuat dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshData() {
    load();
  }

  const pie = useMemo(
    () => [
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
    ],
    [summary]
  );

  const sortedGroups = useMemo(() => {
    return [...groups]
      .sort(
        (a, b) =>
          getGroupTotal(b) -
          getGroupTotal(a)
      )
      .slice(0, 5);
  }, [groups]);

  const wilayahDisplay = useMemo(() => {
    const master = Array.isArray(masterWilayah)
      ? masterWilayah
      : [];

    const dataWilayah = Array.isArray(wilayah)
      ? wilayah
      : [];

    function getLabel(row) {
      return (
        row?.nama_wilayah ||
        row?.nama ||
        row?.label ||
        row?.wilayah ||
        (
          row?.no_wilayah !== undefined &&
          row?.no_wilayah !== null &&
          String(row?.no_wilayah).trim() !== ""
            ? `Wilayah ${row.no_wilayah}`
            : "-"
        )
      );
    }

    function getNumber(row, fields) {
      for (const field of fields) {
        const value = Number(row?.[field]);

        if (
          Number.isFinite(value) &&
          value !== 0
        ) {
          return value;
        }
      }

      return 0;
    }

    function getTotal(row) {
      return getNumber(row, [
        "total",
        "jumlah",
        "jumlah_temuan",
        "count",
      ]);
    }

    function getOpen(row) {
      return getNumber(row, [
        "open",
        "jumlah_open",
        "open_07_hari",
        "open_0_7_hari",
      ]);
    }

    function getClose(row) {
      return getNumber(row, [
        "close",
        "jumlah_close",
      ]);
    }

    function getDisplayKey(row) {
      const label = String(
        getLabel(row) || "-"
      )
        .trim()
        .replace(/\s+/g, " ");

      return label.toLowerCase();
    }

    const hasil = [];
    const indexMap = new Map();

    function addOrMerge(row, source) {
      const label = String(
        getLabel(row) || "-"
      )
        .trim()
        .replace(/\s+/g, " ");

      if (!label || label === "-") {
        return;
      }

      const key = getDisplayKey(row);

      const total = getTotal(row);
      const open = getOpen(row);
      const close = getClose(row);

      const existingIndex =
        indexMap.get(key);

      if (
        existingIndex !== undefined
      ) {
        const existing =
          hasil[existingIndex];

        existing.total =
          Number(existing.total || 0) +
          total;

        existing.jumlah =
          Number(existing.jumlah || 0) +
          total;

        existing.jumlah_temuan =
          Number(
            existing.jumlah_temuan || 0
          ) + total;

        existing.open =
          Number(existing.open || 0) +
          open;

        existing.jumlah_open =
          Number(
            existing.jumlah_open || 0
          ) + open;

        existing.close =
          Number(existing.close || 0) +
          close;

        existing.jumlah_close =
          Number(
            existing.jumlah_close || 0
          ) + close;

        if (source === "data") {
          Object.assign(
            existing,
            row
          );

          existing.wilayah =
            label;

          existing.nama_wilayah =
            label;

          existing.total =
            Number(
              existing.total ?? 
                existing.jumlah ??
                0
            );

          existing.jumlah =
            existing.total;

          existing.jumlah_temuan =
            existing.total;

          existing.open =
            Number(
              existing.open ??
                existing.jumlah_open ??
                0
            );

          existing.jumlah_open =
            existing.open;

          existing.close =
            Number(
              existing.close ??
                existing.jumlah_close ??
                0
            );

          existing.jumlah_close =
            existing.close;
        }

        return;
      }

      const item = {
        ...row,

        wilayah: label,

        nama_wilayah: label,

        total,

        jumlah: total,

        jumlah_temuan: total,

        open,

        jumlah_open: open,

        close,

        jumlah_close: close,
      };

      indexMap.set(
        key,
        hasil.length
      );

      hasil.push(item);
    }

    master.forEach((item) => {
      addOrMerge(item, "master");
    });

    dataWilayah.forEach((item) => {
      addOrMerge(item, "data");
    });

    return hasil;
  }, [
    masterWilayah,
    wilayah,
  ]);

  const displayPeriod = useMemo(() => {
    if (scope === "day") {
      return selectedDay;
    }

    if (scope === "month") {
      return month;
    }

    if (scope === "range") {
      return `${from || "-"} - ${
        to || "-"
      }`;
    }

    return "Januari - Desember 2024";
  }, [
    scope,
    selectedDay,
    month,
    from,
    to,
  ]);

  const fullName = getUserName(user);
  const role = getUserRole(user);
  const initial = getInitial(fullName);

  return (
    <main className="k3d-dashboard">

      {/* =====================================================
          HEADER / NAVBAR
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
              Dashboard Inspeksi K3
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

          <Link href="/inspeksi">
            Form Inspeksi
          </Link>

          <Link
            href="/dashboard"
            className="active"
          >
            Dashboard
          </Link>

          <Link href="/temuan">
            Data Temuan
          </Link>

          <div
            className="profile-container"
            ref={profileRef}
          >

            <button
              type="button"
              className={`profile-button ${
                profileOpen
                  ? "profile-button-open"
                  : ""
              }`}
              onClick={() =>
                setProfileOpen(
                  (previous) =>
                    !previous
                )
              }
              aria-label="Buka profil"
              aria-expanded={profileOpen}
            >

              <span className="profile-avatar">
                {initial}
              </span>

              <span className="profile-button-text">
                <strong>
                  {fullName}
                </strong>

                <small>
                  {role}
                </small>
              </span>

              <span className="profile-chevron">
                <ChevronIcon />
              </span>

            </button>

            {profileOpen && (

              <div
                className="profile-popup"
                role="dialog"
                aria-label="Informasi profil pengguna"
              >

                <div className="profile-popup-header">

                  <div>
                    <h3>
                      Profil Pengguna
                    </h3>

                    <p>
                      Informasi akun yang sedang masuk
                    </p>
                  </div>

                  <button
                    type="button"
                    className="profile-close"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    aria-label="Tutup profil"
                  >
                    <CloseIcon />
                  </button>

                </div>

                <div className="profile-popup-body">

                  <div className="profile-large-avatar">
                    {initial}
                  </div>

                  <div className="profile-info">

                    <div className="profile-info-item">

                      <span className="profile-info-icon">
                        <UserIcon />
                      </span>

                      <div>
                        <small>
                          Nama Lengkap
                        </small>

                        <strong>
                          {fullName}
                        </strong>
                      </div>

                    </div>

                    <div className="profile-info-item">

                      <span className="profile-role-icon">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 3L19 6.5V11.5C19 16.2 16 19.4 12 21C8 19.4 5 16.2 5 11.5V6.5L12 3Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />

                          <path
                            d="M9.5 12L11.2 13.7L14.8 10.1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>

                      <div>
                        <small>
                          Role
                        </small>

                        <strong>
                          {role}
                        </strong>
                      </div>

                    </div>

                  </div>

                </div>

                <div className="profile-popup-footer">

                  <span className="profile-status-dot" />

                  <span>
                    Akun sedang aktif
                  </span>

                </div>

              </div>

            )}

          </div>

          <button
            type="button"
            className="nav-logout"
            onClick={() => {
              window.location.href =
                "/login";
            }}
          >
            Logout
          </button>

        </nav>

      </header>

      <section className="k3d-content">

        {err && (
          <div className="k3d-error">

            <strong>
              Terjadi kesalahan
            </strong>

            <span>
              {err}
            </span>

            <button
              type="button"
              onClick={() => setErr("")}
            >
              ×
            </button>

          </div>
        )}

        <div className="k3d-filter-row">

          <div className="k3d-filter-group">

            <label>
              Tampilan Periode
            </label>

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

              <option value="month">
                Bulanan
              </option>

              <option value="range">
                Jangka Waktu
              </option>
            </select>

          </div>

          {scope === "day" && (
            <div className="k3d-filter-group">

              <label>
                Tanggal
              </label>

              <input
                type="date"
                value={selectedDay}
                onChange={(e) =>
                  setSelectedDay(
                    e.target.value
                  )
                }
              />

            </div>
          )}

          {scope === "month" && (
            <div className="k3d-filter-group">

              <label>
                Bulan
              </label>

              <input
                type="month"
                value={month}
                onChange={(e) =>
                  setMonth(
                    e.target.value
                  )
                }
              />

            </div>
          )}

          {scope === "range" && (
            <>

              <div className="k3d-filter-group">

                <label>
                  Dari
                </label>

                <input
                  type="date"
                  value={from}
                  onChange={(e) =>
                    setFrom(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="k3d-filter-group">

                <label>
                  Sampai
                </label>

                <input
                  type="date"
                  value={to}
                  onChange={(e) =>
                    setTo(
                      e.target.value
                    )
                  }
                />

              </div>

            </>
          )}

          <div className="k3d-filter-group">

            <label>
              Wilayah
            </label>

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

              {masterWilayah.map(
                (item, index) => {
                  const value =
                    item?.no_wilayah ??
                    item?.id_wilayah ??
                    item?.id ??
                    "";

                  const label =
                    item?.nama_wilayah ||
                    item?.nama ||
                    item?.label ||
                    (value
                      ? `Wilayah ${value}`
                      : "Wilayah");

                  return (
                    <option
                      key={`${value}-${index}`}
                      value={value}
                    >
                      {label}
                    </option>
                  );
                }
              )}

            </select>

          </div>

          {/* =================================================
              TOMBOL AKSI
              PDF & EXCEL DIHAPUS
          ================================================= */}

          <div className="k3d-filter-actions">

            <button
              type="button"
              className="k3d-apply-button"
              onClick={load}
              disabled={loading}
            >
              {loading
                ? "Memuat..."
                : "Terapkan"}
            </button>

           <button
  type="button"
  className="k3d-refresh-button"
  onClick={refreshData}
  disabled={loading}
  title="Refresh Data"
  aria-label="Refresh Data"
>
  <RefreshIcon />
</button>

          </div>

        </div>

        <section className="k3d-summary-grid">

          <article className="k3d-summary-card k3d-summary-blue">

            <div className="k3d-summary-top">

              <div>

                <div className="k3d-summary-label">
                  TOTAL TEMUAN
                </div>

                <div className="k3d-summary-value">
                  {formatNumber(
                    summary?.total
                  )}
                </div>

                <div className="k3d-summary-description">
                  Seluruh temuan inspeksi
                </div>

              </div>

              <SummaryIcon
                type="total"
              />

            </div>

            <div className="k3d-wave k3d-wave-blue" />

          </article>

          <article className="k3d-summary-card k3d-summary-orange">

            <div className="k3d-summary-top">

              <div>

                <div className="k3d-summary-label">
                  OPEN
                </div>

                <div className="k3d-summary-value">
                  {formatNumber(
                    summary?.open
                  )}
                </div>

                <div className="k3d-summary-description">
                  Temuan masih terbuka
                </div>

              </div>

              <SummaryIcon
                type="open"
              />

            </div>

            <div className="k3d-wave k3d-wave-orange" />

          </article>

          <article className="k3d-summary-card k3d-summary-green">

            <div className="k3d-summary-top">

              <div>

                <div className="k3d-summary-label">
                  CLOSE
                </div>

                <div className="k3d-summary-value">
                  {formatNumber(
                    summary?.close
                  )}
                </div>

                <div className="k3d-summary-description">
                  Temuan telah selesai
                </div>

              </div>

              <SummaryIcon
                type="close"
              />

            </div>

            <div className="k3d-wave k3d-wave-green" />

          </article>

          <article className="k3d-summary-card k3d-summary-dark">

            <div className="k3d-summary-top">

              <div>

                <div className="k3d-summary-label">
                  TERLAMBAT
                </div>

                <div className="k3d-summary-value">
                  {formatNumber(
                    summary?.overdue
                  )}
                </div>

                <div className="k3d-summary-description">
                  Melewati batas 7 hari
                </div>

              </div>

              <SummaryIcon
                type="late"
              />

            </div>

            <div className="k3d-wave k3d-wave-dark" />

          </article>

          <article className="k3d-summary-card k3d-summary-rate">

            <div className="k3d-summary-top">

              <div>

                <div className="k3d-summary-label">
                  CLOSE RATE
                </div>

                <div className="k3d-summary-value">
                  {formatPercent(
                    summary?.closeRate
                  )}
                </div>

                <div className="k3d-summary-description">
                  Persentase penyelesaian
                </div>

              </div>

              <SummaryIcon
                type="rate"
              />

            </div>

            <div className="k3d-wave k3d-wave-rate" />

          </article>

        </section>

        <section className="k3d-two-column">

          <article className="k3d-panel k3d-status-panel">

            <div className="k3d-panel-heading">

              <h2>
                Status Temuan
              </h2>

              <p>
                Perbandingan status temuan inspeksi
              </p>

            </div>

            <div className="k3d-status-content">

              <div className="k3d-chart-area">
                <StatusPie
                  data={pie}
                />
              </div>

              <div className="k3d-status-legend">

                <div className="k3d-legend-row">

                  <span className="k3d-dot k3d-dot-orange" />

                  <div>

                    <strong>
                      Open
                    </strong>

                    <span>
                      {formatNumber(
                        summary?.open
                      )}{" "}
                      temuan
                    </span>

                  </div>

                </div>

                <div className="k3d-legend-row">

                  <span className="k3d-dot k3d-dot-green" />

                  <div>

                    <strong>
                      Close
                    </strong>

                    <span>
                      {formatNumber(
                        summary?.close
                      )}{" "}
                      temuan
                    </span>

                  </div>

                </div>

                <div className="k3d-legend-row">

                  <span className="k3d-dot k3d-dot-dark" />

                  <div>

                    <strong>
                      Terlambat
                    </strong>

                    <span>
                      {formatNumber(
                        summary?.overdue
                      )}{" "}
                      temuan
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </article>

          <article className="k3d-panel k3d-group-panel">

            <div className="k3d-panel-heading">

              <h2>
                Temuan Berdasarkan Grup Temuan
              </h2>

              <p>
                Ranking grup berdasarkan jumlah temuan terbanyak
              </p>

            </div>

            <div className="k3d-table-scroll">

              <table className="k3d-table">

                <thead>

                  <tr>

                    <th>#</th>

                    <th>
                      Grup Temuan
                    </th>

                    <th>
                      Jumlah Temuan
                    </th>

                    <th>
                      Open (0-7 hari)
                    </th>

                    <th>
                      Close
                    </th>

                    <th>
                      Warning (&gt; 7 hari close)
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {sortedGroups.map(
                    (group, index) => (

                      <tr
                        key={
                          group?.id_grup ||
                          group?.id ||
                          `${getGroupName(
                            group
                          )}-${index}`
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td className="k3d-group-name">
                          {getGroupName(
                            group
                          )}
                        </td>

                        <td className="k3d-number-bold">
                          {formatNumber(
                            getGroupTotal(
                              group
                            )
                          )}
                        </td>

                        <td className="k3d-number-orange">
                          {formatNumber(
                            getGroupOpen(
                              group
                            )
                          )}
                        </td>

                        <td className="k3d-number-green">
                          {formatNumber(
                            getGroupClose(
                              group
                            )
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            getGroupWarning(
                              group
                            )
                          )}
                        </td>

                      </tr>

                    )
                  )}

                  {sortedGroups.length === 0 && (

                    <tr>

                      <td
                        colSpan={6}
                        className="k3d-empty"
                      >
                        Belum ada data grup.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </article>

        </section>

        <section className="k3d-two-column k3d-bottom-row">

          <article className="k3d-panel">

            <div className="k3d-panel-heading k3d-chart-heading">

              <div>

                <h2>
                  Trend Temuan Bulanan
                </h2>

                <p>
                  Perbandingan jumlah temuan dari Januari sampai Desember
                </p>

              </div>

             <div className="k3d-chart-legend">
  <span>
    <i className="k3d-chart-orange" />
    Open
  </span>

  <span>
    <i className="k3d-chart-green" />
    Close
  </span>
</div>
            </div>

            <div className="k3d-chart-large">
              <MonthlyBar
                data={monthly}
              />
            </div>

          </article>

          <article className="k3d-panel k3d-wilayah-panel">

  <div className="k3d-wilayah-heading-row">

    <div className="k3d-panel-heading">

      <h2>
        Temuan Per Wilayah
      </h2>

      <p>
        Perbandingan temuan pada seluruh wilayah kerja
      </p>

    </div>

    <div className="k3d-wilayah-legend">

      <span>
        <i className="k3d-chart-orange" />
        Open
      </span>

      <span>
        <i className="k3d-chart-green" />
        Close
      </span>

    </div>

  </div>

  <div className="k3d-wilayah-chart-wrapper">

    <WilayahBar
      data={wilayahDisplay}
    />

  </div>

  <div className="k3d-wilayah-summary-list">

  {wilayahDisplay
    .filter((item) => {

      const namaWilayah =
        getWilayahName(item);

      return (
        String(namaWilayah)
          .trim()
          .toLowerCase() !== "mixer"
      );

    })
    .map((item, index) => {

      const namaWilayah =
        getWilayahName(item);

      const totalWilayah =
        Number(
          item?.jumlah ??
            item?.total ??
            item?.jumlah_temuan ??
            0
        );

      const warnaTitik =
        index >= 5
          ? "orange"
          : "green";

      return (
        <div
          key={`${String(
            namaWilayah
          ).toLowerCase()}-${index}`}
          className="k3d-wilayah-summary-item"
        >

          <div className="k3d-wilayah-summary-name">

            <i
              className={
                warnaTitik === "orange"
                  ? "k3d-wilayah-dot-orange"
                  : "k3d-wilayah-dot-green"
              }
            />

            <span>
              {namaWilayah}
            </span>

          </div>

          <strong>
            {formatNumber(totalWilayah)}
          </strong>

        </div>
      );
    }
  )}

</div>
</article>
        </section>

        <section className="k3d-panel k3d-open-panel">

          <div className="k3d-panel-heading">

            <h2>
              Temuan OPEN
            </h2>

            <p>
              Temuan yang masih membutuhkan tindak lanjut
            </p>

          </div>

          <div className="k3d-table-scroll">

            <table className="k3d-table k3d-open-table">

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

                  <th>
                    Aktivitas
                  </th>

                  <th>
                    Deadline
                  </th>

                  <th>
                    Detail
                  </th>

                </tr>

              </thead>

              <tbody>

                {openList.map(
                  (row) => (

                    <tr
                      key={String(
                        row.id_temuan
                      )}
                    >

                      <td>
                        {String(
                          row.tanggal_temuan ||
                            ""
                        ).slice(
                          0,
                          10
                        )}
                      </td>

                      <td>
                        {row.nama_wilayah ||
                          (row.no_wilayah
                            ? `Wilayah ${row.no_wilayah}`
                            : "-")}
                      </td>

                      <td>
                        {row.nama_lokasi ||
                          "-"}
                      </td>

                      <td>
                        {row.nama_aktivitas ||
                          "-"}
                      </td>

                      <td>

                        <BadgeDeadline
                          sisaHari={
                            row.sisaHari
                          }
                          overdue={
                            row.overdue
                          }
                        />

                      </td>

                      <td>

                        <button
                          type="button"
                          className="k3d-eye-button"
                          onClick={() =>
                            setSelectedOpen(row)
                          }
                          title="Lihat detail temuan"
                          aria-label="Lihat detail temuan"
                        >

                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >

                            <path
                              d="M2.5 12C4.8 7.8 8 5.5 12 5.5C16 5.5 19.2 7.8 21.5 12C19.2 16.2 16 18.5 12 18.5C8 18.5 4.8 16.2 2.5 12Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />

                          </svg>

                        </button>

                      </td>

                    </tr>

                  )
                )}

                {openList.length === 0 && (

                  <tr>

                    <td
                      colSpan={6}
                      className="k3d-empty"
                    >
                      Tidak ada temuan OPEN.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

        {selectedOpen && (

          <div
            className="k3d-open-detail-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedOpen(null);
              }

            }}
          >

            <div
              className="k3d-open-detail-popup"
              role="dialog"
              aria-modal="true"
              aria-label="Detail temuan OPEN"
            >

              <div className="k3d-open-detail-header">

                <div>

                  <span>
                    DETAIL TEMUAN
                  </span>

                  <h3>
                    Temuan OPEN
                  </h3>

                </div>

                <button
                  type="button"
                  className="k3d-open-detail-close"
                  onClick={() =>
                    setSelectedOpen(null)
                  }
                  title="Tutup"
                  aria-label="Tutup detail temuan"
                >
                  <CloseIcon />
                </button>

              </div>

              <div className="k3d-open-detail-body">

                <div className="k3d-open-detail-grid">

                  <div>

                    <small>
                      Tanggal Temuan
                    </small>

                    <strong>
                      {String(
                        selectedOpen.tanggal_temuan ||
                          ""
                      ).slice(
                        0,
                        10
                      )}
                    </strong>

                  </div>

                  <div>

                    <small>
                      Wilayah
                    </small>

                    <strong>
                      {selectedOpen.nama_wilayah ||
                        (selectedOpen.no_wilayah
                          ? `Wilayah ${selectedOpen.no_wilayah}`
                          : "-")}
                    </strong>

                  </div>

                  <div>

                    <small>
                      Lokasi
                    </small>

                    <strong>
                      {selectedOpen.nama_lokasi ||
                        "-"}
                    </strong>

                  </div>

                  <div>

                    <small>
                      Mandor
                    </small>

                    <strong>
                      {selectedOpen.nama_mandor ||
                        "-"}
                    </strong>

                  </div>

                  <div>

                    <small>
                      Aktivitas
                    </small>

                    <strong>
                      {selectedOpen.nama_aktivitas ||
                        "-"}
                    </strong>

                  </div>

                  <div>

                    <small>
                      Grup Temuan
                    </small>

                    <strong>
                      {selectedOpen.nama_grup ||
                        "-"}
                    </strong>

                  </div>

                  <div>

                    <small>
                      Umur Temuan
                    </small>

                    <strong>
                      {Number(
                        selectedOpen.umur_hari ||
                          0
                      )}{" "}
                      hari
                    </strong>

                  </div>

                  <div>

                    <small>
                      Deadline
                    </small>

                    <strong>

                      <BadgeDeadline
                        sisaHari={
                          selectedOpen.sisaHari
                        }
                        overdue={
                          selectedOpen.overdue
                        }
                      />

                    </strong>

                  </div>

                </div>

                <div className="k3d-open-description-box">

                  <div className="k3d-open-description-title">
                    Deskripsi Temuan
                  </div>

                  <div className="k3d-open-description-text">
                    {selectedOpen.deskripsi ||
                      "Tidak ada deskripsi temuan."}
                  </div>

                </div>

                {selectedOpen.gmaps_url && (

                  <a
                    href={
                      selectedOpen.gmaps_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="k3d-open-map-button"
                  >
                    📍 Buka Lokasi di Maps
                  </a>

                )}

              </div>

              <div className="k3d-open-detail-footer">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOpen(null)
                  }
                >
                  Tutup
                </button>

              </div>

            </div>

          </div>

        )}

      </section>

      <footer className="k3d-footer">

        <span className="k3d-footer-pineapple"></span>

        <span>
          © 2024 Great Giant Pineapple. Semua hak dilindungi.
        </span>

      </footer>

      <style jsx global>{`

        .k3d-dashboard .topbar {
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
          padding: 8px clamp(18px, 4vw, 64px);
          gap: 25px;
          background: rgba(255, 255, 255, 0.97);
          border-bottom: 1px solid rgba(20, 55, 33, 0.08);
          box-shadow: 0 3px 18px rgba(20, 45, 29, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transform: translateZ(0);
          isolation: isolate;
        }

        .k3d-dashboard .brand {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 12px;
          flex: 1;
        }

        .k3d-dashboard .brand-logo-link {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          flex-shrink: 0;
        }

        .k3d-dashboard .logo {
          width: 108px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: transparent;
        }

        .k3d-dashboard .logo img {
          width: 100%;
          height: 100%;
          max-width: 108px;
          object-fit: contain;
        }

        .k3d-dashboard .brand-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .k3d-dashboard .brand-text b {
          color: #142119;
          font-size: 15px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
        }

        .k3d-dashboard .brand-text span {
          color: #87918a;
          font-size: 12px;
          line-height: 1.2;
          white-space: nowrap;
        }

        .k3d-dashboard .nav {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end;
          gap: 5px !important;
          flex-shrink: 0 !important;
        }

        .k3d-dashboard .nav a,
        .k3d-dashboard .nav-maintenance,
        .k3d-dashboard .nav-logout {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap !important;
          text-decoration: none;
          color: #34453a;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          transition:
            color 0.18s ease,
            background 0.18s ease,
            transform 0.18s ease;
        }

        .k3d-dashboard .nav a:hover,
        .k3d-dashboard .nav-maintenance:hover {
          color: #08783d;
          background: #f0f7f2;
          transform: translateY(-1px);
        }

        .k3d-dashboard .nav a.active {
          color: #08783d;
          background: #edf7f0;
        }

        .k3d-dashboard .nav a.active::after {
          content: "";
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 4px;
          height: 2px;
          border-radius: 999px;
          background: #079447;
        }

        .k3d-dashboard .nav-logout {
          border: 1px solid #d9e3dc;
          color: #a12d2d !important;
          background: #fff5f5;
          cursor: pointer;
          box-shadow: none;
        }

        .k3d-dashboard .nav-logout:hover {
          color: #8f2222 !important;
          background: #ffe9e9;
          border-color: #efcccc;
          transform: translateY(-1px);
        }

        .k3d-dashboard .profile-container {
          position: relative;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .k3d-dashboard .profile-button {
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid #dfe8e2;
          background: #ffffff;
          color: #34453a;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 5px 9px 5px 6px;
          border-radius: 12px;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .k3d-dashboard .profile-button:hover,
        .k3d-dashboard .profile-button-open {
          background: #f4faf5;
          border-color: #bddbc4;
          box-shadow: 0 4px 14px rgba(24, 117, 44, 0.10);
          transform: translateY(-1px);
        }

        .k3d-dashboard .profile-avatar {
          width: 33px;
          height: 33px;
          min-width: 33px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #18843c, #0a9b4d);
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px rgba(8, 120, 61, 0.22);
        }

        .k3d-dashboard .profile-button-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 65px;
          max-width: 130px;
          gap: 2px;
          overflow: hidden;
        }

        .k3d-dashboard .profile-button-text strong {
          color: #18251d;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 130px;
        }

        .k3d-dashboard .profile-button-text small {
          color: #7b877f;
          font-size: 9px;
          line-height: 1.2;
          font-weight: 600;
          white-space: nowrap;
        }

        .k3d-dashboard .profile-chevron {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #758078;
          transition: transform 0.2s ease;
        }

        .k3d-dashboard .profile-button-open
          .profile-chevron {
          transform: rotate(180deg);
        }

        .k3d-dashboard .profile-popup {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 330px;
          max-width: calc(100vw - 24px);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.99);
          border: 1px solid #dfe8e2;
          border-radius: 16px;
          box-shadow: 0 18px 50px rgba(25, 53, 36, 0.18);
          z-index: 100000;
          animation: k3dProfilePopupIn 0.18s ease-out;
        }

        @keyframes k3dProfilePopupIn {
          from {
            opacity: 0;
            transform: translateY(-7px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .k3d-dashboard .profile-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 18px 15px;
          border-bottom: 1px solid #edf1ee;
          background: linear-gradient(
            180deg,
            #f8fcf9 0%,
            #ffffff 100%
          );
        }

        .k3d-dashboard .profile-popup-header h3 {
          margin: 0;
          color: #142119;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 800;
        }

        .k3d-dashboard .profile-popup-header p {
          margin: 4px 0 0;
          color: #7a867e;
          font-size: 10px;
          line-height: 1.4;
        }

        .k3d-dashboard .profile-close {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border: 1px solid #e2e8e3;
          border-radius: 9px;
          background: #ffffff;
          color: #68756d;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .k3d-dashboard .profile-close:hover {
          color: #a12d2d;
          background: #fff4f4;
          border-color: #efcccc;
          transform: rotate(3deg);
        }

        .k3d-dashboard .profile-popup-body {
          padding: 20px 18px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .k3d-dashboard .profile-large-avatar {
          width: 66px;
          height: 66px;
          min-width: 66px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #18843c, #079447);
          color: #ffffff;
          font-size: 21px;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(8, 120, 61, 0.20);
          border: 4px solid #eef8f1;
        }

        .k3d-dashboard .profile-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .k3d-dashboard .profile-info-item {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .k3d-dashboard .profile-info-item > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .k3d-dashboard .profile-info-item small {
          color: #8a958e;
          font-size: 9px;
          line-height: 1.2;
          font-weight: 600;
        }

        .k3d-dashboard .profile-info-item strong {
          color: #17231c;
          font-size: 12px;
          line-height: 1.3;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .k3d-dashboard .profile-info-icon,
        .k3d-dashboard .profile-role-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .k3d-dashboard .profile-info-icon {
          color: #08783d;
          background: #edf7f0;
        }

        .k3d-dashboard .profile-role-icon {
          color: #54715f;
          background: #f0f4f1;
        }

        .k3d-dashboard .profile-popup-footer {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 11px 18px;
          background: #f8faf8;
          border-top: 1px solid #edf1ee;
          color: #758078;
          font-size: 9px;
          font-weight: 600;
        }

        .k3d-dashboard .profile-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #20a052;
          box-shadow: 0 0 0 3px rgba(32, 160, 82, 0.10);
        }

        .k3d-dashboard {
          padding-top: 74px !important;
        }

        /* =====================================================
           AKSI FILTER BARU
        ===================================================== */

        .k3d-dashboard .k3d-filter-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .k3d-dashboard .k3d-period-display {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 6px 12px;
          border: 1px solid #dfe8e2;
          border-radius: 10px;
          background: #ffffff;
          color: #34453a;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .k3d-dashboard .k3d-period-icon {
          width: 30px;
          height: 30px;
          min-width: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #08783d;
          background: #edf7f0;
          border-radius: 8px;
        }

        .k3d-dashboard .k3d-period-text {
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1.2;
        }

        .k3d-dashboard .k3d-period-label {
          color: #5f6e64;
          font-size: 11px;
          font-weight: 700;
        }

        .k3d-dashboard .k3d-period-value {
          color: #26352c;
          font-size: 11px;
          font-weight: 800;
        }

        .k3d-dashboard .k3d-period-chevron {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #68756d;
          margin-left: 2px;
        }

        .k3d-dashboard .k3d-refresh-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 7px 14px;
          border: 1px solid #cfe0d4;
          border-radius: 10px;
          background: #ffffff;
          color: #08783d;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .k3d-dashboard .k3d-refresh-button:hover:not(:disabled) {
          background: #f1f8f3;
          border-color: #afd0ba;
          box-shadow: 0 4px 12px rgba(8, 120, 61, 0.08);
          transform: translateY(-1px);
        }

        .k3d-dashboard .k3d-refresh-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {

          .k3d-dashboard .k3d-filter-actions {
            width: 100%;
            justify-content: flex-start;
          }

        }

        @media (max-width: 900px) {

          .k3d-dashboard .topbar {
            padding: 8px 20px;
          }

          .k3d-dashboard .profile-button-text {
            display: none;
          }

          .k3d-dashboard .profile-button {
            padding: 5px 7px;
          }

          .k3d-dashboard .profile-chevron {
            display: none;
          }

        }

        @media (max-width: 768px) {

          .k3d-dashboard {
            padding-top: 66px !important;
          }

          .k3d-dashboard .topbar {
            min-height: 66px !important;
            padding: 7px 11px !important;
            gap: 8px !important;
          }

          .k3d-dashboard .brand {
            min-width: 0 !important;
            flex: 1 1 auto !important;
            gap: 7px;
          }

          .k3d-dashboard .logo {
            width: 92px !important;
            height: 43px !important;
            flex-basis: 92px !important;
          }

          .k3d-dashboard .logo img {
            max-width: 92px !important;
          }

          .k3d-dashboard .brand-text {
            display: none !important;
          }

          .k3d-dashboard .nav {
            max-width: 73vw;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scrollbar-width: none;
            gap: 4px !important;
            padding-bottom: 2px;
          }

          .k3d-dashboard .nav::-webkit-scrollbar {
            display: none;
          }

          .k3d-dashboard .nav a,
          .k3d-dashboard .nav-maintenance,
          .k3d-dashboard .nav-login,
          .k3d-dashboard .nav-logout {
            flex: 0 0 auto !important;
            padding: 8px 9px !important;
            font-size: 10px !important;
            border-radius: 9px !important;
          }

          .k3d-dashboard .nav-logout {
            color: #a12d2d !important;
            background: #fff5f5 !important;
          }

          .k3d-dashboard .nav a.active::after {
            left: 9px;
            right: 9px;
            bottom: 3px;
          }

          .k3d-dashboard .profile-button {
            width: 35px;
            height: 35px;
            min-height: 35px;
            padding: 1px;
            border-radius: 50%;
            justify-content: center;
          }

          .k3d-dashboard .profile-avatar {
            width: 29px;
            height: 29px;
            min-width: 29px;
            font-size: 10px;
          }

          .k3d-dashboard .profile-popup {
            position: fixed;
            top: 73px;
            right: 10px;
            width: min(330px, calc(100vw - 20px));
            max-width: calc(100vw - 20px);
          }

          .k3d-dashboard .k3d-period-display {
            min-height: 40px;
            padding: 5px 9px;
          }

          .k3d-dashboard .k3d-period-label {
            display: none;
          }

          .k3d-dashboard .k3d-period-value {
            font-size: 10px;
          }

          .k3d-dashboard .k3d-refresh-button {
            min-height: 40px;
            padding: 6px 10px;
            font-size: 10px;
          }

        }

        @media (max-width: 480px) {

          .k3d-dashboard {
            padding-top: 60px !important;
          }

          .k3d-dashboard .topbar {
            min-height: 60px !important;
            padding: 7px 8px !important;
            gap: 5px !important;
          }

          .k3d-dashboard .logo {
            width: 82px !important;
            height: 39px !important;
            flex-basis: 82px !important;
          }

          .k3d-dashboard .logo img {
            max-width: 82px !important;
          }

          .k3d-dashboard .nav {
            max-width: 77vw !important;
            gap: 3px !important;
          }

          .k3d-dashboard .nav a,
          .k3d-dashboard .nav-maintenance,
          .k3d-dashboard .nav-login,
          .k3d-dashboard .nav-logout {
            padding: 7px 6px !important;
            font-size: 9px !important;
          }

          .k3d-dashboard .profile-button {
            width: 32px;
            height: 32px;
          }

          .k3d-dashboard .profile-avatar {
            width: 27px;
            height: 27px;
            min-width: 27px;
            font-size: 9px;
          }

          .k3d-dashboard .profile-popup {
            top: 67px;
            right: 8px;
            width: calc(100vw - 16px);
          }

          .k3d-dashboard .profile-popup-body {
            padding: 17px 15px;
            gap: 12px;
          }

          .k3d-dashboard .profile-large-avatar {
            width: 58px;
            height: 58px;
            min-width: 58px;
            font-size: 18px;
          }

          .k3d-dashboard .k3d-filter-actions {
            gap: 7px;
          }

          .k3d-dashboard .k3d-period-display {
            flex: 1 1 auto;
            min-width: 0;
          }

          .k3d-dashboard .k3d-period-value {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .k3d-dashboard .k3d-refresh-button {
            flex-shrink: 0;
          }

          .k3d-dashboard .k3d-refresh-button span {
            display: none;
          }

          .k3d-dashboard .k3d-refresh-button {
            width: 40px;
            padding: 0;
          }

        }

        @media (max-width: 390px) {

          .k3d-dashboard {
            padding-top: 58px !important;
          }

          .k3d-dashboard .logo {
            width: 74px !important;
            height: 36px !important;
            flex-basis: 74px !important;
          }

          .k3d-dashboard .logo img {
            max-width: 74px !important;
          }

          .k3d-dashboard .nav {
            max-width: 80vw !important;
          }

          .k3d-dashboard .nav a,
          .k3d-dashboard .nav-maintenance,
          .k3d-dashboard .nav-login,
          .k3d-dashboard .nav-logout {
            padding: 6px 5px !important;
            font-size: 8px !important;
          }

          .k3d-dashboard .profile-button {
            width: 30px;
            height: 30px;
          }

          .k3d-dashboard .profile-avatar {
            width: 25px;
            height: 25px;
            min-width: 25px;
          }

          .k3d-dashboard .profile-popup {
            top: 64px;
            right: 6px;
            width: calc(100vw - 12px);
          }

        }

        /* =====================================================
           TAMBAHAN DETAIL TEMUAN OPEN
        ===================================================== */

        .k3d-eye-button {
          width: 34px;
          height: 34px;
          padding: 0;
          border: 1px solid #dce7df;
          border-radius: 8px;
          background: #ffffff;
          color: #176b3a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .k3d-eye-button:hover {
          background: #f1f7f3;
          border-color: #b8d4c1;
          color: #12562f;
        }

        .k3d-open-detail-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(18, 33, 24, 0.48);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        .k3d-open-detail-popup {
          width: min(720px, 100%);
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #dfe8e2;
          border-radius: 16px;
          box-shadow: 0 24px 65px rgba(0, 0, 0, 0.22);
        }

        .k3d-open-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          border-bottom: 1px solid #edf1ee;
        }

        .k3d-open-detail-header span {
          display: block;
          margin-bottom: 4px;
          color: #e17a17;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .k3d-open-detail-header h3 {
          margin: 0;
          color: #142119;
          font-size: 20px;
          font-weight: 800;
        }

        .k3d-open-detail-close {
          width: 34px;
          height: 34px;
          padding: 0;
          border: 1px solid #dfe7e2;
          border-radius: 8px;
          background: #ffffff;
          color: #6f7b73;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .k3d-open-detail-close:hover {
          background: #f4f7f5;
          color: #142119;
        }

        .k3d-open-detail-body {
          padding: 20px 22px;
          overflow-y: auto;
        }

        .k3d-open-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .k3d-open-detail-grid > div {
          padding: 12px 13px;
          border: 1px solid #e5ece7;
          border-radius: 10px;
          background: #fbfdfb;
        }

        .k3d-open-detail-grid small {
          display: block;
          margin-bottom: 4px;
          color: #89948d;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .k3d-open-detail-grid strong {
          display: block;
          color: #26352c;
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
        }

        .k3d-open-description-box {
          margin-top: 12px;
          overflow: hidden;
          border: 1px solid #e5ece7;
          border-radius: 10px;
        }

        .k3d-open-description-title {
          padding: 11px 13px;
          background: #f4f8f5;
          border-bottom: 1px solid #e5ece7;
          color: #334239;
          font-size: 12px;
          font-weight: 800;
        }

        .k3d-open-description-text {
          min-height: 90px;
          padding: 14px;
          color: #48564e;
          font-size: 13px;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .k3d-open-map-button {
          display: inline-flex;
          align-items: center;
          margin-top: 12px;
          padding: 9px 13px;
          border-radius: 8px;
          background: #edf7f0;
          color: #176b3a;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        .k3d-open-map-button:hover {
          background: #e2f1e7;
        }

        .k3d-open-detail-footer {
          display: flex;
          justify-content: flex-end;
          padding: 12px 22px;
          border-top: 1px solid #edf1ee;
          background: #fafcfb;
        }

        .k3d-open-detail-footer button {
          min-width: 78px;
          padding: 9px 15px;
          border: 0;
          border-radius: 8px;
          background: #176b3a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .k3d-open-detail-footer button:hover {
          background: #12562f;
        }

        @media (max-width: 600px) {

          .k3d-open-detail-overlay {
            padding: 10px;
            align-items: flex-end;
          }

          .k3d-open-detail-popup {
            max-height: 92vh;
            border-radius: 14px 14px 0 0;
          }

          .k3d-open-detail-header,
          .k3d-open-detail-body {
            padding-left: 16px;
            padding-right: 16px;
          }

          .k3d-open-detail-footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .k3d-open-detail-grid {
            grid-template-columns: 1fr;
          }

        }
/* =========================================================
   REVISI TEMUAN PER WILAYAH
========================================================= */

.k3d-wilayah-panel {
  overflow: hidden;
}

.k3d-wilayah-heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.k3d-wilayah-legend {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-top: 8px;
  flex-shrink: 0;
}

.k3d-wilayah-legend span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #4e5854;
  font-size: 13px;
  font-weight: 500;
}

.k3d-wilayah-legend i {
  width: 14px;
  height: 14px;
  display: inline-block;
  border-radius: 50%;
}

.k3d-wilayah-chart-wrapper {
  width: 100%;
  min-height: 390px;
  margin-top: 4px;
  border: none !important;
  outline: none !important;
}

.k3d-wilayah-chart-wrapper * {
  outline: none;
}

.k3d-wilayah-summary-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 4px;
  border-top: 1px solid #e4ebe6;
}

.k3d-wilayah-summary-item {
  position: relative;
  min-width: 0;
  min-height: 55px;
  padding: 8px 10px 7px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.k3d-wilayah-summary-item::after {
  content: "";
  position: absolute;
  top: 12px;
  bottom: 12px;
  right: 0;
  width: 1px;
  background: #e2e8e3;
}

.k3d-wilayah-summary-item:nth-child(5)::after,
.k3d-wilayah-summary-item:nth-child(10)::after {
  display: none;
}

.k3d-wilayah-summary-item:nth-child(n + 6) {
  border-top: 1px solid #e4ebe6;
}

.k3d-wilayah-summary-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 5px;
}

.k3d-wilayah-summary-name span {
  overflow: hidden;
  color: #53605a;
  font-size: 10px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.k3d-wilayah-summary-item strong {
  padding-left: 18px;
  color: #16723d;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.k3d-wilayah-dot-green,
.k3d-wilayah-dot-orange {
  width: 12px;
  height: 12px;
  min-width: 12px;
  display: inline-block;
  border-radius: 50%;
}

.k3d-wilayah-dot-green {
  background: #4a9a63;
}

.k3d-wilayah-dot-orange {
  background: #f5a623;
}


/* =========================================================
   RESPONSIVE TEMUAN PER WILAYAH
========================================================= */

@media (max-width: 1100px) {

  .k3d-wilayah-summary-list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .k3d-wilayah-summary-item {
    padding-left: 10px;
    padding-right: 10px;
  }

  .k3d-wilayah-summary-name span {
    font-size: 11px;
  }

}


@media (max-width: 760px) {

  .k3d-wilayah-heading-row {
    flex-direction: column;
    gap: 6px;
  }

  .k3d-wilayah-legend {
    padding-top: 0;
  }

  .k3d-wilayah-summary-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .k3d-wilayah-summary-item {
    border-top: 1px solid #e4ebe6;
  }

  .k3d-wilayah-summary-item::after {
    display: block !important;
  }

  .k3d-wilayah-summary-item:nth-child(even)::after {
    display: none !important;
  }

}
      `}</style>

    </main>
  );
}