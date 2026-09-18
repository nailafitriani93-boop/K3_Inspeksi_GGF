import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

function redirectToLogin(request) {
  const url = request.nextUrl.clone();

  url.pathname = "/login";
  url.search = "";

  return NextResponse.redirect(url);
}

function redirectAccessDenied(request) {
  const url = new URL(
    "/dashboard?access=denied",
    request.url
  );

  const response = NextResponse.redirect(url);

  response.cookies.set("k3_access_denied", "1", {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
  });

  return response;
}

function isPermissionActive(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function permissionAllowed(pathname, user) {
  // =========================================================
  // USER / KELOLA USER
  // =========================================================
  if (
    pathname.startsWith("/users") ||
    pathname.startsWith("/api/users")
  ) {
    return isPermissionActive(user?.kelola_user);
  }

  // =========================================================
  // FORM INSPEKSI
  // =========================================================
  if (
    pathname.startsWith("/inspeksi") ||
    pathname.startsWith("/api/inspeksi")
  ) {
    return isPermissionActive(
      user?.akses_form_inspeksi
    );
  }

  // =========================================================
  // DATA TEMUAN
  // =========================================================
  if (
    pathname.startsWith("/temuan") ||
    pathname.startsWith("/api/temuan")
  ) {
    return isPermissionActive(
      user?.akses_data_temuan
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  ) {
    return isPermissionActive(
      user?.akses_dashboard
    );
  }

  return true;
}

// =============================================================
// AMBIL USER TERBARU DARI /api/auth/me
// =============================================================
async function getCurrentUser(request) {
  try {
    const url = new URL(
      "/api/auth/me",
      request.url
    );

    const response = await fetch(url, {
      method: "GET",

      headers: {
        cookie:
          request.headers.get("cookie") || "",
      },

      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data?.success || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error(
      "MIDDLEWARE AUTH ME ERROR:",
      error
    );

    return null;
  }
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // =========================================================
  // HALAMAN / API YANG DILINDUNGI
  // =========================================================
  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/inspeksi") ||
    pathname.startsWith("/temuan") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/api/inspeksi") ||
    pathname.startsWith("/api/temuan") ||
    pathname.startsWith("/api/users");

  if (!isProtected) {
    return NextResponse.next();
  }

  // =========================================================
  // CEK TOKEN LOGIN
  // =========================================================
  const token =
    request.cookies.get("k3_token")?.value;

  const session = token
    ? await verifySession(token)
    : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Login diperlukan.",
        },
        {
          status: 401,
        }
      );
    }

    return redirectToLogin(request);
  }

  // =========================================================
  // PENTING:
  // JANGAN LAGI MENGGUNAKAN PERMISSION DARI JWT.
  //
  // Ambil permission TERBARU dari database melalui /api/auth/me
  // =========================================================
  const currentUser =
    await getCurrentUser(request);

  if (!currentUser) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Session tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    return redirectToLogin(request);
  }

  // =========================================================
  // CEK HAK AKSES DARI DATA DATABASE TERBARU
  // =========================================================
  if (
    !permissionAllowed(
      pathname,
      currentUser
    )
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error:
            "Anda tidak memiliki hak akses.",
        },
        {
          status: 403,
        }
      );
    }

    return redirectAccessDenied(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inspeksi/:path*",
    "/temuan/:path*",
    "/users/:path*",
    "/api/inspeksi/:path*",
    "/api/temuan/:path*",
    "/api/users/:path*",
  ],
};