"use client";

import { GitBranch, GitCommitHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchGitTree,
  type GitTreeBranch,
  type GitTreeCommit,
  type GitTreeResponse,
} from "@/lib/git-tree-api";
import { cn } from "@/lib/utils";

const GRAPH_WIDTH = 276;
const TRUNK_X = 136;
const LEFT_LANE_X = 56;
const RIGHT_LANE_X = 222;
const GRAPH_TOP = 30;
const MAIN_STEP = 84;
const BRANCH_STEP = 58;
const BOTTOM_SPACE = 92;
const COLORS = ["#c7663b", "#77884b", "#4f7f96", "#a45b7a", "#8b6f36"];

type GitTreeSummary = {
  branchCount: number;
  commitCount: number;
};

type BranchLayout = {
  branch: GitTreeBranch;
  color: string;
  side: "left" | "right";
  laneX: number;
  baseY: number;
  labelShift: number;
  commitYs: number[];
};

function getBranchTone(branch: GitTreeBranch, mainBranch: string) {
  if (branch.current) return "current";
  if (branch.name === mainBranch) return "main";
  if (branch.ahead > 0) return `${branch.ahead} ahead`;
  return "merged";
}

function truncateLabel(value: string, max = 22) {
  if (value.length <= max) return value;
  if (max <= 4) return value.slice(0, max);
  return `${value.slice(0, Math.max(1, max - 3))}...`;
}

function matchesBranch(branch: GitTreeBranch, normalizedFilter: string) {
  if (!normalizedFilter) return true;
  return [branch.name, branch.shortName, branch.subject, branch.shortHead].some(
    (value) => value.toLowerCase().includes(normalizedFilter),
  );
}

function matchesCommit(commit: GitTreeCommit, normalizedFilter: string) {
  if (!normalizedFilter) return true;
  return [commit.subject, commit.shortHash, ...commit.refs].some((value) =>
    value.toLowerCase().includes(normalizedFilter),
  );
}

function getBranchColor(branch: GitTreeBranch, index: number) {
  if (branch.current) return COLORS[0];
  return COLORS[(index + 1) % COLORS.length];
}

function getBranchStatusLabel(branch: GitTreeBranch) {
  if (branch.current) return "作業中";
  if (branch.ahead > 0 && branch.behind > 0) {
    return `${branch.ahead} ahead / ${branch.behind} behind`;
  }
  if (branch.ahead > 0) return `${branch.ahead} ahead`;
  return "main 合流済み";
}

function MainCommitNode({
  commit,
  y,
  mainBranch,
}: {
  commit: GitTreeCommit;
  y: number;
  mainBranch: string;
}) {
  const isMerge = commit.parents.length > 1;
  const extraRefs = commit.refs.filter((ref) => ref !== mainBranch).slice(0, 2);

  return (
    <g>
      {isMerge ? (
        <>
          <circle
            cx={TRUNK_X}
            cy={y}
            r="9"
            fill="#f7f0e4"
            stroke="#372e27"
            strokeWidth="4"
          />
          <circle cx={TRUNK_X} cy={y} r="3" fill="#372e27" />
        </>
      ) : (
        <circle cx={TRUNK_X} cy={y} r="8" fill="#372e27" />
      )}
      {extraRefs.map((ref, index) => (
        <text
          key={ref}
          x={TRUNK_X + 16}
          y={y + 4 + index * 14}
          fill="#81786d"
          fontSize="10"
          fontWeight="700"
        >
          {truncateLabel(ref, 16)}
        </text>
      ))}
    </g>
  );
}

