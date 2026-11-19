import { displayNickname } from "@/lib/auth";
import { getClassReport } from "@/lib/exam";

function formatAverage(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}점`;
}

export async function AdminClassReport() {
  const report = await getClassReport();
  const peak = Math.max(...report.distribution.map((bin) => bin.count), 1);

  return (
    <section className="rounded-2xl border border-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">학생 성적</h2>
        <p className="mt-1 text-sm text-slate-500">학생별 응시 성적과 평균, 전체 성적 분포입니다.</p>
      </div>

      <div className="grid gap-4 border-b border-slate-200 px-5 py-4 sm:grid-cols-2">
        <article className="rounded-2xl bg-brand-soft px-4 py-4">
          <p className="text-sm text-slate-500">전체 평균</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-brand">{formatAverage(report.overall)}</p>
        </article>
        <article className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-sm text-slate-500">전체 응시</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{report.attemptCount}회</p>
        </article>
      </div>

      <div className="border-b border-slate-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-slate-700">성적 분포</h3>
        <div className="mt-4 flex items-end gap-2">
          {report.distribution.map((bin) => (
            <div key={bin.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-slate-600">{bin.count}</span>
              <div className="flex h-36 w-full items-end rounded-md bg-slate-50">
                <div
                  className="w-full rounded-md bg-brand"
                  style={{ height: bin.count === 0 ? "0%" : `${Math.max((bin.count / peak) * 100, 8)}%` }}
                />
              </div>
              <span className="text-center text-[11px] leading-4 text-slate-500">{bin.label}</span>
            </div>
          ))}
        </div>
      </div>

      {report.students.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">등록된 학생이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">닉네임</th>
                <th className="px-5 py-3 font-medium">이름</th>
                <th className="px-5 py-3 font-medium">응시</th>
                <th className="px-5 py-3 font-medium">평균 성적</th>
                <th className="px-5 py-3 font-medium">성적</th>
              </tr>
            </thead>
            <tbody>
              {report.students.map((student) => (
                <tr key={student.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {displayNickname(student.nickname)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{student.name}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-700">{student.count}회</td>
                  <td className="px-5 py-3 font-semibold tabular-nums text-brand">
                    {formatAverage(student.average)}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-slate-600">
                    {student.scores.length > 0 ? student.scores.map((score) => `${score}점`).join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
