import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CardStatus, Deck } from "@flashswipe/shared";
import { api } from "../lib/api";
import { FlashCard } from "../components/FlashCard";

export function DeckPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const deck = useQuery({ queryKey: ["deck", id], queryFn: () => api.getDeck(id) });

  const cards = deck.data?.cards ?? [];
  const [index, setIndex] = useState(0);

  const current = cards[index];

  // horizontal drag state — Tinder/Bumble style
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-16, 16]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const reviewOpacity = useTransform(x, [-130, -30], [1, 0]);

  const mark = useCallback(
    (status: CardStatus) => {
      if (!current) return;
      // optimistic update in the react-query cache
      qc.setQueryData<Deck>(["deck", id], (old) =>
        old
          ? { ...old, cards: old.cards?.map((c) => (c.id === current.id ? { ...c, status } : c)) }
          : old,
      );
      api.setProgress(current.id, status).catch(() => {
        /* offline: keep optimistic value, will resync on reload */
      });
    },
    [current, id, qc],
  );

  const hasNext = index < cards.length - 1;
  const hasPrev = index > 0;

  // advance to next card, marking the one we're leaving
  const next = useCallback(
    (leaving: CardStatus) => {
      if (current && current.status === "new") mark(leaving);
      setIndex((i) => Math.min(cards.length - 1, i + 1));
    },
    [current, cards.length, mark],
  );

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // fling the card off-screen, then advance. dir: 1 = right (know it), -1 = left (review)
  const fling = useCallback(
    (dir: 1 | -1) => {
      if (!hasNext) {
        // last card — nothing to advance to; snap back and just mark
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        if (current && current.status === "new") mark(dir > 0 ? "completed" : "difficult");
        return;
      }
      const w = typeof window !== "undefined" ? window.innerWidth : 500;
      animate(x, dir * (w + 100), { duration: 0.28, ease: "easeOut" }).then(() => {
        x.set(0);
        next(dir > 0 ? "completed" : "difficult");
      });
    },
    [x, hasNext, next, current, mark],
  );

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowUp") { e.preventDefault(); fling(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); fling(-1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); prev(); }
      else if (e.key.toLowerCase() === "b") mark("bookmarked");
      else if (e.key.toLowerCase() === "d") mark("difficult");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fling, prev, mark]);

  if (deck.isLoading) return <Centered>Loading deck…</Centered>;
  if (deck.isError || !deck.data) return <Centered>Could not load this deck.</Centered>;
  if (cards.length === 0) return <Centered>This deck has no cards.</Centered>;

  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col px-4 py-4">
      {/* top bar */}
      <div className="mb-3 flex items-center gap-3">
        <Link to="/" className="text-zinc-400 hover:text-zinc-200">←</Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{deck.data.title}</div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-xs text-zinc-400">{index + 1}/{cards.length}</span>
      </div>

      {/* swipe area */}
      <div className="relative min-h-0 flex-1">
        {/* peek of the next card underneath, for depth */}
        {hasNext && (
          <div className="absolute inset-0 scale-[0.96] opacity-60">
            <FlashCard card={cards[index + 1]} />
          </div>
        )}

        <motion.div
          key={current.id}
          className="absolute inset-0"
          style={{ x, rotate, touchAction: "pan-y" }}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100 || info.velocity.x > 500) fling(1);
            else if (info.offset.x < -100 || info.velocity.x < -500) fling(-1);
            else animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
          }}
        >
          {/* swipe badges */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-5 top-5 z-10 rotate-[-12deg] rounded-lg border-2 border-emerald-500 px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-emerald-500"
          >
            Know it
          </motion.div>
          <motion.div
            style={{ opacity: reviewOpacity }}
            className="pointer-events-none absolute right-5 top-5 z-10 rotate-[12deg] rounded-lg border-2 border-amber-500 px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-amber-500"
          >
            Review
          </motion.div>

          <FlashCard card={current} />
        </motion.div>
      </div>

      {/* actions */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <ActionBtn onClick={prev} disabled={!hasPrev}>← Prev</ActionBtn>
        <ActionBtn onClick={() => mark("bookmarked")} active={current.status === "bookmarked"}>🔖</ActionBtn>
        <ActionBtn onClick={() => fling(-1)}>🔥 Review</ActionBtn>
        <ActionBtn onClick={() => fling(1)}>✓ Know it</ActionBtn>
      </div>
      <p className="mt-2 text-center text-xs text-zinc-400">
        Swipe → know it · ← review · ↑↓ keys · B bookmark
      </p>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-sm transition disabled:opacity-30 ${
        active
          ? "border-teal-500 bg-teal-500/15 text-teal-400"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] items-center justify-center px-4 text-center text-zinc-400">
      <div>
        {children}
        <div className="mt-3">
          <Link to="/" className="text-teal-400">← Back home</Link>
        </div>
      </div>
    </div>
  );
}
