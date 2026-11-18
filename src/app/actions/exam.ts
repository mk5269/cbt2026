"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/actions/auth";
import { EXAM_QUESTION_COUNT, SUBMIT_GRACE_MS } from "@/lib/constants";
import {
  asStringArray,
  getOpenSession,
  gradeSession,
  pickQuestionIds,
  remainingMs,
  sanitizeAnswers,
} from "@/lib/exam";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function startExam(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev;
  void formData;
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const open = await getOpenSession(user.id);
  if (open) {
    if (remainingMs(open.startedAt) + SUBMIT_GRACE_MS > 0) redirect("/exam");
    await db().examSession.update({
      where: { id: open.id },
      data: { submittedAt: new Date() },
    });
  }

  const questionIds = await pickQuestionIds();
  if (questionIds.length < EXAM_QUESTION_COUNT) {
    return {
      error: `출제 가능한 문제가 ${questionIds.length}개입니다. 20문제가 등록되면 시험을 시작할 수 있습니다.`,
    };
  }

  await db().examSession.create({
    data: { userId: user.id, questionIds },
  });
  redirect("/exam");
}

export async function submitExam(
  sessionId: string,
  rawAnswers: unknown,
): Promise<{ error: string; attemptId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const answers = sanitizeAnswers(rawAnswers);
  const result = await db().$transaction(async (tx) => {
    const session = await tx.examSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) return { error: "시험을 찾을 수 없습니다." };
    if (session.submittedAt) {
      return session.attemptId
        ? { error: "", attemptId: session.attemptId }
        : { error: "이미 종료된 시험입니다." };
    }
    if (remainingMs(session.startedAt) + SUBMIT_GRACE_MS <= 0) {
      await tx.examSession.update({
        where: { id: session.id },
        data: { submittedAt: new Date() },
      });
      return { error: "제한시간이 종료되어 이번 응시는 기록되지 않았습니다." };
    }

    const questionIds = asStringArray(session.questionIds);
    const graded = await gradeSession(questionIds, answers, tx);
    const attempt = await tx.attempt.create({
      data: {
        userId: user.id,
        score: graded.score,
        correct: graded.correct,
        total: graded.total,
        detail: graded.detail,
      },
    });
    await tx.examSession.update({
      where: { id: session.id },
      data: { submittedAt: new Date(), attemptId: attempt.id },
    });
    return { error: "", attemptId: attempt.id };
  });

  if (result.attemptId) revalidatePath("/dashboard");
  return result;
}
