import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Veri ────────────────────────────────────────────────────────────────────

const CURRICULA = [
  {
    code: "1.1",
    area: "speech",
    title: "Kekemelik",
    goals: [
      {
        code: "1.0",
        title: "Konuşma sırasında nefes kontrolünü sağlar",
        isMainGoal: true,
        sub: [
          { code: "1.1", title: "Konuşmaya başlamadan önce nefes alır" },
          { code: "1.2", title: "Nefes verirken konuşur" },
        ],
      },
      {
        code: "2.0",
        title: "Konuşma prozodisini ayarlayarak konuşur",
        isMainGoal: true,
        sub: [
          { code: "2.1", title: "Konuşma sırasında uygun yerlerde vurgu yapar" },
          { code: "2.2", title: "Konuşma sırasında ses tonundaki iniş-çıkışları uygun şekilde ayarlar" },
          { code: "2.3", title: "Konuşma sırasında uygun hızla konuşur" },
        ],
      },
      {
        code: "3.0",
        title: "Akıcı konuşur",
        isMainGoal: true,
        sub: [
          { code: "3.1", title: "Heceleri akıcı söyler" },
          { code: "3.2", title: "Giderek artan uzunluktaki sözcükleri akıcı söyler" },
          { code: "3.3", title: "Sözcük gruplarını akıcı söyler" },
          { code: "3.4", title: "Cümle düzeyinde akıcı konuşur" },
        ],
      },
      {
        code: "4.0",
        title: "Akıcı okur",
        isMainGoal: true,
        sub: [
          { code: "4.1", title: "Heceleri akıcı okur" },
          { code: "4.2", title: "Giderek artan uzunluktaki sözcükleri akıcı okur" },
          { code: "4.3", title: "Sözcük gruplarını akıcı okur" },
          { code: "4.4", title: "Cümleleri akıcı okur" },
        ],
      },
      {
        code: "5.0",
        title: "Akıcı konuşmayı farklı kişi, ortam ve durumlara geneller",
        isMainGoal: true,
        sub: [
          { code: "5.1", title: "Farklı kişilerle akıcı konuşur" },
          { code: "5.2", title: "Farklı ortamlarda akıcı konuşur" },
          { code: "5.3", title: "Farklı durumlarda akıcı konuşur" },
        ],
      },
      {
        code: "6.0",
        title: "Kekemeliğine yönelik olumsuz duygusal tepkileriyle başa çıkar",
        isMainGoal: true,
        sub: [
          { code: "6.1", title: "Kekemelik davranışlarını tanımlar" },
          { code: "6.2", title: "Kekemelik davranışlarını taklit eder" },
          { code: "6.3", title: "Terapistle konuşurken kekelediğinde olumsuz duygularına rağmen konuşmasını sürdürür" },
          { code: "6.4", title: "Farklı kişilerle konuşurken kekelediğinde olumsuz duygularına rağmen konuşmasını sürdürür" },
          { code: "6.5", title: "Farklı ortamlarda konuşurken kekelediğinde olumsuz duygularına rağmen konuşmasını sürdürür" },
          { code: "6.6", title: "Farklı durumlarda konuşurken kekelediğinde olumsuz duygularına rağmen konuşmasını sürdürür" },
        ],
      },
    ],
  },
  {
    code: "1.2",
    area: "speech",
    title: "Hızlı Bozuk Konuşma",
    goals: [
      {
        code: "1.0",
        title: "Hızlı-bozuk konuştuğunu belirtir",
        isMainGoal: true,
        sub: [
          { code: "1.1", title: "Konuşma hızındaki değişiklikleri ayırt eder" },
          { code: "1.2", title: "Hızlı-bozuk konuşmayı normal konuşmadan ayırt eder" },
        ],
      },
      {
        code: "2.0",
        title: "Konuşma sırasında doğru nefes kontrolünü sağlar",
        isMainGoal: true,
        sub: [
          { code: "2.1", title: "Konuşmaya başlamadan önce nefes alır" },
          { code: "2.2", title: "Nefes verirken konuşur" },
        ],
      },
      {
        code: "3.0",
        title: "Konuşma prozodisini ayarlayarak konuşur",
        isMainGoal: true,
        sub: [
          { code: "3.1", title: "Konuşma sırasında uygun yerlerde vurgu yapar" },
          { code: "3.2", title: "Konuşma sırasında ses tonundaki iniş-çıkışları uygun şekilde ayarlar" },
          { code: "3.3", title: "Konuşma sırasında uygun hızla konuşur" },
        ],
      },
      {
        code: "4.0",
        title: "Tam ve anlaşılır konuşur",
        isMainGoal: true,
        sub: [
          { code: "4.1", title: "Giderek artan uzunluktaki sözcükleri tam ve anlaşılır söyler" },
          { code: "4.2", title: "Sözcük gruplarını tam ve anlaşılır söyler" },
          { code: "4.3", title: "Cümle düzeyinde tam ve anlaşılır konuşur" },
          { code: "4.4", title: "Anlatı düzeyinde tam ve anlaşılır konuşur" },
          { code: "4.5", title: "Terapistle tam ve anlaşılır konuşarak sohbet eder" },
        ],
      },
      {
        code: "5.0",
        title: "Tam ve anlaşılır konuşmayı farklı kişi, ortam ve durumlara geneller",
        isMainGoal: true,
        sub: [
          { code: "5.1", title: "Farklı kişilerle tam ve anlaşılır konuşur" },
          { code: "5.2", title: "Farklı ortamlarda tam ve anlaşılır konuşur" },
          { code: "5.3", title: "Farklı durumlarda tam ve anlaşılır konuşur" },
        ],
      },
    ],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  let curriculumCount = 0;
  let goalCount = 0;

  for (const c of CURRICULA) {
    // Aynı code varsa atla (idempotent)
    const existing = await prisma.curriculum.findFirst({ where: { code: c.code } });
    if (existing) {
      console.log(`  ⏭  Curriculum ${c.code} zaten mevcut, atlandı.`);
      continue;
    }

    const allGoals: { code: string; title: string; isMainGoal: boolean }[] = [];
    for (const g of c.goals) {
      allGoals.push({ code: g.code, title: g.title, isMainGoal: true });
      for (const s of g.sub) {
        allGoals.push({ code: s.code, title: s.title, isMainGoal: false });
      }
    }

    await prisma.curriculum.create({
      data: {
        code: c.code,
        area: c.area,
        title: c.title,
        goals: { create: allGoals },
      },
    });

    curriculumCount++;
    goalCount += allGoals.length;
    console.log(`  ✓  Curriculum ${c.code} "${c.title}" — ${allGoals.length} hedef`);
  }

  console.log("\n─────────────────────────────────");
  console.log(`  Curriculum   : ${curriculumCount}`);
  console.log(`  Hedef (Goal) : ${goalCount}`);
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
