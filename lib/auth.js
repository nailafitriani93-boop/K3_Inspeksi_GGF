import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  throw new Error("JWT_SECRET belum tersedia di .env");
}

const secret = new TextEncoder().encode(secretKey);

export async function createSession(user) {
  return await new SignJWT({
    userId: user.id_user ?? user.id,
    username: user.username,
    nama: user.nama_lengkap ?? user.nama,
    nama_lengkap: user.nama_lengkap ?? user.nama,
    role: user.role,
    akses_dashboard: Boolean(user.akses_dashboard),
    akses_dashboard: Boolean(user.akses_dashboard),
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(
      token,
      secret
    );

    return payload;
  } catch {
    return null;
  }
}