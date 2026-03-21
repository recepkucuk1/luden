export interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export interface BadgeStats {
  totalStudents: number;
  totalCompletedGoals: number;
  totalCards: number;
  currentStreak: number;
  uniqueStudentsWorked: number;
}

export interface EarnedBadge extends BadgeDef {
  earned: boolean;
}

export const ALL_BADGES: BadgeDef[] = [
  { id: "first_step",         emoji: "🌱", name: "İlk Adım",        description: "İlk öğrenci eklendi" },
  { id: "goal_hunter",        emoji: "🎯", name: "Hedef Avcısı",    description: "Toplam 10 hedef tamamlandı" },
  { id: "card_master",        emoji: "🚀", name: "Kart Ustası",      description: "Toplam 20 kart üretildi" },
  { id: "streak_3",           emoji: "🔥", name: "3 Günlük Seri",   description: "3 gün aralıksız aktif" },
  { id: "streak_7",           emoji: "⚡", name: "7 Günlük Seri",   description: "7 gün aralıksız aktif" },
  { id: "streak_30",          emoji: "🏆", name: "30 Günlük Seri",  description: "30 gün aralıksız aktif" },
  { id: "team_captain",       emoji: "👥", name: "Takım Kaptanı",   description: "5 farklı öğrenciyle çalışıldı" },
  { id: "curriculum_master",  emoji: "📚", name: "Müfredat Ustası", description: "50 hedef tamamlandı" },
  { id: "expert_therapist",   emoji: "💎", name: "Uzman Terapist",  description: "100 hedef tamamlandı" },
];

function isBadgeEarned(id: string, s: BadgeStats): boolean {
  switch (id) {
    case "first_step":        return s.totalStudents >= 1;
    case "goal_hunter":       return s.totalCompletedGoals >= 10;
    case "card_master":       return s.totalCards >= 20;
    case "streak_3":          return s.currentStreak >= 3;
    case "streak_7":          return s.currentStreak >= 7;
    case "streak_30":         return s.currentStreak >= 30;
    case "team_captain":      return s.uniqueStudentsWorked >= 5;
    case "curriculum_master": return s.totalCompletedGoals >= 50;
    case "expert_therapist":  return s.totalCompletedGoals >= 100;
    default:                  return false;
  }
}

export function computeBadges(stats: BadgeStats): EarnedBadge[] {
  return ALL_BADGES.map((badge) => ({ ...badge, earned: isBadgeEarned(badge.id, stats) }));
}

/** UTC gün string'i: "2025-03-21" */
export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Verilen aktif gün kümesinden bugüne (veya dünkü son aktif güne kadar)
 * art arda kaç gün aktif olunduğunu hesaplar.
 */
export function calculateStreak(activeDays: Set<string>): number {
  if (activeDays.size === 0) return 0;

  const now = new Date();
  const todayStr = toDateStr(now);
  const yd = new Date(now);
  yd.setUTCDate(yd.getUTCDate() - 1);
  const yesterdayStr = toDateStr(yd);

  // Başlangıç: bugün aktifse bugün, değilse dün aktifse dünden başla
  let startStr: string;
  if (activeDays.has(todayStr)) {
    startStr = todayStr;
  } else if (activeDays.has(yesterdayStr)) {
    startStr = yesterdayStr;
  } else {
    return 0;
  }

  let streak = 0;
  const d = new Date(startStr + "T00:00:00Z");
  while (activeDays.has(toDateStr(d))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}
