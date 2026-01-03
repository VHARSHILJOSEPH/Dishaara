// src/components/DayCard.tsx
import { useState } from "react";
import { Clock, Lightbulb, Trash2, Edit2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  tip?: string;
  duration_minutes?: number;
  location?: string;
}

interface DayCardProps {
  day: {
    day: number;
    title: string;
    activities: Activity[];
  };
  onDeleteActivity: (activityId: string) => void;
  onEditActivity: (activityId: string, newTitle: string) => void;
}

export function DayCard({ day, onDeleteActivity, onEditActivity }: DayCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditValue(activity.title);
  };

  const saveEdit = (activityId: string) => {
    if (editValue.trim()) {
      onEditActivity(activityId, editValue);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
        <CardTitle className="text-lg">
          Day {day.day}: {day.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {day.activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-muted/30 p-4 rounded-lg border border-border hover:shadow-sm transition-smooth"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {activity.time}
              </div>
              <div className="flex gap-1">
                {editingId === activity.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => saveEdit(activity.id)}
                      aria-label="Save edit"
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={cancelEdit}
                      aria-label="Cancel edit"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(activity)}
                      aria-label="Edit activity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onDeleteActivity(activity.id)}
                      aria-label="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {editingId === activity.id ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mb-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(activity.id);
                  if (e.key === "Escape") cancelEdit();
                }}
              />
            ) : (
              <h4 className="font-semibold text-foreground mb-1">{activity.title}</h4>
            )}

            <p className="text-sm text-muted-foreground">{activity.description}</p>

            {activity.tip && (
              <div className="mt-3 flex items-start gap-2 bg-primary/5 p-2 rounded border-l-2 border-primary">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground">
                  <span className="font-medium">Tip:</span> {activity.tip}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
