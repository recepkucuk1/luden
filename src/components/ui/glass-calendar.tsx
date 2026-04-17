"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlassCalendarProps {
  /** Currently highlighted date */
  selectedDate: Date;
  /** Called when user clicks a day */
  onSelectDate: (date: Date) => void;
  /**
   * Dates that have at least one lesson — used to render indicator dots.
   * Pass an array of Date objects (time part is ignored).
   */
  lessonDates?: Date[];
  className?: string;
}

// ─── Animation variants ───────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
  }),
};

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// ─── Component ────────────────────────────────────────────────────────────────

export function GlassCalendar({
  selectedDate,
  onSelectDate,
  lessonDates = [],
  className,
}: GlassCalendarProps) {
  // Internal month cursor — starts on selectedDate's month
  const [cursor, setCursor] = useState(() =>
    startOfMonth(selectedDate)
  );
  // Track direction for slide animation: +1 forward, -1 backward
  const [direction, setDirection] = useState(0);
  // Unique key for AnimatePresence
  const monthKey = format(cursor, "yyyy-MM");
  const uid = useId();

  function go(dir: number) {
    setDirection(dir);
    setCursor((c) => (dir > 0 ? addMonths(c, 1) : subMonths(c, 1)));
  }

  // Build grid: Mon → Sun, padded to full weeks
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(endOfMonth(cursor),     { weekStartsOn: 1 });
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function hasLesson(date: Date) {
    return lessonDates.some((d) => isSameDay(d, date));
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-4 select-none",
        "bg-[rgba(2,52,53,0.06)] dark:bg-white/5 border border-[rgba(2,52,53,0.12)] dark:border-white/10 backdrop-blur-[16px]",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => go(-1)}
          aria-label="Önceki ay"
          className="rounded-lg p-1.5 text-[#023435]/40 dark:text-zinc-400 hover:bg-[#023435]/8 dark:hover:bg-white/10 hover:text-[#023435]/80 dark:hover:text-foreground dark:text-foreground/90 dark:hover:text-zinc-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.h2
            key={monthKey + "-header"}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="text-sm font-semibold capitalize text-[#023435] dark:text-zinc-100"
          >
            {format(cursor, "MMMM yyyy", { locale: tr })}
          </motion.h2>
        </AnimatePresence>

        <button
          onClick={() => go(1)}
          aria-label="Sonraki ay"
          className="rounded-lg p-1.5 text-[#023435]/40 dark:text-zinc-400 hover:bg-[#023435]/8 dark:hover:bg-white/10 hover:text-[#023435]/80 dark:hover:text-foreground dark:text-foreground/90 dark:hover:text-zinc-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Day-of-week labels ── */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[rgba(2,52,53,0.4)] dark:text-zinc-500"
          >
            {name}
          </div>
        ))}
      </div>

      {/* ── Day grid (animated per month) ── */}
      <div className="relative overflow-hidden" style={{ minHeight: `${Math.ceil(days.length / 7) * 44}px` }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={monthKey + uid}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="grid grid-cols-7 gap-y-0.5"
          >
            {days.map((day) => {
              const isSelected    = isSameDay(day, selectedDate);
              const isTodayDate   = isToday(day);
              const isCurrentMonth = isSameMonth(day, cursor);
              const lesson        = hasLesson(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    onSelectDate(day);
                    // If user clicks a day in another month, navigate to that month
                    if (!isCurrentMonth) {
                      setDirection(day > cursor ? 1 : -1);
                      setCursor(startOfMonth(day));
                    }
                  }}
                  className={cn(
                    "relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-xl text-xs font-medium",
                    "transition-all duration-150",
                    isSelected
                      ? "text-white shadow-lg"
                      : isTodayDate
                        ? "text-[#FE703A] font-semibold hover:bg-[#FE703A]/8 dark:hover:bg-[#FE703A]/20"
                        : isCurrentMonth
                          ? "text-[#023435]/70 dark:text-zinc-300 hover:bg-[#023435]/8 dark:hover:bg-white/10"
                          : "text-[#023435]/25 dark:text-zinc-600 hover:bg-[#023435]/5 dark:hover:bg-white/5"
                  )}
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, #FE703A 0%, #F4AE10 100%)" }
                      : undefined
                  }
                >
                  <span>{format(day, "d")}</span>

                  {/* Today dot (only when not selected) */}
                  {isTodayDate && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FE703A]" />
                  )}

                  {/* Lesson dot (bottom, only when not selected and has lesson) */}
                  {lesson && !isSelected && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full",
                        isTodayDate ? "bottom-0" : "",
                        isCurrentMonth ? "bg-[#FE703A]/60" : "bg-white/15"
                      )}
                    />
                  )}

                  {/* Lesson dot when selected */}
                  {lesson && isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-white/60 dark:bg-card/60" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer: today shortcut ── */}
      <div className="mt-3 border-t border-[rgba(2,52,53,0.1)] dark:border-white/10 pt-3 flex justify-center">
        <button
          onClick={() => {
            const t = new Date();
            setDirection(t > cursor ? 1 : -1);
            setCursor(startOfMonth(t));
            onSelectDate(t);
          }}
          className="rounded-lg px-3 py-1 text-[11px] font-medium text-[#023435]/40 dark:text-zinc-400 hover:bg-[#023435]/8 dark:hover:bg-white/10 hover:text-[#023435]/70 dark:hover:text-foreground/90 dark:text-foreground/80 dark:hover:text-zinc-200 transition-colors"
        >
          Bugüne git
        </button>
      </div>
    </div>
  );
}
