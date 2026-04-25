import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#d8d1c4] bg-[#fffefa] text-[#c95d3a]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-1 font-bold text-[#312d27]">{value}</p>
    </div>
  );
}

export function FinanceTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green" | "rose";
}) {
  const toneClass = {
    blue: "bg-[#eef4f8] border-[#a8bed4]",
    amber: "bg-[#fff3c8] border-[#d4bd7f]",
    green: "bg-[#edf5ea] border-[#a8c3a6]",
    rose: "bg-[#f8d8cb] border-[#e2ac98]",
  };

  return (
    <div className={cn("rounded-lg border p-4", toneClass[tone])}>
      <p className="text-sm font-bold text-[#70675b]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-sm font-bold text-[#5f574d]">{title}</p>
      <p className="text-xs text-[#81786d]">{description}</p>
    </div>
  );
}

export function EmptyStateCard(props: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <EmptyState {...props} />
      </CardContent>
    </Card>
  );
}

export function MarkdownLike({ body }: { body: string }) {
  return (
    <div className="space-y-3 rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-5 text-sm leading-7 text-[#5f574d]">
      {body.split("\n").map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={`${line}-${index}`} className="pt-1 font-black text-[#312d27]">
              {line.replace("## ", "")}
            </h3>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <p key={`${line}-${index}`} className="pl-4">
              <span className="mr-2 text-[#c95d3a]">•</span>
              {line.replace("- ", "")}
            </p>
          );
        }

        if (!line.trim()) {
          return <div key={`space-${index}`} className="h-1" />;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}
