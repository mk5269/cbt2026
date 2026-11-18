import { SESSION_COOKIE } from "@/lib/constants";

export { SESSION_COOKIE };

export function getAuthSecret() {
  const value = process.env.AUTH_SECRET;
  if (value && value.length >= 16) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("dev-only-auth-secret-change-me");
  }
  throw new Error("AUTH_SECRET은 16자 이상으로 설정해야 합니다.");
}
