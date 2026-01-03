import React, { useEffect, useState, useRef } from "react";

export type Pos = { lat: number; lon: number; accuracy?: number };

interface Props {
  /**
   * Optional callback invoked whenever the live position updates.
   * Parent can use this to keep the latest position for SOS, sharing, etc.
   */
  onPositionUpdate?: (pos: Pos) => void;
}

export default function SafetyMap({ onPositionUpdate }: Props): JSX.Element {
  const [position, setPosition] = useState<Pos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        const p: Pos = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setPosition(p);
        if (onPositionUpdate) onPositionUpdate(p);
      },
      (err) => {
        setError(err.message || "Unable to access location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    // store id (browser returns number)
    // @ts-ignore - watchPosition returns number in browser
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPosition = position !== null;

  const mapSrc = hasPosition
    ? `https://www.google.com/maps?q=${position!.lat},${position!.lon}&z=17&output=embed`
    : `about:blank`;

  return (
    <div className="w-full h-64">
      <div className="relative w-full h-full rounded overflow-hidden border bg-gray-50">
        {hasPosition ? (
          <iframe
            title="Live location map"
            src={mapSrc}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            {error ? (
              <div className="text-red-600">Location error: {error}</div>
            ) : (
              <div>Waiting for live location… (allow location access in your browser)</div>
            )}
          </div>
        )}

        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs rounded-md px-2 py-1 backdrop-blur-sm">
          {hasPosition ? (
            <div className="space-y-0.5 leading-tight">
              <div>Lat: {position!.lat.toFixed(6)}</div>
              <div>Lon: {position!.lon.toFixed(6)}</div>
              {position!.accuracy != null && <div>Acc ≈ {Math.round(position!.accuracy)} m</div>}
            </div>
          ) : (
            <div>Live location inactive</div>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
              hasPosition ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
            }`}
          >
            {hasPosition ? "Tracking" : "Not tracking"}
          </span>
        </div>
      </div>
    </div>
  );
}
