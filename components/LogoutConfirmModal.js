"use client";

export default function LogoutConfirmModal({
    open,
    loading = false,
    onCancel,
    onConfirm,
}) {
    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(0, 0, 0, 0.45)",
            }}
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-confirm-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "390px",
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "28px 24px 22px",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.20)",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: "52px",
                        height: "52px",
                        margin: "0 auto 16px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#edf8f1",
                        color: "#08783d",
                        fontSize: "24px",
                        fontWeight: 700,
                    }}
                >
                    ↪
                </div>

                <h2
                    id="logout-confirm-title"
                    style={{
                        margin: "0 0 8px",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#173b2a",
                    }}
                >
                    Anda yakin ingin keluar?
                </h2>

                <p
                    style={{
                        margin: "0 0 24px",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        color: "#6b7280",
                    }}
                >
                    Anda akan keluar dari akun ini.
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                    }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            flex: 1,
                            height: "42px",
                            borderRadius: "9px",
                            border: "1px solid #d8e2dc",
                            background: "#ffffff",
                            color: "#315443",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        Tidak
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            flex: 1,
                            height: "42px",
                            border: "none",
                            borderRadius: "9px",
                            background: "#08783d",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Memproses..." : "Ya, Keluar"}
                    </button>
                </div>
            </div>
        </div>
    );
}