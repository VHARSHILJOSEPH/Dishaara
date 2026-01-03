import { useState, useEffect } from "react";
import { ArrowLeft, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import apiService from "@/services/api";
import { INDIAN_STATES_CITIES, getCitiesForState, getAllStates } from "@/data/indianStatesCities";

interface ScamResult {
  id: string;
  title: string;
  description: string;
  location: string;
  targetAudience: string;
  riskLevel: "Low" | "Medium" | "High";
  safetyTips: string[];
  commonPattern?: string[];
  scamType?: string;
  touristLocation?: string;
}

interface ScamDetectionPageProps {
  onBack?: () => void;
}

export function ScamDetectionPage({ onBack }: ScamDetectionPageProps) {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scams, setScams] = useState<ScamResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Update available cities when state changes
  useEffect(() => {
    if (state) {
      const cities = getCitiesForState(state);
      setAvailableCities(cities);
      // Reset city selection when state changes
      setCity("");
    } else {
      setAvailableCities([]);
      setCity("");
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!state || !city) {
      toast({
        title: "Missing Information",
        description: "Please select both state and city",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setScams([]);

    try {
      const results = await apiService.detectScams(state, city);
      setScams(results.scams || []);
      
      if (!results.scams || results.scams.length === 0) {
        toast({
          title: "No Scams Found",
          description: `No reported scams found for ${city}, ${state}. Stay vigilant and research before traveling.`,
        });
      }
    } catch (error: any) {
      console.error("Scam detection error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to detect scams. Please try again.",
        variant: "destructive",
      });
      setScams([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Scam Detection</h1>
          <p className="text-sm text-muted-foreground">Check for reported scams in your destination</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Search for Scams
            </CardTitle>
            <CardDescription>
              Select the state and city you plan to visit to check for reported scams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="state">
                  State
                </Label>
                <Select value={state} onValueChange={setState} disabled={loading}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStates().map((stateName) => (
                      <SelectItem key={stateName} value={stateName}>
                        {stateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">
                  City
                </Label>
                <Select 
                  value={city} 
                  onValueChange={setCity} 
                  disabled={loading || !state || availableCities.length === 0}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={state ? "Select a city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state && availableCities.length === 0 && (
                  <p className="text-xs text-muted-foreground">No cities available for this state</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading || !state || !city}>
                {loading ? "Searching..." : "Find Scams"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="px-4">
          <Card>
            <CardContent className="py-8">
              <LoadingSpinner />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && scams.length > 0 && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Reported Scams in {city}, {state}
            </h2>
            <Badge variant="outline">{scams.length} found</Badge>
          </div>

          {scams.map((scam) => (
            <Card key={scam.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{scam.title}</CardTitle>
                    {scam.scamType && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {scam.scamType}
                      </p>
                    )}
                  </div>
                  <Badge variant={getRiskColor(scam.riskLevel)}>
                    {scam.riskLevel} Risk
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {scam.touristLocation || scam.location}
                    </span>
                  </div>
                  <div className="mt-1 text-xs">
                    Targets: {scam.targetAudience}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground">{scam.description}</p>
                </div>
                {scam.commonPattern && scam.commonPattern.length > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <h4 className="font-semibold text-sm text-destructive">Common Pattern:</h4>
                    </div>
                    <ul className="space-y-2">
                      {scam.commonPattern.map((pattern, index) => (
                        <li key={index} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-destructive mt-1">•</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {scam.safetyTips && scam.safetyTips.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm">How to Avoid:</h4>
                    </div>
                    <ul className="space-y-2">
                      {scam.safetyTips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && scams.length === 0 && (
        <div className="px-4">
          <Card>
            <CardContent className="py-8 text-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Scams Reported
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                No reported scams found for {city}, {state}. However, always stay vigilant and research your destination before traveling.
              </p>
              <Button variant="outline" onClick={() => setHasSearched(false)}>
                Search Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

