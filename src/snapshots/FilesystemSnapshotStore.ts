import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import type { SnapshotKey, ObjectRef, ObjectSnapshot, SnapshotPatch } from "./snapshot-types";
import type { SnapshotStore } from "./SnapshotStore";

interface CollectionFile {
  meta: { object: string; schemaVersion: number; metadataVersion: number };
  items: CollectionItem[];
}

interface CollectionItem {
  id: string;
  parent: string | null;
  owner: string | null;
  values: Record<string, unknown>;
}

export class FilesystemSnapshotStore implements SnapshotStore {
  private readonly sourceDir: string;
  private readonly pendingDir: string;

  constructor(sourceDir: string, pendingDir: string) {
    this.sourceDir = sourceDir;
    this.pendingDir = pendingDir;
  }

  private loadCollection(objectName: string): CollectionFile {
    const path = join(this.sourceDir, `${objectName}.json`);
    if (!existsSync(path)) {
      return { meta: { object: objectName, schemaVersion: 1, metadataVersion: 1 }, items: [] };
    }
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  private loadPending(key: SnapshotKey): CollectionItem | null {
    const path = join(this.pendingDir, key.object, `${key.id}.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  private findInCollection(objectName: string, id: string): CollectionItem | null {
    const col = this.loadCollection(objectName);
    return col.items.find(i => i.id === id) ?? null;
  }

  async list(objectName: string): Promise<ObjectRef[]> {
    const col = this.loadCollection(objectName);
    return col.items.map(i => ({
      id: i.id,
      label: (i.values["Description"] as string) || (i.values["Code"] as string) || i.id,
    }));
  }

  async load(key: SnapshotKey): Promise<ObjectSnapshot | null> {
    const pending = this.loadPending(key);
    const source = this.findInCollection(key.object, key.id);
    const item = pending ?? source;
    if (!item) return null;
    return {
      meta: { id: item.id, object: key.object },
      parent: item.parent,
      owner: item.owner,
      values: { ...item.values },
    };
  }

  async savePatch(key: SnapshotKey, patch: SnapshotPatch): Promise<void> {
    const pendingPath = join(this.pendingDir, key.object, `${key.id}.json`);
    const dir = dirname(pendingPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const existing = this.loadPending(key) ?? this.findInCollection(key.object, key.id);
    const base = existing ?? { id: key.id, parent: null, owner: null, values: {} };
    const merged = { ...base, values: { ...base.values, ...patch } };
    writeFileSync(pendingPath, JSON.stringify(merged, null, 2), "utf-8");
  }
}
