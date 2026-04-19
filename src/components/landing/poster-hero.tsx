"use client";

import Link from "next/link";
import { Blob, PBadge, PBtn, PCard, Squiggle } from "./poster-ui";

function HeroCardStack() {
  return (
    <>
      <PCard
        color="#FFCE52"
        rotate={-6}
        style={{ position: "absolute", top: 40, left: 20, width: 280, padding: 20 }}
      >
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <PBadge color="blue">Artikülasyon</PBadge>
          <PBadge color="soft">7-12 yaş</PBadge>
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 10,
            color: "#0E1E26",
          }}
        >
          /s/ Sesi — Sözcük Başı
        </div>
        <div style={{ fontSize: 13, color: "rgba(14,30,38,.7)", lineHeight: 1.5 }}>
          10 Türkçe kelime, hece ayrımı ve örnek cümlelerle.
        </div>
      </PCard>

      <PCard
        color="#fff"
        style={{
          position: "absolute",
          top: 80,
          left: 80,
          width: 300,
          padding: 20,
          zIndex: 3,
        }}
      >
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <PBadge color="accent">Dil</PBadge>
          <PBadge color="soft">3-6 yaş</PBadge>
          <PBadge color="green">Kolay</PBadge>
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 10,
            color: "#0E1E26",
          }}
        >
          Mutfak Keşfi — Sözcük Avı
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(14,30,38,.7)",
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          Tanıdık mutfak nesneleriyle aktif sözcük dağarcığını genişletir.
        </div>
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: "#FFF8EC",
            border: "1px dashed rgba(14,30,38,.2)",
            fontSize: 11.5,
            color: "rgba(14,30,38,.7)",
          }}
        >
          <strong style={{ color: "#0E1E26" }}>💡 Uzman notu:</strong> Çoklu duyusal
          deneyim sözcük yerleşimini hızlandırır.
        </div>
      </PCard>

      <PCard
        color="#FF6B9D"
        rotate={5}
        style={{ position: "absolute", top: 220, left: 170, width: 260, padding: 18 }}
      >
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <PBadge color="soft">İşitme</PBadge>
          <PBadge color="yellow">Orta</PBadge>
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.1,
          }}
        >
          Ses Lokalizasyonu — Çiftlikte
        </div>
      </PCard>

      <div
        style={{
          position: "absolute",
          top: 20,
          right: 40,
          fontSize: 32,
          color: "#0E1E26",
          animation: "spin 8s linear infinite",
        }}
      >
        ✦
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 20,
          fontSize: 24,
          color: "#0E1E26",
          animation: "spin 12s linear infinite reverse",
        }}
      >
        ✦
      </div>
    </>
  );
}

export function PosterHero() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#FFF8EC",
        color: "#0E1E26",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Blob
          color="#FFCE52"
          style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, opacity: 0.6 }}
        />
        <Blob
          color="#FF6B9D"
          style={{ position: "absolute", bottom: -100, left: -80, width: 320, height: 320, opacity: 0.4 }}
        />
        <Blob
          color="#4A90E2"
          style={{ position: "absolute", top: 200, left: "45%", width: 180, height: 180, opacity: 0.3 }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "64px 24px 88px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
        className="poster-hero-inner"
      >
        <div className="poster-hero-grid">
          <div>
            <PBadge color="yellow" style={{ marginBottom: 24 }}>
              ✦ AI Destekli · Dil ve Konuşma Terapisi
            </PBadge>

            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                lineHeight: 0.95,
                letterSpacing: "-.035em",
                fontWeight: 700,
                color: "#0E1E26",
              }}
              className="poster-hero-h1"
            >
              Dil, Konuşma ve İşitme
              <br />
              <span style={{ position: "relative", display: "inline-block" }}>
                <span style={{ position: "relative", zIndex: 2, color: "#fff" }}>
                  Uzmanları
                </span>
                <span
                  style={{
                    position: "absolute",
                    inset: "-6px -14px",
                    background: "#FE703A",
                    borderRadius: 18,
                    zIndex: 1,
                    transform: "rotate(-2deg)",
                  }}
                />
              </span>{" "}
              için
              <br />
              AI Destekli Öğrenme Kartları
            </h1>

            <p
              style={{
                margin: "28px 0 36px",
                fontSize: 19,
                lineHeight: 1.5,
                maxWidth: 520,
                color: "rgba(14,30,38,.7)",
                fontWeight: 500,
                fontFamily: "var(--font-display)",
              }}
            >
              Saniyeler içinde kişiselleştirilmiş öğrenme materyalleri üretin,
              öğrencilerinizi takip edin.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 40,
                flexWrap: "wrap",
              }}
            >
              <Link href="/register" style={{ textDecoration: "none" }}>
                <PBtn variant="accent" size="lg">
                  Ücretsiz Başla →
                </PBtn>
              </Link>
              <a href="#features" style={{ textDecoration: "none" }}>
                <PBtn variant="white" size="lg">
                  Nasıl Çalışır?
                </PBtn>
              </a>
            </div>

          </div>

          <div className="poster-hero-stack">
            <HeroCardStack />
          </div>
        </div>
      </div>

      <Squiggle
        color="#0E1E26"
        style={{
          position: "absolute",
          bottom: 14,
          left: 0,
          right: 0,
          height: 16,
          opacity: 0.08,
        }}
      />

      <style jsx>{`
        .poster-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        .poster-hero-stack {
          position: relative;
          height: 480px;
          display: none;
        }
        .poster-hero-h1 {
          font-size: 56px;
        }
        @media (min-width: 768px) {
          .poster-hero-grid {
            grid-template-columns: 1.2fr 1fr;
          }
          .poster-hero-stack {
            display: block;
          }
          .poster-hero-h1 {
            font-size: 84px;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
