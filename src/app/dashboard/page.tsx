import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { SiteHeader } from "@/components/SiteHeader";
import { StartExamButton } from "@/components/StartExamButton";
import { displayNickname, getCurrentUser } from "@/lib/auth";
import { EXAM_QUESTION_COUNT, SUBMIT_GRACE_MS } from "@/lib/constants";
import { countUsableQuestions, getMyStats, getOpenSession, getRanking, remainingMs } from "@/lib/exam";

const notices: Record<string, string> = {
  expired:
    "제한시간이 지나 응시가 종료되었습니다. 답안을 제출하지 못해 이번 회차는 성적에 반영되지 않았습니다.",
  empty: "시험 문제를 불러오지 못했습니다.",
};

function formatAverage(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}점`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const noticeKey = (await searchParams).notice;
  const notice = noticeKey ? notices[noticeKey] : undefined;
  const [stats, ranking, usable, open] = await Promise.all([
    getMyStats(user.id),
    getRanking(user.id),
    countUsableQuestions(),
    getOpenSession(user.id),
  ]);
  const active = Boolean(open && remainingMs(open.startedAt) + SUBMIT_GRACE_MS > 0);
  const canStart = active || usable >= EXAM_QUESTION_COUNT;
  const greeting = user.nickname.trim() || user.name;

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            안녕하세요, {greeting}님
          </h1>
          <p className="mt-1 text-sm text-slate-500">지금까지의 응시 기록과 순위입니다.</p>
        </div>

        {notice ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {notice}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">응시 횟수</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand">
              {stats.count}회
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">성적 평균</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand">
              {formatAverage(stats.average)}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">최고 점수</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand">
              {stats.best == null ? "—" : `${stats.best}점`}
            </p>
          </article>
        </section>

        <StartExamButton canStart={canStart} active={active} />
        {user.role === "admin" ? (
          <p className="text-sm text-slate-500">출제 가능한 문제 {usable}개</p>
        ) : null}

        <section className="rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">순위표</h2>
            <p className="mt-1 text-sm text-slate-500">
              최고 점수 기준 1위부터 15위까지 · 100점 만점, 한 문제당 5점
            </p>
          </div>
          {ranking.top.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">아직 응시 기록이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">순위</th>
                    <th className="px-5 py-3 font-medium">닉네임</th>
                    <th className="px-5 py-3 font-medium">이름</th>
                    <th className="px-5 py-3 text-right font-medium">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.top.map((row) => {
                    const mine = row.userId === user.id;
                    return (
                      <tr
                        key={row.userId}
                        className={`border-t border-slate-100 ${mine ? "bg-brand-soft" : ""}`}
                      >
                        <td className="px-5 py-3 font-bold tabular-nums text-brand">{row.rank}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {displayNickname(row.nickname)}
                          {mine ? <span className="ml-2 text-xs font-semibold text-brand">나</span> : null}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{row.name}</td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">
                          {row.score}점
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {ranking.mine ? (
            <p className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
              내 최고 점수 {ranking.mine.score}점
              {ranking.mine.inTop
                ? ` · 현재 ${ranking.mine.rank}위`
                : " · 15위 밖"}
            </p>
          ) : null}
        </section>

        <ProfileForm loginId={user.loginId} name={user.name} nickname={user.nickname} />
      </main>
    </>
  );
}
