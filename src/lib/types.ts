// Copied from the portal's site (market-hub-landing/site/src/lib/types.ts and api.ts): what the
// portal's API answers. A change there is made here too.
// What /api/dashboard returns (see src/markethub/dashboard.py).
export type N = number | null;
type Facts = { return_1m: N; return_3m: N; return_ytd: N; return_1y: N; spark: number[] };
export type Row = Facts & {
  ticker: string; name: string; sector: string; country: string; shares: number; avg_cost: N; price: N; value: N; cost: N;
  pnl: N; pnl_pct: N; day_change: N; day_change_pct: N; weight: N; day_contribution: N; beta: N; volatility: N; volatility_group: string;
  market_cap: N; size: string; dividend_yield: N; from_high_52w: N;
};
export type Watch = Facts & { ticker: string; name: string; price: N; day_change_pct: N; from_high_52w: N; year_low: N; year_high: N };
// The positions gathered by something they share: a sector, a country, how much they move, their size.
export type Group = { label: string; value: number; weight: number; count: number; tickers: string[]; day_change_pct: N; volatility: N;
  return_1m: N; return_3m: N; return_ytd: N; return_1y: N };
export type Grouping = { key: string; label: string; note?: string; items: Group[] };
export type PeriodKey = "1d" | "1m" | "3m" | "ytd" | "1y";
export type Period = { key: PeriodKey; label: string; portfolio: N; indices: Record<string, N> };
export type Index = Facts & { ticker: string; name: string; price: N; day_change_pct: N };
export type Day = { date: string; return: number };
export type Risk = { volatility: N; beta: N; benchmark_volatility: N; max_drawdown: N; best_day: Day | null; worst_day: Day | null; up_days: N;
  top1: N; top3: N; top3_tickers: string[]; effective_positions: N; dividend_yield: N };
// The portfolio read back in sentences: by the code at once, by the model when it answers.
export type Insights = { headline: string; items: { kind: string; text: string }[]; written: boolean };
export type Dashboard = {
  sample: boolean;
  totals: { value: N; cost: N; pnl: N; pnl_pct: N; day_change: N; day_change_pct: N; positions: number; cost_covers: number };
  positions: Row[];
  sectors: { sector: string; value: number; weight: number }[];
  groups: Grouping[];
  history: { dates: string[]; value: number[]; portfolio_rebased: number[]; benchmark_rebased: number[]; benchmark?: string; indices: Record<string, number[]> };
  performance: { periods: Period[]; indices: { ticker: string; name: string }[] };
  risk: Risk;
  watchlist: Watch[];
  movers: { up: string[]; down: string[] };
  benchmark: Index;
  indices: Index[];
  insights: Insights;
  notes: string[];
};

// What /api/community returns (see src/markethub/community.py).
export type Returns = Record<PeriodKey, N>;
export type Member = { handle: string; since_utc: string | null; you: boolean; stand_in: boolean; sample: boolean; count: number; top_sector: string | null;
  positions: { ticker: string; name: string; sector: string; weight: number }[]; performance: Returns; volatility: N; updated_utc: string };
export type Standing = { rank: number; of: number; return: number; average: number; above_average: boolean; ahead_of: number };
export type Board = {
  members: Member[]; average: Returns; sample: boolean; shared: number;
  you: { sharing: boolean; handle: string; since_utc: string | null; performance: Returns | null; standing: Record<PeriodKey, Standing | null> };
  periods: { key: PeriodKey; label: string }[];
  indices: { ticker: string; name: string; performance: Returns }[];
};
export type Sharing = { enabled: boolean; handle: string; since_utc: string | null };

// What /api/news/mine returns (the site's lib/market.ts): the news desk's items about the user's stocks.
export type NewsItem = {
  id: string; category: string; title: string; summary: string; tickers: string[]; source: string; published_utc: string;
  url?: string; // the document or the article
  layer?: "official" | "market" | "press";
  sentiment?: "bullish" | "bearish" | "neutral" | null; // how the news reads; null when nobody has said
  scope?: string | null; // the sector it touches, or "Macro"
};
export type News = { sample: boolean; items: NewsItem[]; refreshed_utc: string | null;
  stale: boolean }; // older than the desk allows: whoever shows it asks for a refresh

// `provider` says how the account signs in: with Google, with Apple, or with a password kept by the portal.
export type User = { id: string; email: string; name: string; picture: string; provider?: "google" | "password" | "apple" };
export type Position = { ticker: string; shares: number; avg_cost: number | null };
export type Portfolio = { positions: Position[]; watchlist: string[]; updated_utc?: string };
export type Company = { ticker: string; name: string; kind?: string }; // kind: "ETF" or "Mutual fund", for a fund

// The rest of a stock's or a fund's page (/api/public/quote/more; the site's lib/market.ts): its
// past against the S&P 500 and, for a company or a fund, what the provider says of it. Every
// figure may be null.
type F = number | null;
export type QuoteDay = { date: string; return: number };
export type Fall = { depth: number; peak: string; trough: string };
export type History = {
  benchmark: string | null; dates: string[]; closes: number[]; benchmark_closes: (number | null)[] | null;
  years: { year: number; return: F; benchmark: F; partial: boolean }[];
  risk: { volatility_1y: F; benchmark_volatility_1y: F; beta_1y: F; up_days_1y: F; best_day: QuoteDay | null; worst_day: QuoteDay | null;
          max_drawdown: Fall | null; benchmark_max_drawdown: Fall | null };
};
export type QuotePeriod = { end: string; revenue: F; gross_profit: F; operating_income: F; net_income: F; eps: F };
export type CompanyFacts = {
  summary: string; sector: string; industry: string; employees: F; website: string; city: string; state: string; country: string;
  valuation: { pe: F; forward_pe: F; ps: F; pb: F; ev_ebitda: F; ev_revenue: F; enterprise_value: F };
  profitability: { gross_margin: F; operating_margin: F; net_margin: F; roe: F; roa: F };
  growth: { revenue: F; earnings: F };
  health: { revenue: F; ebitda: F; free_cash_flow: F; cash: F; debt: F; debt_to_equity: F; current_ratio: F };
  ownership: { insiders: F; institutions: F; short_of_float: F; shares: F; float: F };
  dividends: { rate: F; payout_ratio: F; ex_date: string | null; five_year_avg_yield: F };
  next_results: string | null;
};
export type Weight = { name: string; weight: number };
export type Fund = {
  summary: string; legal_type: string; family: string; category: string; expense_ratio: F; assets: F; yield: F; nav: F;
  inception: string | null; beta_3y: F; return_3y: F; return_5y: F; return_ytd: F;
  holdings: { symbol: string | null; label: string; name: string; weight: number }[]; holdings_weight: F;
  sectors: Weight[]; asset_mix: Weight[];
};
export type QuoteMore = {
  symbol: string; source: string; history: History | null;
  type?: "stock" | "fund";
  company?: CompanyFacts; financials?: { annual: QuotePeriod[]; quarterly: QuotePeriod[] };
  fund_type?: "ETF" | "Mutual fund"; fund?: Fund;
};
