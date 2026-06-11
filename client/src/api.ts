import type { TreeNode, ObjectRef, ObjectSnapshot, ActionResult } from "./types";

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

export function fetchObjectList(objectName: string): Promise<ObjectRef[]> {
  return get(`/object-list/${encodeURIComponent(objectName)}`);
}

export function fetchObject(objectName: string, id: string): Promise<ObjectSnapshot> {
  return get(`/object/${encodeURIComponent(objectName)}/${encodeURIComponent(id)}`);
}

export function postAction(action: { type: string; payload?: unknown }): Promise<ActionResult> {
  return fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  }).then(r => r.json());
}
