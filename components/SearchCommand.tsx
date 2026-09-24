"use client"

import { useEffect, useState, useRef } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList, CommandGroup, CommandItem } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2, Star, TrendingUp} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/useDebounce";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks ?? []);
  const latestQueryRef = useRef("");
  const router = useRouter();

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSearch = async () => {
    const query = searchTerm.trim();
    latestQueryRef.current = query;
    if(!isSearchMode) return setStocks(initialStocks ?? []);

    setLoading(true)
    try {
        const results = await searchStocks(query);
        if (latestQueryRef.current === query) {
            setStocks(results);
        }
    } catch {
        if (latestQueryRef.current === query) {
            setStocks([])
        }
    } finally {
        if (latestQueryRef.current === query) {
            setLoading(false)
        }
    }
  }

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, debouncedSearch]);

  const handleSelectStock = (symbol?: string) => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks ?? []);
    if (symbol) {
        router.push(`/stocks/${symbol}`);
    }
  }

  return (
    <>
      {renderAs === 'text' ? (
          <span onClick={() => setOpen(true)} className="search-text">
            {label}
          </span>
      ): (
          <Button onClick={() => setOpen(true)} className="search-btn">
            {label}
          </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field">
          <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
              <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
          ) : displayStocks?.length === 0 ? (
              <CommandEmpty className="search-list-indicator">
                {isSearchMode ? 'No results found' : 'No stocks available'}
              </CommandEmpty>
            ) : (
            <CommandGroup heading={`${isSearchMode ? 'Search results' : 'Popular stocks'} (${displayStocks?.length || 0})`}>
              {displayStocks?.map((stock) => (
                  <CommandItem
                      key={stock.symbol}
                      value={stock.symbol}
                      onSelect={() => handleSelectStock(stock.symbol)}
                      className="search-item"
                  >
                    <Link
                        href={`/stocks/${stock.symbol}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleSelectStock(stock.symbol);
                        }}
                        className="search-item-link"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <div  className="flex-1">
                        <div className="search-item-name">
                          {stock.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} | {stock.exchange } | {stock.type}
                        </div>
                      </div>
                    <Star className={`h-4 w-4 shrink-0 ${
                          stock.isInWatchlist ? 'fill-yellow-500 text-yellow-500' : 'text-gray-500'
                      }`} />
                    </Link>
                  </CommandItem>
              ))}
            </CommandGroup>
          )
          }
        </CommandList>
      </CommandDialog>
    </>
  )
}