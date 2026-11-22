const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// rounded, because days around a DST change are not exactly 24 hours
const daysAgo = (date: Date) => Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);

const shortDate = (date: Date) =>
  date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// heading between messages of different days
export const formatDay = (iso: string) => {
  const date = new Date(iso);
  const days = daysAgo(date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return shortDate(date);
};

// compact stamp for the chat list
export const formatListTime = (iso: string) => {
  const date = new Date(iso);
  const days = daysAgo(date);
  if (days <= 0) return formatTime(iso);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return shortDate(date);
};

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase() || "?";

const TINTS = [
  "bg-orange-200 text-orange-950 dark:bg-orange-900 dark:text-orange-100",
  "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100",
  "bg-lime-200 text-lime-950 dark:bg-lime-900 dark:text-lime-100",
  "bg-sky-200 text-sky-950 dark:bg-sky-900 dark:text-sky-100",
  "bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-100",
  "bg-violet-200 text-violet-950 dark:bg-violet-900 dark:text-violet-100",
];

// the same person always gets the same colour
export const tintFor = (id = "") => {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) % 100003;
  return TINTS[hash % TINTS.length];
};
