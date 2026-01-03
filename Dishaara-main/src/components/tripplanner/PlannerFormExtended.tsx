// src/components/tripplanner/PlannerFormExtended.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSubmit: (payload: {
    city: string;
    startDate?: string;
    endDate?: string;
    days?: number;
    travelers?: number;
    travelMode?: string;
    preferences?: string;
  }) => void;
  isLoading?: boolean;
}

export default function PlannerFormExtended({ onSubmit, isLoading = false }: Props) {
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number | "">("");
  const [travelers, setTravelers] = useState(1);
  const [travelMode, setTravelMode] = useState("sightseeing");
  const [preferences, setPreferences] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // decide days from inputs
        const payload: any = { city: city.trim(), travelers, travelMode, preferences: preferences.trim() };
        if (startDate && endDate) {
          payload.startDate = startDate;
          payload.endDate = endDate;
        } else if (days) {
          payload.days = Number(days);
        } else {
          // fallback to 1 day
          payload.days = 1;
        }
        onSubmit(payload);
      }}
      className="space-y-3 p-4"
    >
      <div>
        <Label>City</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Paris" required />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>OR Days</Label>
          <Input type="number" min={1} value={days as any} onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div className="flex-1">
          <Label>Travelers</Label>
          <Input type="number" min={1} value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Travel mode</Label>
          <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)} className="w-full px-2 py-2 border rounded">
            <option value="sightseeing">Sightseeing</option>
            <option value="culture">Culture</option>
            <option value="food">Food & Drink</option>
            <option value="adventure">Adventure</option>
            <option value="relax">Relaxed</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Preferences (comma separated or sentence)</Label>
        <Input value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g. vegetarian food, museums, nightlife" />
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Generating..." : "Generate Itinerary"}</Button>
      </div>
    </form>
  );
}
