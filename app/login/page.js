"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * Mengambil username yang sebelumnya disimpan
   */
  useEffect(() => {
    try {
      const savedUsername =
        localStorage.getItem("remember_username");

      if (savedUsername) {
        setUsername(savedUsername);
        setRemember(true);
      }
    } catch (error) {
      console.error(
        "Gagal membaca username:",
        error
      );
    }
  }, []);

  /*
   * PROSES LOGIN
   */
  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    const usernameValue = username.trim();

    if (!usernameValue) {
      setError("Username wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: usernameValue,
            password: password,
          }),
        }
      );

      const result = await response.json();

      console.log(
        "LOGIN RESPONSE:",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Username atau password salah."
        );

        return;
      }

      /*
       * Simpan data user
       *
       * Tetap menggunakan "user"
       * agar tidak mengubah kode lain
       * yang sudah menggunakan storage ini.
       */
      sessionStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );

      /*
       * Simpan username jika
       * Ingat Saya aktif
       */
      if (remember) {
        localStorage.setItem(
          "remember_username",
          usernameValue
        );
      } else {
        localStorage.removeItem(
          "remember_username"
        );
      }

      /*
       * LOGIN BERHASIL
       *
       * Perbaikan:
       * /Dashboard -> /inspeksi
       */
      router.replace("/inspeksi");

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "Tidak dapat terhubung ke server."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * LOGIN SEBAGAI TAMU
   *
   * Tamu diarahkan ke /guest,
   * bukan /Dashboard.
   */
  function loginSebagaiTamu() {
    const guestUser = {
      id_user: null,
      username: "guest",
      nama_lengkap: "Tamu",
      role: "GUEST",
    };

    sessionStorage.setItem(
      "user",
      JSON.stringify(guestUser)
    );

    router.replace("/guest");
  }

  /*
   * LUPA PASSWORD
   */
  function lupaPassword() {
    alert(
      "Silakan hubungi administrator untuk melakukan reset password."
    );
  }

  return (
    <main className="login-page" suppressHydrationWarning>

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="background-image" />

      <div className="background-overlay" />


      {/* =====================================================
          BAGIAN KIRI
      ====================================================== */}

      <section className="visual-section">

        {/* =================================================
            BRAND + LOGO NANAS
        ================================================== */}

        <div className="brand">

          <div className="brand-logo">
            <img
              src="/logo-nanas.png"
              alt="Logo"
            />
          </div>

          <div className="brand-text">

            <strong>
              INSPEKSI K3
            </strong>

            <span>
              Keselamatan dan Kesehatan Kerja
            </span>

          </div>

        </div>


        <div className="visual-content">

          <h1>
            Keselamatan Kerja,
            <br />
            Tanggung Jawab Bersama
          </h1>

          <p>
            Mencatat, memantau, dan menindaklanjuti
            temuan inspeksi untuk menciptakan
            lingkungan kerja yang lebih aman dan sehat.
          </p>

        </div>


        <div className="visual-footer">
          © 2026 Sistem Inspeksi K3
        </div>

      </section>


      {/* =====================================================
          LOGIN
      ====================================================== */}

      <section className="login-section">

        <div className="login-card">

          {/* =================================================
              LOGO GGF
          ================================================== */}

          <div className="login-logo">

            <img
              src="/logo-ggf.png"
              alt="GGF"
            />

          </div>


          <div className="login-header">

            <h2>
              Selamat Datang
            </h2>

            <p>
              Silakan masuk untuk melanjutkan
            </p>

          </div>


          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* =================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleLogin}
            className="login-form"
            suppressHydrationWarning
            autoComplete="off"
          >

            {/* USERNAME */}

            <div className="input-group">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Masukkan username"
                autoComplete="username"
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                >
                  {showPassword
                    ? "Sembunyikan"
                    : "Tampilkan"}
                </button>

              </div>

            </div>


            {/* OPTIONS */}

            <div className="login-options">

              <label className="remember">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(
                      event.target.checked
                    )
                  }
                />

                <span>
                  Ingat saya
                </span>

              </label>


              <button
                type="button"
                className="forgot-button"
                onClick={lupaPassword}
              >
                Lupa password?
              </button>

            </div>


            {/* LOGIN */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading
                ? "Memproses..."
                : "Masuk"}

            </button>

          </form>


          {/* =================================================
              DIVIDER
          ================================================== */}

          <div className="divider">

            <span />

            <small>
              atau
            </small>

            <span />

          </div>


          {/* =================================================
              GUEST
          ================================================== */}

          <button
            type="button"
            className="guest-button"
            onClick={loginSebagaiTamu}
          >
            Masuk sebagai tamu
          </button>

        </div>

      </section>


      {/* =====================================================
          CSS
      ====================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }


        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }


        body {
          font-family:
            "Segoe UI",
            Arial,
            Helvetica,
            sans-serif;

          overflow-x: hidden;

          color: #26352d;
        }


        button,
        input {
          font-family: inherit;
        }


        /* ==================================================
           PAGE
        ================================================== */

        .login-page {
          position: relative;

          width: 100%;

          min-height: 100vh;

          display: grid;

          grid-template-columns:
            1.1fr
            0.9fr;

          overflow: hidden;

          background:
            #f5f7f5;
        }


        /* ==================================================
           BACKGROUND
        ================================================== */

        .background-image {
          position: fixed;

          inset: 0;

          background-image:
            url("/login-bg.jpg");

          background-size: cover;

          background-position: center;

          z-index: 0;
        }


        .background-overlay {
          position: fixed;

          inset: 0;

          background:
            linear-gradient(
              90deg,
              rgba(20, 61, 42, 0.80) 0%,
              rgba(20, 61, 42, 0.60) 43%,
              rgba(246, 249, 247, 0.93) 75%,
              rgba(246, 249, 247, 0.98) 100%
            );

          z-index: 1;
        }


        /* ==================================================
           LEFT SECTION
        ================================================== */

        .visual-section {
          position: relative;

          z-index: 2;

          min-height: 100vh;

          padding:
            40px
            clamp(30px, 6vw, 90px);

          display: flex;

          flex-direction: column;

          justify-content: space-between;

          color: white;
        }


        /* ==================================================
           BRAND
        ================================================== */

        .brand {
          display: flex;

          align-items: center;

          gap: 12px;
        }


        /* ==================================================
           LOGO NANAS
        ================================================== */

        .brand-logo {
          width: 50px;

          height: 50px;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;
        }


        .brand-logo img {
          width: 50px;

          height: 50px;

          display: block;

          object-fit: contain;
        }


        .brand-text strong {
          display: block;

          font-size: 19px;

          line-height: 1.2;

          font-weight: 700;

          letter-spacing:
            -0.01em;
        }


        .brand-text span {
          display: block;

          margin-top: 5px;

          font-size: 12px;

          font-weight: 400;

          color:
            rgba(255,255,255,0.82);
        }


        /* ==================================================
           VISUAL CONTENT
        ================================================== */

        .visual-content {
          max-width: 610px;

          margin-top: auto;

          margin-bottom: auto;
        }


        .visual-content h1 {
          margin: 0;

          font-size:
            clamp(35px, 4vw, 54px);

          line-height: 1.12;

          letter-spacing:
            -0.025em;

          font-weight: 700;
        }


        .visual-content p {
          max-width: 550px;

          margin:
            22px 0 0;

          font-size:
            clamp(15px, 1.3vw, 17px);

          line-height: 1.65;

          font-weight: 400;

          color:
            rgba(255,255,255,0.88);
        }


        /* ==================================================
           FOOTER
        ================================================== */

        .visual-footer {
          font-size: 12px;

          font-weight: 400;

          color:
            rgba(255,255,255,0.70);
        }


        /* ==================================================
           LOGIN SECTION
        ================================================== */

        .login-section {
          position: relative;

          z-index: 3;

          min-height: 100vh;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 40px;
        }


        /* ==================================================
           LOGIN CARD
        ================================================== */

        .login-card {
          width: 100%;

          max-width: 440px;

          padding:
            40px 38px;

          background:
            rgba(255,255,255,0.97);

          border-radius: 18px;

          box-shadow:
            0 16px 45px
            rgba(20,60,40,0.14);
        }


        /* ==================================================
           LOGO GGF
        ================================================== */

        .login-logo {
          width: 100%;

          display: flex;

          align-items: center;

          justify-content: center;

          margin-bottom: 18px;
        }


        .login-logo img {
          display: block;

          width: 160px;

          height: auto;

          object-fit: contain;
        }


        /* ==================================================
           HEADER
        ================================================== */

        .login-header {
          text-align: center;

          margin-bottom: 30px;
        }


        .login-header h2 {
          margin: 0;

          color:
            #193c29;

          font-size: 29px;

          line-height: 1.25;

          font-weight: 650;

          letter-spacing:
            -0.015em;
        }


        .login-header p {
          margin:
            9px 0 0;

          color:
            #78827c;

          font-size: 14px;

          line-height: 1.5;

          font-weight: 400;
        }


        /* ==================================================
           ERROR
        ================================================== */

        .error-message {
          margin-bottom: 20px;

          padding:
            11px 13px;

          border:
            1px solid #f0d2d2;

          border-radius: 9px;

          background:
            #fff7f7;

          color:
            #b42318;

          font-size: 13px;

          line-height: 1.45;
        }


        /* ==================================================
           INPUT GROUP
        ================================================== */

        .input-group {
          margin-bottom: 19px;
        }


        .input-group label {
          display: block;

          margin-bottom: 8px;

          color:
            #34433a;

          font-size: 14px;

          line-height: 1.4;

          font-weight: 600;
        }


        .input-group input {
          width: 100%;

          height: 52px;

          padding:
            0 15px;

          border:
            1px solid #d9e0db;

          border-radius: 9px;

          outline: none;

          background:
            #ffffff;

          color:
            #26352d;

          font-size: 14px;

          font-weight: 400;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }


        .input-group input::placeholder {
          color:
            #a1aaa5;
        }


        .input-group input:focus {
          border-color:
            #34764c;

          box-shadow:
            0 0 0 3px
            rgba(52,118,76,0.09);
        }


        /* ==================================================
           PASSWORD
        ================================================== */

        .password-wrapper {
          position: relative;

          width: 100%;
        }


        .password-wrapper input {
          padding-right:
            90px;
        }


        .password-toggle {
          position: absolute;

          right: 9px;

          top: 50%;

          transform:
            translateY(-50%);

          padding:
            5px 7px;

          border: 0;

          background:
            transparent;

          color:
            #34764c;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;
        }


        .password-toggle:hover {
          color:
            #245d38;
        }


        /* ==================================================
           OPTIONS
        ================================================== */

        .login-options {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          margin:
            3px 0 23px;
        }


        .remember {
          display: flex;

          align-items: center;

          gap: 7px;

          color:
            #68736d;

          font-size: 13px;

          font-weight: 400;

          cursor: pointer;
        }


        .remember input {
          width: 15px;

          height: 15px;

          margin: 0;

          accent-color:
            #34764c;
        }


        .forgot-button {
          padding: 0;

          border: 0;

          background:
            transparent;

          color:
            #34764c;

          font-size: 13px;

          font-weight: 500;

          cursor: pointer;
        }


        .forgot-button:hover {
          text-decoration:
            underline;
        }


        /* ==================================================
           LOGIN BUTTON
        ================================================== */

        .login-button {
          width: 100%;

          height: 52px;

          display: flex;

          align-items: center;

          justify-content: center;

          border: 0;

          border-radius: 9px;

          background:
            #34764c;

          color:
            white;

          font-size: 14px;

          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.2s ease;
        }


        .login-button:hover {
          background:
            #2b653f;
        }


        .login-button:disabled {
          opacity:
            0.65;

          cursor:
            not-allowed;
        }


        /* ==================================================
           DIVIDER
        ================================================== */

        .divider {
          display: flex;

          align-items: center;

          gap: 12px;

          margin:
            23px 0;
        }


        .divider span {
          flex: 1;

          height: 1px;

          background:
            #e3e7e4;
        }


        .divider small {
          color:
            #8b948e;

          font-size: 12px;

          font-weight: 400;
        }


        /* ==================================================
           GUEST BUTTON
        ================================================== */

        .guest-button {
          width: 100%;

          height: 50px;

          border:
            1px solid #d9e0db;

          border-radius: 9px;

          background:
            #ffffff;

          color:
            #34764c;

          font-size: 14px;

          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.2s ease,
            border-color 0.2s ease;
        }


        .guest-button:hover {
          background:
            #f5faf6;

          border-color:
            #c8d7cc;
        }


        /* ==================================================
           TABLET
        ================================================== */

        @media (max-width: 900px) {

          .login-page {
            grid-template-columns:
              1fr;
          }


          .visual-section {
            min-height:
              330px;

            padding:
              28px 35px;
          }


          .visual-content {
            margin:
              55px 0 20px;
          }


          .visual-content h1 {
            font-size:
              38px;
          }


          .visual-footer {
            display: none;
          }


          .login-section {
            min-height:
              calc(100vh - 330px);

            padding:
              30px 20px;
          }


          .background-overlay {
            background:
              linear-gradient(
                180deg,
                rgba(20,61,42,0.80),
                rgba(20,61,42,0.67)
              );
          }

        }


        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 560px) {

          .visual-section {
            min-height:
              255px;

            padding:
              22px 20px;
          }


          .brand {
            gap:
              9px;
          }


          .brand-logo {
            width:
              40px;

            height:
              40px;
          }


          .brand-logo img {
            width:
              40px;

            height:
              40px;
          }


          .brand-text strong {
            font-size:
              17px;
          }


          .brand-text span {
            font-size:
              10px;
          }


          .visual-content {
            margin-top:
              30px;
          }


          .visual-content h1 {
            font-size:
              29px;
          }


          .visual-content p {
            margin-top:
              11px;

            font-size:
              13px;

            line-height:
              1.55;
          }


          .login-section {
            min-height:
              calc(100vh - 255px);

            padding:
              22px 14px;
          }


          .login-card {
            padding:
              30px 20px;

            border-radius:
              16px;
          }


          /* LOGO GGF MOBILE */

          .login-logo {
            margin-bottom:
              15px;
          }


          .login-logo img {
            width:
              140px;
          }


          .login-header {
            margin-bottom:
              26px;
          }


          .login-header h2 {
            font-size:
              27px;
          }


          .login-options {
            gap:
              6px;
          }


          .remember,
          .forgot-button {
            font-size:
              12px;
          }


          .password-toggle {
            font-size:
              11px;
          }

        }

      `}</style>

    </main>
  );
}