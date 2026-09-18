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

function isApiDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <div
      className="k3d-dropdown"
      style={{
        position: "relative",
        width: "150px",
        minWidth: "150px",
      }}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="k3d-dropdown-button"
        style={{
          width: "100%",
          height: "38px",
          padding: "0 34px 0 11px",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          cursor: "pointer",
        }}
      >
        {options && options.length > 0 ? (
          options.map((option, index) => (
            <option
              key={`${String(option.value)}-${index}`}
              value={option.value}
            >
              {option.label}
            </option>
          ))
        ) : (
          <option value="">
            {placeholder || "Tidak ada pilihan"}
          </option>
        )}
      </select>

      <span
        className="k3d-dropdown-arrow"
        style={{
          position: "absolute",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M7 10L12 15L17 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
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
  const rawName =
    row?.nama_wilayah ||
    (row?.no_wilayah
      ? `Wilayah ${row.no_wilayah}`
      : "-");

  if (typeof rawName !== "string") {
    return rawName;
  }

  const normalized = rawName.trim();

  if (
    normalized.toLowerCase() === "mixer" ||
    normalized.toLowerCase() === "mixing"
  ) {
    return "Mixing";
  }

  return normalized;
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
    "k3_user",
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

function normalizedRole(user) {
  return String(getUserRole(user) || "")
    .trim()
    .toUpperCase();
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

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [showMobileNav, setShowMobileNav] =
    useState(false);

  const [user, setUser] = useState(null);
  const [accessNotice, setAccessNotice] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    let dismissTimer;

    function showAccessNotice() {
      const url = new URL(window.location.href);
      const deniedByRedirect = url.searchParams.get("access") === "denied";
      const deniedByCookie = document.cookie
        .split("; ")
        .includes("k3_access_denied=1");

      if (!deniedByRedirect && !deniedByCookie) return;

      setAccessNotice(true);
      document.cookie = "k3_access_denied=; path=/; max-age=0; samesite=lax";
      if (deniedByRedirect) {
        url.searchParams.delete("access");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
      window.clearTimeout(dismissTimer);
      dismissTimer = window.setTimeout(() => setAccessNotice(false), 3500);
    }

    showAccessNotice();
    const watcher = window.setInterval(showAccessNotice, 400);
    return () => {
      window.clearInterval(watcher);
      window.clearTimeout(dismissTimer);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      localStorage.removeItem("k3_user");
      setUser(null);
      setProfileOpen(false);
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", {
      cache: "no-store",
    })
      .then(async (response) => {
        const result = await response.json();

        if (!active) {
          return;
        }

        setUser(
          response.ok && result.success
            ? result.user
            : null
        );
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
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

  function activeRange(filters = {}) {
    const currentScope = filters.scope ?? scope;
    const currentDay = filters.selectedDay ?? selectedDay;
    const currentMonth = filters.month ?? month;
    const currentFrom = filters.from ?? from;
    const currentTo = filters.to ?? to;

    if (currentScope === "day") {
      return {
        from: currentDay,
        to: currentDay,
      };
    }

    if (currentScope === "month") {
      return monthRange(currentMonth);
    }

    if (currentScope === "range") {
      return {
        from: currentFrom,
        to: currentTo,
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

  function queryString(filters = {}) {
    const {
      from: activeFrom,
      to: activeTo,
    } = activeRange(filters);

    const params = new URLSearchParams();

    if (activeFrom) {
      params.set("from", activeFrom);
    }

    if (activeTo) {
      params.set("to", activeTo);
    }

    const currentWilayah = filters.noWilayah ?? noWilayah;

    if (currentWilayah) {
      params.set(
        "noWilayah",
        currentWilayah
      );
    }

    return params.toString();
  }

  function currentFilters() {
    return {
      scope,
      selectedDay,
      month,
      from,
      to,
      noWilayah,
    };
  }

  async function load(filters = {}) {
    const {
      from: activeFrom,
      to: activeTo,
    } = activeRange(filters);

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

    if (
      (activeFrom && !isApiDate(activeFrom)) ||
      (activeTo && !isApiDate(activeTo))
    ) {
      setErr("Format tanggal filter tidak valid.");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      const q = queryString(filters);

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
    const defaults = {
      scope: "all",
      selectedDay: localDate(),
      month: localDate().slice(0, 7),
      from: "",
      to: "",
      noWilayah: "",
    };

    setScope(defaults.scope);
    setSelectedDay(defaults.selectedDay);
    setMonth(defaults.month);
    setFrom(defaults.from);
    setTo(defaults.to);
    setNoWilayah(defaults.noWilayah);
    load(defaults);
  }

  function applyFilters() {
    load(currentFilters());
  }

 const pie = useMemo(() => {
  const openTotal = Number(summary?.open || 0);
  const overdue = Number(summary?.overdue || 0);
  const close = Number(summary?.close || 0);

  const openNormal = Math.max(
    openTotal - overdue,
    0
  );

  return [
    {
      name: "OPEN",
      value: openNormal,
    },
    {
      name: "CLOSE",
      value: close,
    },
    {
      name: "TERLAMBAT",
      value: overdue,
    },
  ];
}, [summary]);

  const sortedGroups = useMemo(() => {
    return [...groups]
      .sort(
        (a, b) =>
          getGroupTotal(b) -
          getGroupTotal(a)
      );
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
  const roleCode = normalizedRole(user);
  const isLoggedIn = Boolean(user?.username);
  const canInspection = [
    "ADMIN_DEVELOPER",
    "ADMIN_SISTEM_MUTU",
    "ADMIN",
    "ADMIN_INSPECTOR",
    "ADMIN_INSPEKSI",
    "INSPECTOR",
  ].includes(roleCode);
  const canFindings = [
    "ADMIN_DEVELOPER",
    "TEAM_WILAYAH",
    "PIC",
    "ADMIN",
    "ADMIN_INSPECTOR",
    "ADMIN_INSPEKSI",
    "INSPECTOR",
  ].includes(roleCode);
  const canUsers =
    roleCode === "ADMIN_DEVELOPER" ||
    Boolean(user?.kelola_user);
  const initial = getInitial(fullName);

  return (
    <main className="k3d-dashboard">
      {accessNotice && (
        <div className="k3d-access-notice" role="alert">
          Anda tidak memiliki hak akses ke halaman ini.
        </div>
      )}

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
                alt="Sistem Manajemen Informasi Estate PG1"
              />
            </div>
          </Link>

        <div className="brand-text">

  <b>
    Dashboard k3
  </b>

  <span>
    Sistem Manajemen Informasi Estate PG1
  </span>

</div>
        </div>

          <nav
            className={`nav ${isLoggedIn ? "nav-authenticated" : "nav-public"} ${showMobileNav ? "mobile-nav-open" : ""}`}
            aria-label="Navigasi utama"
          >
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="nav-page active">
                  Dashboard
                </Link>

                <Link href="/temuan" className="nav-page">
                  Data Temuan
                </Link>

                <Link href="/inspeksi" className="nav-page">
                  Form Inspeksi
                </Link>

                <div className="profile-wrapper" ref={profileRef}>
                  <button
                    type="button"
                    className={`profile-button ${profileOpen ? "profile-button-open" : ""}`}
                    onClick={() => setProfileOpen((value) => !value)}
                    aria-expanded={profileOpen}
                  >
                    <span className="profile-avatar">
                      <svg className="profile-symbol" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="8" r="3.2" fill="currentColor" />
                        <path d="M5.5 19.2c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5" fill="currentColor" />
                      </svg>
                    </span>

                    <span className="profile-info">
                      <strong>{fullName}</strong>
                      <small>{role}</small>
                    </span>

                    <span className="profile-chevron">▴</span>
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
                          <strong>{fullName}</strong>
                          <span>{role}</span>
                        </div>
                      </div>

                      <div className="profile-divider" />

                      <div className="profile-detail">
                        <span className="profile-label">Nama Lengkap</span>
                        <strong>{fullName}</strong>
                      </div>

                      <div className="profile-detail">
                        <span className="profile-label">Username</span>
                        <strong>{user?.username || "-"}</strong>
                      </div>

                      <div className="profile-detail">
                        <span className="profile-label">Role</span>
                        <span className="role-badge">{role}</span>
                      </div>

                      <button
                        type="button"
                        className="profile-logout"
                        onClick={handleLogout}
                        disabled={loggingOut}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4Zm5.59 4.59L14.17 10H21v2h-6.83l1.42 1.41L14.17 14l-3.41-3.41L14.17 7l1.42 1.59Z" fill="currentColor" />
                        </svg>
                        {loggingOut ? "Memproses..." : "Logout"}
                      </button>

                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="nav-logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <svg className="nav-logout-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4Zm5.59 4.59L14.17 10H21v2h-6.83l1.42 1.41L14.17 14l-3.41-3.41L14.17 7l1.42 1.59Z" fill="currentColor" />
                  </svg>
                  <span className="nav-logout-label">{loggingOut ? "Memproses..." : "Logout"}</span>
                </button>

                {canUsers && (
                  <Link href="/users" className="nav-users-button" onClick={() => setProfileOpen(false)}>
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
              </>
            ) : (
              <Link href="/login?next=/dashboard" className="nav-login" aria-label="Login ke akun">
                <span className="nav-login-avatar" aria-hidden="true">
                  <svg
                    className="nav-login-icon"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Zm-6.5 7.3c.9-2.5 3.4-4 6.5-4s5.6 1.5 6.5 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg className="nav-login-door-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                    <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M11 12h9m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="nav-login-label">Login</span>
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

      <section className="k3d-content">

        {isLoggedIn && canInspection && (
          <div className="k3d-dashboard-add-finding-row">
            <Link
              href="/inspeksi"
              className="dashboard-add-finding"
            >
              + Tambah Temuan
            </Link>
          </div>
        )}

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

<CustomDropdown
  value={scope}
  onChange={setScope}
  placeholder="Semua Data"
  options={[
    {
      value: "all",
      label: "Semua Data",
    },
    {
      value: "day",
      label: "1 Hari",
    },
    {
      value: "month",
      label: "Bulanan",
    },
    {
      value: "range",
      label: "Jangka Waktu",
    },
  ]}
/>

          </div>

          {scope === "day" && (
            <div className="k3d-filter-group">

              <label>
                Tanggal
              </label>

              <input
                type="date"
                lang="id-ID"
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
                  lang="id-ID"
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
                  lang="id-ID"
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
                  lang="id-ID"
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

            <CustomDropdown
  value={noWilayah}
  onChange={setNoWilayah}
  placeholder="Semua Wilayah"
  options={[
    {
      value: "",
      label: "Semua Wilayah",
    },

    ...masterWilayah.map(
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

        return {
          value,
          label,
          key: `${value}-${index}`,
        };
      }
    ),
  ]}
/>

          </div>

          {/* =================================================
              TOMBOL AKSI
              PDF & EXCEL DIHAPUS
          ================================================= */}

          <div className="k3d-filter-actions">

            <button
              type="button"
              className="k3d-apply-button"
              onClick={applyFilters}
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
                      Open
                    </th>

                    <th>
                      Close
                    </th>

                    <th>
                      Terlambat
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
          .length > 0
      );
    })
    .map((item, index) => {

      const namaWilayah =
        getWilayahName(item);

      const totalWilayah =
        Number(
          item?.total ??
            item?.jumlah ??
            item?.jumlah_temuan ??
            0
        );

      const closeWilayah =
        Number(
          item?.close ??
            item?.jumlah_close ??
            0
        );

      const closeRate =
        totalWilayah > 0
          ? (closeWilayah /
              totalWilayah) *
            100
          : 0;

     const warnaTitik = "green";
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
            {formatPercent(closeRate)}
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

                  <th className="k3d-detail-mobile">
                    Detail
                  </th>

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

                  <th className="k3d-detail-desktop">
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

                      <td className="k3d-detail-mobile">
                        <button
                          type="button"
                          className="k3d-eye-button"
                          style={{
                            color: row?.overdue
                              ? "#111111"
                              : String(row?.status_temuan || "").toUpperCase() === "CLOSE"
                              ? "#176b3a"
                              : "#f2c300",
                          }}
                          onClick={() => setSelectedOpen(row)}
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

                      <td className="k3d-detail-desktop">

                       <button
  type="button"
  className="k3d-eye-button"
  style={{
    color: row?.overdue
      ? "#111111"
      : String(row?.status_temuan || "").toUpperCase() === "CLOSE"
      ? "#176b3a"
      : "#f2c300",
  }}
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

                <Link
                  href={`/temuan?temuan=${encodeURIComponent(String(selectedOpen.id_temuan))}&action=close`}
                  className="k3d-open-follow-up-button"
                >
                  Tindak Lanjut Temuan
                </Link>

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
        @import url(
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap'
);

        .k3d-access-notice {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 100000;
          max-width: calc(100vw - 32px);
          padding: 12px 16px;
          border: 1px solid #f1c3a8;
          border-radius: 10px;
          background: #fffaf5;
          box-shadow: 0 12px 28px rgba(83, 58, 30, .16);
          color: #9a4c19;
          font: 600 12px "Poppins", sans-serif;
        }

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
          font-family: "Poppins", sans-serif;
          font-weight: 600;
        }

        .k3d-dashboard .nav a,
        .k3d-dashboard .nav-maintenance,
        .k3d-dashboard .nav-login,
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
          font-family: "Poppins", sans-serif;
          font-size: 12px;
          font-weight: 600;
          transition:
            color 0.18s ease,
            background 0.18s ease,
            transform 0.18s ease;
        }

        .k3d-dashboard .nav a:hover,
        .k3d-dashboard .nav-maintenance:hover,
        .k3d-dashboard .nav-login:hover {
          color: #08783d;
          background: #f0f7f2;
          transform: translateY(-1px);
        }

        .k3d-dashboard .k3d-dashboard-add-finding-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }

        .k3d-dashboard .dashboard-add-finding {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px !important;
          padding: 5px 8px !important;
          min-height: 0 !important;
          height: auto !important;
          border-radius: 5px !important;
          border: 1px solid #08783d;
          color: #08783d;
          background: #edf7f0;
          font-size: 9px !important;
          font-weight: 700;
          line-height: 1 !important;
          text-decoration: none;
        }

        .k3d-dashboard .dashboard-add-finding:hover {
          color: #ffffff;
          background: #08783d;
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

        .k3d-dashboard .nav-users-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 5px 9px;
          border: 1px solid #08783d;
          border-radius: 7px;
          background: #08783d;
          color: #ffffff;
          text-decoration: none;
          font-family: "Poppins", sans-serif;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .k3d-dashboard .nav-users-button:hover {
          background: #066531;
          border-color: #066531;
          color: #ffffff;
        }

        .k3d-dashboard .nav-login {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 8px 14px;
          border: 1px solid #08783d;
          color: #ffffff;
          background: linear-gradient(135deg, #0b7f3d, #0f914b);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.1;
          border-radius: 999px;
          box-shadow: 0 8px 18px rgba(8, 120, 61, 0.18);
        }

        .k3d-dashboard .nav-login:hover {
          color: #ffffff;
          background: linear-gradient(135deg, #066531, #0d7f42);
          border-color: #066531;
          transform: translateY(-1px);
        }

        .k3d-dashboard .nav-login-avatar {
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
          flex-shrink: 0;
        }

        .k3d-dashboard .nav-login-icon {
          flex: 0 0 auto;
          display: block;
          width: 12px;
          height: 12px;
        }

        .k3d-dashboard .nav-login-label {
          display: inline-block;
          white-space: nowrap;
        }

        .k3d-dashboard .nav > .nav-login {
          gap: 8px !important;
          padding: 8px 14px !important;
          min-height: 40px !important;
          height: auto !important;
          color: #ffffff !important;
          font-size: 12px !important;
          line-height: 1.1 !important;
          border-radius: 999px !important;
        }

        .k3d-dashboard .nav > .nav-login .nav-login-icon {
          width: 12px !important;
          height: 12px !important;
        }

        .k3d-dashboard .k3d-admin-access {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          padding: 18px 20px;
          border: 1px solid #d9e8dc;
          border-radius: 12px;
          background: #f7fbf8;
        }

        .k3d-dashboard .k3d-admin-access > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .k3d-dashboard .k3d-admin-access strong {
          color: #142119;
          font-size: 16px;
        }

        .k3d-dashboard .k3d-admin-access span {
          color: #66746b;
          font-size: 13px;
        }

        .k3d-dashboard .k3d-admin-access-button {
          flex: 0 0 auto;
          padding: 10px 14px;
          border-radius: 10px;
          background: #08783d;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .k3d-dashboard .k3d-admin-access-button:hover {
          background: #066531;
        }

        @media (max-width: 640px) {
          .k3d-dashboard .k3d-admin-access {
            align-items: stretch;
            flex-direction: column;
            gap: 12px;
          }

          .k3d-dashboard .k3d-admin-access-button {
            text-align: center;
          }
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

        .k3d-dashboard .profile-symbol {
          width: 18px;
          height: 18px;
          display: block;
        }

        .k3d-dashboard .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 65px;
          max-width: 130px;
          gap: 2px;
          overflow: hidden;
        }

        .k3d-dashboard .profile-info strong {
          color: #18251d;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 130px;
        }

        .k3d-dashboard .profile-info small {
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
  top: calc(100% + 8px);
  right: 0;
  z-index: 1100;

  width: 298px;

  padding: 16px;

  border: 1px solid #dfe6e1;
  border-radius: 17px;

  background: #ffffff;

  box-shadow:
    0 18px 40px rgba(24, 45, 32, 0.13);

  animation: k3dProfilePopupIn 0.14s ease-out;
}

        .k3d-dashboard .profile-menu-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .k3d-dashboard .profile-menu-link {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 36px;
          padding: 9px 12px;
          border: 1px solid #e3e9e4;
          border-radius: 10px;
          background: #f7faf8;
          color: #23352d;
          text-decoration: none;
          font-family: "Poppins", sans-serif;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .k3d-dashboard .profile-menu-link:hover {
          background: #edf7f0;
          border-color: #cfe3d3;
        }

        .k3d-dashboard .profile-menu-link-static {
          appearance: none;
          -webkit-appearance: none;
        }

        .k3d-dashboard .profile-menu-link-small {
          min-height: 30px;
          padding: 7px 10px;
          font-size: 11px;
          background: #ffffff;
          border-color: #d9e5dc;
          color: #2a3d31;
          width: auto;
          align-self: flex-end;
          min-width: 118px;
        }

@keyframes k3dProfilePopupIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.k3d-dashboard .profile-popup-header {
  display: flex;
  align-items: center;

  gap: 12px;

  padding: 1px 0 3px;
}

.k3d-dashboard .profile-popup-header > .profile-avatar {
  width: 43px;
  height: 43px;

  flex: 0 0 43px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #079447;
  color: #ffffff;

  font-family: "Poppins", sans-serif;
  font-size: 17px;
  font-weight: 600;
}

.k3d-dashboard .profile-header-info {
  display: flex;
  flex-direction: column;

  gap: 4px;

  min-width: 0;
}

.k3d-dashboard .profile-header-info strong {
  color: #26382d;

  font-family: "Poppins", sans-serif;
  font-size: 13px;
  font-weight: 600;
}

.k3d-dashboard .profile-header-info span {
  color: #7b8980;

  font-family: "Poppins", sans-serif;
  font-size: 9px;
  font-weight: 600;
}

.k3d-dashboard .profile-divider {
  width: 100%;
  height: 1px;

  margin: 11px 0;

  background: #e7ece8;
}

.k3d-dashboard .profile-detail {
  display: flex;
  flex-direction: column;

  gap: 4px;

  margin-bottom: 11px;
}

.k3d-dashboard .profile-detail:last-of-type {
  margin-bottom: 0;
}

.k3d-dashboard .profile-detail > span {
  color: #89948d;

  font-family: "Poppins", sans-serif;
  font-size: 9px;
  font-weight: 500;
}

.k3d-dashboard .profile-detail > strong {
  color: #26382d;

  font-family: "Poppins", sans-serif;
  font-size: 11px;
  font-weight: 600;
}

.k3d-dashboard .role-badge {
  width: fit-content;

  padding: 4px 8px;

  border-radius: 6px;

  background: #e7f6eb;
  color: #08783d;

  font-family: "Poppins", sans-serif;
  font-size: 9px;
  font-weight: 600;
}

.k3d-dashboard .popup-logout {
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
    background 0.16s ease,
    border-color 0.16s ease;
}

.k3d-dashboard .popup-logout:hover {
  background: #fff0f0;
  border-color: #ebc2c2;
}

.k3d-dashboard .popup-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.k3d-dashboard .logout-icon {
  font-size: 14px;
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

          .k3d-dashboard .profile-info {
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
            width: 64px !important;
            height: 32px !important;
            flex-basis: 64px !important;
          }

          .k3d-dashboard .logo img {
            max-width: 64px !important;
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

          .k3d-dashboard .k3d-filter-actions {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            flex-wrap: nowrap;
            grid-column: 1 / -1;
          }

          .k3d-dashboard .k3d-apply-button {
            width: auto;
            flex: 1 1 auto;
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
            width: 60px !important;
            height: 30px !important;
            flex-basis: 60px !important;
          }

          .k3d-dashboard .logo img {
            max-width: 60px !important;
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

        /* Final mobile navbar match with Data Temuan. */
        @media (max-width: 768px) {
          .k3d-dashboard .nav .profile-wrapper {
            width: auto !important;
            flex: 0 0 auto !important;
          }

          .k3d-dashboard .nav .profile-button {
            width: 38px !important;
            min-width: 38px !important;
            height: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
          }

          .k3d-dashboard .nav .profile-info,
          .k3d-dashboard .nav .profile-chevron {
            display: none !important;
          }

          .k3d-dashboard .nav .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
          }

          .k3d-dashboard .nav .nav-logout {
            display: none !important;
          }
        }

        @media (max-width: 390px) {

          .k3d-dashboard {
            padding-top: 58px !important;
          }

          .k3d-dashboard .logo {
            width: 56px !important;
            height: 28px !important;
            flex-basis: 56px !important;
          }

          .k3d-dashboard .logo img {
            max-width: 56px !important;
          }

          .k3d-dashboard .nav {
            max-width: 80vw !important;
          }

          .k3d-dashboard .nav a,
          .k3d-dashboard .nav-maintenance,
          .k3d-dashboard .nav-login,
          .k3d-dashboard .nav-logout {
            padding: 6px 5px !important;
            font-size: 12px !important;
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

        /* Match the Data Temuan mobile navbar layout. */
        @media (max-width: 768px) {
          .k3d-dashboard .topbar {
            min-height: 66px !important;
            height: 66px !important;
            padding: 7px 11px !important;
            gap: 8px !important;
          }

          .k3d-dashboard .brand {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            max-width: calc(100% - 52px) !important;
            gap: 0 !important;
          }

          .k3d-dashboard .logo {
            width: 82px !important;
            height: 40px !important;
            min-width: 82px !important;
            flex: 0 0 82px !important;
          }

          .k3d-dashboard .logo img {
            width: 100% !important;
            max-width: 82px !important;
          }

          .k3d-dashboard .brand-text {
            display: flex !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            flex-direction: column !important;
            gap: 2px !important;
            line-height: 1.15 !important;
          }

          .k3d-dashboard .brand-text b {
            font-size: 12px !important;
            line-height: 1.15 !important;
            white-space: nowrap !important;
          }

          .k3d-dashboard .brand-text span {
            font-size: 8px !important;
            line-height: 1.15 !important;
            white-space: normal !important;
          }

          .k3d-dashboard .nav {
            position: fixed !important;
            top: 66px !important;
            left: 10px !important;
            right: 10px !important;
            display: none !important;
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            width: auto !important;
            max-width: none !important;
            min-width: 0 !important;
            height: auto !important;
            gap: 5px !important;
            padding: 10px !important;
            background: #ffffff !important;
            border: 1px solid #dfe7e1 !important;
            border-radius: 14px !important;
            box-shadow: 0 12px 30px rgba(24, 45, 32, 0.14) !important;
            overflow: visible !important;
            z-index: 1200 !important;
          }

          .k3d-dashboard .nav:not(.mobile-nav-open) {
            display: none !important;
          }

          .k3d-dashboard .nav.mobile-nav-open {
            display: flex !important;
          }

          .k3d-dashboard .nav > a {
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            min-height: 42px !important;
            height: 42px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            flex: 0 0 42px !important;
            align-self: stretch !important;
            box-sizing: border-box !important;
            padding: 10px 12px !important;
            border-radius: 9px !important;
            text-align: left !important;
          }

          .k3d-dashboard .nav > a:global(.nav-users-button) {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            min-width: 0 !important;
            min-height: 27px !important;
            height: 27px !important;
            flex: 0 0 27px !important;
            padding: 0 10px !important;
            gap: 5px !important;
            border: 1px solid #16833f !important;
            border-radius: 7px !important;
            background: #16833f !important;
            color: #ffffff !important;
            font-family: "Poppins", sans-serif !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            line-height: 1.1 !important;
            text-align: center !important;
            white-space: nowrap !important;
          }

          .k3d-dashboard .nav :global(.profile-popup) {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(298px, calc(100vw - 20px)) !important;
            max-width: calc(100vw - 20px) !important;
          }

          .k3d-dashboard .nav .profile-wrapper {
            display: flex !important;
            width: auto !important;
            flex: 0 0 auto !important;
            margin-left: 0 !important;
          }

          .k3d-dashboard .nav .profile-button {
            width: 38px !important;
            min-width: 38px !important;
            height: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
          }

          .k3d-dashboard .nav .profile-info,
          .k3d-dashboard .nav .profile-chevron,
          .k3d-dashboard .nav .nav-logout {
            display: none !important;
          }

          .k3d-dashboard .nav .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
          }

          :global(.k3d-dashboard .nav > a.nav-users-button) {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 27px !important;
            height: 27px !important;
            flex: 0 0 27px !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 10px !important;
            gap: 5px !important;
            border-radius: 7px !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            line-height: 1.1 !important;
            text-align: center !important;
          }

          :global(.k3d-dashboard .nav .profile-popup) {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(298px, calc(100vw - 20px)) !important;
            max-width: calc(100vw - 20px) !important;
          }

          .k3d-dashboard .mobile-menu-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
          }

          .k3d-dashboard .mobile-menu-button {
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

          .k3d-dashboard .mobile-menu-button span {
            display: block !important;
            width: 20px !important;
            height: 2px !important;
            background: #087f3f !important;
            border-radius: 999px !important;
          }
        }

        @media (max-width: 480px) {
          .k3d-dashboard .topbar {
            min-height: 60px !important;
            height: 60px !important;
            padding: 7px 8px !important;
            gap: 5px !important;
          }

          .k3d-dashboard .nav {
            top: 60px !important;
            left: 10px !important;
            right: 10px !important;
            max-width: none !important;
            gap: 3px !important;
          }

          .k3d-dashboard .brand {
            max-width: calc(100% - 52px) !important;
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
          gap: 8px;
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

        .k3d-open-follow-up-button {
          display: inline-flex;
          align-items: center;
          padding: 9px 15px;
          border: 1px solid #176b3a;
          border-radius: 8px;
          background: #ffffff;
          color: #176b3a;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
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
  min-height: 440px;
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
  font-size: 10px;
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
  /* =====================================================
   NAVBAR DESKTOP
   MENYAMAKAN DENGAN NAVBAR FORM INSPEKSI
   MOBILE TIDAK DIUBAH
===================================================== */

@media (min-width: 901px) {

}
  .k3d-dashboard .topbar {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 99999 !important;

    min-height: 78px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;

    gap: 20px !important;
    padding: 10px clamp(18px, 4vw, 54px) !important;

    background: rgba(255,255,255,.96) !important;
    border-bottom: 1px solid #e3eae5 !important;

    box-shadow: none !important;

    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;

    transform: none !important;
    isolation: auto !important;
  }

  .k3d-dashboard .brand {
    display: flex !important;
    align-items: center !important;

    gap: 12px !important;

    min-width: 0 !important;
    flex: 0 1 auto !important;
  }

  .k3d-dashboard .brand-logo-link {
    display: flex !important;
    align-items: center !important;

    text-decoration: none !important;
    flex-shrink: 0 !important;
  }

  .k3d-dashboard .logo {
    width: 82px !important;
    height: 40px !important;

    flex: 0 0 82px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    overflow: hidden !important;
    background: transparent !important;
  }

  .k3d-dashboard .logo img {
    display: block !important;

    width: 100% !important;
    max-width: 82px !important;
    height: auto !important;

    object-fit: contain !important;
  }

  .k3d-dashboard .brand-text {
    display: flex !important;
    flex-direction: column !important;

    gap: 2px !important;

    min-width: 0 !important;
    line-height: 1.2 !important;
  }

  .k3d-dashboard .brand-text b {
    color: #0d2618 !important;

    font-size: 15px !important;
    font-weight: 800 !important;

    line-height: 1.2 !important;
    white-space: nowrap !important;
  }

  .k3d-dashboard .brand-text span {
    color: #87928b !important;

    font-size: 11px !important;
    font-weight: 600 !important;

    line-height: 1.2 !important;
    white-space: nowrap !important;
  }

  .k3d-dashboard .nav {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;

    gap: 7px !important;

    flex: 0 0 auto !important;

    font-family: "Poppins", sans-serif !important;
    font-weight: 600 !important;
  }

  .k3d-dashboard .nav-page {
    position: relative !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;

    min-height: 42px !important;

    border: 0 !important;
    border-radius: 10px !important;

    padding: 10px 13px !important;

    background: transparent !important;
    color: #5f6c64 !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;

    text-decoration: none !important;
    white-space: nowrap !important;

    transition:
      background .16s ease,
      color .16s ease,
      transform .16s ease !important;
  }

  .k3d-dashboard .nav-page:hover {
    background: #f1f6f2 !important;
    color: #123d25 !important;
  }

  .k3d-dashboard .nav-page.active {
    min-width: 112px !important;

    color: #08783d !important;
    background: #edf8f1 !important;

    border-bottom: 2px solid #079447 !important;
    border-radius: 10px !important;
  }

  .k3d-dashboard .nav-page.active::after {
    display: none !important;
  }

  .k3d-dashboard .profile-wrapper {
    position: relative !important;

    display: flex !important;
    align-items: center !important;

    flex: 0 0 auto !important;
  }

  .k3d-dashboard .profile-button {
    min-width: 145px !important;
    height: 44px !important;
    min-height: 44px !important;

    display: flex !important;
    align-items: center !important;

    gap: 9px !important;

    padding: 4px 10px 4px 7px !important;

    border: 1px solid #dbe5de !important;
    border-radius: 12px !important;

    background: #ffffff !important;
    color: #0d2618 !important;

    font-family: "Poppins", sans-serif !important;
    font-weight: 600 !important;

    text-align: left !important;

    box-shadow: none !important;
    transform: none !important;
  }

  .k3d-dashboard .profile-button:hover,
  .k3d-dashboard .profile-button-open {
    background: #f8fbf9 !important;
    border-color: #cbdacf !important;

    box-shadow: none !important;
    transform: none !important;
  }

  .k3d-dashboard .profile-avatar {
    width: 34px !important;
    height: 34px !important;
    min-width: 34px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    border-radius: 50% !important;

    background: #079447 !important;
    color: #ffffff !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;

    box-shadow: none !important;
  }

  .k3d-dashboard .profile-info {
    min-width: 0 !important;

    flex: 1 1 auto !important;

    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;

    gap: 0 !important;

    overflow: hidden !important;
  }

  .k3d-dashboard .profile-info strong {
    overflow: hidden !important;

    color: #25362c !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 11px !important;
    font-weight: 600 !important;

    line-height: 1.05 !important;

    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .k3d-dashboard .profile-info small {
    margin-top: 4px !important;

    color: #7c8981 !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 8px !important;
    font-weight: 600 !important;

    line-height: 1.05 !important;
  }

  .k3d-dashboard .profile-chevron {
    margin-left: 2px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    color: #7c8981 !important;

    font-size: 8px !important;
    line-height: 1 !important;

    transform: translateY(-1px) !important;
  }

  .k3d-dashboard .nav-logout {
    min-height: 30px !important;

    border: 1px solid #d9e3dc !important;
    border-radius: 7px !important;

    padding: 5px 9px !important;

    background: #ffffff !important;
    color: #304037 !important;

    font-family: "Poppins", sans-serif !important;
    font-size: 10px !important;
    font-weight: 600 !important;

    white-space: nowrap !important;

    box-shadow: none !important;
  }

  .k3d-dashboard .nav-logout:hover {
    background: #f7faf8 !important;
    color: #123d25 !important;

    border-color: #cbd8cf !important;

    transform: none !important;
  }

  .k3d-dashboard .nav-users-button {
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
    font-family: "Poppins", sans-serif !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
    white-space: nowrap !important;
    text-decoration: none !important;
  }

  .k3d-dashboard .nav-users-button:hover {
    background: #117236 !important;
    border-color: #117236 !important;
    color: #ffffff !important;
  }

  .k3d-dashboard .nav-logout {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: auto !important;
    min-width: 0 !important;
    flex: 0 0 auto !important;
    box-sizing: border-box !important;
    min-height: 30px !important;
    height: 30px !important;
    padding: 5px 9px !important;
    border-radius: 7px !important;
    font-size: 10px !important;
    line-height: 1.1 !important;
    white-space: nowrap !important;
  }

  .k3d-dashboard {
    padding-top: 78px !important;
  }

}

/* =====================================================
   CUSTOM DROPDOWN FILTER
===================================================== */

/* =====================================================
   TAMPILAN DROPDOWN - HANYA STYLE
===================================================== */

.k3d-dashboard .k3d-dropdown {
  position: relative;
  width: 124px;
  min-width: 124px;
}

.k3d-dashboard .k3d-dropdown-button {
  width: 100% !important;
  height: 42px !important;

  padding: 0 34px 0 13px !important;

  border: 1px solid #d9e4dc !important;
  border-radius: 11px !important;

  background: #ffffff !important;
  color: #26352c !important;

  font-family: "Poppins", sans-serif !important;
  font-size: 11px !important;
  font-weight: 600 !important;

  outline: none !important;
  box-sizing: border-box !important;

  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease !important;
}

.k3d-dashboard .k3d-dropdown-button:hover {
  border-color: #a9c9b2 !important;
  background: #fbfdfb !important;
}

.k3d-dashboard .k3d-dropdown-button:focus {
  border-color: #079447 !important;
  box-shadow: 0 0 0 3px rgba(7, 148, 71, 0.08) !important;
}

.k3d-dashboard .k3d-dropdown-arrow {
  color: #68756d !important;
}

.k3d-dashboard .k3d-dropdown-button option {
  background: #ffffff;
  color: #26352c;
  font-family: "Poppins", sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 10px;
}

/* RESPONSIVE */
@media (max-width: 760px) {
  .k3d-dashboard .k3d-dropdown {
    width: 100%;
    min-width: 0;
  }

  .k3d-dashboard .k3d-dropdown-button {
    height: 42px !important;
  }
}


/* =====================================================
   MENU DROPDOWN
===================================================== */

.k3d-dashboard .k3d-dropdown-menu {
  position: absolute !important;

  top: calc(100% + 7px) !important;
  left: 0 !important;

  width: 100% !important;
  min-width: 180px !important;

  max-height: 270px !important;

  overflow-x: hidden !important;
  overflow-y: auto !important;

  padding: 5px !important;

  background: #ffffff !important;

  border: 1px solid #dfe7e1 !important;
  border-radius: 11px !important;

  box-shadow:
    0 16px 35px rgba(28, 53, 37, 0.14),
    0 4px 10px rgba(28, 53, 37, 0.06) !important;

  box-sizing: border-box !important;

  z-index: 999999 !important;

  animation: k3dDropdownAppear 0.16s ease-out !important;
}

@keyframes k3dDropdownAppear {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* =====================================================
   SETIAP PILIHAN
===================================================== */

.k3d-dashboard .k3d-dropdown-item {
  width: 100% !important;
  min-height: 37px !important;

  display: flex !important;
  align-items: center !important;

  gap: 7px !important;

  padding: 8px 9px !important;

  border: none !important;
  border-radius: 7px !important;

  background: transparent !important;
  color: #34453a !important;

  font-family: "Poppins", sans-serif !important;
  font-size: 11px !important;
  font-weight: 500 !important;

  text-align: left !important;

  cursor: pointer !important;
  box-sizing: border-box !important;

  transition:
    background 0.14s ease,
    color 0.14s ease !important;
}

.k3d-dashboard .k3d-dropdown-item:hover {
  background: #eef8f1 !important;
  color: #08783d !important;
}

.k3d-dashboard .k3d-dropdown-item-active {
  background: #e9f6ed !important;
  color: #08783d !important;
  font-weight: 700 !important;
}

.k3d-dashboard .k3d-dropdown-item-active:hover {
  background: #e1f2e6 !important;
}


/* =====================================================
   CENTANG
===================================================== */

.k3d-dashboard .k3d-dropdown-check {
  width: 17px !important;
  min-width: 17px !important;

  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  color: #08783d !important;

  font-size: 13px !important;
  font-weight: 800 !important;
}

.k3d-dashboard .k3d-dropdown-label {
  min-width: 0 !important;
  flex: 1 1 auto !important;

  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}


/* =====================================================
   SCROLLBAR
===================================================== */

.k3d-dashboard .k3d-dropdown-menu::-webkit-scrollbar {
  width: 5px !important;
}

.k3d-dashboard .k3d-dropdown-menu::-webkit-scrollbar-track {
  background: transparent !important;
}

.k3d-dashboard .k3d-dropdown-menu::-webkit-scrollbar-thumb {
  background: #cbd8cf !important;
  border-radius: 10px !important;
}

.k3d-dashboard .k3d-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #aebeb4 !important;
}


/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width: 760px) {
  .k3d-dashboard .k3d-dropdown {
    width: 100% !important;
    min-width: 0 !important;
  }

  .k3d-dashboard .k3d-dropdown-menu {
    width: 100% !important;
    min-width: 0 !important;
    max-height: 240px !important;
  }

  .k3d-dashboard .k3d-dropdown-button {
    height: 42px !important;
  }
}

@media (max-width: 480px) {
  .k3d-dashboard .k3d-dropdown {
    width: 100% !important;
  }

  .k3d-dashboard .k3d-dropdown-button {
    height: 40px !important;
    font-size: 10px !important;
  }

  .k3d-dashboard .k3d-dropdown-item {
    min-height: 36px !important;
    font-size: 10px !important;
  }
}

.k3d-dashboard .k3d-dropdown-button {
  color: #26352c !important;
  background: #ffffff !important;
  border-color: #d9e4dc !important;
  accent-color: #079447 !important;
}

.k3d-dashboard .k3d-dropdown-button:focus {
  border-color: #079447 !important;
  box-shadow: 0 0 0 3px rgba(7, 148, 71, 0.08) !important;
  outline: none !important;
}

.k3d-dashboard .k3d-dropdown-button option {
  color: #26352c !important;
  background: #ffffff !important;
}

.k3d-dashboard .k3d-dropdown-button option:checked {
  color: #08783d !important;
  background: #e9f6ed !important;
}
        .mobile-menu-wrapper,
        .mobile-menu-button {
          display: none;
        }

        @media (max-width: 768px) {
          .k3d-dashboard .brand-text {
            display: flex !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            flex-direction: column !important;
            gap: 2px !important;
          }

          .k3d-dashboard .brand-text b {
            font-size: 12px !important;
            line-height: 1.15 !important;
            white-space: nowrap !important;
          }

          .k3d-dashboard .brand-text span {
            font-size: 8px !important;
            line-height: 1.15 !important;
            white-space: normal !important;
          }

          .k3d-dashboard .nav {
            position: static !important;
            display: flex !important;
            flex-direction: row !important;
            width: auto !important;
            max-width: 46vw !important;
            min-width: 0 !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 0 !important;
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .k3d-dashboard .nav a {
            width: auto !important;
            min-height: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 6px 8px !important;
            border-radius: 9px !important;
          }

          .k3d-dashboard .nav .profile-wrapper {
            display: flex !important;
            width: 100% !important;
          }

          .k3d-dashboard .nav .profile-button {
            width: 100% !important;
            min-width: 0 !important;
            height: 42px !important;
            min-height: 42px !important;
            justify-content: flex-start !important;
            padding: 6px 12px !important;
            border-radius: 9px !important;
          }

          .k3d-dashboard .nav .profile-info {
            display: flex !important;
          }

          .k3d-dashboard .nav .profile-popup {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(298px, calc(100vw - 20px)) !important;
          }

          .k3d-dashboard .nav .nav-logout {
            display: none !important;
          }

          .k3d-dashboard .mobile-menu-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
          }

          .k3d-dashboard .mobile-menu-button {
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

          .k3d-dashboard .mobile-menu-button span {
            display: block !important;
            width: 20px !important;
            height: 2px !important;
            background: #087f3f !important;
            border-radius: 999px !important;
          }

          .k3d-dashboard .mobile-menu-button-open span:nth-child(1) {
            transform: translateY(7px) rotate(45deg) !important;
          }

          .k3d-dashboard .mobile-menu-button-open span:nth-child(2) {
            opacity: 0 !important;
          }

          .k3d-dashboard .mobile-menu-button-open span:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg) !important;
          }

          .k3d-dashboard .nav .nav-login {
            gap: 2px !important;
            padding: 2px 4px !important;
            font-size: 7px !important;
            line-height: 1 !important;
            border-radius: 7px !important;
          }

          .k3d-dashboard .dashboard-add-finding {
            padding: 4px 6px !important;
            font-size: 8px !important;
          }

          .k3d-dashboard .nav .nav-login-icon {
            width: 8px !important;
            height: 8px !important;
          }

          .k3d-dashboard .nav.nav-public {
            width: auto !important;
            max-width: none !important;
            flex: 0 0 auto !important;
            overflow: visible !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login {
            gap: 8px !important;
            min-height: 40px !important;
            padding: 8px 14px !important;
            font-size: 12px !important;
            line-height: 1.1 !important;
            border-radius: 999px !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login-icon {
            width: 12px !important;
            height: 12px !important;
          }
        }
        .k3d-dashboard .nav-logout-icon,
        .k3d-dashboard .nav-login-door-icon {
          display: none;
        }

        .k3d-dashboard .profile-logout {
          display: none;
        }

        @media (max-width: 768px) {
          .k3d-dashboard .nav {
            position: fixed !important;
            top: 66px !important;
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
            box-shadow: 0 12px 30px rgba(24, 45, 32, 0.14) !important;
            overflow: visible !important;
            z-index: 1200 !important;
          }

          .k3d-dashboard .nav.mobile-nav-open {
            display: flex !important;
          }

          .k3d-dashboard .nav > a {
            width: 100% !important;
            min-height: 42px !important;
            justify-content: flex-start !important;
            padding: 10px 12px !important;
          }

          .k3d-dashboard .nav .profile-popup {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(298px, calc(100vw - 20px)) !important;
          }

          .k3d-dashboard .profile-logout {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 7px !important;
            width: 100% !important;
            min-height: 34px !important;
            border: 0 !important;
            border-radius: 8px !important;
            background: #fff5f5 !important;
            color: #a12d2d !important;
            font: 600 11px/1 "Poppins", sans-serif !important;
            cursor: pointer !important;
          }

          .k3d-dashboard .profile-logout svg {
            width: 16px !important;
            height: 16px !important;
          }

          .k3d-dashboard .nav .nav-users-button {
            width: 100% !important;
            min-height: 42px !important;
            justify-content: center !important;
            padding: 10px 12px !important;
          }

          .k3d-dashboard .nav .nav-logout {
            display: none !important;
          }

          .k3d-dashboard .nav .profile-wrapper {
            width: auto !important;
            flex: 0 0 auto !important;
          }

          .k3d-dashboard .nav .profile-button {
            width: 38px !important;
            min-width: 38px !important;
            height: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
          }

          .k3d-dashboard .nav .profile-info,
          .k3d-dashboard .nav .profile-chevron {
            display: none !important;
          }

          .k3d-dashboard .nav .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
          }

          .k3d-dashboard .nav .nav-logout {
            display: none !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login {
            width: 38px !important;
            min-width: 38px !important;
            height: 36px !important;
            min-height: 36px !important;
            padding: 0 !important;
            gap: 0 !important;
            border-radius: 9px !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login-avatar {
            width: 22px !important;
            height: 22px !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login-icon,
          .k3d-dashboard .nav.nav-public .nav-login-label {
            display: none !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login-door-icon {
            display: block !important;
            width: 16px !important;
            height: 16px !important;
          }
        }

        /* Public Dashboard keeps the original single Login icon. */
        @media (max-width: 768px) {
          .k3d-dashboard .nav.nav-public {
            position: static !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            display: flex !important;
            flex-direction: row !important;
            width: auto !important;
            max-width: none !important;
            padding: 0 !important;
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .k3d-dashboard .nav.nav-public + .mobile-menu-wrapper {
            display: none !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login {
            width: 42px !important;
            min-width: 42px !important;
            height: 42px !important;
            min-height: 42px !important;
            padding: 0 !important;
            border: 1px solid #dfe7e1 !important;
            border-radius: 10px !important;
            background: #ffffff !important;
            color: #087f3f !important;
            box-shadow: none !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login-avatar {
            width: 100% !important;
            height: 100% !important;
            border: 0 !important;
            background: transparent !important;
          }

          .k3d-dashboard .nav.nav-public .nav-login-door-icon {
            color: #087f3f !important;
          }
        }

        /* Match the authenticated mobile navbar used by Data Temuan. */
        @media (max-width: 768px) {
          .k3d-dashboard .nav.nav-authenticated .profile-wrapper {
            width: auto !important;
            flex: 0 0 auto !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open {
            position: fixed !important;
            top: 66px !important;
            left: 10px !important;
            right: 10px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            width: auto !important;
            max-width: none !important;
            max-height: calc(100vh - 78px) !important;
            overflow-y: auto !important;
            padding: 10px !important;
            gap: 5px !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open > a:not(.nav-users-button) {
            display: flex !important;
            width: 100% !important;
            min-width: 100% !important;
            min-height: 42px !important;
            box-sizing: border-box !important;
            justify-content: flex-start !important;
            text-align: left !important;
            padding: 10px 12px !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open .profile-wrapper {
            width: 100% !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open .profile-button {
            align-self: flex-start !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open .profile-popup {
            position: fixed !important;
            top: 61px !important;
            left: auto !important;
            right: 10px !important;
            width: min(298px, calc(100vw - 20px)) !important;
            max-width: calc(100vw - 20px) !important;
            max-height: calc(100vh - 73px) !important;
            overflow-y: auto !important;
          }

          .k3d-dashboard .nav.nav-authenticated .profile-button {
            width: 38px !important;
            min-width: 38px !important;
            height: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
          }

          .k3d-dashboard .nav.nav-authenticated .profile-info,
          .k3d-dashboard .nav.nav-authenticated .profile-chevron {
            display: none !important;
          }

          .k3d-dashboard .nav.nav-authenticated .profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
          }

          .k3d-dashboard .nav.nav-authenticated .nav-logout {
            display: none !important;
          }

          .k3d-dashboard .nav.nav-authenticated .nav-users-button {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            min-width: 0 !important;
            min-height: 27px !important;
            height: 27px !important;
            flex: 0 0 27px !important;
            padding: 0 10px !important;
            border-radius: 7px !important;
            gap: 5px !important;
            font-family: "Poppins", sans-serif !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            line-height: 1.1 !important;
            text-align: center !important;
            white-space: nowrap !important;
          }
        }

        @media (max-width: 480px) {
          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open {
            top: 60px !important;
            left: 10px !important;
            right: 10px !important;
            width: auto !important;
            max-width: 77vw !important;
            gap: 3px !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open > a {
            min-height: 42px !important;
            height: 42px !important;
            padding: 10px 12px !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          .k3d-dashboard .nav.nav-authenticated.mobile-nav-open .nav-users-button {
            min-height: 27px !important;
            height: 27px !important;
            flex-basis: 27px !important;
            padding: 0 10px !important;
            font-size: 10px !important;
            line-height: 1.1 !important;
          }

          :global(.k3d-dashboard .nav.nav-authenticated.mobile-nav-open > a.nav-page) {
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          :global(.k3d-dashboard .nav.nav-authenticated.mobile-nav-open > a.nav-users-button) {
            font-size: 10px !important;
            line-height: 1.1 !important;
          }

          .k3d-dashboard .topbar .logo {
            width: 82px !important;
            height: 39px !important;
            min-width: 82px !important;
            flex: 0 0 82px !important;
          }

          .k3d-dashboard .topbar .logo img {
            width: 82px !important;
            max-width: 82px !important;
            height: 39px !important;
            max-height: 39px !important;
            object-fit: contain !important;
          }
        }
      `}</style>

    </main>
  );
}
