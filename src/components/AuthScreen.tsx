export function AuthScreen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-sm font-bold text-white">
            CBT
          </span>
          <p className="mt-5 text-sm font-semibold text-brand">자격검정 2026</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-[15px] leading-6 text-slate-500">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
