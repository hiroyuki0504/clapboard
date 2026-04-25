import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({
  value,
  className,
  indicatorClassName,
}: ProgressProps) {
  return (
    <div
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-[#e5ded1]",
        className,
      )}
      aria-label={`進捗 ${value}%`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-[#c95d3a] via-[#d5a33f] to-[#5f8b5b]",
          indicatorClassName,
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
