"use client";

import { motion, type Variants } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import Link from "next/link";

type Point = {
  x: number;
  y: number;
};

interface WaveConfig {
  offset: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
}

const WAVE_PALETTE: WaveConfig[] = [
  { offset: 0,              amplitude: 70, frequency: 0.003,  color: "rgba(254, 112, 58, 1)",    opacity: 0.5  },
  { offset: Math.PI / 2,   amplitude: 90, frequency: 0.0026, color: "rgba(254, 112, 58, 0.7)",  opacity: 0.35 },
  { offset: Math.PI,       amplitude: 60, frequency: 0.0034, color: "rgba(1, 180, 180, 0.8)",   opacity: 0.3  },
  { offset: Math.PI * 1.5, amplitude: 80, frequency: 0.0022, color: "rgba(1, 210, 210, 0.5)",   opacity: 0.25 },
  { offset: Math.PI * 2,   amplitude: 55, frequency: 0.004,  color: "rgba(255, 255, 255, 0.15)", opacity: 0.2  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function GlowyWavesHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId: number;
    let time = 0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave: WaveConfig) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
            wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
            (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#023435");
      gradient.addColorStop(1, "#012425");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      WAVE_PALETTE.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section
      className="relative isolate flex min-h-[75vh] w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#023435" }}
      role="region"
      aria-label="Hero bölümü"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col md:flex-row items-center gap-12 px-6 py-10 md:py-14 md:px-8">
        {/* Left — Text + CTA */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 text-center md:text-left"
        >
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FE703A]/30 bg-[#FE703A]/20 px-4 py-1.5 text-xs font-medium text-[#FE703A]"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI Destekli · Dil ve Konuşma Terapisi
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold text-white leading-tight tracking-tight sm:text-5xl"
          >
            Dil, Konuşma ve İşitme{" "}
            <span className="text-[#FE703A]">Uzmanları</span> için
            <br />
            AI Destekli Öğrenme Kartları
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto md:mx-0 mb-10 max-w-xl text-lg text-white/70 leading-relaxed"
          >
            Saniyeler içinde kişiselleştirilmiş öğrenme materyalleri üretin,
            öğrencilerinizi takip edin.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center md:items-start justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FE703A] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FE703A]/90 sm:w-auto"
            >
              Ücretsiz Başla
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <a
              href="#features"
              className="w-full rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto text-center"
            >
              Nasıl Çalışır?
            </a>
          </motion.div>
        </motion.div>

        {/* Right — Floating Product Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="hidden md:block flex-1 max-w-md w-full"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Glass card */}
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#FE703A] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Öğrenme Kartı</p>
                    <p className="text-[10px] text-white/40">AI tarafından üretildi</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  ✓ Hazır
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { label: "Dil · Söz Dönemi", color: "bg-[#107996]/20 text-[#5dd4f0]" },
                  { label: "3-6 yaş", color: "bg-[#FE703A]/20 text-[#FE703A]" },
                  { label: "Başlangıç", color: "bg-white/10 text-white/70" },
                ].map((tag) => (
                  <span key={tag.label} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tag.color}`}>
                    {tag.label}
                  </span>
                ))}
              </div>

              {/* Card content preview */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
                <h4 className="text-sm font-bold text-white mb-2">Nesne Adlandırma Oyunu</h4>
                <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                  Günlük yaşam nesnelerini adlandırma ve sözcük dağarcığını genişletme çalışması.
                </p>
                <div className="space-y-1.5">
                  {["Nesneleri göster", "\"Bu ne?\" diye sor", "Model ol"].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FE703A]/30 text-[8px] font-bold text-[#FE703A]">
                        {i + 1}
                      </span>
                      <span className="text-[10px] text-white/40">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom actions */}
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-[#FE703A] py-2 text-center text-[11px] font-semibold text-white">
                  PDF İndir
                </div>
                <div className="flex-1 rounded-lg bg-white/10 border border-white/15 py-2 text-center text-[11px] font-medium text-white/70">
                  Düzenle
                </div>
              </div>
            </div>

            {/* Decorative glow behind card */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-[#FE703A]/10 blur-2xl" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
