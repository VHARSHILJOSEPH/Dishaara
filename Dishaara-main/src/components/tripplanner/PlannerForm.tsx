// src/components/tripplanner/PlannerForm.tsx
import { useState } from "react";
import { Calendar, Users, Compass, Activity, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlannerFormProps {
  onSubmit: (details: any) => void;
  isLoading: boolean;
}

const travelModes = [
  { value: "mountains", label: "Mountains", icon: "⛰️" },
  { value: "beaches", label: "Beaches", icon: "🏖️" },
  { value: "city", label: "City Escapes", icon: "🏙️" },
  { value: "nature", label: "Nature & Wildlife", icon: "🦁" },
  { value: "cultural", label: "Cultural & Heritage", icon: "🏛️" },
];

const paceOptions = [
  { value: "relaxed", label: "Relaxed", description: "Take it easy" },
  { value: "moderate", label: "Moderate", description: "Balanced pace" },
  { value: "active", label: "Active", description: "Action-packed" },
];

const budgetOptions = [
  { value: "budget", label: "Budget", description: "< ₹5000/day" },
  { value: "moderate", label: "Moderate", description: "₹5000-10000/day" },
  { value: "luxury", label: "Luxury", description: "> ₹10000/day" },
];

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function PlannerForm({ onSubmit, isLoading }: PlannerFormProps) {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(todayISO(1)); // default tomorrow
  const [endDate, setEndDate] = useState(todayISO(3)); // default in 3 days
  const [travelers, setTravelers] = useState<number>(2);
  const [travelMode, setTravelMode] = useState("beaches");
  const [pace, setPace] = useState("moderate");
  const [budget, setBudget] = useState("moderate");

  // minimum selectable date is today (no past dates)
  const minDate = todayISO(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // simple client-side validation
    if (!destination.trim()) {
      alert("Please enter a destination city.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
      alert("Please enter valid dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before or equal to end date.");
      return;
    }
    if (new Date(startDate) < new Date(minDate)) {
      alert("Start date cannot be in the past.");
      return;
    }
    if (travelers < 1) {
      alert("Please enter at least 1 traveler.");
      return;
    }

    onSubmit({
      destination,
      startDate,
      endDate,
      travelers,
      travelMode,
      pace,
      budget,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          Plan Your Journey
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Where do you want to go?
            </Label>
            <Input
              id="destination"
              placeholder="e.g., Goa, Manali, Kerala"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Dates - aligned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                aria-required="true"
                min={minDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                aria-required="true"
                min={startDate || minDate}
              />
            </div>
          </div>

          {/* Travelers */}
          <div className="space-y-2">
            <Label htmlFor="travelers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Number of Travelers
            </Label>
            <Input
              id="travelers"
              type="number"
              min={1}
              max={20}
              value={String(travelers)}
              onChange={(e) => {
                const v = Number(e.target.value || 1);
                setTravelers(Number.isFinite(v) && v > 0 ? v : 1);
              }}
              required
              aria-required="true"
            />
          </div>

          {/* Travel Mode */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Travel Mode
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {travelModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setTravelMode(mode.value)}
                  className={`p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left ${
                    travelMode === mode.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                  aria-pressed={travelMode === mode.value}
                >
                  <div className="text-2xl mb-1">{mode.icon}</div>
                  <div className="text-sm font-medium">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pace */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Travel Pace
            </Label>

            <div className="flex flex-wrap gap-2">
              {paceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPace(opt.value)}
                  className={`flex-1 min-w-[140px] p-3 rounded-lg border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    pace === opt.value ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/30"
                  }`}
                  aria-pressed={pace === opt.value}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Budget Range
            </Label>

            <div className="flex flex-wrap gap-2">
              {budgetOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  className={`flex-1 min-w-[140px] p-3 rounded-lg border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    budget === opt.value ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/30"
                  }`}
                  aria-pressed={budget === opt.value}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? "Generating Itinerary..." : "Generate Itinerary"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
