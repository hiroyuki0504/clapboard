export type GitTreeCommit = {
  hash: string;
  shortHash: string;
  parents: string[];
  date: string | null;
  subject: string;
  refs: string[];
};

export type GitTreeBranch = {
  name: string;
  shortName: string;
  head: string;
  shortHead: string;
  date: string | null;
  subject: string;
  current: boolean;
  base: string | null;
  baseShort: string | null;
  ahead: number;
  behind: number;
  commits: GitTreeCommit[];
};

export type GitTreeResponse = {
  repositoryName: string;
  mainBranch: string;
  currentBranch: string;
  generatedAt: string;
  mainCommits: GitTreeCommit[];
  branches: GitTreeBranch[];
  stats: {
    branchCount: number;
    commitCount: number;
  };
};

export async function fetchGitTree(): Promise<GitTreeResponse> {
  const res = await fetch("/api/git-tree", { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as GitTreeResponse;
}
