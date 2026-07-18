import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Card, CardStatus, Deck } from "@flashswipe/shared";
import { api } from "../lib/api";
import { FlashCard } from "../components/FlashCard";

export function DeckPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const deck = useQuery({ queryKey: ["deck", id], queryFn: () => api.getDeck(id) });

  const cards = deck.data?.cards ?? [];
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1); // 1 = next (up), -1 = prev (down)

  const current = cards[index];

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

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = Math.min(cards.length - 1, Math.max(0, i + delta));
        if (delta > 0 && next !== i) {
          // mark the card we're leaving as completed (if still new)
          const leaving = cards[i];
          if (leaving && leaving.status === "new") mark("completed");
        }
        setDir(delta >= 0 ? 1 : -1);
        return next;
      });
    },
    [cards, mark],
  );

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key.toLowerCase() === "b") mark("bookmarked");
      else if (e.key.toLowerCase() === "d") mark("difficult");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, mark]);

  if (deck.isLoading) return <Centered>Loading deck…</Centered>;
  if (deck.isError || !deck.data) return <Centered>Could not load this deck.</Centered>;
  if (cards.length === 0) return <Centered>This deck has no cards.</Centered>;

  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col px-4 py-4">
      {/* top bar */}
      <div className="mb-3 flex items-center gap-3">
        <Link to="/" className="text-slate-400 hover:text-slate-200">←</Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{deck.data.title}</div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-xs text-slate-400">{index + 1}/{cards.length}</span>
      </div>

      {/* swipe area */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence custom={dir} initial={false} mode="popLayout">
          <motion.div
            key={current.id}
            custom={dir}
            className="absolute inset-0"
            initial={{ y: dir > 0 ? "100%" : "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: dir > 0 ? "-100%" : "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.y < -80) go(1);
              else if (info.offset.y > 80) go(-1);
            }}
          >
            <FlashCard card={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* actions */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <ActionBtn onClick={() => go(-1)} disabled={index === 0}>↓ Prev</ActionBtn>
        <ActionBtn onClick={() => mark("bookmarked")} active={current.status === "bookmarked"}>🔖 Bookmark</ActionBtn>
        <ActionBtn onClick={() => mark("difficult")} active={current.status === "difficult"}>🔥 Hard</ActionBtn>
        <ActionBtn onClick={() => go(1)} disabled={index === cards.length - 1}>↑ Next</ActionBtn>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        Swipe up/down · ↑↓ keys · B bookmark · D hard
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
          ? "border-indigo-500 bg-indigo-500/15 text-indigo-400"
          : "border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] items-center justify-center px-4 text-center text-slate-400">
      <div>
        {children}
        <div className="mt-3">
          <Link to="/" className="text-indigo-400">← Back home</Link>
        </div>
      </div>
    </div>
  );
}
