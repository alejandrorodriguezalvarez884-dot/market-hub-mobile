// The tools of My Hub: Fundamentals Lab, the Earnings Radar, Peer Map and the Playground. Each is
// a site of its own, which the app opens inside itself, signed in. The portal says where each is
// (/api/config); one it does not name is not listed.
import { API, api } from "./api";
import type { IconName } from "@/components/marks";

export type ToolKey = "fundamentals_lab" | "earnings_radar" | "peer_map" | "playground";
export type Tools = Partial<Record<ToolKey, string | null>>;

// In the order of the site's own navigation.
export const TOOLS: { key: ToolKey; icon: IconName; title: string; note: string }[] = [
  { key: "fundamentals_lab", icon: "tools", title: "Fundamentals Lab", note: "Every number of a company: statements, valuation history, forward multiples, technicals and comparison" },
  { key: "earnings_radar", icon: "earnings", title: "Earnings Radar", note: "What a company's latest results release says: guidance, demand, margins and themes" },
  { key: "peer_map", icon: "peers", title: "Peer Map", note: "A company next to its peers" },
  { key: "playground", icon: "playground", title: "Playground", note: "A board of charts and tables, put together by asking for it" },
];

export const getTools = () => api<{ tools: Tools }>("/api/config").then((c) => c.tools);

// Where the app's own page starts: the portal takes the app's token there, in the header of that
// one request, sets the session cookie the tools ask for and goes on to the tool
// (market-hub-landing/src/markethub/appweb.py).
export const ENTER = `${API}/api/app/web/enter`;
export const entering = (tool: string) => `${ENTER}?to=${encodeURIComponent(`${tool}/`)}`;

// The start of an address, to its first slash: what a page of the tool begins with.
export const origin = (address: string) => /^https?:\/\/[^/]+/.exec(address)?.[0] ?? "";
