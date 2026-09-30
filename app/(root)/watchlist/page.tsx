import { headers } from 'next/headers';
import Link from 'next/link';
import { Star } from 'lucide-react';
import WatchlistTable from '@/components/WatchlistTable';
import { auth } from '@/lib/better-auth/auth';
import { getWatchlistByEmail } from '@/lib/actions/watchlist.actions';

const Watchlist = async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email ?? '';
    const watchlist = email ? await getWatchlistByEmail(email) : [];

    if (watchlist.length === 0) {
        return (
            <div className="watchlist-empty flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Star className="watchlist-star h-16 w-16 text-gray-500" />
                <h1 className="empty-title text-xl font-semibold text-gray-400">Your watchlist is empty</h1>
                <p className="empty-description max-w-md text-gray-500">
                    Search for a stock and add it to your watchlist to track it here.
                </p>
                <Link
                    href="/"
                    className="mt-2 rounded-lg bg-yellow-500 px-5 py-2.5 font-semibold text-gray-900 transition-colors hover:bg-yellow-400"
                >
                    Browse stocks
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="watchlist-title text-xl font-bold text-gray-100 md:text-2xl">
                My Watchlist
                <span className="ml-3 text-base font-medium text-gray-500">
                    ({watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'})
                </span>
            </h1>
            <WatchlistTable watchlist={watchlist} />
        </div>
    );
}

export default Watchlist;
