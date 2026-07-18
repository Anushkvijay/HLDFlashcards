import * as cheerio from "cheerio";
import type { ScrapedDoc, ScrapedSection } from "@flashswipe/shared";

/**
 * Fetches a URL and extracts { title, sections[] } by walking headings.
 * MVP: static fetch + cheerio (no headless browser). SSRF guard blocks private hosts.
 */
export class ScraperService {
  async scrape(url: string): Promise<ScrapedDoc> {
    assertSafeUrl(url);
    const res = await fetch(url, {
      headers: { "user-agent": "FlashSwipeBot/0.1 (+revision cards)" },
      redirect: "follow",
    });
    if (!res.ok) throw new HttpError(422, `Could not fetch URL (status ${res.status})`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // drop noise
    $("script, style, nav, header, footer, aside, noscript, svg, form").remove();

    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      new URL(url).pathname;

    const root = pickMain($);
    const sections = extractSections($, root);

    if (sections.length === 0) {
      // fallback: whole-body text as one section
      const text = normalize(root.text());
      if (text) sections.push({ heading: title, text });
    }

    return { title, sourceUrl: url, sections };
  }
}

function pickMain($: cheerio.CheerioAPI) {
  for (const sel of ["main", "article", "[role=main]", ".content", "#content"]) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) return el;
  }
  return $("body");
}

function extractSections(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<any>,
): ScrapedSection[] {
  const sections: ScrapedSection[] = [];
  let current: ScrapedSection | null = null;

  root
    .find("h1, h2, h3, p, li")
    .each((_, el) => {
      const tag = (el as any).tagName?.toLowerCase();
      const text = normalize($(el).text());
      if (!text) return;
      if (tag === "h1" || tag === "h2" || tag === "h3") {
        if (current && current.text.trim()) sections.push(current);
        current = { heading: text, text: "" };
      } else if (current) {
        current.text += (current.text ? " " : "") + text;
      } else {
        current = { heading: "Overview", text };
      }
    });
  if (current && (current as ScrapedSection).text.trim()) sections.push(current);

  // keep sections with enough substance, cap total to avoid huge decks
  return sections.filter((s) => s.text.length > 40).slice(0, 25);
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** SSRF defense: only http(s), block localhost / private ranges. */
function assertSafeUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new HttpError(400, "Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new HttpError(400, "Only http/https URLs are allowed");
  }
  const host = u.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new HttpError(400, "URL host is not allowed");
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
