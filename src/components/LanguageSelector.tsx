"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n/config";
import { Globe, ChevronDown, Check } from "lucide-react";

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export default function LanguageSelector({ className = "", compact = false }: LanguageSelectorProps) {
  const { language, meta, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--light-sage)] bg-white hover:bg-[var(--sage)] transition-colors shadow-xs text-xs font-bold text-[var(--charcoal)]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Select Language / भाषा निवडा / भाषा चुनें"
      >
        <Globe className="w-3.5 h-3.5 text-[var(--forest)]" />
        <span className="font-semibold tracking-tight">
          {compact ? meta.code.toUpperCase() : meta.nativeName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[var(--slate)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-white border border-[var(--light-sage)] rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in py-1.5 max-h-[380px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-[var(--light-sage)]/60 bg-[var(--cream)]/60">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--slate)]">
              Select Language / भाषा
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left ${
                    isSelected
                      ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                      : "text-[var(--charcoal)] hover:bg-[var(--cream)] hover:text-[var(--forest)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div>
                      <p className="font-bold text-xs">{lang.nativeName}</p>
                      <p className="text-[10px] text-[var(--slate)] font-medium">{lang.name}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[var(--forest)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
