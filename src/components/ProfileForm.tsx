"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/app/actions/auth";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

const initialState: ActionState = { error: "" };

export function ProfileForm({
  loginId,
  name,
  nickname,
}: {
  loginId: string;
  name: string;
  nickname: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="rounded-2xl border border-slate-200 p-5">
      <h2 className="text-lg font-bold text-slate-900">내 정보</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        닉네임은 로그인 아이디와 따로 정합니다. 순위표에는 닉네임과 이름이 표시됩니다.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">아이디</span>
          <input value={loginId} readOnly className={`${fieldClass} bg-slate-50 text-slate-500`} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">이름</span>
          <input name="name" defaultValue={name} autoComplete="name" className={fieldClass} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">닉네임</span>
          <input
            name="nickname"
            defaultValue={nickname}
            autoComplete="nickname"
            placeholder="순위표에 보일 닉네임"
            className={fieldClass}
          />
        </label>
      </div>
      {state.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="mt-3 text-sm font-medium text-brand">저장했습니다.</p> : null}
      <button type="submit" className={`${primaryButtonClass} mt-4`} disabled={pending}>
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
