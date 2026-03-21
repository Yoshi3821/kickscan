"use client";
import { useState, useEffect } from "react";
import { getUserTimezone, setUserTimezone, formatDateTime, getTimezoneLabel, TIMEZONE_OPTIONS } from "@/lib/timezone";

interface LeagueTimezoneProps {
  dateISO?: string;
  venue?: string;
  fallbackTime?: string;
  pickerOnly?: boolean;
}

export default function LeagueTimezone({ dateISO, venue, fallbackTime, pickerOnly }: LeagueTimezoneProps) {
  const [tz, setTz] = useState<string>("Asia/Seoul");
  const [showPicker, setShowPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTz(getUserTimezone());
    setMounted(true);

    const handleTzChange = () => setTz(getUserTimezone());
    window.addEventListener("kickscan_tz_change", handleTzChange);
    return () => window.removeEventListener("kickscan_tz_change", handleTzChange);
  }, []);

  // Picker-only mode: renders just the timezone selector bar
  if (pickerOnly) {
    return (
      <div className="flex items-center justify-center gap-2 mb-6 text-sm">
        <span className="text-gray-500">🕐 {mounted ? getTimezoneLabel(tz) : "Loading..."}</span>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-purple-400 hover:text-purple-300 transition text-xs"
        >
          Change
        </button>
        {showPicker && (
          <div className="absolute mt-32 z-50">
            <select
              value={tz}
              onChange={(e) => {
                setUserTimezone(e.target.value);
                setTz(e.target.value);
                setShowPicker(false);
                window.dispatchEvent(new Event("kickscan_tz_change"));
              }}
              className="px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // Time display mode: renders formatted match time
  if (!dateISO) return null;

  const formattedTime = mounted ? formatDateTime(dateISO, tz) : fallbackTime || "";

  return (
    <div className="text-sm text-gray-400 mb-4 text-center">
      {formattedTime}{venue ? ` • ${venue}` : ""}
    </div>
  );
}
