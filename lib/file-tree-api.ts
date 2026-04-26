export type FileTreeEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  updatedAt: string | null;
  children?: FileTreeEntry[];
};

export type FileTreeSource = "desktop" | "repository";

export async function fetchFileTreeDir(
  rel: string,
  source: FileTreeSource = "desktop",
  options: { depth?: number } = {},
): Promise<FileTreeEntry[]> {
  const params = new URLSearchParams({ path: rel, source });
  if (typeof options.depth === "number") {
    params.set("depth", String(options.depth));
  }
  const res = await fetch(`/api/files?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { items: FileTreeEntry[] };
  return data.items;
}

export function buildFileTreeNodeId(
  path: string,
  source: FileTreeSource = "desktop",
) {
  return `file-tree-${source}-${path || "root"}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
}
