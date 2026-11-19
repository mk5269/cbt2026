"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion, saveQuestion } from "@/app/actions/questions";
import { dangerButtonClass, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

export type QuestionDTO = {
  id: string;
  prompt: string;
  choices: { id: string; text: string; isCorrect: boolean }[];
};

type DraftChoice = { key: string; text: string; isCorrect: boolean };
type Draft = { prompt: string; choices: DraftChoice[] };

function emptyDraft(): Draft {
  return {
    prompt: "",
    choices: ["a", "b", "c", "d"].map((key) => ({
      key,
      text: "",
      isCorrect: false,
    })),
  };
}

function draftFrom(question: QuestionDTO): Draft {
  return {
    prompt: question.prompt,
    choices: question.choices.map((choice) => ({
      key: choice.id,
      text: choice.text,
      isCorrect: choice.isCorrect,
    })),
  };
}

export function QuestionStudio({ questions }: { questions: QuestionDTO[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<string>("new");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function openNew() {
    setMode("new");
    setDraft(emptyDraft());
    setError("");
    setMessage("");
  }

  function openQuestion(question: QuestionDTO) {
    setMode(question.id);
    setDraft(draftFrom(question));
    setError("");
    setMessage("");
  }

  function setCorrect(key: string, correct: boolean) {
    setDraft((current) => ({
      ...current,
      choices: current.choices.map((choice) => {
        if (choice.key === key) return { ...choice, isCorrect: correct };
        if (correct) return { ...choice, isCorrect: false };
        return choice;
      }),
    }));
  }

  function move(key: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.choices.findIndex((choice) => choice.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.choices.length) return current;
      const choices = [...current.choices];
      const [item] = choices.splice(index, 1);
      choices.splice(target, 0, item);
      return { ...current, choices };
    });
  }

  async function onSave() {
    setPending(true);
    setError("");
    setMessage("");
    const result = await saveQuestion({
      id: mode === "new" ? undefined : mode,
      prompt: draft.prompt,
      choices: draft.choices.map((choice) => ({
        text: choice.text,
        isCorrect: choice.isCorrect,
      })),
    });
    setPending(false);
    if (result.error || !result.id) {
      setError(result.error || "저장하지 못했습니다.");
      return;
    }
    if (mode === "new") {
      openNew();
      setMessage("저장했습니다. 다음 문제를 입력하세요.");
    } else {
      setMessage("수정했습니다.");
    }
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("이 문제를 삭제할까요?")) return;
    setPending(true);
    const result = await deleteQuestion(id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === id) openNew();
    router.refresh();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <button type="button" className={`${primaryButtonClass} w-full`} onClick={openNew}>
          새 문제
        </button>
        <div className="space-y-2">
          {questions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm leading-6 text-slate-500">
              아직 등록된 문제가 없습니다.
            </p>
          ) : (
            questions.map((question, index) => {
              const correctNumbers = question.choices.flatMap((choice, choiceIndex) =>
                choice.isCorrect ? [choiceIndex + 1] : [],
              );
              const active = mode === question.id;
              return (
                <div
                  key={question.id}
                  className={`rounded-2xl border p-3 ${
                    active ? "border-brand bg-brand-soft" : "border-slate-200"
                  }`}
                >
                  <p className="text-xs font-semibold text-brand">문제 {index + 1}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{question.prompt}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    정답 {correctNumbers.length > 0 ? `${correctNumbers.join(", ")}번` : "없음"} · 선지{" "}
                    {question.choices.length}개
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      disabled={pending}
                      onClick={() => openQuestion(question)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={dangerButtonClass}
                      disabled={pending}
                      onClick={() => void onDelete(question.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === "new" ? "새 문제" : "문제 수정"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          각 선지에서 정답 또는 오답을 직접 체크하세요. 정답은 하나만 선택할 수 있습니다.
        </p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium text-slate-700">문제</span>
          <textarea
            value={draft.prompt}
            onChange={(event) => setDraft((current) => ({ ...current, prompt: event.target.value }))}
            rows={4}
            className={fieldClass}
            placeholder="문제 내용을 입력하세요"
          />
        </label>

        <div className="mt-5 space-y-3">
          {draft.choices.map((choice, index) => (
            <div key={choice.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <label className="flex items-center gap-2 text-brand">
                    <input
                      type="checkbox"
                      checked={choice.isCorrect}
                      onChange={(event) => setCorrect(choice.key, event.target.checked)}
                      className="size-4 accent-brand"
                    />
                    정답
                  </label>
                  <label className="flex items-center gap-2 text-slate-500">
                    <input
                      type="checkbox"
                      checked={!choice.isCorrect}
                      onChange={(event) => setCorrect(choice.key, !event.target.checked)}
                      className="size-4 accent-slate-500"
                    />
                    오답
                  </label>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    onClick={() => move(choice.key, -1)}
                  >
                    위로
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    onClick={() => move(choice.key, 1)}
                  >
                    아래로
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                    disabled={draft.choices.length <= 2}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        choices: current.choices.filter((item) => item.key !== choice.key),
                      }))
                    }
                  >
                    삭제
                  </button>
                </div>
              </div>
              <input
                value={choice.text}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    choices: current.choices.map((item) =>
                      item.key === choice.key ? { ...item, text: event.target.value } : item,
                    ),
                  }))
                }
                className={`${fieldClass} mt-3`}
                placeholder={`선지 ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${secondaryButtonClass} mt-4`}
          disabled={draft.choices.length >= 8}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              choices: [
                ...current.choices,
                { key: `n-${current.choices.length}-${Date.now()}`, text: "", isCorrect: false },
              ],
            }))
          }
        >
          선지 추가
        </button>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-brand">{message}</p> : null}

        <button
          type="button"
          className={`${primaryButtonClass} mt-4`}
          disabled={pending}
          onClick={() => void onSave()}
        >
          {pending ? "저장 중…" : "문제 저장"}
        </button>
      </section>
    </div>
  );
}
