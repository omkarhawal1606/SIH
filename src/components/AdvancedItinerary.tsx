"use client";

import React, { useState, useEffect } from "react";
import { type ItineraryDay } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { updateTrip } from "@/lib/db";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import * as ics from "ics";
import { 
  Calendar, 
  CloudSun, 
  ChevronRight, 
  Navigation, 
  Coffee, 
  Utensils, 
  Moon, 
  Music,
  Wallet,
  Edit2,
  Trash2,
  Plus,
  Download,
  Check,
  X,
  Clock,
  MapPin,
  CalendarPlus,
  ShieldAlert,
  AlertCircle
} from "lucide-react";

const TIME_SCHEDULE: Record<string, { label: string; timeTag: string; timeRange: string; icon: any }> = {
  morning: { label: "Morning Activity", timeTag: "09:00 AM", timeRange: "09:00 AM – 12:00 PM", icon: Coffee },
  afternoon: { label: "Afternoon Tour", timeTag: "12:30 PM", timeRange: "12:30 PM – 04:30 PM", icon: Utensils },
  evening: { label: "Evening Experience", timeTag: "05:00 PM", timeRange: "05:00 PM – 07:30 PM", icon: Moon },
  night: { label: "Night & Dining", timeTag: "08:00 PM", timeRange: "08:00 PM – 10:30 PM", icon: Music },
};

