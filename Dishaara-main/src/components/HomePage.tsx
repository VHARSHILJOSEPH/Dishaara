import { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  Calendar,
  Car,
  Star,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImg from "@/assets/hero-tourism.png";
import rajasthanDesert from "@/assets/offer-rajasthan-desert.jpg";
import keralaBackwaters from "@/assets/offer-kerala-backwaters.jpg";
import himalayanTrek from "@/assets/offer-himalayan-trek.jpg";

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onAdminAccess?: () => void;
  onTripPlannerNavigate?: (destination: string, mode?: string) => void;
}

export function HomePage({ onNavigate, onTripPlannerNavigate }: HomePageProps) {
  const [location, setLocation] = useState<string>("Fetching location...");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Fetch live location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          // Replace with your API key or remove this block if you don't want reverse geocoding
          const apiKey = "e54d4e8cc63f4698aac1a3edc26455a8"; // <-- replace with your key
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
          );

          if (!res.ok) {
            throw new Error("Failed to fetch location");
          }

          const data = await res.json();
          const components = data.results?.[0]?.components;

          const city =
            components?.city ||
            components?.town ||
            components?.village ||
            components?.state ||
            "Unknown Location";

          setLocation(city);
        } catch (err) {
          console.error("Location fetch error:", err);
          setLocation("Unable to fetch location");
        }
      },
      (err) => {
        console.warn("Location access denied:", err);
        setLocation("Location access denied");
      }
    );
  }, []);

  const travelModes = [
    { id: "mountains", label: "Mountains", icon: "⛰️" },
    { id: "beaches", label: "Beaches", icon: "🏖️" },
    { id: "city", label: "City Escapes", icon: "🏙️" },
    { id: "nature", label: "Nature & Wildlife", icon: "🦁" },
    { id: "cultural", label: "Cultural & Heritage", icon: "🏛️" },
  ];

  const quickActions = [
    { id: "guides", label: "Find Guide", icon: Users, description: "Book in 15 mins", color: "bg-primary" },
    { id: "events", label: "Events", icon: Calendar, description: "Join & Create", color: "bg-secondary" },
    { id: "safety", label: "Safety", icon: AlertTriangle, description: "Emergency SOS", color: "bg-destructive" },
    { id: "vehicles", label: "Car Pool", icon: Car, description: "Share rides", color: "bg-accent" },
  ];

  const featuredOffers = [
    {
      title: "Rajasthan Desert Safari",
      discount: "30% OFF",
      location: "Jaisalmer",
      rating: 4.8,
      originalPrice: 2500,
      discountedPrice: 1750,
      image: rajasthanDesert,
    },
    {
      title: "Kerala Backwater Cruise",
      discount: "25% OFF",
      location: "Alleppey",
      rating: 4.9,
      originalPrice: 3000,
      discountedPrice: 2250,
      image: keralaBackwaters,
    },
    {
      title: "Himalayan Trek Package",
      discount: "40% OFF",
      location: "Manali",
      rating: 4.7,
      originalPrice: 5000,
      discountedPrice: 3000,
      image: himalayanTrek,
    },
  ];

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    // navigate to trip planner, passing mode. destination left empty intentionally.
    onTripPlannerNavigate?.("", mode);
  };

  const handlePlanTrip = () => {
    // Always call with (destination, mode?)
    onTripPlannerNavigate?.(searchQuery ?? "", selectedMode ?? undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Improved with clear image */}
      <div className="relative bg-background">
        {/* Image Background */}
        <div className="relative h-64 md:h-72 overflow-hidden">
          <img 
            src={heroImg} 
            alt="India Tourism" 
            className="w-full h-full object-cover object-center"
            style={{ imageRendering: 'auto' }}
          />
          {/* Gradient overlay for text readability - lighter at top */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
        </div>
        
        {/* Content Card - Positioned over image */}
        <div className="relative -mt-20 px-4 pb-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-border/80 bg-card/98 backdrop-blur-sm">
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
                    Travel safely in India
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connect with verified local guides, check for scams, and explore with confidence. Built to help tourists stay safe and informed.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Currently in {location}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-8 pb-8">
        {/* Quick Actions - Refined */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Get started</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Quick access to main features</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => onNavigate(action.id)}
                  className="group relative bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-card transition-all text-left"
                >
                  <div className={`inline-flex p-2 rounded-lg ${action.color} mb-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-foreground mb-0.5">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* AI Trip Planner - More Integrated */}
        <section>
          <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">AI Trip Planner</h2>
                <p className="text-sm text-muted-foreground">
                  Get a personalized itinerary based on your preferences and travel style.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handlePlanTrip}
                className="w-full"
                size="lg"
              >
                Plan my trip
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              
              {travelModes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {travelModes.map((mode) => {
                    const active = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <span>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Scam Detection - Natural Integration */}
        <section>
          <Card className="border-l-4 border-l-primary/50">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Check for scams</h3>
                  <p className="text-sm text-muted-foreground">
                    Research reported scams and safety warnings for your destination before you travel.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate("scam-detection")}
                variant="outline"
                className="w-full"
              >
                Check scams in your area
              </Button>
            </div>
          </Card>
        </section>

        {/* Featured Offers - Cleaner Layout */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Popular destinations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Trending travel experiences</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {featuredOffers.map((offer, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-card transition-shadow">
                <div className="flex">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge 
                      variant="destructive" 
                      className="absolute top-2 right-2 text-xs px-1.5 py-0"
                    >
                      {offer.discount}
                    </Badge>
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
                        {offer.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{offer.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="font-medium text-foreground">{offer.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-primary">₹{offer.discountedPrice}</span>
                        <span className="text-xs text-muted-foreground line-through">₹{offer.originalPrice}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust Section - Subtle */}
        <section className="pt-4 border-t border-border/50">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Verified guides</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Real scam data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Built for safety</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
