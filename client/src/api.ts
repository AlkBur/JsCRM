import type { TreeNode } from "./types";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export function fetchTree(): Promise<TreeNode[]> {
  return get<TreeNode[]>("/tree");
}

export function fetchNode(nodeId: string): Promise<unknown> {
  return get("/node/" + encodeURIComponent(nodeId));
}
