import React, { useEffect, useState } from "react";
import SafetyMap, { Pos } from "./SafetyMap";
import { SafetyPanel } from "@/components/SafetyPanel";
import { useToast } from "@/hooks/use-toast";

/**
 * LocalStorage key used to persist the WhatsApp contact number.
 * Stored format: digits only string, e.g. "919876543210"
 */
const STORAGE_KEY = "safety_whatsapp_number";

export function SafetyPage(): JSX.Element {
  const { toast } = useToast();
  const [latestPos, setLatestPos] = useState<Pos | null>(null);
  const [contact, setContact] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [inputNumber, setInputNumber] = useState<string>(contact);

  // keep inputNumber in sync if stored contact changes externally
  useEffect(() => {
    setInputNumber(contact);
  }, [contact]);

  // Save contact (validate digits)
  const saveContact = () => {
    const digits = inputNumber.replace(/\D/g, "");
    if (digits.length < 8) {
      toast({ title: "Invalid number", description: "Please enter a valid phone number with country code (digits only)." });
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, digits);
    } catch {
      toast({ title: "Storage error", description: "Unable to save contact in browser storage." });
      return;
    }
    setContact(digits);
    toast({ title: "Contact saved", description: `Messages will be prepared for +${digits}` });
  };

  // Remove saved contact
  const removeContact = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setContact("");
    setInputNumber("");
    toast({ title: "Contact removed" });
  };

  // This is called by SafetyPanel when user presses the SOS button.
  // It uses the latestPos (from SafetyMap via onPositionUpdate) if available.
  const handleSOSActivate = async () => {
    // choose the phone to send to: saved contact or fallback
    const targetNumber = contact || "916304929675"; // fallback default in code (replace if needed)
    if (!/^\d{8,}$/.test(targetNumber)) {
      toast({ title: "No valid contact", description: "Please save a contact number first." });
      return;
    }

    // Use the latest watched coordinates if present
    if (latestPos) {
      const { lat, lon } = latestPos;
      const message = encodeURIComponent(`🚨 SOS! I need help. My live location: https://maps.google.com/?q=${lat},${lon}`);
      const waUrl = `https://wa.me/${targetNumber}?text=${message}`;
      window.open(waUrl, "_blank");
      toast({ title: "SOS opened", description: "WhatsApp opened with your live location. Please send the message to alert your contact." });
      return;
    }

    // If latestPos is not yet available, attempt a fresh position fetch as fallback
    if (!navigator.geolocation) {
      toast({ title: "Geolocation unavailable", description: "Your browser does not support geolocation." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const message = encodeURIComponent(`🚨 SOS! I need help. My live location: https://maps.google.com/?q=${lat},${lon}`);
        const waUrl = `https://wa.me/${targetNumber}?text=${message}`;
        window.open(waUrl, "_blank");
        toast({ title: "SOS opened", description: "WhatsApp opened with your live location. Please send the message to alert your contact." });
      },
      (err) => {
        toast({ title: "Location error", description: err.message || "Unable to access your location." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Find nearby (keeps behavior: opens google maps search around latestPos if available)
  const handleFindNearby = (type: "hospital" | "police") => {
    const useQuery = (lat: number, lon: number) => {
      const query = type === "hospital" ? "hospital" : "police station";
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lon},14z`;
      window.open(mapsUrl, "_blank");
    };

    if (latestPos) {
      useQuery(latestPos.lat, latestPos.lon);
      return;
    }

    if (!navigator.geolocation) {
      toast({ title: "Geolocation unavailable", description: "Your browser does not support geolocation." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => useQuery(position.coords.latitude, position.coords.longitude),
      (err) => toast({ title: "Location error", description: err.message || "Unable to access your location." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 py-3">
          <h1 className="text-2xl font-bold text-foreground">Safety Center</h1>
          <p className="text-sm text-muted-foreground">Your security is our priority</p>
        </div>

        {/* Map */}
        <div className="rounded border overflow-hidden bg-card">
          {/* SafetyMap will call onPositionUpdate whenever the location changes */}
          <SafetyMap onPositionUpdate={(p) => setLatestPos(p)} />
        </div>

        {/* Emergency / controls below the map */}
        <div className="space-y-4">
          {/* Add contact UI */}
          <div className="rounded border p-4 bg-card space-y-3">
            <h3 className="text-lg font-semibold">Emergency WhatsApp Contact</h3>

            <div className="flex gap-2">
              <input
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                placeholder="Country code + number, e.g. 919876543210 (digits only)"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button onClick={saveContact} className="px-3 py-2 rounded bg-primary text-white">
                Save
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {contact ? (
                  <div>
                    Saved: <strong>+{contact}</strong>
                  </div>
                ) : (
                  <div>No contact saved — a default number will be used for SOS.</div>
                )}
              </div>
              {contact && (
                <button onClick={removeContact} className="px-2 py-1 text-xs rounded border">
                  Remove
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              When SOS is triggered, WhatsApp will open with a message containing your latest live location. You must press Send to deliver the message.
            </div>
          </div>

          {/* Existing SafetyPanel (SOS button, find nearby) */}
          <SafetyPanel onSOSActivate={handleSOSActivate} onFindNearby={handleFindNearby} />

          <div className="rounded border p-4 bg-card">
            <h2 className="text-lg font-semibold">Safety Actions</h2>
            <p className="text-sm text-muted-foreground">
              Use the SOS button to prepare a WhatsApp message with your live location. The map above updates automatically.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SafetyPage;
