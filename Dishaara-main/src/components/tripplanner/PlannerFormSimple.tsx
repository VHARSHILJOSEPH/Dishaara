// src/components/tripplanner/PlannerFormSimple.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSubmit: (payload: { city: string; days: number; travelers?: number; travelMode?: string; pace?: string }) => void;
  isLoading?: boolean;
}

export default function PlannerFormSimple({ onSubmit, isLoading = false }: Props) {
  const [city, setCity] = useState("");
  const [days, setDays] = useState(3);
  const [travelers, setTravelers] = useState(1);
  const [travelMode, setTravelMode] = useState("sightseeing");
  const [pace, setPace] = useState("moderate");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!city || !days || days < 1) return;
        onSubmit({ city: city.trim(), days: Number(days), travelers: Number(travelers), travelMode, pace });
      }}
      className="space-y-3 p-4"
    >
      <div>
        <Label>City</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Paris" />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Days</Label>
          <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <div className="flex-1">
          <Label>Travelers</Label>
          <Input type="number" min={1} value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Mode</Label>
          <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)} className="w-full px-2 py-2 border rounded">
            <option value="sightseeing">Sightseeing</option>
            <option value="culture">Culture</option>
            <option value="food">Food & Drink</option>
            <option value="adventure">Adventure</option>
          </select>
        </div>
        <div className="flex-1">
          <Label>Pace</Label>
          <select value={pace} onChange={(e) => setPace(e.target.value)} className="w-full px-2 py-2 border rounded">
            <option value="relaxed">Relaxed</option>
            <option value="moderate">Moderate</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Itinerary"}
        </Button>
      </div>
    </form>
  );
}
