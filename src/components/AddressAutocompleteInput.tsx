/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Address Autocomplete Input
*/
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";

function AddressAutocompleteInput({
  id = "address",
  name = "address",
  placeholder = "Ej: Calle 45 #8-14",
  lang = "es",
  limit = 5,
  biasLat = 4.711,
  biasLon = -74.0721,
}: {
  id?: string;
  name?: string;
  placeholder?: string;
  lang?: string;
  limit?: number;
  biasLat?: number;
  biasLon?: number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<
    { label: string; lat?: number; lon?: number; raw?: any }[]
  >([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{ lat: string; lon: string }>({
    lat: "",
    lon: "",
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const debouncedSearch = useMemo(() => {
    let timer: any;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!value || value.trim().length < 3) {
          setHits([]);
          setOpen(false);
          return;
        }
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);

        const safeLang = ["default", "en", "de", "fr"].includes(lang)
          ? lang
          : "default";
        const boostColombia = (txt: string) => {
          const low = txt.toLowerCase();
          if (
            !low.includes("colombia") &&
            !low.includes("bogotá") &&
            !low.includes("bogota")
          ) {
            return `${txt}, Colombia`;
          }
          return txt;
        };

        try {
          const pUrl = new URL("https://photon.komoot.io/api/");
          pUrl.searchParams.set("q", boostColombia(value));
          pUrl.searchParams.set("limit", String(limit));
          pUrl.searchParams.set("lang", safeLang);
          pUrl.searchParams.set("lat", String(biasLat));
          pUrl.searchParams.set("lon", String(biasLon));

          const res = await fetch(pUrl.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("[Photon] HTTP", res.status, res.statusText, txt);
            throw new Error(`Photon ${res.status}`);
          }

          const data = await res.json();
          const mapped =
            (data.features ?? []).map((f: any) => {
              const p = f.properties ?? {};
              const c = f.geometry?.coordinates ?? [];
              const label = buildLabel(p);
              return { label, lat: c[1], lon: c[0], raw: f };
            }) ?? [];

          setHits(mapped);
          setOpen(mapped.length > 0);
          setActiveIndex(-1);
        } catch (err: any) {
          if (err?.name === "AbortError") return;

          console.warn(
            "[Photon] fallo, probando fallback Nominatim…",
            err?.message
          );

          try {
            const nUrl = new URL("https://nominatim.openstreetmap.org/search");
            nUrl.searchParams.set("q", value);
            nUrl.searchParams.set("format", "json");
            nUrl.searchParams.set("limit", String(limit));
            nUrl.searchParams.set("accept-language", "es");

            const nRes = await fetch(nUrl.toString(), {
              signal: controller.signal,
              headers: { Accept: "application/json" },
            });
            if (!nRes.ok) {
              const txt = await nRes.text().catch(() => "");
              console.error(
                "[Nominatim] HTTP",
                nRes.status,
                nRes.statusText,
                txt
              );
              setHits([]);
              setOpen(false);
              return;
            }
            const nData = await nRes.json();
            const mapped = (nData ?? []).map((r: any) => ({
              label: r.display_name,
              lat: r.lat ? Number(r.lat) : undefined,
              lon: r.lon ? Number(r.lon) : undefined,
              raw: r,
            }));
            setHits(mapped);
            setOpen(mapped.length > 0);
            setActiveIndex(-1);
          } catch (e) {
            console.error("[Fallback Nominatim] error:", e);
            setHits([]);
            setOpen(false);
          }
        } finally {
          setLoading(false);
        }
      }, 300);
    };
  }, [lang, limit, biasLat, biasLon]);

  function buildLabel(p: any) {
    const parts = [
      [p.name || "", p.housenumber || ""].filter(Boolean).join(" "),
      p.street,
      p.suburb,
      p.city || p.town || p.village,
      p.state,
      p.country,
    ].filter(Boolean);
    const dedup = parts.filter((x, i, arr) => x && x !== arr[i - 1]);
    return dedup.join(", ");
  }

  const choose = (place: { label: string; lat?: number; lon?: number }) => {
    setQuery(place.label);
    setCoords({
      lat: place.lat != null ? String(place.lat) : "",
      lon: place.lon != null ? String(place.lon) : "",
    });
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={rootRef}>
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < hits.length) {
              e.preventDefault();
              choose(hits[activeIndex]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        style={{ width: "100%" }}
      />

      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 50,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 260,
            overflowY: "auto",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            marginTop: 6,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {loading && (
            <li style={{ padding: "8px 12px", fontSize: 13, color: "#666" }}>
              Buscando…
            </li>
          )}
          {!loading && hits.length === 0 && (
            <li style={{ padding: "8px 12px", fontSize: 13, color: "#666" }}>
              Sin resultados
            </li>
          )}
          {!loading &&
            hits.map((h, i) => (
              <li
                key={`${h.lat}-${h.lon}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(h)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: i === activeIndex ? "#f5f5f5" : "white",
                }}
              >
                <div style={{ fontSize: 14 }}>{h.label}</div>
                {h.lat != null && h.lon != null && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {h.lat.toFixed(6)}, {h.lon.toFixed(6)}
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}

      <input type="hidden" name="lat" value={coords.lat} />
      <input type="hidden" name="lon" value={coords.lon} />
    </div>
  );
}

export default AddressAutocompleteInput;