function BranchPath({ layout }: { layout: BranchLayout }) {
  const { branch, color, side, laneX, baseY, commitYs } = layout;
  const firstY = commitYs[0] ?? baseY - BRANCH_STEP;
  const headY = commitYs[commitYs.length - 1] ?? firstY;
  const curveControlX = side === "left" ? laneX + 44 : laneX - 44;
  const textAnchor = side === "left" ? "end" : "start";
  const labelX = side === "left" ? laneX - 10 : laneX + 10;
  const labelY = Math.max(22, headY - 9 + layout.labelShift);

  return (
    <g>
      <path
        d={[
          `M ${TRUNK_X} ${baseY}`,
          `C ${TRUNK_X} ${baseY - 28}, ${curveControlX} ${firstY + 28}, ${laneX} ${firstY}`,
        ].join(" ")}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      {commitYs.length > 1 && (
        <line
          x1={laneX}
          x2={laneX}
          y1={firstY}
          y2={headY}
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      )}
      <text
        x={labelX}
        y={labelY}
        fill={color}
        fontSize="11"
        fontWeight="800"
        textAnchor={textAnchor}
      >
        {truncateLabel(branch.shortName)}
      </text>
      {commitYs.map((y, index) => (
        <g key={`${branch.name}-${branch.commits[index]?.hash ?? index}`}>
          <circle cx={laneX} cy={y} r="6" fill={color} />
          {index === commitYs.length - 1 && (
            <circle cx={laneX} cy={y} r="2.25" fill="#fffefa" />
          )}
        </g>
      ))}
    </g>
  );
}

function getQuickBranches(branches: GitTreeBranch[], mainBranch: string) {
  const result: GitTreeBranch[] = [];
  const seen = new Set<string>();
  const add = (branch: GitTreeBranch | undefined) => {
    if (!branch || seen.has(branch.name)) return;
    seen.add(branch.name);
    result.push(branch);
  };

  add(branches.find((branch) => branch.current));
  add(branches.find((branch) => branch.name === mainBranch));
  branches
    .filter((branch) => branch.name !== mainBranch && !branch.current)
    .filter((branch) => branch.ahead > 0 || branch.behind > 0)
    .slice(0, 4)
    .forEach(add);

  return result;
}

function BranchSwitchButton({
  branch,
  active,
  mainBranch,
  onSelect,
}: {
  branch: GitTreeBranch;
  active: boolean;
  mainBranch: string;
  onSelect: (branchName: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(branch.name)}
      aria-pressed={active}
      title={branch.name}
      className={cn(
        "grid min-h-10 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 rounded border px-2 py-1 text-left transition",
        active
          ? "border-[#c7663b] bg-[#f3d2c7] text-[#8f3c27]"
          : "border-[#d8d1c4] bg-[#fffefa] text-[#6c6359] hover:border-[#c8a18e] hover:bg-[#fbf2eb]",
      )}
    >
      <GitBranch className="row-span-2 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 truncate text-[11px] font-black">
        {branch.name === mainBranch ? mainBranch : branch.shortName}
      </span>
      <span className="min-w-0 truncate text-[10px] text-current/70">
        {getBranchTone(branch, mainBranch)}
      </span>
    </button>
  );
}

function buildLayouts({
  data,
  filteredBranches,
  yByMainHash,
  fallbackBaseY,
}: {
  data: GitTreeResponse;
  filteredBranches: GitTreeBranch[];
  yByMainHash: Map<string, number>;
  fallbackBaseY: number;
}) {
  let leftCount = 0;
  let rightCount = 0;
  const branchCandidates = filteredBranches
    .filter((branch) => branch.name !== data.mainBranch)
    .filter((branch) => branch.ahead > 0 && branch.commits.length > 0);

  return branchCandidates.map((branch, index): BranchLayout => {
    let side: "left" | "right";
    if (branch.current) {
      side = "right";
    } else if (rightCount > leftCount) {
      side = "left";
    } else {
      side = "right";
    }
    const sideIndex = side === "left" ? leftCount++ : rightCount++;
    const laneOffset = sideIndex % 2 === 0 ? 0 : 12;
    const laneX =
      side === "left" ? LEFT_LANE_X - laneOffset : RIGHT_LANE_X + laneOffset;
    const baseY =
      (branch.base ? yByMainHash.get(branch.base) : undefined) ??
      fallbackBaseY;
    return {
      branch,
      color: getBranchColor(branch, index),
      side,
      laneX,
      baseY,
      labelShift: (sideIndex % 3) * 13,
      commitYs: branch.commits.map((_, commitIndex) => {
        return baseY - (commitIndex + 1) * BRANCH_STEP;
      }),
    };
  });
}

