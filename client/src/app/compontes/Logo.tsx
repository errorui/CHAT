import { cn } from "@/lib/utils";

// a speech bubble with its tip folded over
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="h-[1.5em] w-[1.5em] shrink-0" aria-hidden>
        <path
          d="M10 3h11l8 8v7a8 8 0 0 1-8 8h-7.5L6 30l1.2-5.6A8 8 0 0 1 3 17.5V10a7 7 0 0 1 7-7Z"
          className="fill-primary"
        />
        <path d="M21 3l8 8h-5a3 3 0 0 1-3-3Z" className="fill-primary-foreground" opacity=".45" />
        <g className="fill-primary-foreground">
          <circle cx="10.5" cy="16.5" r="1.9" />
          <circle cx="16" cy="16.5" r="1.9" />
          <circle cx="21.5" cy="16.5" r="1.9" />
        </g>
      </svg>
      talk-tip
    </span>
  );
}
