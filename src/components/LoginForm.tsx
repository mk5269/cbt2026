"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type ActionState } from "@/app/actions/auth";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

const initialState: ActionState = { error: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">아이디</span>
        <input
          name="loginId"
          autoComplete="username"
          className={fieldClass}
          placeholder="아이디"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className={fieldClass}
          placeholder="비밀번호"
        />
      </label>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      ) : null}
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </button>
      <p className="text-center text-sm text-slate-500">
        계정이 없나요?{" "}
        <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark">
          회원가입
        </Link>
      </p>
    </form>
  );
}
