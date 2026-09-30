import { headers } from 'next/headers';
import TradingViewWidget from '@/components/TradingViewWidget';
import WatchlistButton from '@/components/WatchlistButton';
import { auth } from '@/lib/better-auth/auth';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from '@/lib/constants';

const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const ticker = decodeURIComponent(symbol).toUpperCase();
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const [session, stocks] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        searchStocks(ticker),
    ]);

    const watchlistSymbols = session?.user?.email
        ? await getWatchlistSymbolsByEmail(session.user.email)
        : [];
    const isInWatchlist = watchlistSymbols.includes(ticker);
    const company = stocks.find((stock) => stock.symbol === ticker)?.name ?? ticker;

    return (
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-8">
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}symbol-info.js`}
                    config={SYMBOL_INFO_WIDGET_CONFIG(ticker)}
                    height={170}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={CANDLE_CHART_WIDGET_CONFIG(ticker)}
                    height={600}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={BASELINE_WIDGET_CONFIG(ticker)}
                    height={600}
                />
            </div>
            <div className="flex flex-col gap-8">
                <WatchlistButton
                    symbol={ticker}
                    company={company}
                    isInWatchlist={isInWatchlist}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}technical-analysis.js`}
                    config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(ticker)}
                    height={400}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}symbol-profile.js`}
                    config={COMPANY_PROFILE_WIDGET_CONFIG(ticker)}
                    height={440}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}financials.js`}
                    config={COMPANY_FINANCIALS_WIDGET_CONFIG(ticker)}
                    height={464}
                />
            </div>
        </div>
    );
}

export default StockDetails;
