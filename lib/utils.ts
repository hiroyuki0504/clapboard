import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ALLOWED_FILE_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function safeFileUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (!ALLOWED_FILE_URL_PROTOCOLS.has(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function buildDateLabel(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    weekday: "short",
    year: "numeric",
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((accumulator, part) => {
      accumulator[part.type] = part.value;
      return accumulator;
    }, {});

  return `${parts.year}/${parts.month}/${parts.day} ${parts.weekday.toUpperCase()}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

const INVALID_DATE_PLACEHOLDER = "—";

function safeDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string) {
  const date = safeDate(value);
  if (!date) {
    return INVALID_DATE_PLACEHOLDER;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(value: string) {
  const date = safeDate(value);
  if (!date) {
    return INVALID_DATE_PLACEHOLDER;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
