/**
 * User timezone support for KickScan.
 * Phase 1: localStorage-based with browser auto-detect.
 * Phase 2: persist to Supabase user profile.
 */

const STORAGE_KEY = "kickscan_timezone";
const FALLBACK_TZ = "America/New_York";

/**
 * Get the user's timezone. Priority:
 * 1. Saved preference in localStorage
 * 2. Browser auto-detect
 * 3. Fallback to America/New_York
 */
export function getUserTimezone(): string {
  if (typeof window === "undefined") return FALLBACK_TZ;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && isValidTimezone(saved)) return saved;

  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      localStorage.setItem(STORAGE_KEY, detected);
      return detected;
    }
  } catch {
    // Detection failed
  }

  return FALLBACK_TZ;
}

/**
 * Set the user's timezone preference.
 */
export function setUserTimezone(tz: string): boolean {
  if (!isValidTimezone(tz)) return false;
  localStorage.setItem(STORAGE_KEY, tz);
  window.dispatchEvent(new Event("kickscan_tz_change"));
  return true;
}

/**
 * Check if a timezone string is valid.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format an ISO date string or Date to the user's timezone.
 * Returns e.g. "Mar 20, 7:30 PM"
 */
export function formatMatchTime(dateInput: string | Date, options?: {
  showDate?: boolean;
  showSeconds?: boolean;
  tz?: string;
}): string {
  const { showDate = true, showSeconds = false, tz } = options || {};
  const timezone = tz || getUserTimezone();
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return String(dateInput);

  const formatOpts: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  if (showDate) {
    formatOpts.month = "short";
    formatOpts.day = "numeric";
  }

  if (showSeconds) {
    formatOpts.second = "2-digit";
  }

  return new Intl.DateTimeFormat("en-US", formatOpts).format(date);
}

/**
 * Format just the time portion, e.g. "7:30 PM"
 */
export function formatTimeOnly(dateInput: string | Date, tz?: string): string {
  return formatMatchTime(dateInput, { showDate: false, tz });
}

/**
 * Format date + time, e.g. "Mar 20, 7:30 PM"
 */
export function formatDateTime(dateInput: string | Date, tz?: string): string {
  return formatMatchTime(dateInput, { showDate: true, tz });
}

/**
 * Get a short timezone label for display, e.g. "KST", "ET", "SGT"
 */
export function getTimezoneLabel(tz?: string): string {
  const timezone = tz || getUserTimezone();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const tzPart = parts.find(p => p.type === "timeZoneName");
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Common timezone options for the settings dropdown.
 */
export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET)" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Bangkok", label: "Bangkok" },
  { value: "Asia/Jakarta", label: "Jakarta" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
];
