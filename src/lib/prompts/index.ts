export type CardCategory = "speech" | "language" | "hearing";
export type Difficulty = "easy" | "medium" | "hard";
export type AgeGroup = "3-6" | "7-12" | "13-18" | "adult";

export interface CardGenerationParams {
  category: CardCategory;
  difficulty: Difficulty;
  ageGroup: AgeGroup;
  focusArea?: string;
  curriculumGoalText?: string; // "[kod] - [başlık]" formatında, generate route tarafından doldurulur
}

export interface GeneratedCard {
  title: string;
  objective: string;
  duration: string;
  materials: string[];
  instructions: string[];
  exercises: { name: string; description: string; repetitions: string }[];
  therapistNotes: string;
  progressIndicators: string[];
  homeExercise: string;
  category: CardCategory;
  difficulty: Difficulty;
  ageGroup: AgeGroup;
}

const DIFFICULTY_MAP: Record<Difficulty, string> = {
  easy: "kolay (başlangıç seviyesi)",
  medium: "orta (gelişim aşaması)",
  hard: "ileri (pekiştirme aşaması)",
};

const AGE_MAP: Record<AgeGroup, string> = {
  "3-6": "3-6 yaş (okul öncesi)",
  "7-12": "7-12 yaş (ilkokul)",
  "13-18": "13-18 yaş (ortaokul/lise)",
  adult: "yetişkin (18 yaş üzeri)",
};

const CATEGORY_CONTEXT: Record<CardCategory, string> = {
  speech: "Konuşma eğitimi (artikülasyon, ses üretimi, akıcılık bozuklukları, kekemelik)",
  language: "Dil eğitimi (dil anlama ve üretme, kelime hazinesi, dilbilgisi, pragmatik beceriler)",
  hearing: "İşitme eğitimi (işitme kaybı olan bireylerde sözlü iletişim, işitsel hafıza, dudak okuma)",
};

export function buildCardPrompt(params: CardGenerationParams): string {
  const { category, difficulty, ageGroup, focusArea, curriculumGoalText } = params;
  const categoryLabel = category === "speech" ? "konuşma" : category === "language" ? "dil" : "işitme";

  return `Sen deneyimli bir ${categoryLabel} uzmanısın. Uzman için profesyonel bir öğrenme kartı oluştur.

**EĞİTİM ALANI:** ${CATEGORY_CONTEXT[category]}
**ZORLUK SEVİYESİ:** ${DIFFICULTY_MAP[difficulty]}
**YAŞ GRUBU:** ${AGE_MAP[ageGroup]}
${curriculumGoalText ? `**MÜFREDAT HEDEFİ:** ${curriculumGoalText}\nBu kart şu müfredat hedefi için üretiliyor: ${curriculumGoalText}\nKart içeriği bu hedefe doğrudan hizmet etmeli.` : ""}
${focusArea ? `**HEDEF BECERİ / ODAK ALAN:** ${focusArea}` : ""}

**MOTİVASYON YAKLAŞIMI — KESİNLİKLE UYULMASI GEREKEN KURAL:**
Ödül çıkartması, puan tablosu, rozet, ödül sistemi, maddi ödül veya herhangi bir dışsal ödüllendirme mekanizması KULLANMA.
Bunların yerine yalnızca içsel motivasyonu destekleyen yaklaşımlar kullan:
- Sözel övgü ve cesaretlendirme ("Harika denedin!", "Bir öncekinden daha net çıktı!")
- Öğrencinin kendi gelişimini fark etmesini sağlama (önceki ve şimdiki performansı karşılaştırma, "Geçen haftaya göre bak nasıl ilerledi" gibi)
- Oyun temelli katılım (rol yapma, hikâye kurma, keşif oyunları)
- Merak ve keşif odaklı etkinlikler ("Sence neden böyle oluyor?", "Bakalım ne keşfedeceğiz" gibi)

Aşağıdaki JSON formatında bir öğrenme kartı oluştur. Sadece JSON döndür, başka metin ekleme:

{
  "title": "Etkinliğin kısa ve açıklayıcı başlığı",
  "objective": "Bu etkinliğin eğitimsel hedefi (1-2 cümle)",
  "duration": "Önerilen süre (örn: '10-15 dakika')",
  "materials": ["Gerekli materyal 1", "Gerekli materyal 2"],
  "instructions": [
    "Adım 1: ...",
    "Adım 2: ...",
    "Adım 3: ..."
  ],
  "exercises": [
    {
      "name": "Etkinlik adı",
      "description": "Etkinlik açıklaması — içsel motivasyona dayalı, merak/keşif/oyun odaklı",
      "repetitions": "Tekrar sayısı veya süre"
    }
  ],
  "therapistNotes": "Uzmana özel notlar: sözel cesaretlendirme önerileri ve öğrencinin öz-farkındalığını destekleme ipuçları",
  "progressIndicators": ["İlerleme göstergesi 1", "İlerleme göstergesi 2"],
  "homeExercise": "Evde yapılabilecek merak/keşif odaklı etkinlik önerisi"
}`;
}
