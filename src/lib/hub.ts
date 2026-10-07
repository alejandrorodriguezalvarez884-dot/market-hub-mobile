// What the screens of My Hub share: the portfolio's figures, and a stock's page on the portal.
import { openBrowserAsync } from "expo-web-browser";

import { SITE, api } from "./api";
import type { Dashboard } from "./types";

export const getDashboard = () => api<Dashboard>("/api/dashboard");
// A stock's page on the portal: its chart, its figures and its news.
export const openQuote = (ticker: string) => void openBrowserAsync(`${SITE}/quote/?t=${encodeURIComponent(ticker)}`);
export const openPage = (address: string) => void openBrowserAsync(address);
