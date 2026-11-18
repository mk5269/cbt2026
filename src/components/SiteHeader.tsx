import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";

export function SiteHeader({
  user,
  section = "app",
}: {
  user: SessionUser;
  section?: "app" | "admin";
}) {
  const label = user.nickname.trim() || user.name;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-xs text-white">
            CBT
          </span>
          자격검정
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden max-w-40 truncate text-slate-500 sm:inline">{label}</span>
          {user.role === "admin" && section !== "admin" ? (
            <Link
              href="/admin"
              className="rounded-lg border border-brand px-3 py-1.5 font-semibold text-brand hover:bg-brand-soft"
            >
              문제 관리
            </Link>
          ) : null}
          {section === "admin" ? (
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              메인
            </Link>
          ) : null}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
