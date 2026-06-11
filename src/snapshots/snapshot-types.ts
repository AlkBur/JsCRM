export interface SnapshotKey {
  object: string;
  id: string;
}

export interface ObjectRef {
  id: string;
  label: string;
}

export interface ObjectSnapshot {
  meta: SnapshotMeta;
  values: Record<string, unknown>;
}

export interface SnapshotMeta {
  id: string;
  object: string;
}

export type SnapshotPatch = Record<string, unknown>;
