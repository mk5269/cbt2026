import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { getAuthSecret, SESSION_COOKIE } from "@/lib/secret";

export type SessionUser = {
  id: string;
  loginId: string;
  name: string;
  nickname: string;
  role: string;
};

export function displayNickname(nickname: string) {
  const value = nickname.trim();
  return value || "미설정";
}

export async function signSession(user: { id: string; role: string; loginId: string }) {
  return new SignJWT({ role: user.role, loginId: user.loginId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub) return null;
    return db().user.findUnique({
      where: { id: payload.sub },
      select: { id: true, loginId: true, name: true, nickname: true, role: true },
    });
  } catch {
    return null;
  }
});

export async function ensureAdmin() {
  const loginId = (process.env.ADMIN_LOGIN_ID || "admin").trim();
  const password =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "admin1234" : "");
  const name = (process.env.ADMIN_NAME || "관리자").trim() || "관리자";
  if (!loginId || !password) return;

  const existing = await db().user.findUnique({ where: { loginId } });
  if (existing) {
    if (existing.role !== "admin") {
      await db().user.update({ where: { id: existing.id }, data: { role: "admin" } });
    }
    return;
  }

  await db().user.create({
    data: {
      loginId,
      passwordHash: await bcrypt.hash(password, 10),
      name,
      nickname: name,
      role: "admin",
    },
  });
}
