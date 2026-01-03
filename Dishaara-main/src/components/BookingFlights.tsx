import { useState } from "react";
import { Plane, Calendar, MapPin, Users, Search, ArrowLeftRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingFlightsProps {
  onBack: () => void;
}

export function BookingFlights({ onBack }: BookingFlightsProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 pt-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 text-white/90 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        
        <div className="flex items-center gap-2 mb-2">
          <Plane className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Book Flights</h1>
        </div>
        <p className="text-white/80 text-sm">Search and compare flight prices</p>

        {/* Trip Type Toggle */}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant={tripType === 'roundtrip' ? 'secondary' : 'ghost'}
            onClick={() => setTripType('roundtrip')}
            className={tripType === 'roundtrip' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'}
          >
            Round Trip
          </Button>
          <Button
            size="sm"
            variant={tripType === 'oneway' ? 'secondary' : 'ghost'}
            onClick={() => setTripType('oneway')}
            className={tripType === 'oneway' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'}
          >
            One Way
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <div className="p-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            {/* From Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="From (City or Airport)"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button className="bg-primary text-primary-foreground rounded-full p-2 hover:scale-110 transition-transform">
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            {/* To Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="To (City or Airport)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="pl-10 text-sm"
                  placeholder="Depart"
                />
              </div>
              {tripType === 'roundtrip' && (
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="pl-10 text-sm"
                    placeholder="Return"
                  />
                </div>
              )}
            </div>

            {/* Passengers */}
            <div className="relative">
              <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Passengers"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="pl-10"
                min="1"
              />
            </div>

            {/* Search Button */}
            <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" size="lg">
              <Search className="mr-2 h-5 w-5" />
              Search Flights
            </Button>
          </CardContent>
        </Card>

        {/* Popular Destinations */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">POPULAR DESTINATIONS</h3>
          <div className="grid grid-cols-2 gap-3">
            {['Hyerabad', 'Kochi', 'Mumbai', 'Delhi'].map((city) => (
              <Card key={city} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-3">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg mb-2 flex items-center justify-center">
                    <Plane className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{city}</p>
                  <p className="text-xs text-muted-foreground">From Rs.2999</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium text-foreground">Travel Tip:</span> Book flights 3-6 weeks in advance for the best deals!
          </p>
        </div>
      </div>
    </div>
  );
}