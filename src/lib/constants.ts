// Paylaşılan etiket ve renk sabitleri
// UI'da Tailwind class, PDF'de hex renk farklı olduğu için
// DIFFICULTY_COLOR_PDF CardPDFDocument içinde yerel kalır.

// Kısa etiket (badge, filtre butonları)
export const WORK_AREA_LABEL: Record<string, string> = {
  speech: "Konuşma",
  language: "Dil",
  hearing: "İşitme",
};

// Müfredat alt-alan etiketleri
export const AREA_LABELS: Record<string, string> = {
  speech: "Akıcılık Bozukluğu",
  language: "Dil",
  acquired_language: "Edinilmiş Dil",
  speech_sound: "Konuşma Sesi",
  motor_speech: "Motor Konuşma",
  resonance: "Rezonans",
  voice: "Ses",
  hearing: "İşitme Eğitimi",
  hearing_language: "Dil Eğitimi (İşitme)",
  hearing_social: "Sosyal İletişim",
  hearing_learning: "Öğrenmeye Destek",
  hearing_literacy: "Okuma ve Yazma",
  hearing_early_math: "Erken Matematik",
  hearing_math: "Matematik",
};

// Çalışma alanından izin verilen müfredat alanlarına mapping
export const WORK_AREA_FILTER: Record<string, string[]> = {
  speech:   ["speech", "speech_sound", "motor_speech", "resonance", "voice"],
  language: ["language", "acquired_language"],
  hearing:  ["hearing", "hearing_language", "hearing_social", "hearing_learning", "hearing_literacy", "hearing_early_math", "hearing_math"],
};

export const WORK_AREA_COLOR: Record<string, string> = {
  speech: "bg-blue-100 text-blue-700",
  language: "bg-purple-100 text-purple-700",
  hearing: "bg-teal-100 text-teal-700",
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

// Tailwind sınıfları — sadece UI bileşenlerinde kullanılır
export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export const AGE_LABEL: Record<string, string> = {
  "3-6": "3–6 yaş",
  "7-12": "7–12 yaş",
  "13-18": "13–18 yaş",
  adult: "Yetişkin",
};

export function calcAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  return months > 0 ? `${years} yaş ${months} ay` : `${years} yaş`;
}
