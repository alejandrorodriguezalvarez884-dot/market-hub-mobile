// Community: the shared portfolios (/api/community, /api/sharing) and the monthly competition
// (/api/competitions; the types are the site's own, lib/competition.ts), with a month's discussion.
import { api } from "./api";
import type { Board, Sharing } from "./types";

export const getBoard = () => api<Board>("/api/community");
export const setSharing = (body: { enabled: boolean; handle?: string }) => api<Sharing>("/api/sharing", { method: "PUT", body });

export type Pick = { ticker: string; name: string; weight: number; return: number | null }; // weight as a fraction
export type Line = { rank: number; handle: string; you: boolean; stand_in: boolean; return: number; picks: Pick[]; series?: number[] };
export type Entry = { month: string; handle: string; updated_utc: string | null; picks: { ticker: string; name: string; weight: number }[] }; // weight in percent
export type Benchmark = { ticker: string; name: string; return: number | null; series?: number[] };
export type Past = { month: string; label: string; entrants: number; sample: boolean; benchmark: Benchmark | null; standings: Line[] };
export type RecordLine = { rank: number; handle: string; you: boolean; stand_in: boolean; months: number; wins: number; average: number; best: number };
export type Rules = { picks_min: number; picks_max: number; weight_min: number; weight_max: number };
export type Competition = {
  sample: boolean; now_utc: string; name: string; rules: Rules;
  running: {
    month: string; label: string; ends: string; next_starts_utc: string; start_date: string; as_of: string | null; days: string[];
    entrants: number; partial: boolean; benchmark: Benchmark; standings: Line[]; you: { rank: number; of: number; return: number } | null;
  };
  open: { month: string; label: string; closes_utc: string; ends: string; entrants: number; entry: Entry | null };
  history: { months: Past[]; record: RecordLine[]; you: RecordLine | null };
};

export const getCompetition = () => api<Competition>("/api/competitions");
export const sendEntry = (handle: string, picks: { ticker: string; weight: number }[]) => api<Entry>("/api/competitions/entry", { method: "PUT", body: { handle, picks } });
export const withdrawEntry = () => api<{ withdrawn: boolean }>("/api/competitions/entry", { method: "DELETE" });

export type Comment = { id: string; parent_id: string | null; depth: number; created_utc: string; deleted: boolean; name: string; text: string; mine: boolean };
export type Thread = { comments: Comment[]; signed_in: boolean; moderator: boolean };
export const monthThread = (month: string) => api<Thread>(`/api/competitions/comments?month=${encodeURIComponent(month)}`);
export const monthComment = (month: string, text: string, parent_id: string | null) => api<Comment>("/api/competitions/comments", { method: "POST", body: { month, text, parent_id } });
export const removeComment = (id: string) => api<{ deleted: boolean }>(`/api/opinion/comments/${encodeURIComponent(id)}`, { method: "DELETE" });

// A name for a line whose member is gone.
export const who = (l: { handle: string }) => l.handle || "Former member";
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
// A day of a month, from its date: "Oct 7", or "October 7".
export const day = (iso: string, long = false) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: long ? "long" : "short", day: "numeric", timeZone: "UTC" });

// Whole percents that add up to 100, as even as they can be: what "equal weights" deals.
export function evenly(n: number): number[] {
  const base = Math.floor(100 / n);
  return Array.from({ length: n }, (_, i) => base + (i < 100 - base * n ? 1 : 0));
}
