// src/components/TripPlannerContainer.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DayCard } from "./DayCard";
import { Plus } from "lucide-react";

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

interface AIActivity {
  time?: string;
  title?: string;
  description?: string;
  notes?: string;
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

function makeId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function mapAIToDays(ai: AIItinerary): Day[] {
  if (!ai || !Array.isArray(ai.days)) return [];

  return ai.days.map((d, idx) => {
    const activities: Activity[] =
      Array.isArray(d.activities) && d.activities.length
        ? d.activities.map((a) => ({
            id: makeId("act_"),
            time: a.time || "09:00",
            title: a.title || (a.description ? a.description.split(".")[0] : "Activity"),
            description: a.description || "",
            tip: (a as any).notes || (a as any).tip || "",
            duration_minutes: typeof a.duration_minutes === "number" ? a.duration_minutes : undefined,
            location: a.location || undefined
          }))
        : [];

    return {
      day: idx + 1,
      title: d.summary || `Day ${idx + 1}`,
      activities
    };
  });
}

export default function TripPlannerContainer({ baseUrl = "" }: { baseUrl?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [city, setCity] = useState("Paris");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [travelers, setTravelers] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState<Day[]>([]);
  const [itineraryMeta, setItineraryMeta] = useState<any>(null);

  function isValidDates(sd: string, ed: string) {
    const a = new Date(sd);
    const b = new Date(ed);
    return sd && ed && !isNaN(a.valueOf()) && !isNaN(b.valueOf()) && a <= b;
  }

  async function generateItinerary() {
    setError(null);

    if (!city.trim()) {
      setError("Enter a city");
      return;
    }
    if (!isValidDates(startDate, endDate)) {
      setError("Choose valid start and end dates (start <= end)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/ai/trip-planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, startDate, endDate, options: { travelers } })
      });

      const data = await res.json();

      if (!res.ok) {
        const parts: string[] = [];
        if (data?.error) parts.push(data.error);
        if (Array.isArray(data?.warnings) && data.warnings.length) parts.push(`Warnings: ${data.warnings.join("; ")}`);
        if (data?.lastRawAI) parts.push(`AI preview: ${String(data.lastRawAI).slice(0, 800)}`);
        throw new Error(parts.join(" | ") || "Failed to generate itinerary");
      }

      const mapped = mapAIToDays(data as AIItinerary);
      setDays(mapped);
      setItineraryMeta(data.metadata || null);
    } catch (err: any) {
      setError(String(err?.message || err));
      setDays([]);
      setItineraryMeta(null);
    } finally {
      setLoading(false);
    }
  }

  function onDeleteActivity(activityId: string) {
    setDays((prev) => prev.map((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== activityId) })));
  }

  function onEditActivity(activityId: string, newTitle: string) {
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        activities: d.activities.map((a) => (a.id === activityId ? { ...a, title: newTitle } : a))
      }))
    );
  }

  function addActivityToDay(dayIndex: number) {
    const newAct: Activity = {
      id: makeId("act_"),
      time: "12:00",
      title: "New activity",
      description: "Describe this activity",
      tip: ""
    };
    setDays((prev) => prev.map((d, idx) => (idx === dayIndex ? { ...d, activities: [...d.activities, newAct] } : d)));
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 bg-white rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <Input value={city} onChange={(e: any) => setCity(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <Input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Travelers</label>
            <Input type="number" min={1} value={travelers} onChange={(e: any) => setTravelers(Number(e.target.value))} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={generateItinerary} disabled={loading || !isValidDates(startDate, endDate)}>
            {loading ? "Generating..." : "Generate itinerary"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setCity("Paris");
              setStartDate(today);
              setEndDate(today);
              setTravelers(1);
              setDays([]);
              setError(null);
              setItineraryMeta(null);
            }}
            disabled={loading}
          >
            Reset
          </Button>

          <div className="ml-auto text-sm text-gray-500">
            {itineraryMeta ? `Generated at ${new Date(itineraryMeta.generatedAt || Date.now()).toLocaleString()}` : "Click Generate"}
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.length === 0 ? (
          <div className="col-span-full text-sm text-gray-500">No itinerary yet — click Generate to create day cards.</div>
        ) : (
          days.map((d, idx) => (
            <div key={d.day}>
              <DayCard
                day={d}
                onDeleteActivity={(actId) => onDeleteActivity(actId)}
                onEditActivity={(actId, newTitle) => onEditActivity(actId, newTitle)}
              />
              <div className="mt-2 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => addActivityToDay(idx)} className="gap-2">
                  <Plus className="w-4 h-4" /> Add activity
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
