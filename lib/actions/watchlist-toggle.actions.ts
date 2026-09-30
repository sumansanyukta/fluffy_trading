'use server';

import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';

type WatchlistActionResult = { success: boolean; error?: string };

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { id?: string } | undefined;
  return user?.id ?? null;
}

export async function addToWatchlist(symbol: string, company: string): Promise<WatchlistActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const cleanSymbol = (symbol || '').trim().toUpperCase();
  if (!cleanSymbol) return { success: false, error: 'Symbol is required' };

  try {
    await connectToDatabase();
    await Watchlist.updateOne(
      { userId, symbol: cleanSymbol },
      { $setOnInsert: { userId, symbol: cleanSymbol, company: company || cleanSymbol, addedAt: new Date() } },
      { upsert: true }
    );
    return { success: true };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    return { success: false, error: 'Failed to add stock to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string): Promise<WatchlistActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const cleanSymbol = (symbol || '').trim().toUpperCase();
  if (!cleanSymbol) return { success: false, error: 'Symbol is required' };

  try {
    await connectToDatabase();
    await Watchlist.deleteOne({ userId, symbol: cleanSymbol });
    return { success: true };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    return { success: false, error: 'Failed to remove stock from watchlist' };
  }
}
