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
  parent: string | null;
  owner: string | null;
  values: Record<string, unknown>;
}

export interface SnapshotMeta {
  id: string;
  object: string;
}

export type SnapshotPatch = Record<string, unknown>;
