import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getQuote, getStockProfile, getStockMetrics } from '@/lib/actions/finnhub.actions';
import { formatChangePercent, formatMarketCapValue, formatPrice } from '@/lib/utils';

// Finnhub's free tier allows 60 requests/minute and each row costs three
// endpoints, so rows are enriched in small batches rather than all at once.
// The per-row Promise.all below is intentional: it only ever runs three
// requests for a single symbol.
const ENRICHMENT_BATCH_SIZE = 4;

// Better Auth stores users in the "user" collection
async function getUserIdByEmail(email: string): Promise<string | null> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not found');

  const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
  if (!user) return null;

  return (user.id as string) || String(user._id || '') || null;
}

async function getWatchlistRows(userId: string): Promise<Pick<StockWithData, 'userId' | 'symbol' | 'company' | 'addedAt'>[]> {
  const rows = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
  return rows.map((row) => ({
    userId: String(row.userId),
    symbol: String(row.symbol),
    company: row.company,
    addedAt: row.addedAt,
  }));
}

async function enrichRow(row: Pick<StockWithData, 'userId' | 'symbol' | 'company' | 'addedAt'>): Promise<StockWithData> {
  const [quote, profile, metrics] = await Promise.all([
    getQuote(row.symbol),
    getStockProfile(row.symbol),
    getStockMetrics(row.symbol),
  ]);

  const currentPrice = typeof quote.c === 'number' ? quote.c : undefined;
  const changePercent = typeof quote.dp === 'number' ? quote.dp : undefined;
  // Finnhub reports market capitalisation in millions of USD
  const marketCapUsd = profile.marketCapitalization ? profile.marketCapitalization * 1e6 : undefined;
  const pe = metrics.metric?.peBasicExclExtraTTM ?? metrics.metric?.peTTM;

  return {
    ...row,
    company: profile.name || row.company,
    currentPrice,
    changePercent,
    priceFormatted: currentPrice !== undefined ? formatPrice(currentPrice) : 'N/A',
    changeFormatted: changePercent !== undefined ? formatChangePercent(changePercent) : 'N/A',
    marketCap: marketCapUsd !== undefined ? formatMarketCapValue(marketCapUsd) : 'N/A',
    peRatio: pe !== undefined && Number.isFinite(pe) ? pe.toFixed(2) : 'N/A',
  };
}

async function mapInBatches<T, R>(items: T[], batchSize: number, map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    results.push(...(await Promise.all(items.slice(i, i + batchSize).map(map))));
  }
  return results;
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistSymbolsByUserId(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByUserId error:', err);
    return [];
  }
}

export async function getWatchlistByUserId(userId: string): Promise<StockWithData[]> {
  if (!userId) return [];

  let rows: Pick<StockWithData, 'userId' | 'symbol' | 'company' | 'addedAt'>[];
  try {
    rows = await getWatchlistRows(userId);
  } catch (err) {
    console.error('getWatchlistByUserId error:', err);
    return [];
  }

  return mapInBatches(rows, ENRICHMENT_BATCH_SIZE, enrichRow);
}
