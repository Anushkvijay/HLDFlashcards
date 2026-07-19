import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function HomePage() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const decks = useQuery({ queryKey: ["decks"], queryFn: api.listDecks });

  const create = useMutation({
    mutationFn: (u: string) => api.createDeck(u),
    onSuccess: () => {
      setUrl("");
      qc.invalidateQueries({ queryKey: ["decks"] });
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">FlashSwipe</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Paste an interview-prep URL. Get swipeable revision cards.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) create.mutate(url.trim());
        }}
        className="mb-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.hellointerview.com/learn/..."
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-xl bg-teal-600 px-5 py-3 font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
        >
          {create.isPending ? "Generating…" : "Generate"}
        </button>
      </form>

      {create.isError && (
        <p className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {(create.error as Error).message}
        </p>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Your decks
      </h2>

      {decks.isLoading && <p className="text-zinc-400">Loading…</p>}
      {decks.isError && <p className="text-red-500">Could not load decks.</p>}

      <ul className="space-y-3">
        {decks.data?.items.map((d) => (
          <li key={d.id}>
            <Link
              to={`/decks/${d.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-teal-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="font-medium">{d.title}</div>
              <div className="mt-1 truncate text-xs text-zinc-400">{d.sourceUrl}</div>
              <div className="mt-2 text-xs text-teal-500">{d.cardCount ?? 0} cards →</div>
            </Link>
          </li>
        ))}
        {decks.data && decks.data.items.length === 0 && (
          <li className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-400 dark:border-zinc-700">
            No decks yet. Paste a URL above to make your first one.
          </li>
        )}
      </ul>
    </div>
  );
}
