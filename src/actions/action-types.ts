export interface Action {
  type: string;
  payload?: unknown;
}

export interface ActionContext {
  session: { id: string; userId?: string; mode: "runtime" | "designer" };
  workspace: import("../Workspace").Workspace;
  snapshotStore: import("../snapshots/SnapshotStore").SnapshotStore;
}

export interface ActionHandler {
  execute(ctx: ActionContext, action: Action): Promise<ActionResult>;
}

export type ActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string };
