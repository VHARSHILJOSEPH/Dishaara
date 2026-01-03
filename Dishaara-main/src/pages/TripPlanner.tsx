// src/pages/TripPlanner.tsx
import { useState } from "react";
import ServerItineraryDisplay from "@/components/tripplanner/ServerItineraryDisplay";
import PlannerForm from "@/components/tripplanner/PlannerForm";
import apiService from "@/services/api";

export function TripPlanner() {
  const [itinerary, setItinerary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [iterations, setIterations] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  async function handleGenerate(details: any) {
    setError(null);
    setIsLoading(true);
    setIterations(0);

    // Normalize options (client-side mapping)
    const normalize = {
      theme: details.travelMode || details.theme || "city", // the UI theme
      style:
        details.travelMode === "beaches" ? "relaxed" :
        details.travelMode === "mountains" ? "adventure" :
        details.travelMode === "nature" ? "adventure" :
        details.travelMode === "cultural" ? "sightseeing" :
        details.travelMode === "city" ? "sightseeing" : "sightseeing",
      pace: details.pace === "active" ? "fast" : details.pace || "moderate",
      budget: details.budget === "budget" ? "low" : (details.budget === "luxury" ? "high" : (details.budget || "mid")),
      travelers: Number.isFinite(details.travelers) ? details.travelers : parseInt(details.travelers || "1", 10)
    };

    const payload = {
      city: details.destination || details.city || '',
      startDate: details.startDate,
      endDate: details.endDate,
      options: normalize
    };

    try{
      const data = await apiService.generateTripPlan(payload);
      setIterations(data.metadata?.iterations || 0);
      setHistory(prev=> [data, ...prev]);
      setItinerary(data);
    }catch(e:any){
      setError(String(e));
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PlannerForm onSubmit={handleGenerate} isLoading={isLoading} />
      {isLoading && <div className="p-4">Generating itinerary... {iterations>0 ? `Checks ${iterations}/10` : ''}</div>}
      {error && <div className="text-red-600 p-2">{error}</div>}
      {itinerary && <ServerItineraryDisplay itinerary={itinerary} />}
      {history.length>1 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Previous versions</h3>
          <ul>
            {history.slice(1).map((h,idx)=>(
              <li key={idx}>
                <button className="underline" onClick={()=>setItinerary(h)}>Version {idx+1} - iterations: {h.metadata?.iterations}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TripPlanner;
