import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Policy = {
  id: string;
  title: string;
  value: string;
  body: string;
};

export function PolicyListCard({ policies }: { policies: Policy[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <CardTitle>ノーコード運用ルール</CardTitle>
        </div>
        <Badge tone="green">PM gate</Badge>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="grid gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0 sm:grid-cols-[160px_1fr]"
          >
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
                {policy.value}
              </p>
              <p className="mt-1 font-bold text-[#312d27]">{policy.title}</p>
            </div>
            <p className="text-sm leading-6 text-[#70675b]">{policy.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
