import { useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomePage } from "@/components/HomePage";
import { GuidesPage } from "@/components/GuidesPage";
import { EventsPage } from "@/components/EventsPage";
import { SafetyPage } from "@/components/SafetyPage";
import { ProfilePage } from "@/components/ProfilePage";
import { VehiclesPage } from "@/components/VehiclesPage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import {BookingPage }from "@/components/BookingPage"; // default export (as in your BookingPage file)
import {BookingFlights} from "@/components/BookingFlights";
import {BookingTransport} from "@/components/BookingTransport";
import {BookingHotels} from "@/components/BookingHotels";
import { TripPlanner } from "@/pages/TripPlanner";
import { ScamDetectionPage } from "@/components/ScamDetectionPage";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [showAdmin, setShowAdmin] = useState(false);

  // subpage state for booking flow
  const [bookingSubPage, setBookingSubPage] = useState<
    "main" | "flights" | "transport" | "hotels"
  >("main");

  if (showAdmin) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage 
          onNavigate={setActiveTab} 
          onAdminAccess={() => setShowAdmin(true)}
          onTripPlannerNavigate={() => setActiveTab("tripplanner")}
        />;
      case "tripplanner":
        return <TripPlanner onBack={() => setActiveTab("home")} />;
      case "guides":
        return <GuidesPage />;
      case "events":
        return <EventsPage />;
      case "booking":
        // booking flow
        if (bookingSubPage === "flights") {
          return <BookingFlights onBack={() => setBookingSubPage("main")} />;
        }
        if (bookingSubPage === "transport") {
          return <BookingTransport onBack={() => setBookingSubPage("main")} />;
        }
        if (bookingSubPage === "hotels") {
          return <BookingHotels onBack={() => setBookingSubPage("main")} />;
        }
        // main booking page: pass callback to change subpage
        return <BookingPage onCategorySelect={(category) => setBookingSubPage(category)} />;
      case "safety":
        return <SafetyPage />;
      case "profile":
        return <ProfilePage />;
      case "vehicles":
        return <VehiclesPage />;
      case "scam-detection":
        return <ScamDetectionPage onBack={() => setActiveTab("home")} />;
      default:
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-md mx-auto">{renderContent()}</main>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
