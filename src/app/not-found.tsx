import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
      <Link href="/" className="mt-6 font-semibold text-brand">
        처음으로
      </Link>
    </div>
  );
}
