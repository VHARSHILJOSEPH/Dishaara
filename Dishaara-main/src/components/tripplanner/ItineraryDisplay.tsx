import { Download, Copy, Share2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayCard } from "./DayCard";
import { toast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  tip?: string;
}

interface DayItinerary {
  day: number;
  title: string;
  activities: Activity[];
}

interface ItineraryDisplayProps {
  itinerary: DayItinerary[];
  onEdit: () => void;
  onUpdateItinerary: (itinerary: DayItinerary[]) => void;
}

export function ItineraryDisplay({ itinerary, onEdit, onUpdateItinerary }: ItineraryDisplayProps) {
  const handleCopyToClipboard = () => {
    const text = itinerary
      .map(
        (day) =>
          `Day ${day.day}: ${day.title}\n${day.activities
            .map((act) => `${act.time} - ${act.title}\n${act.description}${act.tip ? `\nTip: ${act.tip}` : ""}`)
            .join("\n\n")}`
      )
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Itinerary copied to clipboard",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Trip Itinerary",
          text: "Check out my AI-generated trip itinerary!",
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      toast({
        title: "Share not supported",
        description: "Use copy to clipboard instead",
      });
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download Started",
      description: "Your itinerary PDF is being prepared",
    });
    // In a real app, generate and download PDF here
  };

  const handleDeleteActivity = (dayIndex: number, activityId: string) => {
    const updated = [...itinerary];
    updated[dayIndex].activities = updated[dayIndex].activities.filter(
      (act) => act.id !== activityId
    );
    onUpdateItinerary(updated);
    toast({
      title: "Activity removed",
      description: "Activity has been deleted from your itinerary",
    });
  };

  const handleEditActivity = (dayIndex: number, activityId: string, newTitle: string) => {
    const updated = [...itinerary];
    const activity = updated[dayIndex].activities.find((act) => act.id === activityId);
    if (activity) {
      activity.title = newTitle;
      onUpdateItinerary(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Your Itinerary</h2>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="text-xs">
          <Download className="w-4 h-4 mr-1" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="text-xs">
          <Copy className="w-4 h-4 mr-1" />
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>

      {/* Days */}
      <div className="space-y-6">
        {itinerary.map((day, index) => (
          <DayCard
            key={day.day}
            day={day}
            onDeleteActivity={(activityId) => handleDeleteActivity(index, activityId)}
            onEditActivity={(activityId, newTitle) => handleEditActivity(index, activityId, newTitle)}
          />
        ))}
      </div>
    </div>
  );
}