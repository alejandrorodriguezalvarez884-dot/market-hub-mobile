// Community, the bot competition: what /api/bots returns (the types are the site's own,
// site/src/lib/bots.ts) and what the app may do with it. A bot is built and sent in from a
// computer, by the member's AI agent with Bot League's kit and its key: the app never downloads the kit
// and never shows a key. It can withdraw the bot and take the key back.
import { api } from "./api";

export type BotPeriod = "1d" | "1w" | "1m" | "1y" | "all";
export type BotReturns = Record<BotPeriod, number | null>;
export type BotHolding = { ticker: string; weight: number }; // weight as a fraction
export type BotLine = {
  handle: string; stand_in: boolean; you: boolean; name: string; about: string; since: string | null; as_of: string | null;
  sessions: number; returns: BotReturns; ranks: Partial<Record<BotPeriod, number>>; holdings: BotHolding[]; holding: number; cash: number | null;
};
export type MyBot = {
  handle: string; name: string; about: string; submitted_utc: string; since: string | null; as_of: string | null; sessions: number;
  returns: BotReturns | null; ranks: Partial<Record<BotPeriod, number>>; entrants: number; holdings: BotHolding[]; cash: number | null;
  rules: string[]; universe: number; curve: { date: string; value: number }[];
};
export type BotKey = { created_utc: string; used_utc: string | null };
export type BotBoard = {
  sample: boolean; as_of: string | null; stale: boolean; periods: { key: BotPeriod; label: string }[]; rows: BotLine[]; entrants: number;
  benchmark: { ticker: string; returns: BotReturns | null }; you: MyBot | null; key: BotKey | null; name: string;
  rules: { cost: number; universe: number; hold: number }; league?: string; // Bot League's address
};
// What the account screen lists as kept (GET /api/bots/mine).
export type KeptBot = { bot: { name: string; handle: string; submitted_utc: string } | null; key: BotKey | null };

export const botBoard = () => api<BotBoard>("/api/bots");
export const refreshBots = () => api<{ moved: number; busy?: boolean }>("/api/bots/refresh", { method: "POST" });
export const dropBotKey = () => api<{ revoked: boolean }>("/api/bots/key", { method: "DELETE" });
export const withdrawBot = () => api<{ withdrawn: boolean }>("/api/bots/mine", { method: "DELETE" });
export const keptBot = () => api<KeptBot>("/api/bots/mine");

export const PERIODS: { key: BotPeriod; label: string; long: string }[] = [
  { key: "1d", label: "Day", long: "the last session" }, { key: "1w", label: "Week", long: "the last 5 sessions" },
  { key: "1m", label: "Month", long: "the last 21 sessions" }, { key: "1y", label: "Year", long: "the last 252 sessions" },
  { key: "all", label: "Since start", long: "since each bot started" },
];
export const botDigits = (p: BotPeriod) => (p === "1d" ? 2 : 1);
// A close, by its date: "Oct 20, 2026".
export const closeDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
