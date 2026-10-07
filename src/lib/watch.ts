// The watchlist: what /api/watchlist returns (market-hub-landing/src/markethub/watch.py; the
// types are the site's own, lib/watch.ts) and how the app asks for it. A stock's reading is a set
// of figures, one group per aspect (how far the price is from its average, its trend, its
// strength against the index...), each with a sentence: by the code at once, by the model when
// it answers. A state ("extended", "uptrend", "ahead") names where a figure stands; it never
// says what a price will do.
import { api } from "./api";
import type { Portfolio } from "./types";

type N = number | null;
export type Span = "1m" | "3m" | "6m" | "12m";
export type Against = { gaps: Record<Span, N>; returns: Record<Span, N>; state: "ahead" | "fading" | "gaining" | "behind"; line: number[];
  high_sessions: N; low_sessions: N };
export type Reading = {
  as_of: string; price: number; day_change_pct: N; daily_range_pct: N;
  extension: { pct: number; ranges: N; state: "extended_above" | "above" | "at" | "below" | "extended_below"; percentile: N; sessions: N;
    band: [number, number] | null; low: number; high: number; pct_200: N } | null;
  trend: { sma20: N; sma50: number; sma200: N; slope_50: N; slope_200: N; state: "up" | "pullback" | "down" | "rebound" | "mixed" } | null;
  momentum: { rsi: N; returns: Record<"1w" | Span, N> };
  range: { low: number; high: number; position: N; from_high: number; from_low: N; sessions_since_high: number };
  volume: { average: number; week_ratio: number; up_down: N } | null;
  volatility: N; strength: Against | null; spark: number[];
};
export type Aspect = "extension" | "trend" | "strength" | "sector" | "momentum" | "range" | "volume" | "growth" | "valuation";
export type Analysis = { headline: string; points: { aspect: Aspect; text: string }[]; contrast: string; written: boolean };
export type Item = {
  ticker: string; name: string; kind: "stock" | "fund"; sector: string | null; industry: string | null; reading: Reading | null;
  sector_strength: { name: string; fund: string; against_market: Against | null; stock: Against | null } | null;
  valuation: { pe: N; forward_pe: N; market_cap: N; days_to_results: N } | null;
  analysis: Analysis;
};
export type Board = { sample: boolean; as_of: string; benchmark: { ticker: string; name: string }; watchlist: string[]; positions: string[]; items: Item[] };
type Growing = { quarter?: number; year?: number; next_year?: number };
export type Growth = { eps?: Growing; revenue?: Growing; analysts: N };
export type Read = { sample: boolean; ticker: string; growth: Growth | null; captions: Analysis; analysis: Analysis | null };
export type Bars = { sample: boolean; ticker: string; time: string[]; open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] };

// The stocks already read in this run of the app, so a stock's own screen opens with what its line showed.
const seen = new Map<string, { item: Item; index: string }>();
export const remembered = (ticker: string) => seen.get(ticker) ?? null;

export async function getBoard(): Promise<Board> {
  const board = await api<Board>("/api/watchlist");
  for (const item of board.items) seen.set(item.ticker, { item, index: board.benchmark.name });
  return board;
}

export async function getStock(ticker: string, index = "S&P 500"): Promise<Item> {
  const found = await api<{ sample: boolean; item: Item }>(`/api/watchlist/stock?t=${encodeURIComponent(ticker)}`);
  seen.set(found.item.ticker, { item: found.item, index: seen.get(ticker)?.index ?? index });
  return found.item;
}

// A stock's bars and its fuller reading are asked for once, however many times they are drawn.
function once<T>(path: string): (t: string) => Promise<T> {
  const asked = new Map<string, Promise<T>>();
  return (t) => {
    if (!asked.has(t)) asked.set(t, api<T>(`${path}?t=${encodeURIComponent(t)}`).catch((e) => (asked.delete(t), Promise.reject(e))));
    return asked.get(t)!;
  };
}
export const getBars = once<Bars>("/api/watchlist/bars");
export const getRead = once<Read>("/api/watchlist/read");

// Adds a stock to the user's watchlist: the list is saved whole, so it is read first.
export async function follow(ticker: string): Promise<void> {
  const p = await api<Portfolio>("/api/portfolio");
  if (p.watchlist.includes(ticker) || p.positions.some((x) => x.ticker === ticker)) return;
  await api<Portfolio>("/api/portfolio", { method: "PUT", body: { positions: p.positions, watchlist: [...p.watchlist, ticker] } });
}

export const EXTENSION = { extended_above: "Extended above", above: "Above its average", at: "At its average", below: "Below its average", extended_below: "Extended below" };
export const TREND = { up: "Uptrend", pullback: "Pullback in an uptrend", down: "Downtrend", rebound: "Rebound in a downtrend", mixed: "No clear trend" };
export const STRENGTH = { ahead: "Ahead", fading: "Ahead, losing ground", gaining: "Behind, gaining ground", behind: "Behind" };
export const SPANS: [Span, string][] = [["1m", "1 month"], ["3m", "3 months"], ["6m", "6 months"], ["12m", "12 months"]];

// The averages keep one colour each wherever they are drawn: on the chart and on the gauges.
export const AVERAGES = [
  { sessions: 20, name: "20-day", color: "#c9c7c1" },
  { sessions: 50, name: "50-day", color: "#6f93c4" },
  { sessions: 200, name: "200-day", color: "#c9a45a" },
] as const;

// The mean of the last `n` values at each point; null until there are `n`.
export function average(values: number[], n: number): (number | null)[] {
  let sum = 0;
  return values.map((v, i) => {
    sum += v - (i >= n ? values[i - n] : 0);
    return i >= n - 1 ? sum / n : null;
  });
}

export const RANGES = { "3M": 63, "6M": 126, "1Y": 252, "2Y": 504 } as const;
export type Range = keyof typeof RANGES;
