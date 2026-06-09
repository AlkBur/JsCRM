import type { SnapshotKey, ObjectRef, ObjectSnapshot, SnapshotPatch } from "./snapshot-types";

export interface SnapshotStore {
  list(objectName: string): Promise<ObjectRef[]>;
  load(key: SnapshotKey): Promise<ObjectSnapshot | null>;
  savePatch(key: SnapshotKey, patch: SnapshotPatch): Promise<void>;
}
