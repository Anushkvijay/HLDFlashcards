import { motion } from "framer-motion";
import type { Card } from "@flashswipe/shared";

const diffColor: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  hard: "bg-rose-500/15 text-rose-400",
};

export function FlashCard({ card }: { card: Card }) {
  return (
    <motion.article
      className="flex h-full w-full flex-col overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
      style={{ touchAction: "pan-y" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${diffColor[card.difficulty] ?? diffColor.medium}`}>
          {card.difficulty}
        </span>
        <span className="text-xs text-zinc-400">~{card.readingSeconds}s read</span>
        {card.status === "bookmarked" && <span title="bookmarked">🔖</span>}
        {card.status === "difficult" && <span title="difficult">🔥</span>}
        {card.status === "completed" && <span title="completed">✅</span>}
      </div>

      <h2 className="text-2xl font-bold leading-tight">{card.title}</h2>
      <p className="mt-3 text-zinc-700 dark:text-zinc-300">{card.explanation}</p>

      {card.keyTakeaways.length > 0 && (
        <Section title="Key takeaways">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {card.keyTakeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      )}

      {card.interviewTips.length > 0 && (
        <Section title="Interview tips">
          <ul className="space-y-1 text-sm">
            {card.interviewTips.map((t, i) => (
              <li key={i}>💡 {t}</li>
            ))}
          </ul>
        </Section>
      )}

      {card.commonMistakes.length > 0 && (
        <Section title="Common mistakes">
          <ul className="space-y-1 text-sm">
            {card.commonMistakes.map((t, i) => (
              <li key={i}>⚠️ {t}</li>
            ))}
          </ul>
        </Section>
      )}

      {card.analogy && (
        <Section title="Analogy">
          <p className="text-sm italic text-zinc-600 dark:text-zinc-400">{card.analogy}</p>
        </Section>
      )}

      {card.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {card.tags.map((t) => (
            <span key={t} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
              #{t}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      {children}
    </div>
  );
}
