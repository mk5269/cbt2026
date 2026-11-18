import { Prisma } from "@prisma/client";
import {
  EXAM_DURATION_MS,
  EXAM_QUESTION_COUNT,
  POINT_PER_QUESTION,
  RANKING_SIZE,
} from "@/lib/constants";
import { db } from "@/lib/prisma";

export type ReviewItem = {
  prompt: string;
  choices: { id: string; text: string }[];
  selectedId: string | null;
  correctId: string;
  correct: boolean;
};

export type PaperQuestion = {
  id: string;
  prompt: string;
  choices: { id: string; text: string }[];
};

export function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy;
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asReview(value: unknown): ReviewItem[] {
  if (!value || typeof value !== "object" || !("items" in value)) return [];
  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.prompt !== "string") return [];
    const choices = Array.isArray(row.choices)
      ? row.choices.flatMap((choice) => {
          if (!choice || typeof choice !== "object") return [];
          const entry = choice as Record<string, unknown>;
          if (typeof entry.id !== "string" || typeof entry.text !== "string") return [];
          return [{ id: entry.id, text: entry.text }];
        })
      : [];

    return [
      {
        prompt: row.prompt,
        choices,
        selectedId: typeof row.selectedId === "string" ? row.selectedId : null,
        correctId: typeof row.correctId === "string" ? row.correctId : "",
        correct: row.correct === true,
      },
    ];
  });
}

function isUsable(choices: { isCorrect: boolean }[]) {
  return choices.length >= 2 && choices.filter((choice) => choice.isCorrect).length === 1;
}

export async function countUsableQuestions() {
  const questions = await db().question.findMany({
    select: { choices: { select: { isCorrect: true } } },
  });
  return questions.filter((question) => isUsable(question.choices)).length;
}

export async function pickQuestionIds() {
  const questions = await db().question.findMany({
    include: { choices: { select: { isCorrect: true } } },
  });
  const ids = questions.filter((question) => isUsable(question.choices)).map((question) => question.id);
  return shuffle(ids).slice(0, EXAM_QUESTION_COUNT);
}

export async function getOpenSession(userId: string) {
  return db().examSession.findFirst({
    where: { userId, submittedAt: null },
    orderBy: { startedAt: "desc" },
  });
}

export function remainingMs(startedAt: Date) {
  return startedAt.getTime() + EXAM_DURATION_MS - Date.now();
}

export async function getPaper(userId: string) {
  const session = await getOpenSession(userId);
  if (!session) return null;

  const ids = asStringArray(session.questionIds);
  const questions = await db().question.findMany({
    where: { id: { in: ids } },
    include: { choices: { orderBy: { order: "asc" } } },
  });
  const byId = new Map(questions.map((question) => [question.id, question]));
  const ordered: PaperQuestion[] = ids.flatMap((id) => {
    const question = byId.get(id);
    if (!question) return [];
    return [
      {
        id: question.id,
        prompt: question.prompt,
        choices: question.choices.map((choice) => ({ id: choice.id, text: choice.text })),
      },
    ];
  });

  return {
    sessionId: session.id,
    remainingMs: remainingMs(session.startedAt),
    questions: ordered,
    expectedCount: ids.length,
  };
}

export function sanitizeAnswers(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const answers: Record<string, string> = {};
  for (const [questionId, choiceId] of Object.entries(value)) {
    if (typeof choiceId === "string" && choiceId.length > 0 && choiceId.length < 80) {
      answers[questionId] = choiceId;
    }
  }
  return answers;
}

export async function gradeSession(
  questionIds: string[],
  answers: Record<string, string>,
  client: Pick<Prisma.TransactionClient, "question"> = db(),
) {
  const questions = await client.question.findMany({
    where: { id: { in: questionIds } },
    include: { choices: { orderBy: { order: "asc" } } },
  });
  const byId = new Map(questions.map((question) => [question.id, question]));
  const items: ReviewItem[] = questionIds.map((id) => {
    const question = byId.get(id);
    if (!question) {
      return {
        prompt: "삭제된 문제",
        choices: [],
        selectedId: answers[id] ?? null,
        correctId: "",
        correct: false,
      };
    }
    const correctChoice = question.choices.find((choice) => choice.isCorrect);
    const selectedId = answers[id] ?? null;
    return {
      prompt: question.prompt,
      choices: question.choices.map((choice) => ({ id: choice.id, text: choice.text })),
      selectedId,
      correctId: correctChoice?.id ?? "",
      correct: Boolean(correctChoice) && selectedId === correctChoice?.id,
    };
  });

  const correct = items.filter((item) => item.correct).length;
  return {
    correct,
    total: questionIds.length,
    score: correct * POINT_PER_QUESTION,
    detail: { items } as Prisma.InputJsonValue,
  };
}

export async function getMyStats(userId: string) {
  const aggregate = await db().attempt.aggregate({
    where: { userId },
    _count: true,
    _avg: { score: true },
    _max: { score: true },
  });

  return {
    count: aggregate._count,
    average: aggregate._avg.score,
    best: aggregate._max.score,
  };
}

export async function getRanking(userId: string) {
  const attempts = await db().attempt.findMany({
    select: {
      userId: true,
      score: true,
      finishedAt: true,
      user: { select: { name: true, nickname: true } },
    },
  });

  const best = new Map<
    string,
    { userId: string; name: string; nickname: string; score: number; finishedAt: Date }
  >();

  for (const attempt of attempts) {
    const current = best.get(attempt.userId);
    const betterScore = !current || attempt.score > current.score;
    const earlierTie =
      current &&
      attempt.score === current.score &&
      attempt.finishedAt.getTime() < current.finishedAt.getTime();
    if (betterScore || earlierTie) {
      best.set(attempt.userId, {
        userId: attempt.userId,
        name: attempt.user.name,
        nickname: attempt.user.nickname,
        score: attempt.score,
        finishedAt: attempt.finishedAt,
      });
    }
  }

  const sorted = [...best.values()].sort(
    (left, right) =>
      right.score - left.score || left.finishedAt.getTime() - right.finishedAt.getTime(),
  );

  const top = sorted.slice(0, RANKING_SIZE).map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name,
    nickname: row.nickname,
    score: row.score,
  }));
  const mineIndex = sorted.findIndex((row) => row.userId === userId);

  return {
    top,
    mine:
      mineIndex >= 0
        ? {
            rank: mineIndex + 1,
            score: sorted[mineIndex].score,
            inTop: mineIndex < RANKING_SIZE,
          }
        : null,
  };
}
