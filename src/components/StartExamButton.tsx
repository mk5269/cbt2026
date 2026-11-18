"use client";

import { useActionState } from "react";
import { startExam } from "@/app/actions/exam";
import type { ActionState } from "@/app/actions/auth";
import { primaryButtonClass } from "@/lib/ui";

const initialState: ActionState = { error: "" };

export function StartExamButton({
  canStart,
  active,
}: {
  canStart: boolean;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(startExam, initialState);

  return (
    <form action={action} className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {active ? "진행 중인 시험이 있습니다" : "시험 시작"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            등록된 문제 중 20문제가 무작위로 출제됩니다. 제한시간은 20분이고, 한 문제당 5점입니다.
          </p>
        </div>
        <button
          type="submit"
          className={`${primaryButtonClass} shrink-0`}
          disabled={pending || !canStart}
        >
          {pending ? "준비 중…" : active ? "시험 이어하기" : "시험 시작"}
        </button>
      </div>
      {!canStart ? (
        <p className="mt-3 text-sm text-slate-500">
          출제 가능한 문제가 20개 미만이라 아직 시험을 시작할 수 없습니다.
        </p>
      ) : null}
      {state.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
