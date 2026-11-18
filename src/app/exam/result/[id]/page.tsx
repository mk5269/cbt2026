import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { asReview } from "@/lib/exam";
import { db } from "@/lib/prisma";
import { primaryButtonClass } from "@/lib/ui";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const { id } = await params;
  const attempt = await db().attempt.findFirst({ where: { id, userId: user.id } });
  if (!attempt) notFound();

  const items = asReview(attempt.detail);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-slate-200 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-brand">시험 결과</p>
          <p className="mt-3 text-6xl font-bold tabular-nums tracking-tight text-brand">
            {attempt.score}
            <span className="ml-1 text-2xl">점</span>
          </p>
          <p className="mt-3 text-slate-600">
            {attempt.correct} / {attempt.total} 정답 · 100점 만점 · 한 문제당 5점
          </p>
          <p className="mt-1 text-sm text-slate-500">순위표에 반영되었습니다.</p>
          <Link href="/dashboard" className={`${primaryButtonClass} mt-6`}>
            메인으로
          </Link>
        </section>

        <ol className="mt-6 space-y-4">
          {items.map((item, index) => (
            <li key={`${item.prompt}-${index}`} className="rounded-2xl border border-slate-200 p-5">
              <p className={`text-sm font-semibold ${item.correct ? "text-emerald-600" : "text-red-600"}`}>
                문제 {index + 1} · {item.correct ? "정답" : "오답"}
              </p>
              <p className="mt-2 whitespace-pre-wrap font-medium leading-7 text-slate-900">{item.prompt}</p>
              <ul className="mt-3 space-y-2">
                {item.choices.map((choice, choiceIndex) => {
                  const selected = choice.id === item.selectedId;
                  const correct = choice.id === item.correctId;
                  return (
                    <li
                      key={choice.id}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        correct
                          ? "bg-brand-soft text-brand"
                          : selected
                            ? "bg-red-50 text-red-700"
                            : "text-slate-600"
                      }`}
                    >
                      {choiceIndex + 1}. {choice.text}
                      {correct ? " · 정답" : ""}
                      {selected ? " · 내 선택" : ""}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
