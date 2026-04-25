import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "rose";
};

const toneClass = {
  blue: "bg-[#eef4f8] text-[#315a78] ring-[#a8bed4]",
  green: "bg-[#edf5ea] text-[#426c3d] ring-[#a8c3a6]",
  amber: "bg-[#fff3c8] text-[#7c5a18] ring-[#d4bd7f]",
  rose: "bg-[#f8d8cb] text-[#9f452c] ring-[#e2ac98]",
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#70675b]">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-normal text-[#312d27]">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg ring-1",
            toneClass[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-sm text-[#81786d]">{helper}</p>
    </Card>
  );
}
