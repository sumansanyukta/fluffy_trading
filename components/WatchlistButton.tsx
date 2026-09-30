'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist-toggle.actions';

const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist,
    showTrashIcon = true,
    type = 'button',
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const router = useRouter();
    const [isAdded, setIsAdded] = useState(isInWatchlist);
    const [isPending, setIsPending] = useState(false);

    const handleToggle = async () => {
        const nextIsAdded = !isAdded;
        setIsAdded(nextIsAdded);
        setIsPending(true);

        const result = nextIsAdded
            ? await addToWatchlist(symbol, company)
            : await removeFromWatchlist(symbol);

        setIsPending(false);

        if (!result.success) {
            setIsAdded(!nextIsAdded);
            toast.error(result.error ?? 'Something went wrong. Please try again.');
            return;
        }

        toast.success(
            nextIsAdded
                ? `${symbol} added to your watchlist`
                : `${symbol} removed from your watchlist`
        );

        onWatchlistChange?.(symbol, nextIsAdded);
        router.refresh();
    };

    if (type === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                aria-label={isAdded ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                aria-pressed={isAdded}
                disabled={isPending}
                onClick={handleToggle}
                className="text-gray-500 hover:text-yellow-500"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isAdded && showTrashIcon ? (
                    <Trash2 className="h-4 w-4" />
                ) : (
                    <Star className={`h-4 w-4 ${isAdded ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                )}
            </Button>
        );
    }

    return (
        <Button
            variant={isAdded ? 'outline' : 'default'}
            disabled={isPending}
            onClick={handleToggle}
            className="w-full gap-2 text-base font-medium"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAdded && showTrashIcon ? (
                <Trash2 className="h-4 w-4" />
            ) : (
                <Star className={`h-4 w-4 ${isAdded ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            )}
            {isAdded ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
    );
}

export default WatchlistButton;
