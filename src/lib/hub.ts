// What the screens of My Hub share: the portfolio's figures, and a stock's page on the portal.
import { openBrowserAsync } from "expo-web-browser";

import { SITE, api } from "./api";
import type { Dashboard, News, NewsItem } from "./types";

export const getDashboard = () => api<Dashboard>("/api/dashboard");
// A stock's page on the portal: its chart, its figures and its news.
export const openQuote = (ticker: string) => void openBrowserAsync(`${SITE}/quote/?t=${encodeURIComponent(ticker)}`);
export const openPage = (address: string) => void openBrowserAsync(address);

// The news about the user's stocks. Nothing refreshes the news on a timer: what is stored is drawn,
// and when that is stale the refresh is asked for here, waited for, and the news drawn again.
export async function watchMyNews(draw: (n: News) => void): Promise<void> {
  const load = () => api<News>("/api/news/mine");
  const first = await load();
  draw(first);
  if (!first.stale) return;
  const done = await api<{ refreshed: boolean }>("/api/public/news/refresh", { method: "POST" }).catch(() => null);
  if (done?.refreshed) draw(await load().catch(() => first));
}

// A headline opens the item's own page on the portal, where its article is and, from there, its
// source. A headline of the press has nothing here but itself: it opens at its publisher.
export function newsAddress(n: NewsItem): string | null {
  if (n.layer !== "press") return `${SITE}/news/article/?id=${encodeURIComponent(n.id)}`;
  return /^https?:\/\//.test(n.url ?? "") ? n.url! : null;
}
