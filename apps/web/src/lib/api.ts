import type { Card, CardStatus, Deck } from "@flashswipe/shared";
import { get as idbGet, set as idbSet } from "idb-keyval";

const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export interface DeckList {
  items: Deck[];
  page: number;
  total: number;
}

export const api = {
  async listDecks(): Promise<DeckList> {
    try {
      const data = await req<DeckList>("/decks");
      await idbSet("decks", data); // cache for offline
      return data;
    } catch (err) {
      const cached = await idbGet<DeckList>("decks");
      if (cached) return cached;
      throw err;
    }
  },

  async getDeck(id: string): Promise<Deck> {
    try {
      const deck = await req<Deck>(`/decks/${id}`);
      await idbSet(`deck:${id}`, deck);
      return deck;
    } catch (err) {
      const cached = await idbGet<Deck>(`deck:${id}`);
      if (cached) return cached;
      throw err;
    }
  },

  createDeck(url: string): Promise<Deck> {
    return req<Deck>("/decks", { method: "POST", body: JSON.stringify({ url }) });
  },

  setProgress(cardId: string, status: CardStatus): Promise<Card> {
    return req<Card>(`/cards/${cardId}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
