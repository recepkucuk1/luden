import { prisma } from "@/lib/db";
import { CREDIT_COSTS } from "@/lib/plans";

/**
 * Non-atomic credit check (no deduction). Use as a fast pre-flight before expensive operations.
 * Always follow up with deductCredits() in the same request to atomically deduct.
 */
export async function checkCredits(
  therapistId: string,
  type: keyof typeof CREDIT_COSTS
): Promise<{ ok: boolean; credits: number }> {
  const cost = CREDIT_COSTS[type];
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
    select: { credits: true },
  });
  const credits = therapist?.credits ?? 0;
  return { ok: credits >= cost, credits };
}

type CreditCostKey = keyof typeof CREDIT_COSTS;

const DESCRIPTIONS: Record<CreditCostKey, string> = {
  card_generate: "Öğrenme kartı üretimi",
  ai_profile:    "AI profil oluşturma",
};

/**
 * Atomically deducts credits from a therapist account.
 * Returns { ok: true } on success, { ok: false, credits: number } if insufficient.
 */
export async function deductCredits(
  therapistId: string,
  type: CreditCostKey
): Promise<{ ok: true } | { ok: false; credits: number }> {
  const cost = CREDIT_COSTS[type];

  return prisma.$transaction(async (tx) => {
    const therapist = await tx.therapist.findUnique({
      where: { id: therapistId },
      select: { credits: true },
    });

    if (!therapist || therapist.credits < cost) {
      return { ok: false as const, credits: therapist?.credits ?? 0 };
    }

    await tx.therapist.update({
      where: { id: therapistId },
      data: { credits: { decrement: cost } },
    });

    await tx.creditTransaction.create({
      data: {
        therapistId,
        amount: cost,
        type: "SPEND",
        description: DESCRIPTIONS[type],
      },
    });

    return { ok: true as const };
  });
}
