import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TourGuideCard } from "@/components/TourGuideCard";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/api";

const mockGuides = [
  {
    id: "1",
    name: "Rajesh Kumar",
    rating: 4.8,
    reviews: 127,
    languages: ["Hindi", "English", "Tamil"],
    specialties: ["Historical Sites", "Local Culture"],
    pricePerHour: 500,
    location: "Delhi, India",
    availableIn: "15 mins",
    verified: true,
    image: "/images/guid1.png"
  },
  {
    id: "2", 
    name: "Rohith Sharma",
    rating: 4.9,
    reviews: 89,
    languages: ["English", "Punjabi", "French"],
    specialties: ["Adventure Tours", "Photography"],
    pricePerHour: 750,
    location: "Goa, India", 
    availableIn: "12 mins",
    verified: true,
    image: "/images/guid2.png"
  },
  {
    id: "3",
    name: "Mohammed Ali",
    rating: 4.6,
    reviews: 156,
    languages: ["Arabic", "Hindi", "English"],
    specialties: ["Heritage Tours", "Architecture"],
    pricePerHour: 600,
    location: "Agra, India",
    availableIn: "8 mins", 
    verified: true,
    image: "/images/guid3.jpg"
  },
];

// Interface for Guide data from backend
interface Guide {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  bio: string;
  specialties: string[];
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  experience: {
    years: number;
    description: string;
  };
  pricing: {
    hourlyRate: number;
    dailyRate: number;
    currency: string;
  };
  ratings: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  profileImage?: string;
  gallery?: Array<{
    image: string;
    caption: string;
    uploadedAt: string;
  }>;
}

export function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("current");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch guides from backend
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const response = await apiService.getGuides();
        setGuides(response.guides || []);
      } catch (error) {
        console.error('Failed to fetch guides:', error);
        setError('Failed to load guides. Please try again.');
        // Fallback to mock data if backend fails
        setGuides(mockGuides.map(guide => ({
          _id: guide.id,
          user: { _id: guide.id, name: guide.name, email: '', phone: '' },
          bio: `Experienced guide specializing in ${guide.specialties.join(', ')}`,
          specialties: guide.specialties,
          languages: guide.languages.map(lang => ({ language: lang, proficiency: 'fluent' })),
          experience: { years: 5, description: 'Professional guide' },
          pricing: { hourlyRate: guide.pricePerHour, dailyRate: guide.pricePerHour * 8, currency: 'INR' },
          ratings: { average: guide.rating, count: guide.reviews },
          isVerified: guide.verified,
          location: { city: guide.location.split(',')[0], state: guide.location.split(',')[1]?.trim() || '', country: 'India' },
          profileImage: guide.image,
          gallery: [
            {
              image: guide.image,
              caption: `Professional photo of ${guide.name}`,
              uploadedAt: new Date().toISOString()
            }
          ]
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const handleBookGuide = (guideId: string) => {
    const guide = guides.find(g => g._id === guideId);
    toast({
      title: "Booking Request Sent",
      description: `Your request to book ${guide?.user.name} has been sent. You'll be connected shortly!`,
    });
  };

  const filteredGuides = guides.filter(guide =>
    guide.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Find Your Guide</h1>
          <p className="text-muted-foreground">Verified local guides available within 15 minutes</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, location, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Near Me
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Top Rated
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Available Now Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Available Now</h2>
          <span className="text-sm text-muted-foreground">{filteredGuides.length} guides</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading guides...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No guides found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGuides.map((guide) => (
              <TourGuideCard
                key={guide._id}
                guide={{
                  id: guide._id,
                  name: guide.user.name,
                  rating: guide.ratings.average,
                  reviews: guide.ratings.count,
                  languages: guide.languages.map(l => l.language),
                  specialties: guide.specialties,
                  pricePerHour: guide.pricing.hourlyRate,
                  location: `${guide.location.city}, ${guide.location.state}`,
                  availableIn: "Available now",
                  verified: guide.isVerified,
                  image: guide.profileImage || "/images/guid1.png"
                }}
                onBook={handleBookGuide}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Tour Options */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Quick Tour Options</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="card" className="h-20 flex-col">
            <span className="font-medium">1-2 Hours</span>
            <span className="text-xs text-muted-foreground">Quick City Tour</span>
          </Button>
          <Button variant="card" className="h-20 flex-col">
            <span className="font-medium">Half Day</span>
            <span className="text-xs text-muted-foreground">4-6 Hours</span>
          </Button>
          <Button variant="card" className="h-20 flex-col">
            <span className="font-medium">Full Day</span>
            <span className="text-xs text-muted-foreground">8+ Hours</span>
          </Button>
          <Button variant="card" className="h-20 flex-col">
            <span className="font-medium">Multi-Day</span>
            <span className="text-xs text-muted-foreground">Custom Package</span>
          </Button>
        </div>
      </div>
    </div>
  );
}