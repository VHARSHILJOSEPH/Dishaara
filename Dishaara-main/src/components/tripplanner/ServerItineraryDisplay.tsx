// src/components/tripplanner/ServerItineraryDisplay.tsx
import React, { useEffect, useState } from "react";
import { DayCard } from "@/components/tripplanner/DayCard";

interface AIActivity {
  time?: string;
  title?: string;
  description?: string;
  notes?: string;
  tip?: string;
  duration_minutes?: number;
  location?: string;
}

interface AIDay {
  date?: string;
  summary?: string;
  activities?: AIActivity[];
}

interface AIItinerary {
  city?: string;
  startDate?: string;
  endDate?: string;
  days?: AIDay[];
  metadata?: Record<string, any>;
}

interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  tip?: string;
  duration_minutes?: number;
  location?: string;
}

interface Day {
  day: number;
  title: string;
  activities: Activity[];
}

interface Props {
  itinerary: AIItinerary | null;
  onUpdate?: (itinerary: AIItinerary) => void;
}

function makeId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function mapAIToDays(ai: AIItinerary | null): Day[] {
  if (!ai || !Array.isArray(ai.days)) return [];
  return ai.days.map((d, idx) => {
    const activities: Activity[] = Array.isArray(d.activities)
      ? d.activities.map((a) => ({
          id: makeId("act_"),
          time: a.time || "09:00",
          title: a.title || (a.description ? String(a.description).split(".")[0] : "Activity"),
          description: a.description || "",
          tip: (a as any).notes || (a as any).tip || "",
          duration_minutes: typeof a.duration_minutes === "number" ? a.duration_minutes : undefined,
          location: a.location || undefined,
        }))
      : [];

    return {
      day: idx + 1,
      title: d.summary || `Day ${idx + 1}`,
      activities,
    };
  });
}

function mapDaysToAI(days: Day[], base: AIItinerary | null): AIItinerary {
  const ai: AIItinerary = {
    city: base?.city,
    startDate: base?.startDate,
    endDate: base?.endDate,
    metadata: base?.metadata || {},
  };
  ai.days = days.map((d) => ({
    date: undefined,
    summary: d.title,
    activities: d.activities.map((a) => ({
      time: a.time,
      title: a.title,
      description: a.description,
      notes: a.tip,
      duration_minutes: a.duration_minutes,
      location: a.location,
    })),
  }));
  return ai;
}

export default function ServerItineraryDisplay({ itinerary, onUpdate }: Props) {
  const [days, setDays] = useState<Day[]>([]);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    setDays(mapAIToDays(itinerary));
    setCity(itinerary?.city);
    setMeta(itinerary?.metadata || null);
  }, [itinerary]);

  function handleDeleteActivity(activityId: string) {
    setDays((prev) => {
      const next = prev.map((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== activityId) }));
      if (onUpdate) onUpdate(mapDaysToAI(next, itinerary));
      return next;
    });
  }

  function handleEditActivity(activityId: string, newTitle: string) {
    setDays((prev) => {
      const next = prev.map((d) => ({
        ...d,
        activities: d.activities.map((a) => (a.id === activityId ? { ...a, title: newTitle } : a)),
      }));
      if (onUpdate) onUpdate(mapDaysToAI(next, itinerary));
      return next;
    });
  }

  function addActivityToDay(dayIndex: number) {
    const newAct: Activity = {
      id: makeId("act_"),
      time: "12:00",
      title: "New activity",
      description: "Describe this activity",
      tip: "",
    };
    setDays((prev) => {
      const next = prev.map((d, i) => (i === dayIndex ? { ...d, activities: [...d.activities, newAct] } : d));
      if (onUpdate) onUpdate(mapDaysToAI(next, itinerary));
      return next;
    });
  }

  if (!itinerary) return null;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {city || "Your Trip Itinerary"}
            </h2>
            <p className="text-sm text-gray-500">
              {itinerary.startDate || ""} → {itinerary.endDate || ""}
            </p>
          </div>
          {meta?.generatedAt && (
            <div className="text-sm text-gray-400">
              Generated: {new Date(meta.generatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Stack DayCards vertically */}
      <div className="flex flex-col gap-6">
        {days.length === 0 ? (
          <div className="text-sm text-gray-500">No itinerary days to display.</div>
        ) : (
          days.map((d, idx) => (
            <div key={d.day} className="w-full">
              <DayCard
                day={d}
                onDeleteActivity={(actId) => handleDeleteActivity(actId)}
                onEditActivity={(actId, newTitle) => handleEditActivity(actId, newTitle)}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => addActivityToDay(idx)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border hover:bg-gray-50"
                >
                  + Add activity
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {itinerary.metadata?.warnings && itinerary.metadata.warnings.length > 0 && (
        <div className="mt-6 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md border border-yellow-200">
          ⚠️ Warnings: {itinerary.metadata.warnings.join("; ")}
        </div>
      )}
    </div>
  );
}
