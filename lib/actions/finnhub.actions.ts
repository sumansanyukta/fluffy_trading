'use server';

import { cache } from 'react';
import { getDateRange, validateArticle, formatArticle, delay } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

// The free tier allows 60 requests per minute in a fixed window. Responses carry
// `x-ratelimit-remaining` and `x-ratelimit-reset`, so a 429 can be retried at the
// exact moment the window rolls over instead of guessing a backoff.
const RATE_LIMIT_RETRIES = 1;
const RATE_LIMIT_MIN_WAIT_MS = 250;
// Retrying only pays off when the window is about to roll over. If the reset is
// further out than this there is no point holding the render open, so the request
// fails fast and the row degrades to its cached/N.A. values instead.
const RATE_LIMIT_MAX_WAIT_MS = 2_000;

type FinnhubFetchError = Error & {
  status?: number;
  rateLimitResetAt?: number;
};

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const error = new Error(`Fetch failed ${res.status}: ${text}`) as FinnhubFetchError;
    error.status = res.status;
    const reset = res.headers.get('x-ratelimit-reset');
    const resetAt = reset ? Number(reset) * 1000 : NaN;
    if (Number.isFinite(resetAt)) error.rateLimitResetAt = resetAt;
    throw error;
  }
  return (await res.json()) as T;
}

// Milliseconds to wait before retrying a rate limited request, or null when the
// failure should not be retried - either because it was not a 429, or because the
// window is too far from resetting for waiting to be worthwhile.
function getRateLimitWaitMs(error: unknown): number | null {
  const { status, rateLimitResetAt } = (error ?? {}) as FinnhubFetchError;
  if (status !== 429 || rateLimitResetAt === undefined) return null;

  const waitMs = rateLimitResetAt - Date.now();
  if (waitMs > RATE_LIMIT_MAX_WAIT_MS) return null;

  return Math.max(waitMs, RATE_LIMIT_MIN_WAIT_MS);
}

export { fetchJSON };

function getFinnhubToken(): string {
  return process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
}

// Shared by the per-symbol endpoints below. Retries only on 429, and only for as
// long as the reset header says it is worth waiting.
async function fetchSymbolEndpoint<T>(
  endpoint: string,
  symbol: string,
  revalidateSeconds: number
): Promise<T> {
  const token = getFinnhubToken();
  if (!token) {
    console.error(`Finnhub ${endpoint} error:`, new Error('FINNHUB API key is not configured'));
    return {} as T;
  }

  const url = `${FINNHUB_BASE_URL}/${endpoint}?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${token}`;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchJSON<T>(url, revalidateSeconds);
    } catch (e) {
      const waitMs = getRateLimitWaitMs(e);
      if (waitMs === null || attempt >= RATE_LIMIT_RETRIES) throw e;
      console.warn(`Finnhub ${endpoint} rate limited for ${symbol}, retrying in ${waitMs}ms`);
      await delay(waitMs);
    }
  }
}

export async function getQuote(symbol: string): Promise<QuoteData> {
  try {
    return await fetchSymbolEndpoint<QuoteData>('quote', symbol, 120);
  } catch (e) {
    console.error('Error fetching quote for', symbol, e);
    return {};
  }
}

export async function getStockProfile(symbol: string): Promise<ProfileData> {
  try {
    return await fetchSymbolEndpoint<ProfileData>('stock/profile2', symbol, 3600);
  } catch (e) {
    console.error('Error fetching profile for', symbol, e);
    return {};
  }
}

export async function getStockMetrics(symbol: string): Promise<FinancialsData> {
  try {
    return await fetchSymbolEndpoint<FinancialsData>('stock/metric', symbol, 3600);
  } catch (e) {
    console.error('Error fetching metrics for', symbol, e);
    return {};
  }
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];
    let exchanges: Map<string, string | undefined> | undefined;

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<{ name?: string; ticker?: string; exchange?: string }>(url, 3600);
            return { sym, profile };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null };
          }
        })
      );

      exchanges = new Map(profiles.map(({ sym, profile }) => [sym.toUpperCase(), profile?.exchange]));

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = exchanges?.get(upper);
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});
