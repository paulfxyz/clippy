/**
 * @file LanguageSwitcher.tsx
 * @description Language selector component for Clippy v3.0.0.
 *
 * OVERVIEW
 * --------
 * Renders a compact flag + native name button that opens a dropdown grid of
 * all 17 supported locales. Selecting a locale calls `setLocale()` from the
 * i18n context, persists the choice to localStorage, and applies the correct
 * `dir` attribute to `<html>` for RTL languages (Arabic, Hebrew).
 *
 * DESIGN
 * ------
 * - The trigger shows just the flag emoji + native name abbreviation (first 8 chars)
 *   to keep the nav bar compact.
 * - The dropdown is a 4-column grid of flag + native name tiles.
 * - Active locale is highlighted with the primary colour.
 * - Closes on outside click (via a useEffect with document event listener).
 * - RTL note: the dropdown itself always opens LTR (language names are always
 *   readable left-to-right even in RTL contexts).
 *
 * ACCESSIBILITY
 * -------------
 * - The trigger has aria-label and aria-expanded.
 * - The dropdown items are <button> elements (keyboard navigable).
 * - role="listbox" on the grid container.
 */

import { useRef, useState, useEffect } from "react";
import { useI18n, SUPPORTED_LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Language switcher button + dropdown.
 * Designed to sit in the top nav bar alongside the GitHub link.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Current locale info (flag + native name)
  const current = SUPPORTED_LOCALES.find(l => l.code === locale) ?? SUPPORTED_LOCALES[0];

  // Close dropdown when clicking outside the component
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" dir="ltr">
      {/* ------------------------------------------------------------------ */}
      {/* Trigger button                                                       */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t("lang.select")}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded text-sm
          text-muted-foreground hover:text-foreground hover:bg-muted/60
          transition-colors select-none
          ${open ? "bg-muted/60 text-foreground" : ""}
        `}
      >
        {/* Flag emoji */}
        <span className="text-base leading-none" aria-hidden="true">
          {current.flag}
        </span>
        {/* Abbreviated native name — truncated at 8 chars for nav bar fit */}
        <span className="hidden sm:inline text-xs">
          {current.nativeName.slice(0, 8)}
        </span>
        {/* Chevron indicator */}
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Dropdown panel                                                       */}
      {/* ------------------------------------------------------------------ */}
      {open && (
        <div
          role="listbox"
          aria-label={t("lang.select")}
          className={`
            absolute z-50 mt-1 p-2
            bg-card border border-border rounded-xl shadow-lg
            grid grid-cols-4 gap-1
            w-64
            ${
              /* Position: open right-aligned to prevent overflow on left side */
              "right-0"
            }
          `}
          style={{ minWidth: "16rem" }}
        >
          {SUPPORTED_LOCALES.map(loc => {
            const isActive = loc.code === locale;
            return (
              <button
                key={loc.code}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(loc.code)}
                className={`
                  flex flex-col items-center gap-1 px-1 py-2 rounded-lg text-center
                  transition-colors text-xs
                  ${isActive
                    ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary/30"
                    : "hover:bg-muted/60 text-foreground"
                  }
                `}
                title={loc.nativeName}
              >
                <span className="text-xl leading-none">{loc.flag}</span>
                <span className="leading-tight truncate w-full text-center" style={{ fontSize: "0.65rem" }}>
                  {loc.nativeName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
