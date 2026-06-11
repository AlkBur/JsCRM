import type { Action, ActionContext, ActionHandler, ActionResult } from "./action-types";

export class ActionDispatcher {
  private readonly handlers = new Map<string, ActionHandler>();

  register(type: string, handler: ActionHandler): void {
    this.handlers.set(type, handler);
  }

  async dispatch(ctx: ActionContext, action: Action): Promise<ActionResult> {
    const handler = this.handlers.get(action.type);
    if (!handler) {
      return { ok: false, error: `Неизвестное действие: ${action.type}` };
    }
    return handler(action, ctx);
  }
}
