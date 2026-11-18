"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export type ChoiceInput = { text: string; isCorrect: boolean };

export async function saveQuestion(input: {
  id?: string;
  prompt: string;
  choices: ChoiceInput[];
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "관리자만 문제를 등록할 수 있습니다." };

  const prompt = input.prompt.trim();
  if (prompt.length < 1 || prompt.length > 2000) {
    return { error: "문제 내용은 1~2000자로 입력해 주세요." };
  }

  const choices = input.choices.map((choice) => ({
    text: choice.text.trim(),
    isCorrect: choice.isCorrect,
  }));
  if (choices.length < 2 || choices.length > 8) {
    return { error: "선지는 2개에서 8개까지 넣을 수 있습니다." };
  }
  if (choices.some((choice) => choice.text.length < 1 || choice.text.length > 300)) {
    return { error: "각 선지는 1~300자로 입력해 주세요." };
  }
  if (choices.filter((choice) => choice.isCorrect).length !== 1) {
    return { error: "정답은 하나만 선택해 주세요. 나머지는 오답입니다." };
  }

  const choiceData = choices.map((choice, index) => ({
    text: choice.text,
    isCorrect: choice.isCorrect,
    order: index,
  }));

  if (!input.id) {
    const created = await db().question.create({
      data: { prompt, choices: { create: choiceData } },
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { error: "", id: created.id };
  }

  const existing = await db().question.findUnique({ where: { id: input.id } });
  if (!existing) return { error: "문제를 찾을 수 없습니다." };

  await db().$transaction([
    db().choice.deleteMany({ where: { questionId: input.id } }),
    db().question.update({
      where: { id: input.id },
      data: { prompt, choices: { create: choiceData } },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { error: "", id: input.id };
}

export async function deleteQuestion(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "관리자만 문제를 삭제할 수 있습니다." };

  await db().question.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { error: "" };
}