export default function AdvancedItinerary({ 
  itinerary: initialItinerary, 
  destination, 
  currency = "INR",
  tripId,
  tripStartDate,
  tripSafetyLevel
}: { 
  itinerary: ItineraryDay[], 
  destination: string, 
  currency?: string,
  tripId?: string,
  tripStartDate?: string,
  tripSafetyLevel?: "safe" | "caution" | "unsafe"
}) {
  const { t } = useTranslation();
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(initialItinerary);
  const [editingSlot, setEditingSlot] = useState<{dayIndex: number, time: string} | null>(null);
  const [editForm, setEditForm] = useState({ activity: "", place: "", transport: "" });

  // Sync state if initialItinerary changes (e.g. fresh generation)
  useEffect(() => {
    setItinerary(initialItinerary);
  }, [initialItinerary]);

  const saveToDb = async (newItinerary: ItineraryDay[]) => {
    setItinerary(newItinerary);
    if (tripId) {
      await updateTrip(tripId, { itinerary: newItinerary });
    }
  };

  const handleEdit = (dayIndex: number, time: string, data: any) => {
    setEditingSlot({ dayIndex, time });
    setEditForm({ activity: data.activity, place: data.place, transport: data.transport });
  };

  const saveEdit = () => {
    if (!editingSlot) return;
    const newItin = [...itinerary];
    newItin[editingSlot.dayIndex].slots[editingSlot.time as keyof typeof newItin[0]['slots']] = {
      ...newItin[editingSlot.dayIndex].slots[editingSlot.time as keyof typeof newItin[0]['slots']],
      ...editForm
    };
    saveToDb(newItin);
    setEditingSlot(null);
  };

  const handleDelete = (dayIndex: number, time: string) => {
    if (confirm("Clear this scheduled activity slot?")) {
      const newItin = [...itinerary];
      newItin[dayIndex].slots[time as keyof typeof newItin[0]['slots']] = {
        activity: "", place: "", transport: ""
      };
      saveToDb(newItin);
    }
  };

  const parseDateParts = (dateStr: string): [number, number, number] => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}`);
    return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
  };

  const exportCalendar = () => {
    if (!tripStartDate) return alert("Trip start date is required to generate calendar schedule.");

    let baseParts: [number, number, number];
    try {
      baseParts = parseDateParts(tripStartDate);
    } catch {
      return alert("Invalid start date format. Expected YYYY-MM-DD.");
    }

    const events: ics.EventAttributes[] = [];

    itinerary.forEach((day, dayIdx) => {
      const eventDate = new Date(baseParts[0], baseParts[1] - 1, baseParts[2] + dayIdx);
      const year = eventDate.getFullYear();
      const month = eventDate.getMonth() + 1;
      const date = eventDate.getDate();

      Object.entries(day.slots).forEach(([time, data]: [string, any]) => {
        if (!data.place || !data.activity) return;

        let startHour = 9;
        if (time === "afternoon") startHour = 13;
        if (time === "evening") startHour = 17;
        if (time === "night") startHour = 20;

        events.push({
          title: `${data.place} — ${destination}`,
          description: data.activity + (data.transport ? `\nTransit: ${data.transport}` : ""),
          location: `${data.place}, ${destination}`,
          start: [year, month, date, startHour, 0],
          duration: { hours: 2 }
        });
      });
    });

    if (events.length === 0) {
      return alert("No activities found to export.");
    }

    ics.createEvents(events, (error, value) => {
      if (error) {
        console.error(error);
        return alert("Failed to generate calendar file.");
      }
      const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Wanderly_${destination.replace(/\s+/g, "_")}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  };

  const getDayFormattedDate = (dayIdx: number, dayDateStr?: string) => {
    const rawDate = dayDateStr || (tripStartDate ? (() => {
      const parts = tripStartDate.split("-");
      if (parts.length !== 3) return null;
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + dayIdx);
      return d.toISOString().split("T")[0];
    })() : null);

    if (!rawDate) return null;
    const parts = rawDate.split("-");
    if (parts.length !== 3) return null;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--charcoal)] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--forest)]" />
            Daily Itinerary & Schedule ({itinerary.length} Days)
          </h3>
          <p className="text-xs text-[var(--slate)] mt-0.5">
            Complete day-by-day plan with scheduled times, attractions, transit info, and direct map links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCalendar}
            className="btn-secondary text-xs sm:text-sm font-bold flex items-center gap-2 py-2 px-4 shadow-sm"
          >
            <Download className="w-4 h-4 text-[var(--forest)]" /> {t("common.download")} (.ics)
          </button>
        </div>
      </div>

      {/* Days Stack */}
      <div className="space-y-8">
        {itinerary.map((day, dayIdx) => {
          const formattedDate = getDayFormattedDate(dayIdx, day.date);

          return (
            <div key={day.day || dayIdx + 1} className="bg-white border border-[var(--light-sage)] rounded-2xl shadow-sm overflow-hidden">
              {/* Day Banner */}
              <div className="bg-[var(--sage)] px-6 py-4 border-b border-[var(--light-sage)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--forest)] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                    {day.day || dayIdx + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-[var(--charcoal)] tracking-tight">
                      {t("common.day").toUpperCase()} {day.day || dayIdx + 1} {formattedDate && <span className="text-xs font-bold text-[var(--forest)] ml-2">— {formattedDate}</span>}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {tripSafetyLevel === "unsafe" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/30 text-xs font-bold shadow-xs" title="Advisory Area">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {tripSafetyLevel === "caution" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--warning-bg)] text-[#7A5C00] border border-[var(--sand)] text-xs font-bold shadow-xs" title="Caution Area">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {day.weather && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[var(--charcoal)] border border-[var(--light-sage)] text-xs font-semibold shadow-xs">
                      {day.weather.icon ? (
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.weather.icon}.png`} 
                          alt={day.weather.condition}
                          className="w-4 h-4"
                        />
                      ) : (
                        <CloudSun className="w-3.5 h-3.5 text-[var(--forest)]" />
                      )}
                      <span>{day.weather.temp}°C • {day.weather.condition}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--forest)] bg-white px-3 py-1 rounded-full border border-[var(--light-sage)]">
                    <Wallet className="w-3.5 h-3.5" />
                    Est. {formatCurrency(day.daily_cost || day.estimated_cost || 0, currency)}
                  </div>
                </div>
              </div>

              {/* Day Time Slots */}
              <div className="p-6 divide-y divide-[var(--light-sage)]">
                {day.slots && (Object.entries(day.slots) as [string, any][]).map(([timeKey, data]) => {
                  const schedule = TIME_SCHEDULE[timeKey] || { label: timeKey, timeTag: "Flexible", timeRange: "Anytime", icon: Clock };
                  const TimeIcon = schedule.icon;
                  const isEditing = editingSlot?.dayIndex === dayIdx && editingSlot?.time === timeKey;

                  if (isEditing) {
                    return (
                      <div key={timeKey} className="py-4 first:pt-0 last:pb-0">
                        <div className="bg-[var(--cream)] border-2 border-[var(--teal)] rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
                            <span>Editing {schedule.label} ({schedule.timeTag})</span>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[var(--charcoal)] mb-1 block">Place / Attraction</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Colosseum"
                              className="input-field py-2 text-sm"
                              value={editForm.place}
                              onChange={e => setEditForm({...editForm, place: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[var(--charcoal)] mb-1 block">Activity Description</label>
                            <textarea 
                              placeholder="Describe the activity..."
                              className="input-field py-2 text-xs h-16 resize-none"
                              value={editForm.activity}
                              onChange={e => setEditForm({...editForm, activity: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[var(--charcoal)] mb-1 block">Transit Method</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Metro Line B, 10 min"
                              className="input-field py-2 text-xs"
                              value={editForm.transport}
                              onChange={e => setEditForm({...editForm, transport: e.target.value})}
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button onClick={() => setEditingSlot(null)} className="btn-secondary text-xs py-1.5 px-3">
                              <X className="w-3.5 h-3.5 mr-1" /> Cancel
                            </button>
                            <button onClick={saveEdit} className="btn-primary text-xs py-1.5 px-3 font-bold">
                              <Check className="w-3.5 h-3.5 mr-1" /> Save Activity
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (!data || (!data.place && !data.activity)) {
                    return (
                      <div key={timeKey} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs text-[var(--slate)]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--light-sage)]" />
                          <span className="font-bold text-[var(--charcoal)]">{schedule.timeTag} — {schedule.label}:</span>
                          <span className="italic">No activity scheduled</span>
                        </div>
                        <button
                          onClick={() => handleEdit(dayIdx, timeKey, data || { activity: "", place: "", transport: "" })}
                          className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3 h-3" /> Add Activity
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={timeKey} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                      {/* Left: Time Tag */}
                      <div className="w-48 shrink-0">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--forest)] bg-[var(--sage)] px-2.5 py-1 rounded-md border border-[var(--light-sage)] shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-[var(--forest)]" />
                          {schedule.timeTag}
                        </div>
                        <div className="text-[11px] font-bold text-[var(--slate)] mt-1.5 flex items-center gap-1">
                          <TimeIcon className="w-3.5 h-3.5 text-[var(--emerald)]" />
                          {schedule.label}
                        </div>
                      </div>

                      {/* Center: Activity Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h5 className="text-base font-extrabold text-[var(--charcoal)] tracking-tight">
                            {data.place}
                          </h5>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.place} ${destination}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs font-bold text-[var(--teal)] hover:text-[var(--forest)] hover:underline"
                            title="Open in Google Maps"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Maps
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--slate)] leading-relaxed">
                          {data.activity}
                        </p>

                        {data.transport && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--charcoal-80)] bg-[var(--cream)] px-2.5 py-1 rounded-md border border-[var(--light-sage)] mt-1">
                            <Navigation className="w-3.5 h-3.5 text-[var(--forest)]" />
                            <span>Transit: {data.transport}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-1 self-start md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(dayIdx, timeKey, data)}
                          className="p-1.5 rounded-lg bg-[var(--sage)] hover:bg-[var(--light-sage)] text-[var(--charcoal)] transition-colors"
                          title="Edit activity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(dayIdx, timeKey)}
                          className="p-1.5 rounded-lg bg-[var(--error-bg)] hover:bg-red-200 text-[var(--error)] transition-colors"
                          title="Clear activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
