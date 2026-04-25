export type FileTreeEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  updatedAt: string | null;
};

export async function fetchFileTreeDir(
  rel: string,
): Promise<FileTreeEntry[]> {
  const res = await fetch(`/api/files?path=${encodeURIComponent(rel)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { items: FileTreeEntry[] };
  return data.items;
}

export function buildFileTreeNodeId(path: string) {
  return `file-tree-${path || "root"}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}
