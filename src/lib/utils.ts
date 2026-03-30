import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardize timestamp to East 8th District (UTC+8) HH:mm format
 */
export function formatTimeUTC8(ts: number | string | Date) {
  const date = new Date(ts);
  // Get time in UTC+8
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const date8 = new Date(utc + (3600000 * 8));

  const h = date8.getHours().toString().padStart(2, '0');
  const m = date8.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Standardize timestamp to East 8th District (UTC+8) YYYY-MM-DD HH:mm:ss format
 */
export function formatDateTimeUTC8(ts: number | string | Date) {
  const date = new Date(ts);
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const date8 = new Date(utc + (3600000 * 8));

  const y = date8.getFullYear();
  const mo = (date8.getMonth() + 1).toString().padStart(2, '0');
  const d = date8.getDate().toString().padStart(2, '0');
  const h = date8.getHours().toString().padStart(2, '0');
  const m = date8.getMinutes().toString().padStart(2, '0');
  const s = date8.getSeconds().toString().padStart(2, '0');

  return `${y}-${mo}-${d} ${h}:${m}:${s}`;
}
