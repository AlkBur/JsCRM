import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import type { SnapshotKey, ObjectRef, ObjectSnapshot, SnapshotPatch } from "./snapshot-types";
import type { SnapshotStore } from "./SnapshotStore";
import { parseObjectName } from "../core/object-name";

interface CollectionFile {
  meta: { object: string; schemaVersion: number; metadataVersion: number };
  items: CollectionItem[];
}

interface CollectionItem {
  id: string;
  values: Record<string, unknown>;
}

export class FilesystemSnapshotStore implements SnapshotStore {
  private readonly sourceDir: string;
  private readonly pendingDir: string;

  constructor(sourceDir: string, pendingDir: string) {
    this.sourceDir = sourceDir;
    this.pendingDir = pendingDir;
  }

  private collectionPath(objectName: string): string {
    const p = parseObjectName(objectName);
    return join(this.sourceDir, p.kind, `${p.name}.json`);
  }

  private loadCollection(objectName: string): CollectionFile {
    const path = this.collectionPath(objectName);
    if (!existsSync(path)) {
      return { meta: { object: objectName, schemaVersion: 1, metadataVersion: 1 }, items: [] };
    }
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  private pendingPath(key: SnapshotKey): string {
    const p = parseObjectName(key.object);
    return join(this.pendingDir, p.kind, `${p.name}_${key.id}.json`);
  }

  private loadPending(key: SnapshotKey): CollectionItem | null {
    const path = this.pendingPath(key);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  private findInCollection(objectName: string, id: string): CollectionItem | null {
    const col = this.loadCollection(objectName);
    return col.items.find(i => i.id === id) ?? null;
  }

  async list(objectName: string): Promise<ObjectRef[]> {
    const col = this.loadCollection(objectName);
    const p = parseObjectName(objectName);
    return col.items.map(i => {
      const presentation =
        p.kind === "Catalog"
          ? (i.values["Description"] as string)
            || (i.values["Code"] as string)
            || i.id
          : (i.values["Number"] as string)
            || (i.values["Date"] as string)
            || i.id;
      return {
        id: i.id,
        // TODO(M6): extract to ObjectPresentationProvider — SnapshotStore should not know presentation rules
        label: presentation,
      };
    });
  }

  async load(key: SnapshotKey): Promise<ObjectSnapshot | null> {
    const pending = this.loadPending(key);
    const source = this.findInCollection(key.object, key.id);
    const item = pending ?? source;
    if (!item) return null;
    return {
      meta: { id: item.id, object: key.object },
      values: { ...item.values },
    };
  }

  async savePatch(key: SnapshotKey, patch: SnapshotPatch): Promise<void> {
    const p = parseObjectName(key.object);
    const dir = join(this.pendingDir, p.kind);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const pendingPath = join(dir, `${p.name}_${key.id}.json`);

    const existing = this.loadPending(key) ?? this.findInCollection(key.object, key.id);
    const base = existing ?? { id: key.id, values: {} };
    const merged = { ...base, values: { ...base.values, ...patch } };
    writeFileSync(pendingPath, JSON.stringify(merged, null, 2), "utf-8");
  }
}
