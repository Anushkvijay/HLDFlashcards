import { nanoid } from "nanoid";
import type { ScrapedDoc } from "@flashswipe/shared";
import { prisma } from "./lib/prisma.js";
import { MockProvider } from "./ai/mockProvider.js";

/** Seeds one demo deck (no network) so the UI has content on first run. */
const demo: ScrapedDoc = {
  title: "System Design in a Hurry — Core Concepts",
  sourceUrl: "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction",
  sections: [
    {
      heading: "Load Balancers",
      text: "A load balancer distributes incoming traffic across multiple servers. It improves availability and scales horizontally. Common strategies include round-robin, least-connections, and consistent hashing. Health checks remove unhealthy instances from rotation.",
    },
    {
      heading: "Caching",
      text: "Caching stores frequently accessed data in fast storage to reduce latency and database load. Cache-aside is the most common pattern. Eviction policies like LRU decide what to drop. Watch out for cache invalidation and stampedes.",
    },
    {
      heading: "CAP Theorem",
      text: "The CAP theorem states a distributed system can guarantee only two of Consistency, Availability, and Partition tolerance. Since network partitions are unavoidable, you choose between consistency and availability during a partition.",
    },
    {
      heading: "Database Replication",
      text: "Replication copies data across nodes for durability and read scaling. Leader-follower replication sends writes to a leader and reads to followers. Replication lag can cause stale reads. Multi-leader and quorum systems trade consistency for availability.",
    },
    {
      heading: "Message Queues",
      text: "A message queue decouples producers from consumers and smooths traffic spikes. It enables async processing and retries. Kafka offers durable ordered logs; RabbitMQ offers flexible routing. At-least-once delivery requires idempotent consumers.",
    },
  ],
};

async function main() {
  const cards = await new MockProvider().generateCards(demo);
  const deckId = nanoid();
  await prisma.deck.create({
    data: {
      id: deckId,
      title: demo.title,
      sourceUrl: demo.sourceUrl,
      status: "ready",
      cards: {
        create: cards.map((g, i) => ({
          id: nanoid(),
          position: i,
          title: g.title,
          explanation: g.explanation,
          keyTakeaways: JSON.stringify(g.keyTakeaways),
          interviewTips: JSON.stringify(g.interviewTips),
          commonMistakes: JSON.stringify(g.commonMistakes),
          analogy: g.analogy ?? null,
          difficulty: g.difficulty ?? "medium",
          tags: JSON.stringify(g.tags ?? []),
          readingSeconds: g.readingSeconds ?? 20,
          status: "new",
        })),
      },
    },
  });
  console.log(`Seeded demo deck ${deckId} with ${cards.length} cards.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
