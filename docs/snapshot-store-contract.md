# SnapshotStore Contract

## Responsibility

Provides access to object instance data (snapshots).
Abstracts over storage backend — JSON files, SQL, HTTP exchange, or sync engine.

## Owns

- loading object snapshots;
- saving patches;
- listing object instances;

## Does NOT own

- FormState (dataPath → values mapping);
- UI rendering;
- synchronization, conflict resolution, migrations;
- metadata structure;
- execution logic.

## Interface

```ts
interface SnapshotStore {
  list(objectName: string): Promise<ObjectRef[]>;
  load(key: SnapshotKey): Promise<ObjectSnapshot | null>;
  savePatch(key: SnapshotKey, patch: SnapshotPatch): Promise<void>;
}
```

Where:

```ts
interface SnapshotKey {
  object: string; // "Контрагенты"
  id: string;     // UUID — stable identifier, not user-editable Code
}

interface ObjectRef {
  id: string;     // UUID
  label: string;  // display name (e.g. "00001 · ООО Ромашка")
}

interface ObjectSnapshot {
  meta: SnapshotMeta;
  values: Record<string, unknown>;
}

interface SnapshotMeta {
  id: string;
  object: string;
  schemaVersion: number;
  metadataVersion: number;
}

type SnapshotPatch = Record<string, unknown>;
```

## Snapshot JSON format (FilesystemSnapshotStore)

Collection per object type, one file per type:

```json
{
  "meta": {
    "object": "Контрагенты",
    "schemaVersion": 1,
    "metadataVersion": 1
  },
  "items": [
    {
      "id": "eab2b1df-...",
      "parent": null,
      "owner": null,
      "values": {
        "Code": "00001",
        "Description": "ООО Ромашка",
        "ИНН": "7701234567"
      }
    }
  ]
}
```

- `parent` and `owner` are nullable UUID strings (or `$ref` objects in future).
- relationships present even if unused — see Data Evolution Rule.
- `id` is 1C internal UUID (`ЗначениеВСтрокуВнутр(Ссылка)`), not user-editable Code.

## Overlay (FilesystemSnapshotStore)

Source is `export/data/{object}.json`. Writes go to `workspace/pending/{object}/{id}.json`.
Read always does `pending ?? source` (pending overlays source per item).

This is an implementation detail — other stores (SQL, HTTP) may have no overlay.

## Current implementation

```
FilesystemSnapshotStore
  source:  export/data/{object}.json
  pending: workspace/pending/{object}/{id}.json
```

## Future implementations

```
SqlSnapshotStore          — SQLite / PostgreSQL
OneCExchangeSnapshotStore — direct 1C HTTP exchange
CompositeSnapshotStore    — local cache + remote
SyncSnapshotStore         — bidirectional sync
```

## Architectural rule

UI → FormStateStore → SnapshotStore.
UI never knows where data comes from.
