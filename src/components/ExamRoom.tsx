"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitExam } from "@/app/actions/exam";
import type { PaperQuestion } from "@/lib/exam";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ExamRoom({
  sessionId,
  initialRemainingMs,
  questions,
}: {
  sessionId: string;
  initialRemainingMs: number;
  questions: PaperQuestion[];
}) {
  const router = useRouter();
  const storageKey = `cbt-answers-${sessionId}`;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(initialRemainingMs);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const endAtRef = useRef(0);
  const submitRef = useRef<(manual: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    endAtRef.current = Date.now() + initialRemainingMs;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return;
      const restored: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") restored[key] = value;
      }
      queueMicrotask(() => setAnswers(restored));
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [initialRemainingMs, storageKey]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  async function submit(manual: boolean) {
    if (submittedRef.current) return;
    if (manual) {
      const unanswered = questions.filter((question) => !answersRef.current[question.id]).length;
      if (
        unanswered > 0 &&
        !window.confirm(`아직 ${unanswered}문제를 풀지 않았습니다. 제출할까요?`)
      ) {
        return;
      }
    }

    submittedRef.current = true;
    setPending(true);
    setError("");
    const result = await submitExam(sessionId, answersRef.current);
    if (result.error || !result.attemptId) {
      submittedRef.current = false;
      setPending(false);
      setError(result.error || "제출하지 못했습니다.");
      return;
    }
    sessionStorage.removeItem(storageKey);
    router.push(`/exam/result/${result.attemptId}`);
    router.refresh();
  }

  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    let autoSubmitted = false;
    const timer = window.setInterval(() => {
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemaining(left);
      if (left <= 0 && !autoSubmitted && endAtRef.current > 0) {
        autoSubmitted = true;
        void submitRef.current(false);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  useEffect(() => {
    document.title = `${formatRemaining(remaining)} · 자격검정`;
  }, [remaining]);

  const question = questions[index];
  const answeredCount = questions.filter((item) => answers[item.id]).length;
  const urgent = remaining <= 60_000;

  if (!question) {
    return <p className="text-slate-500">출제된 문제가 없습니다.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">
            {index + 1} / {questions.length}
            <span className="mx-2 text-slate-300">·</span>
            {answeredCount}문제 응답
          </p>
          <p
            className={`rounded-full px-3 py-1 font-mono text-lg font-bold tabular-nums ${
              urgent ? "bg-red-50 text-red-600" : "bg-brand-soft text-brand"
            }`}
          >
            {formatRemaining(remaining)}
          </p>
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200 p-5 sm:p-6">
        <p className="text-sm font-semibold text-brand">문제 {index + 1}</p>
        <h1 className="mt-2 whitespace-pre-wrap text-xl font-bold leading-8 text-slate-900">
          {question.prompt}
        </h1>
        <div className="mt-5 space-y-3">
          {question.choices.map((choice, choiceIndex) => {
            const selected = answers[question.id] === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setAnswers((current) => ({ ...current, [question.id]: choice.id }))
                }
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-brand bg-brand-soft"
                    : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    selected ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {choiceIndex + 1}
                </span>
                <span className="pt-0.5 text-[15px] leading-6 text-slate-800">{choice.text}</span>
              </button>
            );
          })}
        </div>
      </article>

      <div className="mt-4 grid grid-cols-10 gap-2">
        {questions.map((item, itemIndex) => {
          const answered = Boolean(answers[item.id]);
          const current = itemIndex === index;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className={`h-9 rounded-lg text-sm font-semibold ${
                current
                  ? "bg-brand text-white"
                  : answered
                    ? "bg-brand-soft text-brand"
                    : "border border-slate-200 text-slate-500"
              }`}
            >
              {itemIndex + 1}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={index === 0 || pending}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
          >
            이전
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={index === questions.length - 1 || pending}
            onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
          >
            다음
          </button>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={pending}
          onClick={() => void submit(true)}
        >
          {pending ? "채점 중…" : "제출하기"}
        </button>
      </div>
    </div>
  );
}
