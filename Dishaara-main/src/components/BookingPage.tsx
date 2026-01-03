import { Plane, Bus, Hotel, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BookingPageProps {
  onCategorySelect: (category: 'flights' | 'transport' | 'hotels') => void;
}

const categories = [
  {
    id: 'flights' as const,
    icon: Plane,
    title: 'Flights',
    description: 'Search and book flights worldwide',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'transport' as const,
    icon: Bus,
    title: 'Transport',
    description: 'Book buses and ground transportation',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'hotels' as const,
    icon: Hotel,
    title: 'Hotels',
    description: 'Find and book hotels & accommodations',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function BookingPage({ onCategorySelect }: BookingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pt-10 pb-20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Start Your Journey</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">
          Choose what you'd like to book
        </p>
      </div>

      {/* Category Cards */}
      <div className="px-4 mt-10 pb-24 space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => onCategorySelect(category.id)}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  {/* Icon with Gradient */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>

                {/* Animated Border Bottom */}
                <div className={`h-1 bg-gradient-to-r ${category.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="px-4 pb-4">
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            ✨ <span className="font-medium text-foreground">Best prices guaranteed</span> - Compare and book with confidence
          </p>
        </div>
      </div>
    </div>
  );
}