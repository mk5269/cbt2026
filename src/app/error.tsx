"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">화면을 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        데이터베이스 연결을 확인해 주세요. Vercel에서는 Postgres 연결 문자열을 DATABASE_URL에
        넣으면 됩니다.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
