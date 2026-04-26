"use client";

import { Network } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";

type DependencyNodeTone = "project" | "task" | "file" | "minute";

type DependencyNode = {
  id: string;
  label: string;
  tone: DependencyNodeTone;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DependencyEdge = {
  from: string;
  to: string;
};

type NodePositions = Record<string, { x: number; y: number }>;

type DragState = {
  nodeId: string;
  offsetX: number;
  offsetY: number;
};

const toneClass: Record<DependencyNodeTone, string> = {
  project: "border-[#d66b43] text-[#9a4a31]",
  task: "border-[#423c33] text-[#312d27]",
  file: "border-[#423c33] text-[#312d27]",
  minute: "border-[#423c33] text-[#312d27]",
};

export function DependencyGraphCard({ projects }: { projects: Project[] }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const focus = [...projects].sort(
    (a, b) =>
      getHighPriorityOpenTaskCount(b.tasks) -
      getHighPriorityOpenTaskCount(a.tasks),
  )[0];
  const focusLabel = focus
    ? `${focus.name.slice(0, 8)} ${focus.progress}%`
    : "進捗未取得";
  const blocker = focus?.tasks.find(
    (task) => !task.completed && task.priority === "high",
  );
  const minute = focus?.minutes[0];
  const file = focus?.files[0];
  const nodes: DependencyNode[] = [
    {
      id: "project",
      label: focusLabel,
      tone: "project",
      x: 6,
      y: 24,
      width: 40,
      height: 24,
    },
    {
      id: "task",
      label: blocker?.title.slice(0, 10) ?? "未完了タスク",
      tone: "task",
      x: 31,
      y: 58,
      width: 35,
      height: 24,
    },
    {
      id: "file",
      label: file?.name.slice(0, 10) ?? "関連ファイル",
      tone: "file",
      x: 68,
      y: 45,
      width: 32,
      height: 24,
    },
    {
      id: "minute",
      label: minute?.title.slice(0, 10) ?? "進捗メモ",
      tone: "minute",
      x: 50,
      y: 20,
      width: 29,
      height: 24,
    },
  ];
  const edges: DependencyEdge[] = [
    { from: "project", to: "task" },
    { from: "task", to: "minute" },
    { from: "minute", to: "file" },
  ];
  const layoutKey = nodes.map((node) => `${node.id}:${node.label}`).join("|");
  const [positions, setPositions] = useState<NodePositions>(() =>
    getInitialPositions(nodes),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    setPositions(getInitialPositions(nodes));
  }, [layoutKey]);

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    node: DependencyNode,
  ) {
    const pointerPosition = getPointerPosition(event, canvasRef.current);

    if (pointerPosition == null) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const nodePosition = getNodePosition(node, positions);

    setDragState({
      nodeId: node.id,
      offsetX: pointerPosition.x - nodePosition.x,
      offsetY: pointerPosition.y - nodePosition.y,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragState == null) {
      return;
    }

    const pointerPosition = getPointerPosition(event, canvasRef.current);
    const node = nodes.find((item) => item.id === dragState.nodeId);

    if (pointerPosition == null || node == null) {
      return;
    }

    setPositions((current) => ({
      ...current,
      [node.id]: clampNodePosition(node, {
        x: pointerPosition.x - dragState.offsetX,
        y: pointerPosition.y - dragState.offsetY,
      }),
    }));
  }

  function handlePointerEnd() {
    setDragState(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4" aria-hidden />
          <CardTitle>進捗依存グラフ</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">blocked path</span>
      </CardHeader>
      <CardContent>
        <div
          ref={canvasRef}
          className="dotted-canvas relative h-52 overflow-hidden rounded-md border border-[#d8d1c4] bg-[#fffefa]"
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            {edges.map((edge) => {
              const line = getEdgeLine(edge, nodes, positions);

              if (line == null) {
                return null;
              }

              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={`${line.x1}%`}
                  y1={`${line.y1}%`}
                  x2={`${line.x2}%`}
                  y2={`${line.y2}%`}
                  stroke="#c8c0b4"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {nodes.map((node) => {
            const position = getNodePosition(node, positions);

            return (
              <button
                key={node.id}
                type="button"
                className={`absolute z-10 flex cursor-grab touch-none select-none items-center justify-center rounded-full border bg-[#fffefa] px-3 text-xs font-bold shadow-sm transition active:cursor-grabbing ${
                  toneClass[node.tone]
                } ${dragState?.nodeId === node.id ? "z-20 ring-2 ring-[#d5a33f]" : ""}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${node.width}%`,
                  height: `${node.height}%`,
                }}
                aria-label={`${node.label} ノード`}
                onPointerDown={(event) => handlePointerDown(event, node)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onLostPointerCapture={handlePointerEnd}
              >
                <span className="truncate">{node.label}</span>
              </button>
            );
          })}

          <div className="pointer-events-none absolute bottom-5 left-7 rotate-[-2deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415] shadow-sm">
            線 = 依存関係 / 赤枠 = 停滞ポイント
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getInitialPositions(nodes: DependencyNode[]): NodePositions {
  return Object.fromEntries(
    nodes.map((node) => [
      node.id,
      clampNodePosition(node, { x: node.x, y: node.y }),
    ]),
  );
}

function getNodePosition(node: DependencyNode, positions: NodePositions) {
  return positions[node.id] ?? { x: node.x, y: node.y };
}

function clampNodePosition(
  node: DependencyNode,
  position: { x: number; y: number },
) {
  return {
    x: Math.min(Math.max(position.x, 0), 100 - node.width),
    y: Math.min(Math.max(position.y, 0), 100 - node.height),
  };
}

function getPointerPosition(
  event: React.PointerEvent<HTMLElement>,
  canvas: HTMLDivElement | null,
) {
  const rect = canvas?.getBoundingClientRect();

  if (rect == null || rect.width === 0 || rect.height === 0) {
    return null;
  }

  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function getEdgeLine(
  edge: DependencyEdge,
  nodes: DependencyNode[],
  positions: NodePositions,
) {
  const from = nodes.find((node) => node.id === edge.from);
  const to = nodes.find((node) => node.id === edge.to);

  if (from == null || to == null) {
    return null;
  }

  const fromPosition = getNodePosition(from, positions);
  const toPosition = getNodePosition(to, positions);

  return {
    x1: fromPosition.x + from.width / 2,
    y1: fromPosition.y + from.height / 2,
    x2: toPosition.x + to.width / 2,
    y2: toPosition.y + to.height / 2,
  };
}
