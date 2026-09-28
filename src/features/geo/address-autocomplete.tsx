"use client";

import { useEffect, useId, useState } from "react";
import { suggestAddresses, type MapboxSuggestResult } from "@/features/geo/mapbox-suggest";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#e82142] focus:ring-2 focus:ring-[#e82142]/10";

export type AddressValue = {
  address: string;
  lat: number | null;
  lng: number | null;
};

export function AddressAutocomplete({
  label,
  namePrefix,
  placeholder,
  initial,
  required = true,
  searchUnavailableHint,
}: {
  label: string;
  namePrefix: string;
  placeholder: string;
  initial?: AddressValue;
  required?: boolean;
  searchUnavailableHint?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState(initial?.address ?? "");
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [suggestions, setSuggestions] = useState<MapboxSuggestResult[]>([]);
  const [searchAvailable, setSearchAvailable] = useState(true);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
    if (!token) {
      const timer = window.setTimeout(() => {
        setSearchAvailable(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (query.trim().length < 3) {
      const clearTimer = window.setTimeout(() => {
        setSuggestions([]);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void suggestAddresses(query, { signal: controller.signal })
        .then((results) => {
          setSuggestions(results);
          setSearchAvailable(true);
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="min-w-0">
      <label htmlFor={`${listId}-input`} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={`${listId}-input`}
        name={`${namePrefix}Address`}
        type="text"
        required={required}
        autoComplete="street-address"
        value={query}
        placeholder={placeholder}
        className={fieldClass}
        list={suggestions.length > 0 ? listId : undefined}
        onChange={(event) => {
          setQuery(event.target.value);
          setLat(null);
          setLng(null);
        }}
        onBlur={() => {
          const match = suggestions.find((item) => item.placeName === query);
          if (match) {
            setLat(match.lat);
            setLng(match.lng);
          }
        }}
      />
      {suggestions.length > 0 ? (
        <datalist id={listId}>
          {suggestions.map((item) => (
            <option key={item.id} value={item.placeName} />
          ))}
        </datalist>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.slice(0, 3).map((item) => (
          <button
            key={item.id}
            type="button"
            className="cursor-pointer rounded-lg border border-border px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            onClick={() => {
              setQuery(item.placeName);
              setLat(item.lat);
              setLng(item.lng);
              setSuggestions([]);
            }}
          >
            {item.placeName}
          </button>
        ))}
      </div>
      {!searchAvailable && searchUnavailableHint ? (
        <p className="mt-2 text-xs text-muted-foreground">{searchUnavailableHint}</p>
      ) : null}
      <input type="hidden" name={`${namePrefix}Lat`} value={lat ?? ""} />
      <input type="hidden" name={`${namePrefix}Lng`} value={lng ?? ""} />
    </div>
  );
}
