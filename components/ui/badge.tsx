import { cn } from "@/lib/utils";

export type BadgeShape = "default" | "vertical";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "purple";
  shape?: BadgeShape;
};

const toneClass = {
  blue: "border-[#a8bed4] bg-[#eef4f8] text-[#315a78]",
  green: "border-[#a8c3a6] bg-[#edf5ea] text-[#426c3d]",
  amber: "border-[#d4bd7f] bg-[#fff3c8] text-[#7c5a18]",
  red: "border-[#e2ac98] bg-[#f8d8cb] text-[#9f452c]",
  slate: "border-[#c8c0b3] bg-[#f7f3ea] text-[#625a50]",
  purple: "border-[#bdb2ca] bg-[#f1edf7] text-[#5d4d73]",
};

const shapeClass: Record<BadgeShape, string> = {
  default: "px-2.5 py-1 text-xs leading-none",
  vertical:
    "w-11 justify-center text-center px-1.5 py-2.5 text-[12px] leading-[1.3]",
};

export function Badge({
  tone = "slate",
  shape = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border font-semibold",
        shape === "default" ? "items-center" : "flex-col items-center",
        toneClass[tone],
        shapeClass[shape],
        className,
      )}
      {...props}
    />
  );
}
