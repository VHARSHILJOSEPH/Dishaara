import { useState } from "react";
import { Bus, Calendar, MapPin, Users, Search, ChevronLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingTransportProps {
  onBack: () => void;
}

export function BookingTransport({ onBack }: BookingTransportProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 pt-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 text-white/90 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        
        <div className="flex items-center gap-2 mb-2">
          <Bus className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Book Transport</h1>
        </div>
        <p className="text-white/80 text-sm">Find buses and ground transportation</p>
      </div>

      {/* Search Form */}
      <div className="p-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            {/* From Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="From (City or Station)"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* To Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="To (City or Station)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
                placeholder="Travel date"
              />
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
            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" size="lg">
              <Search className="mr-2 h-5 w-5" />
              Search Transport
            </Button>
          </CardContent>
        </Card>

        {/* Popular Routes */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">POPULAR ROUTES</h3>
          <div className="space-y-3">
            {[
              { from: 'Vijayawada', to: 'Vizag', price: 1500, duration: '6h' },
              { from: 'Mumbai', to: 'Delhi', price: 3500, duration: '8h' },
              { from: 'Chennai', to: 'Goa', price: 2000, duration: '14h' },
            ].map((route, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{route.from}</p>
                        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                        <Bus className="h-4 w-4 text-green-500" />
                        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                        <p className="font-semibold">{route.to}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{route.duration}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Direct</Badge>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold text-green-600">Rs. {route.price}</p>
                      <p className="text-xs text-muted-foreground">per person</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground">
            🚌 <span className="font-medium text-foreground">Comfort Tip:</span> VIP buses offer extra legroom and amenities for longer journeys!
          </p>
        </div>
      </div>
    </div>
  );
}