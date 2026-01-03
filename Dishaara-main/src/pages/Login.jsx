import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseWarning } from "@/components/FirebaseWarning";
import Logo from "../assets/Air Travel (1).png";

/**
 * Mobile-first polished login page for Dishaara.
 * - Forgot link removed as requested
 * - Icons fixed to not overlap (explicit pixel paddings)
 * - Inline error message
 */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      await login(email, password);
      // Wait a moment for the auth context to update
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'admin') {
          navigate("/admin");
        } else if (user.role === 'guide') {
          navigate("/guidedashboard");
        } else {
          navigate("/dashboard");
        }
      }, 100);
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!name) return setError("Please enter your name.");
    if (!email) return setError("Please enter your email.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      await register({ name, email, password, phone, role });
      // Wait a moment for the auth context to update
      setTimeout(() => {
        // Navigate based on role
        if (role === 'guide') {
          navigate("/guidedashboard");
        } else {
          navigate("/dashboard");
        }
      }, 100);
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Explicit paddings to ensure icons never overlap text
  const inputLeftPadding = 64; // px
  const passwordRightPadding = 56; // px

  // Check if Firebase is configured by checking if auth exists
  // We'll import auth directly to check
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(true);
  
  React.useEffect(() => {
    import('../lib/firebase').then(({ auth }) => {
      setIsFirebaseConfigured(auth !== null);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-white dark:from-gray-900 px-4">
      {/* Show warning if Firebase is not configured */}
      {!isFirebaseConfigured && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          <FirebaseWarning />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="overflow-visible rounded-3xl shadow-xl">
          {/* Header with responsive logo */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-orange-400 to-indigo-600 rounded-t-3xl flex items-center justify-center">
            <div className="-mt-10 flex items-center justify-center w-full">
              <img
                src={Logo}
                alt="Dishaara"
                className="w-24 sm:w-28 md:w-32 object-contain rounded-md shadow-md bg-white p-1"
                style={{ maxWidth: "72%", height: "auto" }}
              />
            </div>
          </div>

          <CardContent className="p-6 bg-white dark:bg-gray-900 rounded-b-3xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isRegisterMode ? "Join Dishaara" : "Welcome to Dishaara"}
            </h2>
            <p className="text-center text-sm text-gray-500 mt-1 mb-4">
              {isRegisterMode ? "Create your account and start exploring" : "Travel your direction — find your story"}
            </p>

            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
              {/* Name input (only for registration) */}
              {isRegisterMode && (
                <div className="relative">
                  <div
                    className="absolute"
                    style={{
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      pointerEvents: "none",
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-white"
                    aria-label="name"
                    style={{
                      paddingLeft: inputLeftPadding,
                      paddingRight: 12,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              {/* Phone input (only for registration) */}
              {isRegisterMode && (
                <div className="relative">
                  <div
                    className="absolute"
                    style={{
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      pointerEvents: "none",
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number (optional)"
                    className="w-full py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-white"
                    aria-label="phone"
                    style={{
                      paddingLeft: inputLeftPadding,
                      paddingRight: 12,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              {/* Role selection (only for registration) */}
              {isRegisterMode && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("user")}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        role === "user"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Traveler</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-500">Book trips & services</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("guide")}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        role === "guide"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Guide</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-500">Offer tours & services</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Email input */}
              <div className="relative">
                <div
                  className="absolute"
                  style={{
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                    pointerEvents: "none",
                  }}
                >
                  <Mail size={20} />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-white"
                  aria-label="email"
                  style={{
                    paddingLeft: inputLeftPadding,
                    paddingRight: 12,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Password input */}
              <div className="relative">
                <div
                  className="absolute"
                  style={{
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={20} />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-white"
                  aria-label="password"
                  style={{
                    paddingLeft: inputLeftPadding,
                    paddingRight: passwordRightPadding,
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute"
                  style={{
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#374151",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  Remember me
                </label>
                <div /> {/* placeholder to maintain layout */}
              </div>

              {/* Inline error message */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl py-3 font-semibold text-sm bg-gradient-to-r from-orange-500 to-indigo-600 text-white shadow-md hover:from-orange-600 hover:to-indigo-700"
                disabled={loading}
              >
                {loading 
                  ? (isRegisterMode ? "Creating account..." : "Signing in...") 
                  : (isRegisterMode ? "Create Account" : "Login")
                }
              </Button>

              {/* Toggle between login and register */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError("");
                    setName("");
                    setPhone("");
                    setRole("user");
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  {isRegisterMode 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-2">
                By {isRegisterMode ? "creating an account" : "logging in"} you agree to our{" "}
                <a href="/terms" className="underline">
                  Terms
                </a>{" "}
                &{" "}
                <a href="/privacy" className="underline">
                  Privacy Policy
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
