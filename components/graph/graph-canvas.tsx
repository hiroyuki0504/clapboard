import { InteractiveGraphCanvas } from "@/components/graph/interactive-graph-canvas";
import type { GraphModel } from "@/lib/graph-model";

export function GraphCanvas({ model }: { model: GraphModel }) {
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <InteractiveGraphCanvas nodes={model.nodes} edges={model.edges} />
    </div>
  );
}
