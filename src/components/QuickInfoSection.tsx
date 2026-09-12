"use client";

import React from "react";
import { 
  ShieldAlert, 
  Phone, 
  Shirt, 
  CalendarDays, 
  CheckCircle2 
} from "lucide-react";

interface QuickInfoProps {
  emergency: { police: string; ambulance: string; helpline: string };
  clothing: string[];
  events: { name: string; type: string; description: string }[];
  season_info: string;
}

export default function QuickInfoSection({ emergency, clothing, events, season_info }: QuickInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Emergency Info */}
      <div className="bg-white border border-[var(--error)]/30 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--error)] flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4" />
          Emergency Contacts
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/15">
            <span className="text-xs font-semibold text-[var(--error)]">Police</span>
            <span className="text-xs font-bold text-[var(--charcoal)] flex items-center gap-1">
              <Phone className="w-3 h-3 text-[var(--error)]" /> {emergency.police}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/15">
            <span className="text-xs font-semibold text-[var(--error)]">Ambulance</span>
            <span className="text-xs font-bold text-[var(--charcoal)] flex items-center gap-1">
              <Phone className="w-3 h-3 text-[var(--error)]" /> {emergency.ambulance}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/15">
            <span className="text-xs font-semibold text-[var(--error)]">Helpline</span>
            <span className="text-xs font-bold text-[var(--charcoal)] flex items-center gap-1">
              <Phone className="w-3 h-3 text-[var(--error)]" /> {emergency.helpline}
            </span>
          </div>
        </div>
      </div>

      {/* Seasonal & Clothing */}
      <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--forest)] flex items-center gap-2 mb-4">
          <Shirt className="w-4 h-4" />
          Packing & Season
        </h3>
        <p className="text-xs text-[var(--slate)] mb-4 leading-relaxed italic bg-[var(--cream)] p-3 rounded-lg border border-[var(--light-sage)]">
          "{season_info}"
        </p>
        <div className="flex flex-wrap gap-1.5">
          {clothing.map((item, idx) => (
            <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--sage)] text-[var(--forest)] border border-[var(--light-sage)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[var(--emerald)]" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Cultural Events */}
      <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--forest)] flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4" />
          Local Happenings
        </h3>
        <div className="space-y-3">
          {events.length > 0 ? events.map((event, idx) => (
            <div key={idx} className="border-b border-[var(--light-sage)] pb-2.5 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--charcoal)]">{event.name}</span>
                <span className="text-[10px] bg-[var(--sage)] px-2 py-0.5 rounded-full text-[var(--forest)] font-semibold border border-[var(--light-sage)]">
                  {event.type}
                </span>
              </div>
              <p className="text-xs text-[var(--slate)] leading-relaxed">
                {event.description}
              </p>
            </div>
          )) : (
            <p className="text-xs text-[var(--slate)] italic">No major local events scheduled during your dates.</p>
          )}
        </div>
      </div>
    </div>
  );
}
