import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type {
  GitTreeBranch,
  GitTreeCommit,
  GitTreeResponse,
} from "@/lib/git-tree-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const FIELD = "\u001f";
const RECORD = "\u001e";
const COMMIT_FORMAT = `%H%x1f%h%x1f%P%x1f%ad%x1f%s%x1e`;
const REF_FORMAT = `%(refname)%1f%(refname:short)%1f%(objectname)%1f%(objectname:short)%1f%(committerdate:iso8601-strict)%1f%(contents:subject)%1e`;
const MAX_MAIN_COMMITS = 14;
const MAX_BRANCH_COMMITS = 6;

type BranchRef = {
  name: string;
  refName: string;
  shortRefName: string;
  head: string;
  shortHead: string;
  date: string | null;
  subject: string;
};

async function git(args: string[], cwd = process.cwd()) {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 1024 * 1024,
  });
  return String(stdout).trim();
}

function splitRecords(output: string) {
  return output
    .split(RECORD)
    .map((record) => record.trim())
    .filter(Boolean);
}

function parseCommitRecord(record: string): GitTreeCommit | null {
  const [hash, shortHash, parentsRaw, date, subject] = record.split(FIELD);
  if (!hash || !shortHash) return null;
  return {
    hash,
    shortHash,
    parents: parentsRaw ? parentsRaw.split(" ").filter(Boolean) : [],
    date: date || null,
    subject: subject || "(no subject)",
    refs: [],
  };
}

function parseCommits(output: string): GitTreeCommit[] {
  return splitRecords(output)
    .map(parseCommitRecord)
    .filter((commit): commit is GitTreeCommit => commit !== null);
}

function makeBranchName(refName: string, shortRefName: string) {
  if (refName.startsWith("refs/heads/")) return shortRefName;
  if (!refName.startsWith("refs/remotes/")) return shortRefName;

  const segments = refName.split("/");
  const remoteName = segments[2];
  const branchName = segments.slice(3).join("/");
  if (!remoteName || !branchName || branchName === "HEAD") return null;
  return remoteName === "origin" ? branchName : `${remoteName}/${branchName}`;
}

function parseBranchRefs(output: string): BranchRef[] {
  return splitRecords(output)
    .map((record) => {
      const [refName, shortRefName, head, shortHead, date, subject] =
        record.split(FIELD);
      if (!refName || !shortRefName || !head || !shortHead) return null;
      if (refName.endsWith("/HEAD")) return null;
      const name = makeBranchName(refName, shortRefName);
      if (!name) return null;
      return {
        name,
        refName,
        shortRefName,
        head,
        shortHead,
        date: date || null,
        subject: subject || "(no subject)",
      };
    })
    .filter((branch): branch is BranchRef => branch !== null);
}

function pickMainBranch(branches: BranchRef[], currentBranch: string) {
  if (branches.some((branch) => branch.name === "main")) return "main";
  if (branches.some((branch) => branch.name === "master")) return "master";
  return currentBranch || branches[0]?.name || "main";
}

function pickBranchRef(
  branches: BranchRef[],
  mainBranch: string,
  currentBranch: string,
  headHash: string,
) {
  return branches.sort((a, b) => {
    const priority = (branch: BranchRef) => {
      if (branch.head === headHash) return -1;
      if (branch.name === mainBranch) {
        if (branch.shortRefName === `origin/${mainBranch}`) return 0;
        if (branch.refName === `refs/heads/${mainBranch}`) return 1;
      }
      if (
        branch.name === currentBranch &&
        branch.refName.startsWith("refs/heads/")
      ) {
        return 0;
      }
      if (branch.shortRefName === `origin/${branch.name}`) return 1;
      if (branch.refName.startsWith("refs/heads/")) return 2;
      return 3;
    };
    return priority(a) - priority(b);
  })[0];
}

function dedupeBranchRefs({
  branchRefs,
  currentBranch,
  headHash,
  mainBranch,
}: {
  branchRefs: BranchRef[];
  currentBranch: string;
  headHash: string;
  mainBranch: string;
}) {
  const byName = new Map<string, BranchRef[]>();
  for (const branch of branchRefs) {
    byName.set(branch.name, [...(byName.get(branch.name) ?? []), branch]);
  }

  return Array.from(byName.values())
    .map((branches) =>
      pickBranchRef(branches, mainBranch, currentBranch, headHash),
    )
    .filter((branch): branch is BranchRef => branch !== undefined);
}

function makeShortBranchName(name: string) {
  if (!name.includes("/")) return name;
  const segments = name.split("/").filter(Boolean);
  return segments.at(-1) ?? name;
}

