import { SiteHeader } from "@/components/SiteHeader";
import { QuestionStudio, type QuestionDTO } from "@/components/QuestionStudio";
import { getCurrentUser } from "@/lib/auth";
import { countUsableQuestions } from "@/lib/exam";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  if (user.role !== "admin") redirect("/dashboard");

  const [questions, usable] = await Promise.all([
    db().question.findMany({
      orderBy: { updatedAt: "desc" },
      include: { choices: { orderBy: { order: "asc" } } },
    }),
    countUsableQuestions(),
  ]);

  const items: QuestionDTO[] = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
      isCorrect: choice.isCorrect,
    })),
  }));

  return (
    <>
      <SiteHeader user={user} section="admin" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">문제 관리</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            새 문제와 저장된 문제 보기를 눌러 등록하거나 수정·삭제할 수 있습니다. 응시자는 이 문제들 중 20문제를
            무작위로 풀게 됩니다. 지금 출제 가능한 문제는 {usable}개입니다.
          </p>
        </div>
        <QuestionStudio questions={items} />
      </main>
    </>
  );
}
