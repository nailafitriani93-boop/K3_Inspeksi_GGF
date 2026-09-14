"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  id_user: null,
  nama_lengkap: "",
  username: "",
  email: "",
  role: "INSPECTOR",
  aktif: true,
  akses_dashboard: false,
  password: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data user.");
      }

      setUsers(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setMessage("");
    setError("");
    setOpen(true);
  }

  function openEdit(user) {
    setForm({ ...EMPTY_FORM, ...user, password: "" });
    setMessage("");
    setError("");
    setOpen(true);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan user.");
      }

      setOpen(false);
      setMessage(editing ? "User berhasil diperbarui." : "User berhasil ditambahkan.");
      await loadUsers();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="users-page">
      <header className="users-header">
        <div>
          <Link href="/inspeksi" className="users-back">Form Inspeksi</Link>
          <h1>Manajemen User</h1>
          <p>Kelola username login, nama lengkap, role, status, dan hak akses dashboard.</p>
        </div>
        <button type="button" className="users-primary" onClick={openCreate}>+ Tambah User</button>
      </header>

      {message && <div className="users-message">{message}</div>}
      {error && <div className="users-error">{error}</div>}

      <section className="users-panel">
        <div className="users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Akses Dashboard</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="users-empty">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="users-empty">Belum ada user.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id_user}>
                  <td>{user.nama_lengkap}</td>
                  <td>{user.username}</td>
                  <td>{user.email || "-"}</td>
                  <td><span className={`users-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                  <td><span className={`users-badge ${user.aktif ? "status-active" : "status-inactive"}`}>{user.aktif ? "Aktif" : "Nonaktif"}</span></td>
                  <td>{user.akses_dashboard ? "Ya" : "Tidak"}</td>
                  <td>
                    <button type="button" className="users-action" onClick={() => openEdit(user)} title="Edit user" aria-label={`Edit ${user.username}`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4.8L8 20l11.2-11.2a2.8 2.8 0 0 0-4-4L4 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m13.8 6.2 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form className="users-modal" onSubmit={saveUser}>
            <div className="users-modal-head">
              <h2>{form.id_user ? "Edit User dan Hak Akses" : "Tambah User"}</h2>
              <button type="button" className="users-close" onClick={() => setOpen(false)} aria-label="Tutup">×</button>
            </div>

            <label>Nama Lengkap<input value={form.nama_lengkap} onChange={(event) => updateField("nama_lengkap", event.target.value)} required /></label>
            <label>Username<input value={form.username} onChange={(event) => updateField("username", event.target.value)} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required /></label>
            <label>Role<select value={form.role} onChange={(event) => updateField("role", event.target.value)}><option value="ADMIN">Admin</option><option value="INSPECTOR">Inspector</option><option value="ADMIN_INSPECTOR">Admin dan Inspector</option><option value="ADMIN_DEVELOPER">Admin Developer</option></select></label>
            <label>Password {form.id_user ? "Baru (opsional)" : ""}<input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required={!form.id_user} /></label>

            <div className="users-checks">
              <label className="users-check"><input type="checkbox" checked={form.aktif} onChange={(event) => updateField("aktif", event.target.checked)} /> Aktif</label>
              <label className="users-check"><input type="checkbox" checked={form.akses_dashboard} onChange={(event) => updateField("akses_dashboard", event.target.checked)} /> Akses Dashboard</label>
            </div>

            <div className="users-modal-actions">
              <button type="button" className="users-secondary" onClick={() => setOpen(false)}>Batal</button>
              <button type="submit" className="users-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .users-page { min-height: 100vh; padding: 32px clamp(16px, 5vw, 72px); background: #f5faf6; color: #1b2b20; }
        .users-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; max-width: 1280px; margin: 0 auto 20px; }
        .users-back { color: #19783a; font-size: 12px; text-decoration: none; }
        h1 { margin: 8px 0 4px; font-size: 30px; }
        .users-header p { margin: 0; color: #627067; font-size: 13px; }
        .users-panel { max-width: 1280px; margin: 0 auto; padding: 16px; background: #fff; border: 1px solid #dce8df; border-radius: 12px; box-shadow: 0 8px 24px rgba(28, 70, 40, .06); }
        .users-table-wrap { overflow-x: auto; }
        table { width: 100%; min-width: 800px; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 13px 12px; border-bottom: 1px solid #e8efea; text-align: left; white-space: nowrap; }
        th { color: #4b5c51; font-size: 11px; text-transform: uppercase; }
        .users-primary, .users-secondary, .users-action, .users-close { border: 0; border-radius: 8px; cursor: pointer; font-weight: 700; }
        .users-primary { padding: 11px 15px; background: #16833d; color: #fff; }
        .users-secondary { padding: 11px 15px; background: #edf3ee; color: #31523c; }
        .users-action { width: 32px; height: 32px; display: inline-grid; place-items: center; padding: 0; background: #edf7ef; color: #17763a; }
        .users-action svg { width: 16px; height: 16px; }
        .users-badge { display: inline-flex; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
        .role-admin { background: #e8f0ff; color: #2861ad; }
        .role-inspector { background: #e8f6eb; color: #21783a; }
        .status-active { background: #e8f6eb; color: #21783a; }
        .status-inactive { background: #fbeaea; color: #a43e3e; }
        .users-empty { padding: 30px; text-align: center; color: #7b887f; }
        .users-message, .users-error { max-width: 1280px; margin: 0 auto 12px; padding: 11px 13px; border-radius: 8px; font-size: 13px; }
        .users-message { background: #e8f6eb; color: #21783a; }
        .users-error { background: #fbeaea; color: #a43e3e; }
        .users-modal-backdrop { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 18px; background: rgba(20, 35, 25, .35); }
        .users-modal { width: min(520px, 100%); max-height: 92vh; overflow: auto; padding: 22px; border-radius: 12px; background: #fff; box-shadow: 0 20px 60px rgba(20, 45, 29, .2); }
        .users-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .users-modal h2 { margin: 0; font-size: 20px; }
        .users-close { width: 32px; height: 32px; background: #edf3ee; color: #385442; font-size: 20px; }
        .users-modal label:not(.users-check) { display: block; margin-top: 12px; color: #415248; font-size: 12px; font-weight: 700; }
        .users-modal input:not([type="checkbox"]), .users-modal select { width: 100%; box-sizing: border-box; margin-top: 6px; padding: 10px 11px; border: 1px solid #d7e3da; border-radius: 8px; font-size: 13px; }
        .users-checks { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 18px; }
        .users-check { display: flex; align-items: center; gap: 7px; color: #415248; font-size: 12px; }
        .users-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; }
        @media (max-width: 600px) { .users-header { align-items: stretch; flex-direction: column; } .users-primary { align-self: flex-start; } .users-page { padding: 22px 12px; } h1 { font-size: 24px; } }
      `}</style>
    </main>
  );
}
