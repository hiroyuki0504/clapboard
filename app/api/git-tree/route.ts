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
const REF_FORMAT = `%(refname:short)%1f%(objectname)%1f%(objectname:short)%1f%(committerdate:iso8601-strict)%1f%(contents:subject)%1e`;
const MAX_MAIN_COMMITS = 14;
const MAX_BRANCH_COMMITS = 6;

type LocalBranch = {
  name: string;
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

function parseLocalBranches(output: string): LocalBranch[] {
  return splitRecords(output)
    .map((record) => {
      const [name, head, shortHead, date, subject] = record.split(FIELD);
      if (!name || !head || !shortHead) return null;
      return {
        name,
        head,
        shortHead,
        date: date || null,
        subject: subject || "(no subject)",
      };
    })
    .filter((branch): branch is LocalBranch => branch !== null);
}

function pickMainBranch(branches: LocalBranch[], currentBranch: string) {
  if (branches.some((branch) => branch.name === "main")) return "main";
  if (branches.some((branch) => branch.name === "master")) return "master";
  return currentBranch || branches[0]?.name || "main";
}

function makeShortBranchName(name: string) {
  if (!name.includes("/")) return name;
  const segments = name.split("/").filter(Boolean);
  return segments.at(-1) ?? name;
}

function attachRefsToMainCommits(
  mainCommits: GitTreeCommit[],
  branches: LocalBranch[],
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
  mainBranch,
  branchName,
}: {
  repoRoot: string;
  mainBranch: string;
  branchName: string;
}) {
  const output = await git(
    ["rev-list", "--left-right", "--count", `${mainBranch}...${branchName}`],
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
  mainBranch,
  repoRoot,
}: {
  branch: LocalBranch;
  currentBranch: string;
  mainBranch: string;
  repoRoot: string;
}): Promise<GitTreeBranch> {
  const base = await git(["merge-base", mainBranch, branch.name], repoRoot).catch(
    () => "",
  );
  const baseShort = base
    ? await git(["rev-parse", "--short", base], repoRoot).catch(() => "")
    : "";
  const { ahead, behind } = await readAheadBehind({
    repoRoot,
    mainBranch,
    branchName: branch.name,
  }).catch(() => ({ ahead: 0, behind: 0 }));
  const commits =
    branch.name === mainBranch || !base || ahead === 0
      ? []
      : await git(
          [
            "log",
            "--reverse",
            "--date=iso-strict",
            `--pretty=format:${COMMIT_FORMAT}`,
            `--max-count=${MAX_BRANCH_COMMITS}`,
            `${base}..${branch.name}`,
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
    current: branch.name === currentBranch,
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
    const branchOutput = await git(
      ["for-each-ref", `--format=${REF_FORMAT}`, "refs/heads"],
      repoRoot,
    );
    const localBranches = parseLocalBranches(branchOutput);
    const mainBranch = pickMainBranch(localBranches, currentBranch);
    const mainOutput = await git(
      [
        "log",
        "--first-parent",
        "--date=iso-strict",
        `--pretty=format:${COMMIT_FORMAT}`,
        `--max-count=${MAX_MAIN_COMMITS}`,
        mainBranch,
      ],
      repoRoot,
    );
    const mainCommits = attachRefsToMainCommits(
      parseCommits(mainOutput),
      localBranches,
    );
    const branches = await Promise.all(
      localBranches.map((branch) =>
        readBranchDetails({
          branch,
          currentBranch,
          mainBranch,
          repoRoot,
        }),
      ),
    );
    const commitHeads = new Set([
      ...mainCommits.map((commit) => commit.hash),
      ...localBranches.map((branch) => branch.head),
    ]);
    const response: GitTreeResponse = {
      repositoryName: path.basename(repoRoot),
      mainBranch,
      currentBranch,
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
        branchCount: localBranches.length,
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