export function GitBranchTree({
  filter,
  onSummary,
}: {
  filter: string;
  onSummary: (summary: GitTreeSummary) => void;
}) {
  const [data, setData] = useState<GitTreeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    setError(null);
    fetchGitTree()
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        onSummary(nextData.stats);
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [onSummary]);

  const normalizedFilter = filter.trim().toLowerCase();
  const graph = useMemo(() => {
    if (!data) return null;
    const filteredBranches = data.branches.filter((branch) =>
      matchesBranch(branch, normalizedFilter),
    );
    const filteredMainCommits = data.mainCommits.filter((commit) =>
      matchesCommit(commit, normalizedFilter),
    );
    const drawableBranches = filteredBranches.filter(
      (branch) => branch.name !== data.mainBranch && branch.ahead > 0,
    );
    const maxBranchLead = Math.max(
      0,
      ...drawableBranches.map(
        (branch) => Math.max(1, branch.commits.length) * BRANCH_STEP,
      ),
    );
    const mainTopOffset = Math.max(86, Math.min(360, maxBranchLead + 34));
    const mainCommitCount = Math.max(1, data.mainCommits.length);
    const height = Math.max(
      420,
      GRAPH_TOP +
        mainTopOffset +
        (mainCommitCount - 1) * MAIN_STEP +
        BOTTOM_SPACE,
    );
    const yByMainHash = new Map(
      data.mainCommits.map((commit, index) => [
        commit.hash,
        GRAPH_TOP + mainTopOffset + index * MAIN_STEP,
      ]),
    );
    const fallbackBaseY =
      GRAPH_TOP + mainTopOffset + Math.min(3, mainCommitCount - 1) * MAIN_STEP;
    const branchLayouts = buildLayouts({
      data,
      filteredBranches,
      yByMainHash,
      fallbackBaseY,
    });

    return {
      filteredBranches,
      filteredMainCommits,
      height,
      mainTopOffset,
      yByMainHash,
      branchLayouts,
    };
  }, [data, normalizedFilter]);

  if (error) {
    return (
      <p className="px-2 py-2 text-xs leading-5 text-[#81786d]">
        Git tree を読み込めませんでした: {error}
      </p>
    );
  }
  if (!data || !graph) {
    return <p className="px-2 py-2 text-xs text-[#9a9084]">読み込み中...</p>;
  }

  const visibleBranchNames = new Set(
    graph.filteredBranches.map((branch) => branch.name),
  );
  const rootCommit = data.mainCommits[data.mainCommits.length - 1];
  const mainLineStart = GRAPH_TOP + 44;
  const mainLineEnd = graph.height - 76;
  const hasFilterResults =
    graph.filteredBranches.length > 0 || graph.filteredMainCommits.length > 0;

  if (!hasFilterResults) {
    return (
      <p className="px-2 py-2 text-xs text-[#9a9084]">
        該当するブランチがありません。
      </p>
    );
  }

  const quickBranches = getQuickBranches(
    graph.filteredBranches,
    data.mainBranch,
  );
  const selectedBranch =
    data.branches.find((branch) => branch.name === selectedBranchName) ??
    data.branches.find((branch) => branch.current) ??
    null;

  return (
    <div className="text-sm text-[#5f574d]">
      <div className="mb-2 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase text-[#312d27]">
            {data.repositoryName}
          </p>
          <p className="truncate text-[11px] text-[#81786d]">
            current: {data.currentBranch || "(detached)"}
          </p>
        </div>
        <div className="shrink-0 rounded border border-[#d8d1c4] bg-[#fffefa] px-2 py-1 text-[10px] font-bold text-[#6c6359]">
          {data.mainBranch}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-md border border-[#d8d0c2] bg-[#f7f1e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]">
        <svg
          role="img"
          aria-label="現在のリポジトリブランチを使ったGitツリー"
          viewBox={`0 0 ${GRAPH_WIDTH} ${graph.height}`}
          className="block w-full"
          style={{ height: graph.height }}
        >
          <defs>
            <pattern
              id="git-tree-dot-grid"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="rgba(55,48,38,0.13)" />
            </pattern>
          </defs>
          <rect width={GRAPH_WIDTH} height={graph.height} fill="#f7f1e6" />
          <rect
            width={GRAPH_WIDTH}
            height={graph.height}
            fill="url(#git-tree-dot-grid)"
          />
          <text x="16" y="22" fill="#a49a8e" fontSize="11" fontWeight="700">
            newer ↑
          </text>
          <text
            x={TRUNK_X}
            y="22"
            fill="#3b3029"
            fontSize="13"
            fontWeight="900"
            textAnchor="middle"
          >
            {data.mainBranch.toUpperCase()}
          </text>
          <line
            x1={TRUNK_X}
            x2={TRUNK_X}
            y1={mainLineStart}
            y2={mainLineEnd}
            stroke="#e8e0d2"
            strokeLinecap="round"
            strokeWidth="18"
          />
          <line
            x1={TRUNK_X}
            x2={TRUNK_X}
            y1={mainLineStart + 14}
            y2={mainLineEnd - 14}
            stroke="#372e27"
            strokeLinecap="round"
            strokeWidth="5"
          />
          {graph.branchLayouts.map((layout) => (
            <BranchPath key={layout.branch.name} layout={layout} />
          ))}
          {data.mainCommits.map((commit) => {
            const y = graph.yByMainHash.get(commit.hash);
            if (!y) return null;
            const dimmed =
              normalizedFilter &&
              !matchesCommit(commit, normalizedFilter) &&
              !commit.refs.some((ref) => visibleBranchNames.has(ref));
            return (
              <g key={commit.hash} opacity={dimmed ? 0.32 : 1}>
                <MainCommitNode
                  commit={commit}
                  y={y}
                  mainBranch={data.mainBranch}
                />
              </g>
            );
          })}
        </svg>
        {rootCommit && (
          <div className="absolute bottom-3 right-3 max-w-[174px] rotate-[-2deg] rounded-sm bg-[#f3da82] px-3 py-2 text-[#6f5b29] shadow-[0_2px_6px_rgba(83,67,37,0.22)]">
            <p className="text-[11px] font-black">ここが幹のねもと</p>
            <p className="truncate font-mono text-[10px]">
              {rootCommit.subject || "Initial commit"}
            </p>
          </div>
        )}
      </div>

      {quickBranches.length > 0 && (
        <div
          className="mt-3 rounded-md border border-[#d8d1c4] bg-[#f6f1e7] p-2"
          aria-label="ブランチ切り替え"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-[#312d27]">
              ブランチ切替
            </span>
            {selectedBranch && (
              <span className="min-w-0 truncate text-[10px] font-bold text-[#81786d]">
                {selectedBranch.shortHead}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickBranches.map((branch) => (
              <BranchSwitchButton
                key={branch.name}
                branch={branch}
                active={
                  selectedBranchName
                    ? branch.name === selectedBranchName
                    : branch.current
                }
                mainBranch={data.mainBranch}
                onSelect={setSelectedBranchName}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1" aria-label="ブランチ一覧">
        {graph.filteredBranches
          .filter((branch) => branch.name !== data.mainBranch)
          .map((branch, index) => {
            const color = getBranchColor(branch, index);
            return (
              <div
                key={branch.name}
                className={cn(
                  "flex min-h-8 items-center gap-2 rounded border px-2 py-1 text-[11px]",
                  selectedBranchName === branch.name &&
                    "border-[#c7663b] bg-[#fbf2eb]",
                  selectedBranchName !== branch.name && "border-transparent",
                  branch.current
                    ? "bg-[#f3d2c7] font-bold text-[#9f452c]"
                    : "text-[#6c6359]",
                )}
              >
                <GitBranch
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{branch.name}</span>
                <span className="shrink-0 text-[10px] text-[#8b8175]">
                  {getBranchStatusLabel(branch)}
                </span>
              </div>
            );
          })}
        {graph.filteredBranches.length === 1 &&
          graph.filteredBranches[0]?.name === data.mainBranch && (
            <div className="flex min-h-8 items-center gap-2 rounded px-2 py-1 text-[11px] text-[#6c6359]">
              <GitCommitHorizontal
                className="h-3.5 w-3.5 shrink-0 text-[#81786d]"
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">
                {data.mainBranch} の幹だけを表示中
              </span>
            </div>
          )}
      </div>
    </div>
  );
}
