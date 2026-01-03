import { useState } from "react";
import { Hotel, Calendar, MapPin, Users, Search, ChevronLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingHotelsProps {
  onBack: () => void;
}

export function BookingHotels({ onBack }: BookingHotelsProps) {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [rooms, setRooms] = useState("1");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 pt-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 text-white/90 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        
        <div className="flex items-center gap-2 mb-2">
          <Hotel className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Book Hotels</h1>
        </div>
        <p className="text-white/80 text-sm">Find your perfect accommodation</p>
      </div>

      {/* Search Form */}
      <div className="p-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            {/* Destination */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Where are you going?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Check-in & Check-out */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="pl-10 text-sm"
                  placeholder="Check-in"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="pl-10 text-sm"
                  placeholder="Check-out"
                />
              </div>
            </div>

            {/* Guests & Rooms */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="pl-10"
                  min="1"
                />
              </div>
              <div className="relative">
                <Hotel className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="pl-10"
                  min="1"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" size="lg">
              <Search className="mr-2 h-5 w-5" />
              Search Hotels
            </Button>
          </CardContent>
        </Card>

        {/* Featured Hotels */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">FEATURED HOTELS</h3>
          <div className="space-y-3">
            {[
              { name: 'River View Resort', location: 'Kochi', rating: 4.8, price: 2500, image: 'hotel1' },
              { name: 'Nile Luxury Hotel', location: 'Delhi', rating: 4.9, price: 3200, image: 'hotel2' },
              { name: 'Red Sea Paradise', location: 'Goa', rating: 4.7, price: 1800, image: 'hotel3' },
            ].map((hotel, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    {/* Hotel Image */}
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 flex items-center justify-center">
                      <Hotel className="h-10 w-10 text-white" />
                    </div>
                    
                    {/* Hotel Info */}
                    <div className="flex-1 p-3 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">{hotel.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{hotel.location}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{hotel.rating}</span>
                          <Badge variant="secondary" className="ml-1 text-xs">Top Rated</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600 text-sm">Rs.{hotel.price}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-muted-foreground">
            🏨 <span className="font-medium text-foreground">Booking Tip:</span> Free cancellation available on most hotels - book now, decide later!
          </p>
        </div>
      </div>
    </div>
  );
}