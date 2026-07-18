import type { Card, CardStatus } from "@flashswipe/shared";
import { prisma } from "../lib/prisma.js";
import { toCard } from "./deckService.js";

/**
 * MVP: single anonymous user, so progress is stored directly on the card row.
 * Full app splits this into a per-user Progress table (see DESIGN.md §6).
 */
export class ProgressService {
  async setStatus(cardId: string, status: CardStatus): Promise<Card | null> {
    try {
      const c = await prisma.card.update({ where: { id: cardId }, data: { status } });
      return toCard(c);
    } catch {
      return null; // not found
    }
  }
}
