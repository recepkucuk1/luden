// Paylaşılan etiket ve renk sabitleri
// UI'da Tailwind class, PDF'de hex renk farklı olduğu için
// DIFFICULTY_COLOR_PDF CardPDFDocument içinde yerel kalır.

export const CATEGORY_LABEL: Record<string, string> = {
  speech: "Konuşma Eğitimi",
  language: "Dil Eğitimi",
  hearing: "İşitme Eğitimi",
};

// Kısa etiket (badge, filtre butonları)
export const WORK_AREA_LABEL: Record<string, string> = {
  speech: "Konuşma",
  language: "Dil",
  hearing: "İşitme",
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
  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  return `${age} yaş`;
}