function attachRefsToMainCommits(
  mainCommits: GitTreeCommit[],
  branches: BranchRef[],
) {
  const refsByHead = new Map<string, string[]>();
  for (const branch of branches) {
    refsByHead.set(branch.head, [
      ...(refsByHead.get(branch.head) ?? []),
      branch.name,
    ]);
  }
  return mainCommits.map((commit) => ({
    ...commit,
    refs: refsByHead.get(commit.hash) ?? [],
  }));
}

async function readAheadBehind({
  repoRoot,
  mainRef,
  branchRef,
}: {
  repoRoot: string;
  mainRef: string;
  branchRef: string;
}) {
  const output = await git(
    ["rev-list", "--left-right", "--count", `${mainRef}...${branchRef}`],
    repoRoot,
  );
  const [behindRaw, aheadRaw] = output.split(/\s+/);
  return {
    behind: Number(behindRaw) || 0,
    ahead: Number(aheadRaw) || 0,
  };
}

async function readBranchDetails({
  branch,
  currentBranch,
  headHash,
  mainRef,
  repoRoot,
}: {
  branch: BranchRef;
  currentBranch: string;
  headHash: string;
  mainRef: string;
  repoRoot: string;
}): Promise<GitTreeBranch> {
  const base = await git(["merge-base", mainRef, branch.refName], repoRoot).catch(
    () => "",
  );
  const baseShort = base
    ? await git(["rev-parse", "--short", base], repoRoot).catch(() => "")
    : "";
  const { ahead, behind } = await readAheadBehind({
    repoRoot,
    mainRef,
    branchRef: branch.refName,
  }).catch(() => ({ ahead: 0, behind: 0 }));
  const commits =
    branch.refName === mainRef || !base || ahead === 0
      ? []
      : await git(
          [
            "log",
            "--reverse",
            "--date=iso-strict",
            `--pretty=format:${COMMIT_FORMAT}`,
            `--max-count=${MAX_BRANCH_COMMITS}`,
            `${base}..${branch.refName}`,
          ],
          repoRoot,
        )
          .then(parseCommits)
          .catch(() => []);

  return {
    name: branch.name,
    shortName: makeShortBranchName(branch.name),
    head: branch.head,
    shortHead: branch.shortHead,
    date: branch.date,
    subject: branch.subject,
    current: branch.name === currentBranch || branch.head === headHash,
    base: base || null,
    baseShort: baseShort || null,
    ahead,
    behind,
    commits,
  };
}

export async function GET() {
  try {
    const repoRoot = await git(["rev-parse", "--show-toplevel"]);
    const currentBranch = await git(["branch", "--show-current"], repoRoot);
    const headHash = await git(["rev-parse", "HEAD"], repoRoot);
    const branchOutput = await git(
      ["for-each-ref", `--format=${REF_FORMAT}`, "refs/heads", "refs/remotes"],
      repoRoot,
    );
    const branchRefs = parseBranchRefs(branchOutput);
    const mainBranch = pickMainBranch(branchRefs, currentBranch);
    const branchesForTree = dedupeBranchRefs({
      branchRefs,
      currentBranch,
      headHash,
      mainBranch,
    });
    const mainRef =
      branchesForTree.find((branch) => branch.name === mainBranch)?.refName ??
      mainBranch;
    const currentDisplayBranch =
      currentBranch ||
      branchesForTree.find((branch) => branch.head === headHash)?.name ||
      "";
    const mainOutput = await git(
      [
        "log",
        "--first-parent",
        "--date=iso-strict",
        `--pretty=format:${COMMIT_FORMAT}`,
        `--max-count=${MAX_MAIN_COMMITS}`,
        mainRef,
      ],
      repoRoot,
    );
    const mainCommits = attachRefsToMainCommits(
      parseCommits(mainOutput),
      branchesForTree,
    );
    const branches = await Promise.all(
      branchesForTree.map((branch) =>
        readBranchDetails({
          branch,
          currentBranch: currentDisplayBranch,
          headHash,
          mainRef,
          repoRoot,
        }),
      ),
    );
    const commitHeads = new Set([
      ...mainCommits.map((commit) => commit.hash),
      ...branchesForTree.map((branch) => branch.head),
    ]);
    const response: GitTreeResponse = {
      repositoryName: path.basename(repoRoot),
      mainBranch,
      currentBranch: currentDisplayBranch,
      generatedAt: new Date().toISOString(),
      mainCommits,
      branches: branches.sort((a, b) => {
        if (a.name === mainBranch) return -1;
        if (b.name === mainBranch) return 1;
        if (a.current) return -1;
        if (b.current) return 1;
        return b.ahead - a.ahead || a.name.localeCompare(b.name);
      }),
      stats: {
        branchCount: branchesForTree.length,
        commitCount: commitHeads.size,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "git tree could not be loaded";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
