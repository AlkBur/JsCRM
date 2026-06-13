import { fetchObjectList } from "../api";

const cache = new Map<string, Promise<readonly { id: string; label: string }[]>>();

export function loadReferenceList(
  objectName: string,
): Promise<readonly { id: string; label: string }[]> {
  let p = cache.get(objectName);
  if (!p) {
    p = fetchObjectList(objectName);
    cache.set(objectName, p);
  }
  return p;
}

export function clearReferenceCache(): void {
  cache.clear();
}
