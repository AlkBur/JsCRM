import type { Session } from "../session";

export interface Action {
  type: string;
  payload?: unknown;
}

export interface ActionContext {
  session: Session;
  workspace: import("../Workspace").Workspace;
  snapshotStore: import("../snapshots/SnapshotStore").SnapshotStore;
}

export type ActionHandler = (
  action: Action,
  context: ActionContext,
) => Promise<ActionResult>;

export interface UiPatch {
  commands?: unknown[];
  controlStates?: Record<string, unknown>;
}

export type ActionResult = {
  ok: boolean;
  error?: string;
  data?: unknown;
  ui?: UiPatch;
};
