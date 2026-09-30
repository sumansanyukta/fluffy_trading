'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import { getChangeColorClass } from '@/lib/utils';
import { removeFromWatchlist } from '@/lib/actions/watchlist-toggle.actions';

// The alert column is not rendered yet - there is no alerts store to read from.
const HEADERS = WATCHLIST_TABLE_HEADER.filter((header) => header !== 'Alert');
const WIDE_ONLY_HEADERS = new Set(['Market Cap', 'P/E Ratio']);

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
    const router = useRouter();
    const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);

    const handleRemove = async (event: React.MouseEvent, symbol: string) => {
        event.stopPropagation();
        setPendingSymbol(symbol);

        const result = await removeFromWatchlist(symbol);
        setPendingSymbol(null);

        if (!result.success) {
            toast.error(result.error ?? 'Failed to remove stock from watchlist');
            return;
        }

        toast.success(`${symbol} removed from your watchlist`);
        router.refresh();
    };

    return (
        <div className="overflow-x-auto">
            <table className="watchlist-table">
                <thead>
                    <tr className="table-header-row">
                        {HEADERS.map((header) => (
                            <th
                                key={header}
                                className={`px-4 py-3 font-medium ${WIDE_ONLY_HEADERS.has(header) ? 'hidden md:table-cell' : ''}`}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {watchlist.map((stock) => (
                        <tr
                            key={stock.symbol}
                            className="table-row"
                            onClick={() => router.push(`/stocks/${stock.symbol}`)}
                        >
                            <td className="table-cell px-4 py-3">
                                <Link
                                    href={`/stocks/${stock.symbol}`}
                                    onClick={(event) => event.stopPropagation()}
                                    className="transition-colors hover:text-yellow-500"
                                >
                                    {stock.company}
                                </Link>
                            </td>
                            <td className="table-cell px-4 py-3">{stock.symbol}</td>
                            <td className="table-cell px-4 py-3">{stock.priceFormatted ?? 'N/A'}</td>
                            <td className={`table-cell px-4 py-3 ${getChangeColorClass(stock.changePercent)}`}>
                                {stock.changeFormatted ?? 'N/A'}
                            </td>
                            <td className="table-cell hidden px-4 py-3 md:table-cell">{stock.marketCap ?? 'N/A'}</td>
                            <td className="table-cell hidden px-4 py-3 md:table-cell">{stock.peRatio ?? 'N/A'}</td>
                            <td className="table-cell px-4 py-3">
                                <button
                                    type="button"
                                    aria-label={`Remove ${stock.symbol} from watchlist`}
                                    disabled={pendingSymbol !== null}
                                    onClick={(event) => handleRemove(event, stock.symbol)}
                                    className="watchlist-icon-btn flex size-8 items-center justify-center rounded-full bg-gray-700/50"
                                >
                                    {pendingSymbol === stock.symbol ? (
                                        <Loader2 className="trash-icon animate-spin" />
                                    ) : (
                                        <Trash2 className="trash-icon" />
                                    )}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default WatchlistTable;
