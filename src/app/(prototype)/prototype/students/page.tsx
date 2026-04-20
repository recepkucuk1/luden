"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ForceLightTheme } from "@/components/ForceLightTheme";

type WorkArea = "speech" | "language" | "hearing";
type FilterArea = "all" | WorkArea;
type SortBy = "name" | "birthDate-asc" | "birthDate-desc" | "lastCard" | "mostCards";
type DesignMode = "original" | "poster" | "poster-list" | "poster-dark" | "clinical" | "playful" | "editorial";

interface MockStudent {
  id: string;
  name: string;
  birthDate: string;
  workArea: WorkArea;
  diagnosis: string | null;
  latestCardAt: string | null;
  cards: number;
  completed: number;
  total: number;
}

// 20 mock öğrenci — gerçekçi TR isimler, dağılmış veri
const MOCK_STUDENTS: MockStudent[] = [
  { id: "1", name: "Ayşe Yılmaz", birthDate: "2018-03-14", workArea: "speech", diagnosis: "Artikülasyon", latestCardAt: "2026-04-15", cards: 42, completed: 18, total: 24 },
  { id: "2", name: "Mehmet Demir", birthDate: "2016-07-21", workArea: "language", diagnosis: "Geç Konuşma", latestCardAt: "2026-04-12", cards: 27, completed: 9, total: 20 },
  { id: "3", name: "Zeynep Kaya", birthDate: "2019-11-02", workArea: "hearing", diagnosis: "Koklear İmplant", latestCardAt: "2026-04-18", cards: 58, completed: 32, total: 40 },
  { id: "4", name: "Emir Arslan", birthDate: "2017-05-30", workArea: "speech", diagnosis: null, latestCardAt: "2026-04-10", cards: 15, completed: 5, total: 18 },
  { id: "5", name: "Elif Şahin", birthDate: "2015-09-12", workArea: "language", diagnosis: "Disleksi", latestCardAt: "2026-04-17", cards: 61, completed: 28, total: 32 },
  { id: "6", name: "Kerem Öztürk", birthDate: "2020-01-25", workArea: "speech", diagnosis: "Kekemelik", latestCardAt: "2026-04-08", cards: 12, completed: 3, total: 15 },
  { id: "7", name: "Defne Aydın", birthDate: "2018-06-18", workArea: "hearing", diagnosis: "İşitme Kaybı", latestCardAt: "2026-04-19", cards: 73, completed: 45, total: 50 },
  { id: "8", name: "Ömer Çelik", birthDate: "2014-12-03", workArea: "language", diagnosis: "Özgül Dil Bzk.", latestCardAt: "2026-04-14", cards: 34, completed: 14, total: 22 },
  { id: "9", name: "Ela Polat", birthDate: "2019-08-09", workArea: "speech", diagnosis: "Fonolojik", latestCardAt: "2026-04-16", cards: 29, completed: 12, total: 20 },
  { id: "10", name: "Yusuf Kılıç", birthDate: "2016-02-14", workArea: "language", diagnosis: null, latestCardAt: "2026-04-11", cards: 18, completed: 6, total: 14 },
  { id: "11", name: "Miray Tunç", birthDate: "2020-10-07", workArea: "hearing", diagnosis: "Resonans", latestCardAt: "2026-04-13", cards: 24, completed: 10, total: 18 },
  { id: "12", name: "Berk Aksoy", birthDate: "2013-04-22", workArea: "speech", diagnosis: "Motor Konuşma", latestCardAt: "2026-04-09", cards: 47, completed: 22, total: 28 },
  { id: "13", name: "Aylin Doğan", birthDate: "2017-11-30", workArea: "language", diagnosis: "Edinilmiş Dil", latestCardAt: "2026-04-18", cards: 38, completed: 16, total: 25 },
  { id: "14", name: "Çınar Yıldız", birthDate: "2019-03-05", workArea: "hearing", diagnosis: null, latestCardAt: "2026-04-07", cards: 11, completed: 4, total: 16 },
  { id: "15", name: "Nil Keskin", birthDate: "2018-09-17", workArea: "speech", diagnosis: "Artikülasyon", latestCardAt: "2026-04-15", cards: 33, completed: 15, total: 22 },
  { id: "16", name: "Eymen Aktaş", birthDate: "2015-06-11", workArea: "language", diagnosis: "Disleksi", latestCardAt: "2026-04-12", cards: 52, completed: 25, total: 30 },
  { id: "17", name: "Lina Bulut", birthDate: "2021-02-28", workArea: "hearing", diagnosis: "Koklear İmplant", latestCardAt: "2026-04-17", cards: 19, completed: 7, total: 14 },
  { id: "18", name: "Kaan Erdem", birthDate: "2014-08-19", workArea: "speech", diagnosis: "Ses", latestCardAt: "2026-04-10", cards: 25, completed: 11, total: 20 },
  { id: "19", name: "Su Özdemir", birthDate: "2017-01-08", workArea: "language", diagnosis: null, latestCardAt: "2026-04-16", cards: 41, completed: 19, total: 26 },
  { id: "20", name: "Toprak Güneş", birthDate: "2018-12-24", workArea: "hearing", diagnosis: "İşitme Eğitimi", latestCardAt: "2026-04-14", cards: 36, completed: 14, total: 24 },
];

