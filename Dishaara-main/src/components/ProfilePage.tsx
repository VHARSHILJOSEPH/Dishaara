// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { User, Star, Gift, MapPin, Calendar, Camera, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ProfilePage
 * - Gets user data from AuthContext which fetches from MongoDB Atlas via API
 * - Shows user's name in the header and subtitle
 * - Sign Out uses AuthContext logout method
 * - Shows loading state while fetching user data from database
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const toastHook: { toast?: (opts: { title: string; description?: string }) => void } | ((opts: { title: string; description?: string }) => void) | undefined = useToast(); // typical shape: { toast } or toast function
  const { user, isLoading, logout: authLogout } = useAuth();
  const [userName, setUserName] = useState("");
    const userStats = [
    { label: "Tours Completed", value: 12, icon: MapPin },
    { label: "Events Attended", value: 8, icon: Calendar },
    { label: "Reviews Given", value: 15, icon: Star },
    { label: "Photos Shared", value: 47, icon: Camera },
  ];

  useEffect(() => {
    // Update userName when user object changes from AuthContext
    if (user?.name) {
      setUserName(user.name);
    } else {
      setUserName("");
    }
  }, [user]);

  // Add mock recent activities data
  const recentActivities = [
    {
      title: "Completed Jaipur City Tour",
      date: "2024-06-01",
      rating: 5,
    },
    {
      title: "Attended Kite Festival",
      date: "2024-05-20",
      rating: 4.5,
    },
    {
      title: "Reviewed Amber Fort",
      date: "2024-05-10",
      rating: 4,
    },
  ];

  const fireToast = (opts = { title: "", description: "" }) => {
    try {
      // many useToast implementations return { toast } where toast is a function
      // handle a few common shapes to be safe
      if (!toastHook) {
        // no toast available — fallback
        alert(`${opts.title}\n${opts.description || ""}`);
        return;
      }

      // if useToast returned an object with a "toast" function: { toast }
      if (typeof toastHook.toast === "function") {
        toastHook.toast(opts);
        return;
      }

      // if useToast returned a function directly: toast(opts)
      if (typeof toastHook === "function") {
        (toastHook as (opts: { title: string; description?: string }) => void)(opts);
        return;
      }

      // otherwise fallback to alert
      alert(`${opts.title}\n${opts.description || ""}`);
    } catch (err) {
      // if toast throws for any reason, fallback to alert
      // (we don't want toast errors to block signout)
      console.warn("Toast failed:", err);
      alert(`${opts.title}\n${opts.description || ""}`);
    }
  };

  const handleSignOut = () => {
    // Use AuthContext logout method which handles all cleanup
    authLogout();

    // show toast / alert
    fireToast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });

    // redirect to login. small delay so toast can appear briefly (adjust if desired)
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 300);
  };

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Profile Header */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              {userName || "Tourist Explorer"}
            </h2>
            <p className="text-muted-foreground">{userName || "Adventure seeker"}</p>
            <div className="flex items-center mt-2">
              <Star className="w-4 h-4 text-primary fill-current" />
              <span className="ml-1 font-medium">4.8</span>
              <span className="ml-1 text-sm text-muted-foreground">(24 reviews)</span>
            </div>
          </div>

          <Button variant="outline" size="sm" type="button" onClick={() => console.log("open settings (not implemented)")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Rewards Section (unchanged) */}
      <Card className="p-4 bg-gradient-primary text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Gift className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Rewards Points</h3>
          </div>
          <Badge variant="secondary" className="text-primary">
            Gold Member
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">2,450</p>
            <p className="text-sm opacity-90">Available Points</p>
          </div>
          <div>
            <p className="text-2xl font-bold">₹245</p>
            <p className="text-sm opacity-90">Cash Value</p>
          </div>
        </div>

        <Button variant="secondary" className="w-full mt-4" size="sm" type="button">
          Redeem Points
        </Button>
      </Card>
       {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {userStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 text-center bg-gradient-card">
              <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          );
        })}
      </div>

     {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <Card key={index} className="p-4 bg-gradient-card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
                {activity.rating && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <span className="ml-1 font-medium">{activity.rating}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" type="button">
          <User className="w-4 h-4 mr-2" />
          Account Settings
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
          type="button" // IMPORTANT: prevents being treated as submit inside any form
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Auth Notice */}
      <Card className="p-4 bg-muted/50 border-primary/20">
        <p className="text-sm text-muted-foreground text-center">This website is just a prototype</p>
      </Card>
    </div>
  );
}

export default ProfilePage;
