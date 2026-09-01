"use client";

import { useRouter } from "next/navigation";

export default function GuestPage() {
  const router = useRouter();

  function kembaliKeLogin() {
    sessionStorage.removeItem("user");
    router.replace("/login");
  }

  return (
    <main className="guest-page">

      <section className="guest-card">

        <div className="guest-logo">
          <img
            src="/logo-ggf.png"
            alt="Great Giant Foods"
          />
        </div>

        <h1>
          Akses Tamu
        </h1>

        <p>
          Anda sedang menggunakan akses sebagai tamu.
        </p>

        <p className="guest-description">
          Silakan gunakan sistem sesuai dengan
          hak akses yang tersedia.
        </p>

        <button
          type="button"
          onClick={kembaliKeLogin}
        >
          Kembali ke Login
        </button>

      </section>


      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
        }

        body {
          font-family:
            "Segoe UI",
            Arial,
            Helvetica,
            sans-serif;

          background:
            #f5f7f5;

          color:
            #26352d;
        }

        .guest-page {
          min-height: 100vh;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 24px;

          background:
            #f5f7f5;
        }

        .guest-card {
          width: 100%;

          max-width: 450px;

          padding: 40px;

          background:
            #ffffff;

          border-radius: 18px;

          text-align: center;

          box-shadow:
            0 16px 45px
            rgba(20, 60, 40, 0.10);
        }

        .guest-logo {
          display: flex;

          justify-content: center;

          align-items: center;

          margin-bottom: 25px;
        }

        .guest-logo img {
          width: 160px;

          height: auto;

          object-fit: contain;

          display: block;
        }

        .guest-card h1 {
          margin: 0 0 10px;

          color:
            #193c29;

          font-size: 28px;

          font-weight: 650;
        }

        .guest-card p {
          margin: 0;

          color:
            #59665e;

          font-size: 15px;

          line-height: 1.6;
        }

        .guest-description {
          margin-top: 6px !important;

          color:
            #78827c !important;

          font-size: 13px !important;
        }

        .guest-card button {
          width: 100%;

          height: 50px;

          margin-top: 28px;

          border: 0;

          border-radius: 9px;

          background:
            #34764c;

          color:
            #ffffff;

          font-size: 14px;

          font-weight: 600;

          cursor: pointer;
        }

        .guest-card button:hover {
          background:
            #2b653f;
        }

        @media (max-width: 560px) {

          .guest-page {
            padding: 16px;
          }

          .guest-card {
            padding: 30px 22px;

            border-radius: 16px;
          }

          .guest-logo img {
            width: 140px;
          }

          .guest-card h1 {
            font-size: 25px;
          }

        }

      `}</style>

    </main>
  );
}