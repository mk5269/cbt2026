"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getCurrentUser, sessionCookieOptions, signSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/secret";
import {
  validateLoginId,
  validateName,
  validateNickname,
  validatePassword,
} from "@/lib/validators";

export type ActionState = { error: string; ok?: boolean };

async function setSession(user: { id: string; role: string; loginId: string }) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(user), sessionCookieOptions());
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginId || !password) return { error: "아이디와 비밀번호를 입력해 주세요." };

  const user = await db().user.findUnique({ where: { loginId } });
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };

  await setSession(user);
  redirect("/dashboard");
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const loginResult = validateLoginId(String(formData.get("loginId") ?? ""));
  if (!loginResult.ok) return { error: loginResult.error };
  const passwordResult = validatePassword(String(formData.get("password") ?? ""));
  if (!passwordResult.ok) return { error: passwordResult.error };
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== passwordResult.data.password) return { error: "비밀번호가 서로 다릅니다." };
  const nameResult = validateName(String(formData.get("name") ?? ""));
  if (!nameResult.ok) return { error: nameResult.error };

  const reserved = (process.env.ADMIN_LOGIN_ID || "admin").trim().toLowerCase();
  if (loginResult.data.loginId.toLowerCase() === reserved) {
    return { error: "사용할 수 없는 아이디입니다." };
  }

  const existing = await db().user.findUnique({ where: { loginId: loginResult.data.loginId } });
  if (existing) return { error: "이미 사용 중인 아이디입니다." };

  const user = await db().user.create({
    data: {
      loginId: loginResult.data.loginId,
      passwordHash: await bcrypt.hash(passwordResult.data.password, 10),
      name: nameResult.data.name,
      nickname: "",
      role: "user",
    },
  });

  await setSession(user);
  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const nameResult = validateName(String(formData.get("name") ?? ""));
  if (!nameResult.ok) return { error: nameResult.error };
  const nicknameResult = validateNickname(String(formData.get("nickname") ?? ""));
  if (!nicknameResult.ok) return { error: nicknameResult.error };

  await db().user.update({
    where: { id: user.id },
    data: { name: nameResult.data.name, nickname: nicknameResult.data.nickname },
  });
  revalidatePath("/dashboard");
  return { error: "", ok: true };
}
