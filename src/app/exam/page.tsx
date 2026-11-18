import { redirect } from "next/navigation";
import { ExamRoom } from "@/components/ExamRoom";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { SUBMIT_GRACE_MS } from "@/lib/constants";
import { getPaper } from "@/lib/exam";
import { db } from "@/lib/prisma";

export default async function ExamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const paper = await getPaper(user.id);
  if (!paper) redirect("/dashboard");

  if (paper.remainingMs + SUBMIT_GRACE_MS <= 0) {
    await db().examSession.update({
      where: { id: paper.sessionId },
      data: { submittedAt: new Date() },
    });
    redirect("/dashboard?notice=expired");
  }

  if (paper.questions.length === 0) redirect("/dashboard?notice=empty");

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <ExamRoom
          sessionId={paper.sessionId}
          initialRemainingMs={Math.max(paper.remainingMs, 0)}
          questions={paper.questions}
        />
      </main>
    </>
  );
}
