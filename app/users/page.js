"use client";

import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  id_user: null,
  nama_lengkap: "",
  username: "",
  email: "",
  no_hp: "",
  role: "INSPECTOR",
  aktif: true,
  akses_dashboard: false,
  akses_form_inspeksi: false,
  akses_data_temuan: false,
  kelola_user: false,
  password: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("SEMUA");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [activeTab, setActiveTab] = useState("users");
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileRef = useRef(null);

  const role = currentUser?.role || "-";
  const fullName = currentUser?.nama_lengkap || "Pengguna";

  const initial =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  const visibleUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        [user.nama_lengkap, user.username, user.email, user.no_hp, user.role].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
        );

      const matchesRole =
        roleFilter === "SEMUA" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "SEMUA" ||
        (statusFilter === "AKTIF" ? user.aktif : !user.aktif);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter((user) => user.aktif).length;
  const inactiveCount = users.length - activeCount;
  const permissionCount = users.filter(
    (user) => user.kelola_user
  ).length;

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Gagal mengambil data user."
        );
      }

      setUsers(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivityLogs() {
    setLogsLoading(true);
    try {
      const response = await fetch("/api/activity-logs", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengambil audit log.");
      setActivityLogs(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    loadActivityLogs();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function clearActivityLogs() {
    if (!window.confirm("Hapus seluruh riwayat audit log? Tindakan ini tidak dapat dibatalkan.")) return;

    setClearingLogs(true);
    setError("");
    try {
      const response = await fetch("/api/activity-logs", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghapus audit log.");
      setActivityLogs([]);
      setMessage("Audit log berhasil dihapus.");
    } catch (clearError) {
      setError(clearError.message);
    } finally {
      setClearingLogs(false);
    }
  }

  function formatLogTime(value) {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value));
  }

  useEffect(() => {
    fetch("/api/auth/me", {
      cache: "no-store",
    })
      .then(async (response) => {
        const result = await response.json();

        if (response.ok && result.success) {
          setCurrentUser(result.user);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    function closeProfile(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfile);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeProfile
      );
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

      window.location.replace("/login");
    }
  }

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAllAccess(value) {
    setForm((current) => ({
      ...current,
      akses_dashboard: value,
      akses_form_inspeksi: value,
      akses_data_temuan: value,
      kelola_user: value,
    }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setMessage("");
    setError("");
    setOpen(true);
  }

  function openEdit(user) {
    setForm({
      ...EMPTY_FORM,
      ...user,
      no_hp: user.no_hp || "",
      password: "",
    });
    setShowPassword(false);

    setMessage("");
    setError("");
    setOpen(true);
  }

  function openAccessEdit(user) {
    openEdit(user);
    setMessage(
      `Mengatur hak akses ${user.nama_lengkap}.`
    );
  }

  async function saveUser(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const editing = Boolean(form.id_user);

      const response = await fetch("/api/users", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Gagal menyimpan user."
        );
      }

      const successMessage = editing
        ? "User berhasil diperbarui."
        : "User berhasil ditambahkan.";

      setOpen(false);
      setMessage("");
      await loadUsers();
      setToast(successMessage);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="users-page">
      <header className="users-topbar">
        <div className="users-brand">
          <Link
            href="/temuan"
            className="users-brand-logo"
            aria-label="Data Temuan"
          >
            <img
              src="/ggf-estate-pg01.png"
              alt="Sistem Manajemen Informasi Estate PG1"
            />
          </Link>

          <div className="users-brand-text">
            <b>Manajemen User</b>
            <span>
              Sistem Manajemen Informasi Estate PG1
            </span>
          </div>
        </div>

        <nav
          className={`users-nav ${showMobileNav ? "mobile-nav-open" : ""
            }`}
          aria-label="Navigasi utama"
        >
          <Link
            href="/dashboard"
            className="users-nav-page users-nav-page-dashboard"
          >
            Dashboard
          </Link>

          <div className="users-nav-mobile-row">
            <Link
              href="/temuan"
              className="users-nav-page"
            >
              Data Temuan
            </Link>

            <Link href="/inspeksi" className="users-nav-page">
              Form Inspeksi
            </Link>
          </div>

          <div
            className="users-profile-wrapper"
            ref={profileRef}
          >
            <button
              type="button"
              className="users-profile-button"
              onClick={() =>
                setProfileOpen((value) => !value)
              }
              aria-expanded={profileOpen}
            >
              <span className="users-profile-avatar">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.2"
                    fill="currentColor"
                  />
                  <path
                    d="M5.5 19.2c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <span className="users-profile-text">
                <strong>{fullName}</strong>

                <small
                  className={
                    role === "ADMIN_DEVELOPER"
                      ? "users-role-admin-developer"
                      : ""
                  }
                >
                  {role === "ADMIN_DEVELOPER" && (
                    <span className="users-role-active-dot" />
                  )}

                  {role === "ADMIN_DEVELOPER"
                    ? "ADMIN DEVELOPER"
                    : role}
                </small>
              </span>
              <span className="users-profile-chevron">
                ▴
              </span>
            </button>

            {profileOpen && (
              <div className="users-profile-popup">
                <div className="users-profile-popup-header">
                  <span className="users-profile-avatar">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="3.2"
                        fill="currentColor"
                      />
                      <path
                        d="M5.5 19.2c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5"
                        fill="currentColor"
                      />
                    </svg>
                  </span>

                  <span>
                    <strong>{fullName}</strong>
                    <small>{role}</small>
                  </span>
                </div>

                <div className="users-profile-divider" />

                <div className="users-profile-detail">
                  <small>Nama Lengkap</small>
                  <strong>{fullName}</strong>
                </div>

                <div className="users-profile-detail">
                  <small>Username</small>
                  <strong>
                    {currentUser?.username || "-"}
                  </strong>
                </div>

                <div className="users-profile-detail">
                  <small>Role</small>
                  <span
                    className={`users-role-badge ${role === "ADMIN_DEVELOPER"
                      ? "users-role-admin-developer"
                      : ""
                      }`}
                  >
                    {role === "ADMIN_DEVELOPER"
                      ? "ADMIN DEVELOPER"
                      : role}
                  </span>
                </div>
                <div className="users-profile-divider" />
              </div>
            )}
          </div>

          <button
            type="button"
            className="users-nav-logout"
            onClick={() => setShowLogoutConfirm(true)}
            disabled={loggingOut}
          >
            <span>
              {loggingOut
                ? "Memproses..."
                : "Logout"}
            </span>
          </button>

          <Link
            href="/users"
            className="users-nav-manage"
            onClick={() => setProfileOpen(false)}
          >
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="11"
                height="11"
                fill="none"
              >
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
        </nav>

        <div className="users-mobile-menu-wrapper">
          <button
            type="button"
            className={`users-mobile-menu-button ${showMobileNav
              ? "users-mobile-menu-button-open"
              : ""
              }`}
            onClick={() =>
              setShowMobileNav((value) => !value)
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

      <header className="users-header">
        <div>
          <h1>Manajemen User</h1>
          <p>
            Kelola akun, role, status, dan permission
            akses sistem.
          </p>
        </div>

        <button
          type="button"
          className="users-primary"
          onClick={openCreate}
        >
          <span aria-hidden="true">+</span>
          Tambah User
        </button>
      </header>

      <div className="users-tabs" role="tablist" aria-label="Menu kelola akses">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          className={activeTab === "users" ? "is-active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Manajemen User
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "logs"}
          className={activeTab === "logs" ? "is-active" : ""}
          onClick={() => {
            setActiveTab("logs");
            loadActivityLogs();
          }}
        >
          Log Aktifitas
        </button>
      </div>

      {message && (
        <div className="users-message">
          {message}
        </div>
      )}

      {error && (
        <div className="users-error">
          {error}
        </div>
      )}

      {toast && (
        <div className="users-toast" role="status">
          <span aria-hidden="true">✓</span>
          {toast}
        </div>
      )}

      {activeTab === "users" ? <>
        <section
          className="users-summary"
          aria-label="Ringkasan user"
        >
          <article>
            <span>Total User</span>
            <strong>{users.length}</strong>
            <small>Seluruh akun</small>
          </article>

          <article>
            <span>User Aktif</span>
            <strong>{activeCount}</strong>
            <small>Siap digunakan</small>
          </article>

          <article>
            <span>User Nonaktif</span>
            <strong>{inactiveCount}</strong>
            <small>Akses dinonaktifkan</small>
          </article>

          <article>
            <span>Kelola User</span>
            <strong>{permissionCount}</strong>
            <small>Memiliki permission</small>
          </article>
        </section>

        {false && <section className="users-panel">
          <div className="users-toolbar">
            <label className="users-search">
              <span aria-hidden="true">âŒ•</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari nama, username, email..."
                aria-label="Cari user"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              aria-label="Filter role"
            >
              <option value="SEMUA">Semua Role</option>
              <option value="ADMIN_DEVELOPER">Admin Developer</option>
              <option value="ADMIN_SISTEM_MUTU">Admin Sistem Mutu</option>
              <option value="ADMIN">Admin</option>
              <option value="ADMIN_INSPECTOR">Admin Inspector</option>
              <option value="INSPECTOR">Inspector</option>
              <option value="TEAM_WILAYAH">Team Wilayah</option>
              <option value="PIC">PIC</option>
              <option value="VIEWER">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter status"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
          </div>

          <div className="users-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Akses Dashboard</th><th>Kelola User</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="users-empty">Memuat data user...</td></tr>
                ) : visibleUsers.length === 0 ? (
                  <tr><td colSpan="8" className="users-empty">Belum ada user.</td></tr>
                ) : (
                  visibleUsers.map((user) => (
                    <tr key={user.id_user}>
                      <td>{user.nama_lengkap}</td><td>{user.username}</td><td>{user.email || "-"}</td>
                      <td><span className={`users-badge role-${String(user.role).toLowerCase()}`}>{user.role}</span></td>
                      <td><span className={`users-badge ${user.aktif ? "status-active" : "status-inactive"}`}>{user.aktif ? "Aktif" : "Nonaktif"}</span></td>
                      <td>{user.akses_dashboard ? "Ya" : "Tidak"}</td><td>{user.kelola_user ? "Ya" : "Tidak"}</td>
                      <td><div className="users-actions">
                        <button type="button" className="users-action" onClick={() => openEdit(user)} title="Edit data user" aria-label={`Edit data ${user.username}`}>Edit</button>
                        <button type="button" className="users-access-action" onClick={() => openAccessEdit(user)} title="Edit hak akses" aria-label={`Edit hak akses ${user.username}`}>Akses</button>
                      </div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>}
      </> : (
        <section className="users-panel users-audit-panel">
          <div className="users-audit-head">
            <div>
              <h2>Log Aktifitas</h2>
              <p>Riwayat login, logout, pembuatan user, dan perubahan hak akses.</p>
            </div>
            <button
              type="button"
              className="users-danger"
              onClick={clearActivityLogs}
              disabled={clearingLogs || activityLogs.length === 0}
            >
              {clearingLogs ? "Menghapus..." : "Hapus Log"}
            </button>
          </div>

          <div className="users-table-wrap users-audit-table-wrap">
            <table className="users-audit-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Deskripsi Aktivitas</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr><td colSpan="4" className="users-empty">Memuat audit log...</td></tr>
                ) : activityLogs.length === 0 ? (
                  <tr><td colSpan="4" className="users-empty">Belum ada aktivitas yang tercatat.</td></tr>
                ) : activityLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="users-log-time">{formatLogTime(log.created_at)}</td>
                    <td>
                      <strong>{log.actor_name}</strong>
                      <small>@{log.actor_username || "sistem"} {log.actor_role ? `(${log.actor_role})` : ""}</small>
                    </td>
                    <td><span className={`users-log-action action-${String(log.action).toLowerCase()}`}>{String(log.action).replaceAll("_", " ")}</span></td>
                    <td className="users-log-description">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Manajemen user ditampilkan pada tab di atas. */}
      {activeTab === "users" && <section className="users-panel">
        <div className="users-toolbar">
          <label className="users-search">
            <span aria-hidden="true">⌕</span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nama, username, email..."
              aria-label="Cari user"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
            aria-label="Filter role"
          >
            <option value="SEMUA">
              Semua Role
            </option>
            <option value="ADMIN_DEVELOPER">
              Admin Developer
            </option>
            <option value="ADMIN_SISTEM_MUTU">
              Admin Sistem Mutu
            </option>
            <option value="ADMIN">
              Admin
            </option>
            <option value="ADMIN_INSPECTOR">
              Admin Inspector
            </option>
            <option value="INSPECTOR">
              Inspector
            </option>
            <option value="TEAM_WILAYAH">
              Team Wilayah
            </option>
            <option value="PIC">
              PIC
            </option>
            <option value="VIEWER">
              Viewer
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter status"
          >
            <option value="SEMUA">
              Semua Status
            </option>
            <option value="AKTIF">
              Aktif
            </option>
            <option value="NONAKTIF">
              Nonaktif
            </option>
          </select>
        </div>

        <div className="users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Email</th>
                <th>No. Handphone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Akses Dashboard</th>
                <th>Kelola User</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="users-empty"
                  >
                    Memuat data user...
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="users-empty"
                  >
                    Belum ada user.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr key={user.id_user}>
                    <td>{user.nama_lengkap}</td>
                    <td>{user.username}</td>
                    <td>
                      {user.email || "-"}
                    </td>
                    <td>
                      {user.no_hp || "-"}
                    </td>

                    <td>
                      <span
                        className={`users-badge role-${String(
                          user.role
                        ).toLowerCase()}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-badge ${user.aktif
                          ? "status-active"
                          : "status-inactive"
                          }`}
                      >
                        {user.aktif
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>
                    </td>

                    <td>
                      {user.akses_dashboard
                        ? "Ya"
                        : "Tidak"}
                    </td>

                    <td>
                      {user.kelola_user
                        ? "Ya"
                        : "Tidak"}
                    </td>

                    <td>
                      <div className="users-actions">
                        <button
                          type="button"
                          className="users-action"
                          onClick={() =>
                            openEdit(user)
                          }
                          title="Edit data user"
                          aria-label={`Edit data ${user.username}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="m4 16-.8 4.8L8 20l11.2-11.2a2.8 2.8 0 0 0-4-4L4 16Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="m13.8 6.2 4 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="users-access-action"
                          onClick={() =>
                            openAccessEdit(user)
                          }
                          title="Edit hak akses"
                          aria-label={`Edit hak akses ${user.username}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 3.5 19 6v5.3c0 4.3-2.8 7.5-7 9.2-4.2-1.7-7-4.9-7-9.2V6l7-2.5Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="m9.2 12 1.8 1.8 3.8-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>}

      {open && (
        <div
          className="users-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setOpen(false);
            }
          }}
        >
          <form
            className="users-modal"
            onSubmit={saveUser}
          >
            <div className="users-modal-head">
              <h2>
                {form.id_user
                  ? "Edit User"
                  : "Tambah User"}
              </h2>

              <button
                type="button"
                className="users-close"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <div className="users-modal-body">
              <label>
                Nama Lengkap
                <input
                  value={form.nama_lengkap}
                  onChange={(event) =>
                    updateField(
                      "nama_lengkap",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                Username
                <input
                  value={form.username}
                  onChange={(event) =>
                    updateField(
                      "username",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                No. Handphone (WhatsApp)
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={form.no_hp}
                  onChange={(event) =>
                    updateField(
                      "no_hp",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Role
                <select
                  value={form.role}
                  onChange={(event) =>
                    updateField(
                      "role",
                      event.target.value
                    )
                  }
                >
                  <option value="ADMIN">
                    Admin
                  </option>
                  <option value="INSPECTOR">
                    Inspector
                  </option>
                  <option value="ADMIN_INSPECTOR">
                    Admin dan Inspector
                  </option>
                  <option value="ADMIN_DEVELOPER">
                    Admin Developer
                  </option>
                  <option value="ADMIN_SISTEM_MUTU">
                    Admin Sistem Mutu
                  </option>
                  <option value="TEAM_WILAYAH">
                    Team Wilayah / PIC
                  </option>
                  <option value="PIC">
                    PIC
                  </option>
                  <option value="VIEWER">
                    Viewer
                  </option>
                </select>
              </label>

              <label>
                Password{" "}
                {form.id_user
                  ? "Baru (opsional)"
                  : ""}
                <div className="users-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      updateField(
                        "password",
                        event.target.value
                      )
                    }
                    required={!form.id_user}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
              </label>

              <div className="users-permission-title">
                Status User
              </div>

              <div className="users-checks">
                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={form.aktif}
                    onChange={(event) =>
                      updateField(
                        "aktif",
                        event.target.checked
                      )
                    }
                  />
                  Aktif
                </label>

                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={!form.aktif}
                    onChange={(event) => {
                      if (event.target.checked) {
                        updateField("aktif", false);
                      }
                    }}
                  />
                  Nonaktif
                </label>
              </div>

              <div className="users-permission-title">
                Hak Akses
              </div>

              <div className="users-checks">

                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={
                      form.akses_dashboard &&
                      form.akses_form_inspeksi &&
                      form.akses_data_temuan &&
                      form.kelola_user
                    }
                    onChange={(event) =>
                      updateAllAccess(
                        event.target.checked
                      )
                    }
                  />
                  Semua Akses
                </label>

                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={
                      form.akses_dashboard
                    }
                    onChange={(event) =>
                      updateField(
                        "akses_dashboard",
                        event.target.checked
                      )
                    }
                  />
                  Dashboard
                </label>

                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={
                      form.akses_form_inspeksi
                    }
                    onChange={(event) =>
                      updateField(
                        "akses_form_inspeksi",
                        event.target.checked
                      )
                    }
                  />
                  Form Inspeksi
                </label>

                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={
                      form.akses_data_temuan
                    }
                    onChange={(event) =>
                      updateField(
                        "akses_data_temuan",
                        event.target.checked
                      )
                    }
                  />
                  Data Temuan
                </label>

                <label className="users-check">
                  <input
                    type="checkbox"
                    checked={form.kelola_user}
                    onChange={(event) =>
                      updateField(
                        "kelola_user",
                        event.target.checked
                      )
                    }
                  />
                  Kelola Akses
                </label>
              </div>
            </div>

            <div className="users-modal-actions">
              <button
                type="button"
                className="users-secondary"
                onClick={() => setOpen(false)}
              >
                Batal
              </button>

              <button
                type="submit"
                className="users-primary"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');

        .users-page {
          min-height: 100vh;
          padding: 104px clamp(16px, 5vw, 64px) 42px;
          background: #f5faf6;
          color: #1b2b20;
          font-family: "Poppins", sans-serif;
        }

        .users-topbar {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  right: 0;

  height: 78px !important;
  min-height: 78px !important;

  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;

  gap: 20px !important;

  padding: 10px clamp(18px, 4vw, 54px) !important;

  background: rgba(255, 255, 255, 0.96);

  border-bottom: 1px solid #e3eae5;

  box-shadow: none;

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}


.users-brand {
  display: flex !important;
  align-items: center !important;

  gap: 12px !important;

  min-width: 0 !important;

  height: auto !important;
}


.users-brand-logo {
  width: 110px !important;
  height: 52px !important;

  min-width: 110px !important;

  flex: 0 0 110px !important;

  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  text-decoration: none !important;

  overflow: hidden !important;
}


.users-brand-logo img {
  display: block !important;

  width: 100% !important;

  max-width: 82px !important;

  height: auto !important;

  object-fit: contain !important;
}


.users-brand-text {
  display: flex !important;
  flex-direction: column !important;

  gap: 2px !important;

  min-width: 0 !important;

  font-family: "Inter", Arial, sans-serif !important;
}


.users-brand-text b {
  color: #142119;

  font-family: "Inter", Arial, sans-serif !important;

  font-size: 15px !important;

  line-height: 1.2 !important;

  font-weight: 800;

  white-space: nowrap;
}


.users-brand-text span {
  color: #87918a;

  font-family: "Inter", Arial, sans-serif !important;

  font-size: 11px !important;

  line-height: 1.2 !important;

  font-weight: 600;

  white-space: nowrap;
}


.users-nav {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;

  gap: 7px !important;

  height: auto !important;

  flex: 0 0 auto !important;

  font-family: "Poppins", sans-serif !important;

  font-weight: 600 !important;
}


.users-nav-page {
  position: relative;

  display: inline-flex !important;

  align-items: center !important;
  justify-content: center !important;

  min-height: 42px !important;
  height: 42px !important;

  padding: 10px 13px !important;

  border: 0;

  border-radius: 10px !important;

  background: transparent;

  color: #5f6c64;

  font-family: "Poppins", sans-serif !important;

  font-size: 12px !important;

  font-weight: 600;

  line-height: 1.2;

  letter-spacing: 0;

  text-decoration: none;

  white-space: nowrap;

  transition:
    background .16s ease,
    color .16s ease,
    transform .16s ease;
}


.users-nav-page:hover {
  color: #123d25;

  background: #f1f6f2;
}


.users-nav-page-active {
  color: #087f3e !important;

  background: #edf8f0 !important;

  box-shadow: inset 0 -2px 0 #0b9449 !important;

  border-radius: 10px !important;
}


.users-profile-wrapper {
  position: relative;

  display: flex !important;
  align-items: center !important;

  flex: 0 0 auto;

  margin-left: 0 !important;
}


.users-profile-button {
  display: inline-flex !important;

  align-items: center !important;

  gap: 9px !important;

  min-width: 145px !important;

  width: auto !important;

  height: 44px !important;

  min-height: 44px !important;

  padding: 4px 10px 4px 7px !important;

  border: 1px solid #d9e3dc;

  border-radius: 12px;

  background: #fff;

  color: #304037;

  font-family: "Poppins", sans-serif;

  font-weight: 600;

  cursor: pointer;
}


.users-profile-avatar {
  width: 34px !important;
  height: 34px !important;

  min-width: 34px !important;

  display: flex !important;

  align-items: center !important;
  justify-content: center !important;

  flex: 0 0 34px !important;

  border-radius: 50%;

  background: linear-gradient(
    135deg,
    #18843c,
    #0a9b4d
  ) !important;

  color: #fff;

  font-size: 14px;

  font-weight: 700;
}


.users-profile-avatar svg {
  width: 18px !important;
  height: 18px !important;
}


.users-profile-text {
  display: flex !important;

  flex-direction: column !important;

  align-items: flex-start !important;

  justify-content: center !important;

  min-width: 0 !important;

  flex: 1 1 auto !important;

  gap: 0 !important;

  overflow: hidden !important;

  line-height: 1.1;
}


.users-profile-text strong {
  max-width: 85px !important;

  overflow: hidden !important;

  text-overflow: ellipsis !important;

  white-space: nowrap !important;

  color: #17251d;

  font-family: "Poppins", sans-serif !important;

  font-size: 11px !important;

  font-weight: 600;

  line-height: 1.05 !important;
}


.users-profile-text small.users-role-admin-developer {
  display: inline-flex !important;

  align-items: center !important;

  width: fit-content !important;

  margin-top: 4px !important;

  padding: 1px 6px !important;

  border-radius: 4px !important;

  background: #ffd21f !important;

  color: #6b5200 !important;

  font-family: "Poppins", sans-serif !important;

  font-size: 8px !important;

  font-weight: 700 !important;

  line-height: 1.4 !important;

  letter-spacing: 0.3px !important;

  white-space: nowrap !important;

  box-shadow: 0 0 8px rgba(255, 210, 31, 0.75) !important;
}


.users-role-active-dot {
  display: inline-block;

  width: 6px;
  height: 6px;

  margin-right: 5px;

  border-radius: 50%;

  background: #087f3f;

  box-shadow: 0 0 5px rgba(8, 127, 63, 0.65);
}


.users-profile-text small {
  margin-top: 4px !important;

  color: #7b8780;

  font-size: 8px;

  font-weight: 600;

  white-space: nowrap;
}


.users-profile-chevron {
  margin-left: 2px !important;

  display: flex !important;

  align-items: center !important;
  justify-content: center !important;

  color: #718078;

  font-size: 8px !important;

  line-height: 1;

  transform: translateY(-1px);
}


.users-nav-logout {
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

  border: 1px solid #d9e3dc;

  border-radius: 7px;

  background: #fff;

  color: #304037;

  font-family: "Poppins", sans-serif !important;

  font-size: 10px !important;

  font-weight: 600;

  line-height: 1.1;

  white-space: nowrap;

  cursor: pointer;
}


.users-nav-logout:hover {
  background: #f7faf8;

  color: #123d25;

  border-color: #cbd8cf;
}


.users-nav-manage {
  display: inline-flex !important;

  align-items: center !important;
  justify-content: center !important;

  min-height: 27px !important;
  height: 27px !important;

  gap: 5px !important;

  padding: 0 10px !important;

  border: 1px solid #16833f;

  border-radius: 7px;

  background: #16833f;

  color: #fff;

  font-family: "Poppins", sans-serif !important;

  font-size: 10px !important;

  font-weight: 700;

  line-height: 1.1;

  text-decoration: none;

  white-space: nowrap;
}


.users-nav-manage:hover {
  background: #117236;

  border-color: #117236;

  color: #fff;
}

        .users-profile-popup {
          position: absolute;
          top: 52px !important;
          right: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 300px !important;
          min-width: 0 !important;
          padding: 16px !important;
          border: 1px solid #e1e9e3;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 18px 45px rgba(20,55,35,.14);
          animation: usersProfileIn .18s ease-out;
        }

        @keyframes usersProfileIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .users-profile-popup-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .users-profile-popup-header > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .users-profile-popup-header > .users-profile-avatar {
          width: 43px !important;
          height: 43px !important;
          min-width: 43px !important;
          flex-basis: 43px !important;
          background: linear-gradient(
            135deg,
            #18843c,
            #0a9b4d
          );
          font-size: 18px;
        }

        .users-profile-popup-header small {
          color: #6c7c73;
          font-size: 10px;
          font-weight: 700;
        }

        .users-profile-popup strong {
          color: #17251d;
          font-size: 12px;
        }

        .users-profile-popup span {
          color: #718078;
          font-size: 10px;
        }

        .users-profile-divider {
          height: 1px;
          margin: 14px 0;
          background: #edf1ee;
        }

        .users-profile-detail {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 11px;
        }

        .users-profile-detail small {
          color: #89948d;
          font-size: 10px;
        }

        .users-profile-detail strong {
          color: #17251d;
          font-size: 12px;
        }

        .users-role-badge {
          width: fit-content;
          padding: 4px 9px;
          border-radius: 7px;
          background: #e8f6eb;
          color: #08783d !important;
          font-size: 10px !important;
          font-weight: 800;
        }

.users-role-badge.users-role-admin-developer {
  background: #ffd21f !important;
  color: #6b5200 !important;
  font-weight: 700 !important;
  box-shadow: 0 0 8px rgba(255, 210, 31, 0.75) !important;
}

        .users-profile-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          height: 32px;
          border: 1px solid #f0caca;
          border-radius: 7px;
          background: #fff7f7;
          color: #c42e2e;
          font: 700 11px "Poppins", sans-serif;
          cursor: pointer;
        }

        .users-profile-logout:hover {
          background: #fff0f0;
        }

        .users-nav-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px !important;
          height: 30px !important;
          padding: 5px 9px !important;
          border: 1px solid #d9e3dc;
          border-radius: 7px;
          background: #fff;
          color: #304037;
          font: 600 10px/1.1 "Poppins", sans-serif;
          white-space: nowrap;
          cursor: pointer;
        }

        .users-nav-logout:hover {
          background: #f7faf8;
          color: #123d25;
          border-color: #cbd8cf;
        }

        .users-nav-manage {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 27px !important;
          height: 27px !important;
          gap: 5px;
          padding: 0 10px !important;
          border: 1px solid #16833f;
          border-radius: 7px;
          background: #16833f;
          color: #fff;
          font: 700 10px/1.1 "Poppins", sans-serif;
          text-decoration: none;
          white-space: nowrap;
        }

        .users-nav-manage:hover {
          background: #117236;
          border-color: #117236;
          color: #fff;
        }

        .users-mobile-menu-wrapper,
        .users-mobile-menu-button {
          display: none;
        }

        .users-header,
        .users-panel,
        .users-summary,
        .users-message,
        .users-error {
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
        }

        .users-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        h1 {
          margin: 8px 0 4px;
          color: #142119;
          font-size: clamp(24px, 3vw, 32px);
          letter-spacing: -0.3px;
        }

        .users-header p {
          margin: 0;
          color: #627067;
          font-size: 13px;
        }

        .users-primary,
        .users-secondary,
        .users-action,
        .users-close {
          border: 0;
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          transition:
            transform .16s ease,
            background .16s ease,
            border-color .16s ease;
        }

        .users-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          background: #08783d;
          color: #fff;
          font-size: 12px;
        }

        .users-primary:hover {
          background: #066531;
          transform: translateY(-1px);
        }

        .users-primary span {
          font-size: 18px;
          font-weight: 400;
          line-height: 12px;
        }

        .users-tabs {
          display: flex;
          gap: 8px;
          margin: 0 0 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid #dce8df;
        }

        .users-tabs button {
          min-height: 36px;
          padding: 0 14px;
          border: 1px solid #d7e3da;
          border-radius: 9px;
          background: #fff;
          color: #516258;
          cursor: pointer;
          font: 700 12px "Poppins", sans-serif;
          transition: background .16s ease, color .16s ease, border-color .16s ease;
        }

        .users-tabs button:hover {
          border-color: #9ccdb0;
          color: #08783d;
        }

        .users-tabs button.is-active {
          border-color: #08783d;
          background: #08783d;
          color: #fff;
        }

        .users-summary {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 12px;
          margin-bottom: 16px;
        }

        .users-summary article {
          min-height: 108px;
          padding: 16px 18px;
          border: 1px solid #dce8df;
          border-radius: 12px;
          background: #fff;
          box-shadow:
            0 6px 18px rgba(28, 70, 40, .05);
        }

        .users-summary span,
        .users-summary small {
          display: block;
          color: #718078;
          font-size: 11px;
        }

        .users-summary strong {
          display: block;
          margin: 8px 0 2px;
          color: #142119;
          font-size: 27px;
          line-height: 1;
        }

        .users-panel {
          padding: 16px;
          border: 1px solid #dce8df;
          border-radius: 12px;
          background: #fff;
          box-shadow:
            0 8px 24px rgba(28, 70, 40, .06);
        }

        .users-audit-panel {
          min-height: 330px;
        }

        .users-audit-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .users-audit-head h2 {
          margin: 0;
          color: #142119;
          font-size: 15px;
          line-height: 1.3;
        }

        .users-audit-head p {
          margin: 4px 0 0;
          color: #718078;
          font-size: 10px;
        }

        .users-danger {
          flex: 0 0 auto;
          min-height: 36px;
          padding: 0 13px;
          border: 1px solid #f1b8b8;
          border-radius: 8px;
          background: #fff8f8;
          color: #bd3030;
          cursor: pointer;
          font: 700 11px "Poppins", sans-serif;
        }

        .users-danger:hover:not(:disabled) { background: #fff0f0; }
        .users-danger:disabled { cursor: not-allowed; opacity: .55; }

        .users-audit-table { min-width: 760px; }
        .users-audit-table td { white-space: normal; vertical-align: middle; }
        .users-audit-table td strong,
        .users-audit-table td small { display: block; }
        .users-audit-table td small { margin-top: 2px; color: #718078; font-size: 10px; }
        .users-log-time { color: #53635a; font-family: monospace; font-size: 11px; }
        .users-log-description { min-width: 280px; line-height: 1.55; }

        .users-log-action {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 5px;
          background: #e8f6eb;
          color: #187239;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .users-log-action.action-logout { background: #f2f4f3; color: #53635a; }
        .users-log-action.action-ubah_user { background: #eef6ff; color: #2861ad; }

        .users-toolbar {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 14px;
        }

        .users-search {
          display: flex;
          align-items: center;
          flex: 1 1 auto;
          gap: 8px;
          min-width: 180px;
          padding: 0 11px;
          border: 1px solid #d7e3da;
          border-radius: 9px;
          background: #fbfdfb;
          color: #708077;
        }

        .users-search span {
          font-size: 21px;
          line-height: 1;
        }

        .users-search input,
        .users-toolbar select {
          height: 38px;
          border: 1px solid #d7e3da;
          border-radius: 9px;
          background: #fff;
          color: #34453a;
          font: 600 12px "Poppins",
            sans-serif;
          outline: none;
        }

        .users-search input {
          flex: 1;
          min-width: 0;
          border: 0;
          background: transparent;
        }

        .users-search:focus-within,
        .users-toolbar select:focus {
          border-color: #079447;
          box-shadow:
            0 0 0 3px rgba(7, 148, 71, .08);
        }

        .users-toolbar select {
          min-width: 142px;
          padding: 0 10px;
        }

        .users-table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 840px;
          border-collapse: collapse;
          font-size: 12px;
        }

        th,
        td {
          padding: 13px 12px;
          border-bottom: 1px solid #e8efea;
          text-align: left;
          white-space: nowrap;
        }

        tbody tr:hover {
          background: #f8fcf9;
        }

        th {
          color: #4b5c51;
          font-size: 10px;
          letter-spacing: .2px;
          text-transform: uppercase;
        }

        td {
          color: #34453a;
        }

        .users-action {
          width: 32px;
          height: 32px;
          display: inline-grid;
          place-items: center;
          padding: 0;
          background: #edf7ef;
          color: #17763a;
        }

        .users-action:hover {
          background: #dcefe1;
          transform: translateY(-1px);
        }

        .users-action svg {
          width: 16px;
          height: 16px;
        }

        .users-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .users-access-action {
          min-width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          place-items: center;
          padding: 0 8px;
          border: 0;
          border-radius: 8px;
          background: #e9f0ff;
          color: #2861ad;
          cursor: pointer;
          font: 700 10px "Poppins", sans-serif;
          transition:
            transform .16s ease,
            background .16s ease;
        }

        .users-access-action:hover {
          background: #dbe7ff;
          transform: translateY(-1px);
        }

        .users-access-action svg {
          width: 16px;
          height: 16px;
        }

        .users-action {
          width: auto;
          min-width: 32px;
          padding: 0 8px;
          font: 700 10px "Poppins", sans-serif;
        }

        .users-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .role-admin,
        .role-admin_developer,
        .role-admin_inspector,
        .role-admin_sistem_mutu {
          background: #e5f4e9;
          color: #08783d;
        }

        .role-inspector,
        .role-team_wilayah,
        .role-pic {
          background: #eef6ff;
          color: #2861ad;
        }

        .role-viewer {
          background: #f1f3f2;
          color: #53635a;
        }

        .status-active {
          background: #e8f6eb;
          color: #21783a;
        }

        .status-inactive {
          background: #fbeaea;
          color: #a43e3e;
        }

        .users-empty {
          padding: 34px;
          text-align: center;
          color: #7b887f;
        }

        .users-message,
        .users-error {
          margin-bottom: 12px;
          padding: 11px 13px;
          border-radius: 8px;
          font-size: 13px;
        }

        .users-message {
          background: #e8f6eb;
          color: #21783a;
        }

        .users-error {
          background: #fbeaea;
          color: #a43e3e;
        }

        .users-toast {
          position: fixed;
          right: 24px;
          top: 92px;
          z-index: 3000;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: calc(100vw - 32px);
          padding: 12px 15px;
          border: 1px solid #b7dfc1;
          border-radius: 10px;
          background: #ffffff;
          box-shadow: 0 12px 28px rgba(24, 75, 42, .16);
          color: #16733a;
          font-size: 12px;
          font-weight: 700;
        }

        .users-toast span {
          display: inline-grid;
          width: 18px;
          height: 18px;
          place-items: center;
          border-radius: 50%;
          background: #08783d;
          color: #fff;
          font-size: 11px;
        }

        .users-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 999999 !important;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 16px;
          background: rgba(20, 35, 25, .52);
          overflow-y: auto;
        }

        .users-modal {
          width: min(100%, 760px);
          max-height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin: 0 auto;
          padding: 0;
          border: 1px solid #dce8df;
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 24px 65px rgba(18, 38, 25, .28);
        }

        .users-modal-head {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e4ece6;
          background: #ffffff;
        }

        .users-modal h2 {
          margin: 0;
          color: #142119;
          font-size: 20px;
          font-weight: 800;
        }

        .users-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .users-permission-title {
          margin-top: 20px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4ece6;
          color: #142119;
          font-size: 13px;
          font-weight: 800;
        }

        .users-close {
          width: 32px;
          height: 32px;
          background: #edf3ee;
          color: #385442;
          font-size: 20px;
        }

        .users-close:hover {
          background: #dfece2;
        }

        .users-modal label:not(.users-check) {
          display: block;
          margin-top: 12px;
          color: #415248;
          font-size: 12px;
          font-weight: 700;
        }

        .users-modal input:not([type="checkbox"]),
        .users-modal select {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          padding: 10px 11px;
          border: 1px solid #d7e3da;
          border-radius: 8px;
          font: 13px "Poppins", sans-serif;
          outline: none;
        }

        .users-password-field {
          position: relative;
          margin-top: 6px;
        }

        .users-password-field input {
          margin-top: 0 !important;
          padding-right: 86px !important;
        }

        .users-password-field button {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: #08783d;
          cursor: pointer;
          font: 700 10px "Poppins", sans-serif;
        }

        .users-modal input:not([type="checkbox"]):focus,
        .users-modal select:focus {
          border-color: #079447;
          box-shadow:
            0 0 0 3px rgba(7, 148, 71, .08);
        }

        .users-checks {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .users-check {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #415248;
          font-size: 12px;
        }

        .users-check input {
          accent-color: #08783d;
        }

        .users-modal-actions {
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid #e4ece6;
          background: #fafcfa;
          margin-top: 0;
        }

        /* ============================================================
           NAVBAR MOBILE
           Disamakan dengan navbar mobile halaman Data Temuan
           ============================================================ */

        .users-mobile-menu-wrapper,
        .users-mobile-menu-button {
          display: none;
        }

        .users-page .users-profile-button > .users-profile-avatar {
          width: 34px !important;
          height: 34px !important;
          min-width: 34px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 34px !important;
          border-radius: 50% !important;
          background: linear-gradient(
            135deg,
            #18843c,
            #0a9b4d
          ) !important;
          color: #ffffff !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 14px !important;
          font-weight: 600 !important;
        }

        .users-page .users-profile-avatar svg {
          width: 18px !important;
          height: 18px !important;
        }

        .users-page .users-profile-button > .users-profile-text {
          min-width: 0 !important;
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          gap: 0 !important;
          overflow: hidden !important;
        }

        .users-page .users-profile-text strong {
          max-width: 85px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.05 !important;
        }

        .users-page .users-profile-text small {
          margin-top: 4px !important;
          color: #7b8780 !important;
          font-family: "Poppins", sans-serif !important;
          font-size: 8px !important;
          font-weight: 600 !important;
          line-height: 1.05 !important;
        }

        .users-page .users-profile-button > .users-profile-chevron {
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

        .users-page .users-nav-logout {
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

        .users-page .users-nav-logout:hover {
          background: #f7faf8 !important;
          color: #087f3e !important;
          border-color: #cbd8cf !important;
        }

        .users-page .users-nav-manage {
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

        .users-page .users-nav-manage:hover {
          background: #117236 !important;
          border-color: #117236 !important;
          color: #ffffff !important;
        }

        .users-nav-mobile-row {
          display: contents;
        }

        @media (max-width: 768px) {
          .users-page .users-topbar {
            font-family: "Inter", Arial, sans-serif !important;
            min-height: 66px !important;
            height: 66px !important;
            padding: 7px 11px !important;
            gap: 8px !important;
          }

          .users-page .users-brand {
            flex: 0 0 auto !important;
            gap: 0 !important;
          }

          .users-page .users-brand-logo {
            width: 82px !important;
            height: 40px !important;
            min-width: 82px !important;
            flex: 0 0 82px !important;
          }

          .users-page .users-brand-logo img {
            width: 100% !important;
            max-width: 82px !important;
          }

          .users-page .users-brand-text {
            display: flex !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            flex-direction: column !important;
            gap: 2px !important;
            line-height: 1.15 !important;
            font-family: "Inter", Arial, sans-serif !important;
          }

          .users-page .users-brand-text b {
            font-size: 12px !important;
            line-height: 1.15 !important;
          }

          .users-page .users-brand-text span {
            font-size: 8px !important;
            line-height: 1.15 !important;
            white-space: normal !important;
          }

          .users-page .users-nav {
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
            box-shadow:
              0 12px 30px rgba(24, 45, 32, 0.14) !important;
            overflow: visible !important;
            z-index: 1200 !important;
          }

          .users-page .users-nav.mobile-nav-open {
            display: flex !important;
            height: auto !important;
            bottom: auto !important;
            justify-content: flex-start !important;
          }

          .users-page .users-nav > a {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            min-height: 42px !important;
            height: 42px !important;
            display: flex !important;
            flex: 0 0 42px !important;
            align-items: center !important;
            justify-content: flex-start !important;
            align-self: stretch !important;
            box-sizing: border-box !important;
            padding: 10px 12px !important;
            border-radius: 9px !important;
            text-align: left !important;
          }

          .users-page .users-nav-mobile-row {
            display: flex !important;
            align-items: stretch !important;
            gap: 3px !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .users-page .users-nav-mobile-row > a {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: auto !important;
            min-width: 0 !important;
            max-width: none !important;
            height: 42px !important;
            min-height: 42px !important;
            flex: 1 1 0 !important;
            padding: 10px 8px !important;
            text-align: center !important;
            white-space: nowrap !important;
          }

          .users-page .users-nav .users-profile-wrapper {
            display: flex !important;
            width: auto !important;
            flex: 0 0 auto !important;
            margin-left: 0 !important;
          }

          .users-page .users-nav .users-profile-button {
            width: 38px !important;
            min-width: 38px !important;
            height: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
          }

          .users-page .users-nav .users-profile-text,
          .users-page .users-nav .users-profile-chevron {
            display: none !important;
          }

          .users-page .users-nav .users-profile-avatar {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-basis: 28px !important;
          }

          .users-page .users-nav .users-profile-popup {
            position: fixed !important;
            top: 61px !important;
            right: 10px !important;
            width: min(
              298px,
              calc(100vw - 20px)
            ) !important;
          }

          .users-page .users-nav .users-nav-logout {
            display: none !important;
          }

          .users-page .users-mobile-menu-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
          }

          .users-page .users-mobile-menu-button {
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
            cursor: pointer !important;
          }

          .users-page .users-mobile-menu-button span {
            display: block !important;
            width: 20px !important;
            height: 2px !important;
            background: #087f3f !important;
            border-radius: 999px !important;
            transition:
              transform .2s ease,
              opacity .2s ease !important;
          }

          .users-page
            .users-mobile-menu-button-open
            span:nth-child(1) {
            transform:
              translateY(7px) rotate(45deg) !important;
          }

          .users-page
            .users-mobile-menu-button-open
            span:nth-child(2) {
            opacity: 0 !important;
          }

          .users-page
            .users-mobile-menu-button-open
            span:nth-child(3) {
            transform:
              translateY(-7px) rotate(-45deg) !important;
          }
        }

        /* ============================================================
           PAKSA DASHBOARD RATA KIRI
           ============================================================ */

        @media (max-width: 900px) {
          .users-page
            .users-nav.mobile-nav-open
            :global(.users-nav-page-dashboard) {
            display: flex !important;

            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;

            height: 42px !important;
            min-height: 42px !important;

            flex: 0 0 42px !important;
            align-self: stretch !important;

            align-items: center !important;
            justify-content: flex-start !important;

            margin: 0 !important;
            padding: 10px 12px !important;

            box-sizing: border-box !important;

            text-align: left !important;

            justify-content: flex-start !important;
            text-indent: 0 !important;
            direction: ltr !important;

            transform: none !important;
          }

          .users-page
            .users-nav.mobile-nav-open
            :global(.users-nav-page-dashboard)::before,
          .users-page
            .users-nav.mobile-nav-open
            :global(.users-nav-page-dashboard)::after {
            display: none !important;
            content: none !important;
          }

          .users-page
            .users-nav.mobile-nav-open
            :global(.users-nav-page-dashboard)
            :global(.users-dashboard-label) {
            position: absolute !important;
            left: 14px !important;
            top: 50% !important;
            width: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            text-align: left !important;
            transform: translateY(-50%) !important;
          }
        }

        @media (max-width: 480px) {
          .users-page .users-topbar {
            min-height: 60px !important;
            height: 60px !important;
            padding: 7px 8px !important;
            gap: 5px !important;
          }

          .users-page .users-brand-logo {
            width: 82px !important;
            height: 39px !important;
            flex-basis: 82px !important;
          }

          .users-page .users-brand-logo img {
            max-width: 82px !important;
          }

          .users-page .users-nav {
            top: 60px !important;
            left: 10px !important;
            right: 10px !important;
            width: auto !important;
            max-width: none !important;
            gap: 3px !important;
          }

          .users-page .users-nav > a {
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            box-sizing: border-box !important;
          }
        }

        @media (max-width: 650px) {
          :global(body) {
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          :global(html) {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          .users-page {
            width: 100vw !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
            overflow-x: hidden;
          }

          .users-page,
          .users-page * {
            box-sizing: border-box !important;
          }

          .users-page .users-topbar {
            width: 100vw !important;
            max-width: 100vw !important;
          }

          .users-page .users-header,
          .users-page .users-summary,
          .users-page .users-panel,
          .users-page .users-message,
          .users-page .users-error {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }

          .users-page .users-table-wrap {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }

          .users-page .users-header {
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }

          .users-page .users-header .users-primary {
            align-self: flex-end !important;
            min-height: 27px !important;
            padding: 5px 8px !important;
            font-size: 9px !important;
          }

          .users-page .users-header .users-primary span {
            font-size: 13px !important;
          }

          .users-page .users-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }

          .users-page .users-summary article {
            min-height: 96px !important;
            padding: 12px !important;
          }

          .users-page .users-panel {
            padding: 12px !important;
          }

          .users-page .users-tabs {
            gap: 6px !important;
            margin-bottom: 14px !important;
            overflow-x: auto !important;
            padding-bottom: 10px !important;
          }

          .users-page .users-tabs button {
            flex: 0 0 auto !important;
            min-height: 34px !important;
            padding: 0 11px !important;
            font-size: 11px !important;
          }

          .users-page .users-audit-head {
            flex-direction: column !important;
            gap: 10px !important;
          }

          .users-page .users-audit-head h2 {
            font-size: 14px !important;
          }

          .users-page .users-danger {
            width: 100% !important;
          }

          .users-page .users-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 9px !important;
          }

          .users-page .users-search,
          .users-page .users-toolbar select {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .users-page .users-topbar {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .users-page .users-brand {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            max-width: calc(100% - 52px) !important;
          }

          .users-page .users-brand-text {
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .users-page .users-mobile-menu-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
          }

          .users-page .users-mobile-menu-button {
            position: static !important;
            transform: none !important;
          }

          :global(.users-page .users-nav-mobile-row) {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 3px !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          :global(.users-page .users-nav-mobile-row > a) {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            height: 42px !important;
            min-height: 42px !important;
            flex: 0 0 42px !important;
            padding: 10px 12px !important;
            text-align: left !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
          }

          .users-page .users-modal-backdrop {
            padding: 16px 10px !important;
            z-index: 999999 !important;
          }

          .users-page .users-modal {
            width: 100% !important;
            max-height: calc(100vh - 32px) !important;
          }
        }
      `}</style>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        loading={loggingOut}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}
