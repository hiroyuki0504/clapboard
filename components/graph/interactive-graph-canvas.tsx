"use client";

import { CircleDot } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode, GraphTone } from "@/lib/graph-model";

const graphWidth = 1000;
const graphHeight = 520;
const nodeWidthPx = 220;
const nodeHeightPx = 58;
const dragThresholdPx = 4;

const toneClass: Record<GraphTone, string> = {
  project: "border-[#d66b43] text-[#9a4a31]",
  task: "border-[#423c33] text-[#312d27]",
  file: "border-[#8aa0b8] text-[#315a78]",
  minute: "border-[#b89b48] text-[#7c5a18]",
  support: "border-[#93aa8d] text-[#426c3d]",
};

type NodePositions = Record<string, { x: number; y: number }>;

type DragState = {
  nodeId: string;
  offsetX: number;
  offsetY: number;
  startClientX: number;
  startClientY: number;
};

export function InteractiveGraphCanvas({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const [positions, setPositions] = useState<NodePositions>(() =>
    getInitialPositions(nodes),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const layoutKey = nodes
    .map((node) => `${node.id}:${node.x}:${node.y}:${node.label}:${node.sub}`)
    .join("|");
  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  useEffect(() => {
    setPositions(getInitialPositions(nodes));
  }, [layoutKey, nodes]);

  function handlePointerDown(
    event: React.PointerEvent<HTMLAnchorElement | HTMLDivElement>,
    node: GraphNode,
  ) {
    const pointerPosition = getPointerPosition(event, canvasRef.current);

    if (pointerPosition == null) {
      return;
    }

    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);

    const nodePosition = getNodePosition(node, positions);
    setDragState({
      nodeId: node.id,
      offsetX: pointerPosition.x - nodePosition.x,
      offsetY: pointerPosition.y - nodePosition.y,
      startClientX: event.clientX,
      startClientY: event.clientY,
    });
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLAnchorElement | HTMLDivElement>,
  ) {
    if (dragState == null) {
      return;
    }

    const pointerPosition = getPointerPosition(event, canvasRef.current);
    const node = nodeById.get(dragState.nodeId);

    if (pointerPosition == null || node == null) {
      return;
    }

    const moved =
      Math.abs(event.clientX - dragState.startClientX) > dragThresholdPx ||
      Math.abs(event.clientY - dragState.startClientY) > dragThresholdPx;

    if (moved) {
      suppressClickRef.current = true;
    }

    const nextPosition = clampNodePosition(canvasRef.current, {
      x: pointerPosition.x - dragState.offsetX,
      y: pointerPosition.y - dragState.offsetY,
    });

    setPositions((current) => ({
      ...current,
      [node.id]: nextPosition,
    }));
  }

  function handlePointerEnd() {
    setDragState(null);
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    suppressClickRef.current = false;
  }

  return (
    <div
      ref={canvasRef}
      className="dotted-canvas relative min-h-[520px] min-w-[680px] bg-[#fffefa]"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        role="img"
        aria-label="ワーク、タスク、議事録、ファイルの関係線"
      >
        {edges.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) return null;

          const fromPosition = getNodePosition(from, positions);
          const toPosition = getNodePosition(to, positions);

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={fromPosition.x}
              y1={fromPosition.y}
              x2={toPosition.x}
              y2={toPosition.y}
              stroke="#c8c0b4"
              strokeLinecap="round"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {nodes.map((node) => {
        const nodePosition = getNodePosition(node, positions);
        const commonProps = {
          className: `absolute z-10 w-[220px] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none rounded-full border bg-[#fffefa] px-3 py-2 text-left shadow-sm transition active:cursor-grabbing ${
            toneClass[node.tone]
          } ${dragState?.nodeId === node.id ? "z-20 ring-2 ring-[#d5a33f]" : ""}`,
          style: {
            left: `${(nodePosition.x / graphWidth) * 100}%`,
            top: `${(nodePosition.y / graphHeight) * 100}%`,
          },
          onPointerDown: (
            event: React.PointerEvent<HTMLAnchorElement | HTMLDivElement>,
          ) => handlePointerDown(event, node),
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerEnd,
          onPointerCancel: handlePointerEnd,
          onLostPointerCapture: handlePointerEnd,
        };
        const content = (
          <>
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate text-sm font-black">
                {node.label}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-[#81786d]">{node.sub}</p>
          </>
        );

        if (!node.href) {
          return (
            <div key={node.id} {...commonProps}>
              {content}
            </div>
          );
        }

        return (
          <Link
            key={node.id}
            href={node.href}
            aria-label={`${node.label}を開く`}
            draggable={false}
            onClick={handleClick}
            {...commonProps}
          >
            {content}
          </Link>
        );
      })}

      <div className="pointer-events-none absolute bottom-6 left-6 max-w-xs rotate-[-1deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-4 py-3 text-sm font-bold leading-6 text-[#6f5415] shadow-sm">
        赤枠は停滞リスク。線はワーク、タスク、議事録、ファイルの参照関係です。
      </div>
    </div>
  );
}

function getInitialPositions(nodes: GraphNode[]): NodePositions {
  return Object.fromEntries(
    nodes.map((node) => [node.id, { x: node.x, y: node.y }]),
  );
}

function getNodePosition(node: GraphNode, positions: NodePositions) {
  return positions[node.id] ?? { x: node.x, y: node.y };
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
    x: ((event.clientX - rect.left) / rect.width) * graphWidth,
    y: ((event.clientY - rect.top) / rect.height) * graphHeight,
  };
}

function clampNodePosition(
  canvas: HTMLDivElement | null,
  position: { x: number; y: number },
) {
  const rect = canvas?.getBoundingClientRect();
  const nodeHalfWidth =
    rect != null && rect.width > 0
      ? (nodeWidthPx / rect.width) * graphWidth * 0.5
      : nodeWidthPx * 0.5;
  const nodeHalfHeight =
    rect != null && rect.height > 0
      ? (nodeHeightPx / rect.height) * graphHeight * 0.5
      : nodeHeightPx * 0.5;

  return {
    x: Math.min(Math.max(position.x, nodeHalfWidth), graphWidth - nodeHalfWidth),
    y: Math.min(
      Math.max(position.y, nodeHalfHeight),
      graphHeight - nodeHalfHeight,
    ),
  };
}