const WORK_AREA_LABEL: Record<WorkArea, string> = {
  speech: "Konuşma",
  language: "Dil",
  hearing: "İşitme",
};

const FILTER_OPTIONS: { value: FilterArea; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "speech", label: "Konuşma" },
  { value: "language", label: "Dil" },
  { value: "hearing", label: "İşitme" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Ada göre (A–Z)" },
  { value: "birthDate-asc", label: "Yaşa göre (küçükten büyüğe)" },
  { value: "birthDate-desc", label: "Yaşa göre (büyükten küçüğe)" },
  { value: "lastCard", label: "En son kart üretilene göre" },
  { value: "mostCards", label: "En çok kart üretilene göre" },
];

function calcAge(birthDate: string): string {
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${years} yaş`;
}

function formatShort(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function PrototypeStudentsPage() {
  const [mode, setMode] = useState<DesignMode>("poster");
  const [filterArea, setFilterArea] = useState<FilterArea>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");

  const filtered = useMemo(() => {
    let list: MockStudent[] = filterArea === "all"
      ? MOCK_STUDENTS
      : MOCK_STUDENTS.filter((s) => s.workArea === filterArea);

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name, "tr");
        case "birthDate-asc": return a.birthDate.localeCompare(b.birthDate);
        case "birthDate-desc": return b.birthDate.localeCompare(a.birthDate);
        case "lastCard": return (b.latestCardAt ?? "").localeCompare(a.latestCardAt ?? "");
        case "mostCards": return b.cards - a.cards;
        default: return 0;
      }
    });
    return list;
  }, [filterArea, sortBy]);

  return (
    <>
      <ForceLightTheme />

      {/* Mode switcher — fixed top center */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "inline-flex",
          padding: 4,
          background: "#fff",
          border: "2px solid #0E1E26",
          borderRadius: 999,
          boxShadow: "0 4px 0 #0E1E26",
          fontFamily: "var(--font-display), system-ui, sans-serif",
          maxWidth: "calc(100vw - 32px)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {([
          { key: "original", label: "Orijinal" },
          { key: "poster", label: "Poster (grid)" },
          { key: "poster-list", label: "Poster (list)" },
          { key: "poster-dark", label: "Poster (dark)" },
          { key: "clinical", label: "Clinical" },
          { key: "playful", label: "Playful" },
          { key: "editorial", label: "Editorial" },
        ] as { key: DesignMode; label: string }[]).map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: mode === m.key ? "#0E1E26" : "transparent",
              color: mode === m.key ? "#fff" : "#0E1E26",
              transition: "background .15s, color .15s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "original" && <OriginalView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
      {mode === "poster" && <PosterView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
      {mode === "poster-list" && <PosterListView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
      {mode === "poster-dark" && <PosterDarkView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
      {mode === "clinical" && <ClinicalView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
      {mode === "playful" && <PlayfulView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
      {mode === "editorial" && <EditorialView filtered={filtered} students={MOCK_STUDENTS} filterArea={filterArea} setFilterArea={setFilterArea} sortBy={sortBy} setSortBy={setSortBy} />}
    </>
  );
}

/* ===================== ORIJINAL (mevcut shadcn-ish) ===================== */

function OriginalView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)",
        paddingTop: 72,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(255,255,255,0.7)",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 24px rgba(2,52,53,0.03)",
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#023435", letterSpacing: "-.02em", margin: 0 }}>Öğrenciler</h1>
            <p style={{ marginTop: 2, fontSize: 12, color: "rgba(2,52,53,.6)", fontWeight: 500 }}>{students.length} öğrenci</p>
          </div>
          <button
            style={{
              background: "#FE703A",
              color: "#fff",
              padding: "0 20px",
              height: 40,
              borderRadius: 12,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(254,112,58,.2)",
            }}
          >
            ✨ Yeni Öğrenci
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 24px" }}>
        {/* Filters */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, padding: 4, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 999, backdropFilter: "blur(12px)" }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterArea(opt.value)}
                style={{
                  borderRadius: 999,
                  padding: "8px 20px",
                  fontSize: 12,
                  fontWeight: 700,
                  background: filterArea === opt.value ? "#023435" : "transparent",
                  color: filterArea === opt.value ? "#fff" : "rgba(2,52,53,.6)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: filterArea === opt.value ? "0 4px 8px rgba(2,52,53,.2)" : "none",
                }}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span style={{ marginLeft: 6, padding: "2px 6px", borderRadius: 999, fontSize: 10, background: filterArea === opt.value ? "rgba(255,255,255,.2)" : "rgba(2,52,53,.1)", color: filterArea === opt.value ? "#fff" : "rgba(2,52,53,.6)" }}>
                    {students.filter((s) => s.workArea === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(2,52,53,.6)" }}>Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.8)",
                background: "rgba(255,255,255,.5)",
                backdropFilter: "blur(12px)",
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 700,
                color: "#023435",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {filtered.map((s) => (
            <Link
              key={s.id}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                textDecoration: "none",
                background: "rgba(255,255,255,.6)",
                border: "1px solid rgba(255,255,255,.8)",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 4px 24px rgba(2,52,53,.03)",
                display: "block",
                position: "relative",
                transition: "transform .2s, box-shadow .2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 48px rgba(2,52,53,.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(2,52,53,.03)"; }}
            >
              <div style={{ height: 48, width: 48, borderRadius: 16, background: "linear-gradient(135deg, rgba(2,52,53,.1), rgba(16,121,150,.1))", display: "flex", alignItems: "center", justifyContent: "center", color: "#023435", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
                {s.name.charAt(0)}
              </div>
              <h3 style={{ fontWeight: 800, color: "#023435", fontSize: 16, marginBottom: 8 }}>{s.name}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10, marginBottom: 16 }}>
                <span style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(16,121,150,.2)", background: "rgba(16,121,150,.05)", color: "#107996", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>{WORK_AREA_LABEL[s.workArea]}</span>
                <span style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(228,228,231,.6)", background: "#fff", color: "rgba(2,52,53,.6)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>{calcAge(s.birthDate)}</span>
                {s.diagnosis && <span style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(16,121,150,.2)", background: "rgba(16,121,150,.05)", color: "#107996", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>{s.diagnosis}</span>}
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid rgba(2,52,53,.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(2,52,53,.5)", textTransform: "uppercase", letterSpacing: ".1em" }}>{s.cards} Materyal</span>
                    {s.latestCardAt && <span style={{ fontSize: 9, opacity: .7 }}>Son: {formatShort(s.latestCardAt)}</span>}
                  </div>
                  <span style={{ fontSize: 12, color: "#FE703A", fontWeight: 700 }}>Detay →</span>
                </div>
                <div style={{ background: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.6)", padding: 10, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(2,52,53,.4)", textTransform: "uppercase", letterSpacing: ".08em" }}>{s.completed}/{s.total} Hedef</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#107996" }}>{Math.round((s.completed / s.total) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", borderRadius: 999, background: "rgba(2,52,53,.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, #107996, #023435)", width: `${(s.completed / s.total) * 100}%`, borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ===================== POSTER ===================== */

const AREA_CARD_COLOR: Record<WorkArea, string> = {
  speech: "#FFCE52",
  language: "#FF6B9D",
  hearing: "#4A90E2",
};

function PosterView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  return (
    <div
      className="poster-scope"
      style={{
        minHeight: "100vh",
        background: "#FFF8EC",
        paddingTop: 72,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 72,
          zIndex: 20,
          background: "#FFF8EC",
          borderBottom: "2px solid #0E1E26",
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "#0E1E26", letterSpacing: "-.02em", margin: 0 }}>Öğrenciler</h1>
            <p style={{ marginTop: 2, fontSize: 12, color: "rgba(14,30,38,.7)", fontWeight: 500, fontFamily: "var(--font-display)" }}>{students.length} öğrenci</p>
          </div>
          <button
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              background: "#FE703A",
              color: "#fff",
              padding: "0 20px",
              height: 44,
              borderRadius: 12,
              border: "2px solid #0E1E26",
              boxShadow: "0 4px 0 #0E1E26",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✨ Yeni Öğrenci
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 24px" }}>
        {/* Filters */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, padding: 4, background: "#fff", border: "2px solid #0E1E26", borderRadius: 999, boxShadow: "0 4px 0 #0E1E26" }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterArea(opt.value)}
                style={{
                  fontFamily: "var(--font-display)",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: filterArea === opt.value ? "#0E1E26" : "transparent",
                  color: filterArea === opt.value ? "#fff" : "rgba(14,30,38,.7)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: "1px 6px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 800,
                      background: filterArea === opt.value ? "#FE703A" : "rgba(14,30,38,.08)",
                      color: filterArea === opt.value ? "#fff" : "#0E1E26",
                    }}
                  >
                    {students.filter((s) => s.workArea === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "rgba(14,30,38,.7)" }}>Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                fontFamily: "var(--font-display)",
                borderRadius: 12,
                border: "2px solid #0E1E26",
                boxShadow: "0 3px 0 #0E1E26",
                background: "#fff",
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 700,
                color: "#0E1E26",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {filtered.map((s) => {
            const tint = AREA_CARD_COLOR[s.workArea];
            return (
              <Link
                key={s.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  textDecoration: "none",
                  background: "#fff",
                  border: "2px solid #0E1E26",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 6px 0 #0E1E26",
                  display: "block",
                  position: "relative",
                  color: "#0E1E26",
                  fontFamily: "var(--font-display)",
                  transition: "transform .08s, box-shadow .08s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 0 #0E1E26"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 0 #0E1E26"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      height: 48,
                      width: 48,
                      borderRadius: 14,
                      background: tint,
                      border: "2px solid #0E1E26",
                      boxShadow: "0 3px 0 #0E1E26",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 18,
                      color: "#0E1E26",
                      flexShrink: 0,
                    }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</h3>
                    <div style={{ fontSize: 11, color: "rgba(14,30,38,.6)", marginTop: 2 }}>{calcAge(s.birthDate)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                  <span style={{ padding: "3px 8px", borderRadius: 999, background: tint, color: "#0E1E26", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", border: "1.5px solid #0E1E26" }}>
                    {WORK_AREA_LABEL[s.workArea]}
                  </span>
                  {s.diagnosis && (
                    <span style={{ padding: "3px 8px", borderRadius: 999, background: "rgba(14,30,38,.08)", color: "#0E1E26", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
                      {s.diagnosis}
                    </span>
                  )}
                </div>

                <div style={{ paddingTop: 14, borderTop: "2px dashed rgba(14,30,38,.12)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" }}>{s.cards}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(14,30,38,.55)", textTransform: "uppercase", letterSpacing: ".1em" }}>Materyal</span>
                    </div>
                    {s.latestCardAt && (
                      <span style={{ fontSize: 10, color: "rgba(14,30,38,.55)", fontWeight: 600 }}>Son · {formatShort(s.latestCardAt)}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(14,30,38,.6)", textTransform: "uppercase", letterSpacing: ".08em" }}>{s.completed}/{s.total} Hedef</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#FE703A" }}>{Math.round((s.completed / s.total) * 100)}%</span>
                    </div>
                    <div style={{ height: 8, width: "100%", borderRadius: 999, background: "rgba(14,30,38,.08)", overflow: "hidden", border: "1.5px solid #0E1E26" }}>
                      <div style={{ height: "100%", background: "#FE703A", width: `${(s.completed / s.total) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Hover actions */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "flex",
                    gap: 6,
                    opacity: 0,
                    transition: "opacity .15s",
                  }}
                  className="poster-card-actions"
                >
                  <button
                    onClick={(e) => { e.preventDefault(); }}
                    style={{ height: 28, width: 28, borderRadius: 8, background: "#fff", border: "2px solid #0E1E26", boxShadow: "0 2px 0 #0E1E26", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0E1E26" }}
                    aria-label="Düzenle"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); }}
                    style={{ height: 28, width: 28, borderRadius: 8, background: "#fff", border: "2px solid #0E1E26", boxShadow: "0 2px 0 #0E1E26", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#c53030" }}
                    aria-label="Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <style jsx>{`
                  a:hover :global(.poster-card-actions) {
                    opacity: 1;
                  }
                `}</style>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ===================== CLINICAL (Linear + Doximity) ===================== */

const CLINICAL_AREA_COLOR: Record<WorkArea, string> = {
  speech: "#2563eb",
  language: "#7c3aed",
  hearing: "#0891b2",
};

function ClinicalView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        paddingTop: 72,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#0a0a0a",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "20px 32px",
        }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0a0a0a", letterSpacing: "-.015em", margin: 0 }}>Öğrenciler</h1>
            <p style={{ marginTop: 2, fontSize: 13, color: "#71717a", fontWeight: 400 }}>{students.length} öğrenci kaydı</p>
          </div>
          <button
            style={{
              background: "#0a0a0a",
              color: "#fff",
              padding: "0 14px",
              height: 34,
              borderRadius: 6,
              border: "none",
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Yeni Öğrenci
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "24px 32px" }}>
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "#f4f4f5", padding: 3, borderRadius: 8 }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterArea(opt.value)}
                style={{
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  background: filterArea === opt.value ? "#fff" : "transparent",
                  color: filterArea === opt.value ? "#0a0a0a" : "#71717a",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: filterArea === opt.value ? "0 1px 2px rgba(0,0,0,.05)" : "none",
                }}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span style={{ marginLeft: 6, color: "#a1a1aa", fontWeight: 400 }}>
                    {students.filter((s) => s.workArea === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={{
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: "7px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "#0a0a0a",
              cursor: "pointer",
            }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Dense list-style — single column, monochrome */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          {filtered.map((s, idx) => {
            const accent = CLINICAL_AREA_COLOR[s.workArea];
            return (
              <Link
                key={s.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 120px 140px 100px 24px",
                  gap: 20,
                  alignItems: "center",
                  padding: "14px 20px",
                  borderTop: idx === 0 ? "none" : "1px solid #f4f4f5",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fafafa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
              >
                <div style={{ height: 32, width: 32, borderRadius: 999, background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, color: "#52525b" }}>
                  {s.name.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "#0a0a0a", marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#71717a", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ height: 6, width: 6, borderRadius: 999, background: accent }} />
                      {WORK_AREA_LABEL[s.workArea]}
                    </span>
                    <span style={{ color: "#d4d4d8" }}>·</span>
                    <span>{calcAge(s.birthDate)}</span>
                    {s.diagnosis && (<>
                      <span style={{ color: "#d4d4d8" }}>·</span>
                      <span>{s.diagnosis}</span>
                    </>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0a0a0a" }}>{s.cards} materyal</div>
                  <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 1 }}>Son: {s.latestCardAt && formatShort(s.latestCardAt)}</div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#71717a", marginBottom: 4 }}>
                    <span>{s.completed}/{s.total}</span>
                    <span style={{ fontWeight: 500, color: "#0a0a0a" }}>{Math.round((s.completed / s.total) * 100)}%</span>
                  </div>
                  <div style={{ height: 3, width: "100%", borderRadius: 999, background: "#f4f4f5", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: accent, width: `${(s.completed / s.total) * 100}%` }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#71717a" }}>Detay</div>
                <div style={{ color: "#d4d4d8", fontSize: 18 }}>›</div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ===================== PLAYFUL (Duolingo) ===================== */

const PLAYFUL_AREA: Record<WorkArea, { bg: string; emoji: string; accent: string }> = {
  speech:   { bg: "#FFF3C4", emoji: "🗣️", accent: "#F59E0B" },
  language: { bg: "#FFE4E6", emoji: "💬", accent: "#EC4899" },
  hearing:  { bg: "#DBEAFE", emoji: "👂", accent: "#3B82F6" },
};

function PlayfulView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ffffff 0%, #F0FDF4 100%)",
        paddingTop: 72,
        fontFamily: "'Nunito', 'Space Grotesk', system-ui, sans-serif",
        color: "#1f2937",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderBottom: "3px solid #e5e7eb", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1f2937", letterSpacing: "-.02em", margin: 0 }}>
              Öğrencilerim <span style={{ fontSize: 22 }}>🌟</span>
            </h1>
            <p style={{ marginTop: 4, fontSize: 14, color: "#6b7280", fontWeight: 600 }}>{students.length} harika öğrenci</p>
          </div>
          <button
            style={{
              background: "#58CC02",
              color: "#fff",
              padding: "0 20px",
              height: 46,
              borderRadius: 16,
              border: "none",
              borderBottom: "4px solid #58A700",
              fontWeight: 800,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: ".05em",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Yeni Öğrenci
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {FILTER_OPTIONS.map((opt) => {
              const active = filterArea === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterArea(opt.value)}
                  style={{
                    borderRadius: 12,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 800,
                    background: active ? "#fff" : "#F3F4F6",
                    color: active ? "#1CB0F6" : "#6b7280",
                    border: active ? "2px solid #1CB0F6" : "2px solid #E5E7EB",
                    borderBottom: active ? "4px solid #1CB0F6" : "4px solid #D1D5DB",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={{
              borderRadius: 12,
              border: "2px solid #E5E7EB",
              borderBottom: "4px solid #D1D5DB",
              background: "#fff",
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#1f2937",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {filtered.map((s) => {
            const cfg = PLAYFUL_AREA[s.workArea];
            const pct = Math.round((s.completed / s.total) * 100);
            return (
              <Link
                key={s.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  background: "#fff",
                  border: "2px solid #E5E7EB",
                  borderBottom: "5px solid #D1D5DB",
                  borderRadius: 20,
                  padding: 18,
                  display: "block",
                  transition: "transform .12s, border-color .12s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cfg.accent;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.transform = "";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 18,
                      background: cfg.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                    }}
                  >
                    {cfg.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</h3>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, fontWeight: 600 }}>
                      {calcAge(s.birthDate)} · {WORK_AREA_LABEL[s.workArea]}
                    </div>
                  </div>
                </div>

                {s.diagnosis && (
                  <div style={{ padding: "4px 10px", borderRadius: 999, background: cfg.bg, color: cfg.accent, fontSize: 11, fontWeight: 800, display: "inline-block", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
                    {s.diagnosis}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: cfg.accent }}>{s.cards}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>materyal</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FEF3C7", padding: "3px 8px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#92400E" }}>
                    🔥 {pct}%
                  </div>
                </div>

                <div style={{ height: 10, borderRadius: 999, background: "#F3F4F6", overflow: "hidden", border: "1px solid #E5E7EB" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}dd)`, width: `${pct}%`, borderRadius: 999, transition: "width .3s" }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "#9ca3af", fontWeight: 600, textAlign: "right" }}>
                  {s.completed}/{s.total} hedef
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ===================== EDITORIAL (Stripe docs, serif-driven) ===================== */

