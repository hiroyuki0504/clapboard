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

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 10000) {
    return `¥${Math.round(value / 10000)}万`;
  }

  return formatCurrency(value);
}

export function formatByteSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

export function normalizeProgressValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

const INVALID_DATE_PLACEHOLDER = "—";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const APP_TIME_ZONE = "Asia/Tokyo";

export function isDateOnly(value: string) {
  return formatDateOnly(value) !== null;
}

export function safeDate(value: string | undefined | null): Date | null {
  if (!value) {
    return null;
  }

  if (isDateOnly(value)) {
    const dateOnlyLabel = formatDateOnly(value);

    if (!dateOnlyLabel) {
      return null;
    }

    return new Date(`${dateOnlyLabel.replaceAll("/", "-")}T00:00:00+09:00`);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function safeDateTime(value: string | undefined, fallback: number): number {
  return safeDate(value)?.getTime() ?? fallback;
}

function formatDateOnly(value: string) {
  const match = value.match(DATE_ONLY_PATTERN);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const parsedDate = new Date(
    Date.UTC(numericYear, numericMonth - 1, numericDay),
  );

  if (
    parsedDate.getUTCFullYear() !== numericYear ||
    parsedDate.getUTCMonth() !== numericMonth - 1 ||
    parsedDate.getUTCDate() !== numericDay
  ) {
    return null;
  }

  return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
}

export function formatDate(value: string) {
  const dateOnlyLabel = formatDateOnly(value);

  if (dateOnlyLabel) {
    return dateOnlyLabel;
  }

  const date = safeDate(value);
  if (!date) {
    return INVALID_DATE_PLACEHOLDER;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: APP_TIME_ZONE,
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
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDayNumber(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(value);
}

export function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
    timeZone: APP_TIME_ZONE,
  }).format(value);
}

const APP_DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: APP_TIME_ZONE,
});

export function toAppDateKey(value: Date): string {
  return APP_DATE_KEY_FORMATTER.format(value);
}

export function parseAppDateKey(key: string): Date {
  return new Date(`${key}T00:00:00+09:00`);
}

export function addAppDays(key: string, days: number): string {
  return toAppDateKey(addDays(parseAppDateKey(key), days));
}

export function formatLogTime(value: string | undefined) {
  const date = safeDate(value);

  if (!date) {
    return "--:--";
  }

  if (value && isDateOnly(value)) {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      timeZone: APP_TIME_ZONE,
    }).format(date);
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(date);
}
