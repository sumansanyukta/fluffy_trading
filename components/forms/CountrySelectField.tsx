'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import countryList from 'react-select-country-list';

const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const CountrySelect = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const countries = useMemo(() => countryList().getData(), []);

    const filteredCountries = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.value.toLowerCase().includes(q)
        );
    }, [countries, query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCountry = countries.find((c) => c.value === value);

    return (
        <div ref={containerRef} className="relative">
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpen((prev) => !prev)}
                className="country-select-trigger"
            >
                {selectedCountry ? (
                    <span className="flex items-center gap-2">
                        <span>{getFlagEmoji(selectedCountry.value)}</span>
                        <span>{selectedCountry.label}</span>
                    </span>
                ) : (
                    'Select your country...'
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-xl">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            role="searchbox"
                            placeholder="Search countries..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="country-select-input w-full border-b border-gray-600 px-3 py-2 pl-9 outline-none"
                        />
                    </div>

                    <ul role="listbox" className="max-h-60 overflow-y-auto p-1 scrollbar-hide-default">
                        {filteredCountries.length === 0 ? (
                            <li className="country-select-empty">No country found.</li>
                        ) : (
                            filteredCountries.map((country) => (
                                <li key={country.value}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={value === country.value}
                                        onClick={() => {
                                            onChange(country.value);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className={cn(
                                            'country-select-item flex w-full items-center gap-2 text-left',
                                            value === country.value && 'bg-gray-600'
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                'h-4 w-4 shrink-0 text-yellow-500',
                                                value === country.value ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <span className="flex items-center gap-2">
                                            <span>{getFlagEmoji(country.value)}</span>
                                            <span>{country.label}</span>
                                        </span>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const CountrySelectField = ({
    name,
    label,
    control,
    error,
    required = false,
}: CountrySelectProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>
            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `Please select ${label.toLowerCase()}` : false,
                }}
                render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} />
                )}
            />
            {error && <p className="text-sm text-red-500">{error.message}</p>}
            <p className="text-xs text-gray-500">
                Helps us show market data and news relevant to you.
            </p>
        </div>
    );
};

export default CountrySelectField;