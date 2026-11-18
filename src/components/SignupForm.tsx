"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type ActionState } from "@/app/actions/auth";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

const initialState: ActionState = { error: "" };

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initialState);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">아이디</span>
        <input name="loginId" autoComplete="username" className={fieldClass} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">비밀번호 확인</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">이름</span>
        <input name="name" autoComplete="name" className={fieldClass} placeholder="홍길동" />
      </label>
      <p className="text-sm leading-6 text-slate-500">
        닉네임은 아이디와 별도로, 로그인 후에 설정합니다. 순위표에는 닉네임과 이름이 함께
        표시됩니다.
      </p>
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      ) : null}
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? "가입 중…" : "가입하고 시작하기"}
      </button>
      <p className="text-center text-sm text-slate-500">
        이미 계정이 있나요?{" "}
        <Link href="/" className="font-semibold text-brand hover:text-brand-dark">
          로그인
        </Link>
      </p>
    </form>
  );
}
