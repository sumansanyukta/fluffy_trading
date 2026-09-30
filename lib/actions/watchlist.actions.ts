import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getQuote, getStockProfile, getStockMetrics } from '@/lib/actions/finnhub.actions';
import { formatChangePercent, formatMarketCapValue, formatPrice } from '@/lib/utils';

// Better Auth stores users in the "user" collection
async function getUserIdByEmail(email: string): Promise<string | null> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not found');

  const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
  if (!user) return null;

  return (user.id as string) || String(user._id || '') || null;
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

export async function getWatchlistByEmail(email: string): Promise<StockWithData[]> {
  if (!email) return [];

  let userId: string | null;
  try {
    userId = await getUserIdByEmail(email);
  } catch (err) {
    console.error('getWatchlistByEmail error:', err);
    return [];
  }
  if (!userId) return [];

  let items: Pick<StockWithData, 'userId' | 'symbol' | 'company' | 'addedAt'>[];
  try {
    const rows = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
    items = rows.map((row) => ({
      userId: String(row.userId),
      symbol: String(row.symbol),
      company: row.company,
      addedAt: row.addedAt,
    }));
  } catch (err) {
    console.error('getWatchlistByEmail error:', err);
    return [];
  }

  return Promise.all(
    items.map(async (item): Promise<StockWithData> => {
      const [quote, profile, metrics] = await Promise.all([
        getQuote(item.symbol),
        getStockProfile(item.symbol),
        getStockMetrics(item.symbol),
      ]);

      const currentPrice = typeof quote.c === 'number' ? quote.c : undefined;
      const changePercent = typeof quote.dp === 'number' ? quote.dp : undefined;
      // Finnhub reports market capitalisation in millions of USD
      const marketCapUsd = profile.marketCapitalization
        ? profile.marketCapitalization * 1e6
        : undefined;
      const pe = metrics.metric?.peBasicExclExtraTTM ?? metrics.metric?.peTTM;

      return {
        ...item,
        company: profile.name || item.company,
        currentPrice,
        changePercent,
        priceFormatted: currentPrice !== undefined ? formatPrice(currentPrice) : 'N/A',
        changeFormatted: changePercent !== undefined ? formatChangePercent(changePercent) : 'N/A',
        marketCap: marketCapUsd !== undefined ? formatMarketCapValue(marketCapUsd) : 'N/A',
        peRatio: pe !== undefined && Number.isFinite(pe) ? pe.toFixed(2) : 'N/A',
      };
    })
  );
}