const EDITORIAL_AREA_COLOR: Record<WorkArea, string> = {
  speech: "#A21C30",
  language: "#1E40AF",
  hearing: "#065F46",
};

function EditorialView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F4",
        paddingTop: 72,
        color: "#1a1a1a",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(250,248,244,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #E5E1D7",
          padding: "24px 32px",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "#A21C30", marginBottom: 4 }}>
              Kayıtlar
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Instrument Serif', Georgia, serif",
                fontSize: 40,
                fontWeight: 400,
                color: "#1a1a1a",
                letterSpacing: "-.02em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Öğrenciler
            </h1>
            <p style={{ marginTop: 8, fontSize: 14, color: "#6b6b6b", fontWeight: 400, maxWidth: 480, lineHeight: 1.55 }}>
              {students.length} aktif kayıt · son güncelleme bugün
            </p>
          </div>
          <button
            style={{
              background: "transparent",
              color: "#1a1a1a",
              padding: "0 18px",
              height: 40,
              borderRadius: 0,
              border: "1px solid #1a1a1a",
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: ".02em",
            }}
          >
            Yeni öğrenci ekle →
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 32px" }}>
        {/* Filter row — understated */}
        <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid #E5E1D7", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 24 }}>
            {FILTER_OPTIONS.map((opt) => {
              const active = filterArea === opt.value;
              const count = opt.value === "all" ? students.length : students.filter((s) => s.workArea === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterArea(opt.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "4px 0",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#1a1a1a" : "#8a8a8a",
                    borderBottom: active ? "2px solid #A21C30" : "2px solid transparent",
                  }}
                >
                  {opt.label}
                  <span style={{ marginLeft: 6, fontSize: 11, color: "#a0a0a0", fontWeight: 400 }}>{count}</span>
                </button>
              );
            })}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={{
              border: "none",
              borderBottom: "1px solid #1a1a1a",
              background: "transparent",
              padding: "4px 24px 4px 0",
              fontSize: 13,
              fontWeight: 500,
              color: "#1a1a1a",
              cursor: "pointer",
              fontFamily: "inherit",
              appearance: "none",
            }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* List style — editorial, lots of whitespace */}
        <div>
          {filtered.map((s, idx) => {
            const accent = EDITORIAL_AREA_COLOR[s.workArea];
            const pct = Math.round((s.completed / s.total) * 100);
            return (
              <Link
                key={s.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "grid",
                  gridTemplateColumns: "56px 1fr 160px 200px",
                  gap: 24,
                  alignItems: "center",
                  padding: "24px 0",
                  borderTop: idx === 0 ? "none" : "1px solid #E5E1D7",
                }}
              >
                <div style={{ fontFamily: "var(--font-serif), 'Instrument Serif', Georgia, serif", fontSize: 28, fontWeight: 400, color: accent, fontStyle: "italic" }}>
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "#1a1a1a", letterSpacing: "-.01em", marginBottom: 4 }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b6b6b", fontWeight: 400 }}>
                    <span style={{ color: accent, fontWeight: 600, fontFamily: "var(--font-serif), Georgia, serif", fontStyle: "italic" }}>{WORK_AREA_LABEL[s.workArea]}</span>
                    {s.diagnosis && ` — ${s.diagnosis}`}
                    <span style={{ color: "#c0c0c0", margin: "0 8px" }}>·</span>
                    {calcAge(s.birthDate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 28, fontWeight: 400, color: "#1a1a1a", lineHeight: 1 }}>
                    {s.cards}
                  </div>
                  <div style={{ fontSize: 11, color: "#8a8a8a", marginTop: 4, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase" }}>
                    materyal · son {s.latestCardAt && formatShort(s.latestCardAt)}
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#6b6b6b", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 500 }}>
                      {s.completed}/{s.total} hedef
                    </span>
                    <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 18, color: accent, fontStyle: "italic" }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 1, width: "100%", background: "#E5E1D7" }}>
                    <div style={{ height: "100%", background: accent, width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ===================== POSTER — LIST LAYOUT ===================== */

function PosterListView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  return (
    <div
      className="poster-scope"
      style={{
        minHeight: "100vh",
        background: "#FFF8EC",
        paddingTop: 72,
        fontFamily: "var(--font-display), system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 72,
          zIndex: 20,
          background: "#FFF8EC",
          borderBottom: "2px solid #0E1E26",
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0E1E26", letterSpacing: "-.02em", margin: 0 }}>Öğrenciler</h1>
            <p style={{ marginTop: 2, fontSize: 12, color: "rgba(14,30,38,.7)", fontWeight: 500 }}>{students.length} öğrenci</p>
          </div>
          <button
            style={{
              fontFamily: "inherit",
              fontWeight: 700,
              background: "#FE703A",
              color: "#fff",
              padding: "0 20px",
              height: 44,
              borderRadius: 12,
              border: "2px solid #0E1E26",
              boxShadow: "0 4px 0 #0E1E26",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✨ Yeni Öğrenci
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 24px" }}>
        {/* Filters */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, padding: 4, background: "#fff", border: "2px solid #0E1E26", borderRadius: 999, boxShadow: "0 4px 0 #0E1E26" }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterArea(opt.value)}
                style={{
                  fontFamily: "inherit",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: filterArea === opt.value ? "#0E1E26" : "transparent",
                  color: filterArea === opt.value ? "#fff" : "rgba(14,30,38,.7)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: "1px 6px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 800,
                      background: filterArea === opt.value ? "#FE703A" : "rgba(14,30,38,.08)",
                      color: filterArea === opt.value ? "#fff" : "#0E1E26",
                    }}
                  >
                    {students.filter((s) => s.workArea === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(14,30,38,.7)" }}>Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                fontFamily: "inherit",
                borderRadius: 12,
                border: "2px solid #0E1E26",
                boxShadow: "0 3px 0 #0E1E26",
                background: "#fff",
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 700,
                color: "#0E1E26",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Column header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "52px 1fr 180px 200px 40px",
            gap: 20,
            alignItems: "center",
            padding: "10px 16px",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".1em",
            color: "rgba(14,30,38,.55)",
          }}
        >
          <div></div>
          <div>Öğrenci</div>
          <div>Üretim</div>
          <div>Hedef İlerleme</div>
          <div></div>
        </div>

        {/* Chunky outer container */}
        <div
          style={{
            background: "#fff",
            border: "2px solid #0E1E26",
            borderRadius: 18,
            boxShadow: "0 6px 0 #0E1E26",
            overflow: "hidden",
          }}
        >
          {filtered.map((s, idx) => {
            const tint = AREA_CARD_COLOR[s.workArea];
            const pct = Math.round((s.completed / s.total) * 100);
            return (
              <Link
                key={s.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "grid",
                  gridTemplateColumns: "52px 1fr 180px 200px 40px",
                  gap: 20,
                  alignItems: "center",
                  padding: "14px 16px",
                  borderTop: idx === 0 ? "none" : "2px dashed rgba(14,30,38,.15)",
                  transition: "background .1s",
                  position: "relative",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FDE8C7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
              >
                {/* Avatar */}
                <div
                  style={{
                    height: 44,
                    width: 44,
                    borderRadius: 12,
                    background: tint,
                    border: "2px solid #0E1E26",
                    boxShadow: "0 2px 0 #0E1E26",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 17,
                    color: "#0E1E26",
                    flexShrink: 0,
                  }}
                >
                  {s.name.charAt(0)}
                </div>

                {/* Name + meta chips */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.01em", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: tint,
                        color: "#0E1E26",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        border: "1.5px solid #0E1E26",
                      }}
                    >
                      {WORK_AREA_LABEL[s.workArea]}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(14,30,38,.6)", fontWeight: 600 }}>
                      {calcAge(s.birthDate)}
                    </span>
                    {s.diagnosis && (
                      <>
                        <span style={{ color: "rgba(14,30,38,.3)", fontWeight: 700 }}>·</span>
                        <span style={{ fontSize: 11, color: "rgba(14,30,38,.7)", fontWeight: 600 }}>
                          {s.diagnosis}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Materyal üretimi */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "#0E1E26" }}>{s.cards}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(14,30,38,.55)", textTransform: "uppercase", letterSpacing: ".1em" }}>materyal</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(14,30,38,.55)", fontWeight: 600, marginTop: 2 }}>
                    {s.latestCardAt ? `Son · ${formatShort(s.latestCardAt)}` : ""}
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(14,30,38,.6)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      {s.completed}/{s.total} hedef
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#FE703A" }}>{pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      width: "100%",
                      borderRadius: 999,
                      background: "rgba(14,30,38,.06)",
                      border: "1.5px solid #0E1E26",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ height: "100%", background: "#FE703A", width: `${pct}%` }} />
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ color: "#FE703A", fontSize: 20, fontWeight: 800, textAlign: "right" }}>→</div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ===================== POSTER (DARK) ===================== */

function PosterDarkView({
  filtered, students, filterArea, setFilterArea, sortBy, setSortBy,
}: {
  filtered: MockStudent[];
  students: MockStudent[];
  filterArea: FilterArea;
  setFilterArea: (v: FilterArea) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}) {
  // Dark poster tokens
  const BG = "#15100A";          // deep kraft
  const INK = "#F5E8C7";          // cream (text / borders)
  const SURFACE = "#1E1811";      // card bg
  const HOVER = "#2A2016";
  const ACCENT = "#FE703A";
  const MUTED = "rgba(245,232,199,.62)";
  const FAINT = "rgba(245,232,199,.18)";
  const FAINT_BG = "rgba(245,232,199,.06)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        paddingTop: 72,
        fontFamily: "var(--font-display), system-ui, sans-serif",
        color: INK,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 72,
          zIndex: 20,
          background: BG,
          borderBottom: `2px solid ${INK}`,
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, letterSpacing: "-.02em", margin: 0 }}>Öğrenciler</h1>
            <p style={{ marginTop: 2, fontSize: 12, color: MUTED, fontWeight: 500 }}>{students.length} öğrenci</p>
          </div>
          <button
            style={{
              fontFamily: "inherit",
              fontWeight: 700,
              background: ACCENT,
              color: "#15100A",
              padding: "0 20px",
              height: 44,
              borderRadius: 12,
              border: `2px solid ${INK}`,
              boxShadow: `0 4px 0 ${INK}`,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✨ Yeni Öğrenci
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 24px" }}>
        {/* Filters */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, padding: 4, background: SURFACE, border: `2px solid ${INK}`, borderRadius: 999, boxShadow: `0 4px 0 ${INK}` }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterArea(opt.value)}
                style={{
                  fontFamily: "inherit",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: filterArea === opt.value ? INK : "transparent",
                  color: filterArea === opt.value ? "#15100A" : MUTED,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: "1px 6px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 800,
                      background: filterArea === opt.value ? ACCENT : FAINT_BG,
                      color: filterArea === opt.value ? "#15100A" : INK,
                    }}
                  >
                    {students.filter((s) => s.workArea === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                fontFamily: "inherit",
                borderRadius: 12,
                border: `2px solid ${INK}`,
                boxShadow: `0 3px 0 ${INK}`,
                background: SURFACE,
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 700,
                color: INK,
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} style={{ background: SURFACE, color: INK }}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Column header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "52px 1fr 180px 200px 40px",
            gap: 20,
            alignItems: "center",
            padding: "10px 16px",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".1em",
            color: MUTED,
          }}
        >
          <div></div>
          <div>Öğrenci</div>
          <div>Üretim</div>
          <div>Hedef İlerleme</div>
          <div></div>
        </div>

        {/* Chunky outer container */}
        <div
          style={{
            background: SURFACE,
            border: `2px solid ${INK}`,
            borderRadius: 18,
            boxShadow: `0 6px 0 ${INK}`,
            overflow: "hidden",
          }}
        >
          {filtered.map((s, idx) => {
            const tint = AREA_CARD_COLOR[s.workArea];
            const pct = Math.round((s.completed / s.total) * 100);
            return (
              <Link
                key={s.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  textDecoration: "none",
                  color: INK,
                  display: "grid",
                  gridTemplateColumns: "52px 1fr 180px 200px 40px",
                  gap: 20,
                  alignItems: "center",
                  padding: "14px 16px",
                  borderTop: idx === 0 ? "none" : `2px dashed ${FAINT}`,
                  transition: "background .1s",
                  position: "relative",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = HOVER; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
              >
                {/* Avatar */}
                <div
                  style={{
                    height: 44,
                    width: 44,
                    borderRadius: 12,
                    background: tint,
                    border: `2px solid ${INK}`,
                    boxShadow: `0 2px 0 ${INK}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 17,
                    color: "#0E1E26",
                    flexShrink: 0,
                  }}
                >
                  {s.name.charAt(0)}
                </div>

                {/* Name + meta chips */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.01em", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: INK }}>
                    {s.name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: tint,
                        color: "#0E1E26",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        border: `1.5px solid ${INK}`,
                      }}
                    >
                      {WORK_AREA_LABEL[s.workArea]}
                    </span>
                    <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
                      {calcAge(s.birthDate)}
                    </span>
                    {s.diagnosis && (
                      <>
                        <span style={{ color: FAINT, fontWeight: 700 }}>·</span>
                        <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
                          {s.diagnosis}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Materyal üretimi */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: INK }}>{s.cards}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em" }}>materyal</span>
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, marginTop: 2 }}>
                    {s.latestCardAt ? `Son · ${formatShort(s.latestCardAt)}` : ""}
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".08em" }}>
                      {s.completed}/{s.total} hedef
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT }}>{pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      width: "100%",
                      borderRadius: 999,
                      background: FAINT_BG,
                      border: `1.5px solid ${INK}`,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ height: "100%", background: ACCENT, width: `${pct}%` }} />
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ color: ACCENT, fontSize: 20, fontWeight: 800, textAlign: "right" }}>→</div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
