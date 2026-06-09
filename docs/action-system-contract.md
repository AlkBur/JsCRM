# Action System Contract

## Responsibility

Decouples UI from execution. FormRenderer dispatches typed actions;
ActionDispatcher routes them to handlers. No UI code knows about VM,
SnapshotStore, or Session.

## Owns

- action type definitions;
- handler registry (type → handler mapping);
- dispatch (ctx, action) → ActionResult;

## Does NOT own

- Session, SnapshotStore, VM (injected via ActionContext);
- HTTP transport (POST /api/action is a thin wrapper);
- business logic — handlers own that.

## Interface

```ts
interface Action {
  type: string;
  payload?: unknown;
}

interface ActionContext {
  session: Session;
  workspace: Workspace;
  snapshotStore: SnapshotStore;
}

interface ActionHandler {
  execute(ctx: ActionContext, action: Action): Promise<ActionResult>;
}

type ActionResult = 
  | { success: true; data?: unknown }
  | { success: false; error: string };
```

## Dispatch

```ts
class ActionDispatcher {
  register(type: string, handler: ActionHandler): void;
  async dispatch(ctx: ActionContext, action: Action): Promise<ActionResult>;
}
```

## Transport

Single POST /api/action endpoint. Body is the Action JSON.
Server wraps the request into ActionContext and calls dispatcher.dispatch().

```json
POST /api/action
{ "type": "object.save", "payload": { "object": "Контрагенты", "id": "uuid", "patch": { ... } } }
```

## Handler discovery

By action.type string convention:
- "object.save" → handlers/ObjectSaveHandler.ts
- "session.login" → handlers/SessionLoginHandler.ts (future)
- "form.open" → handlers/FormOpenHandler.ts (future)

Registry is populated at server startup. No dynamic discovery.

## Current handlers

| type | handler | status |
|------|---------|--------|
| object.save | ObjectSaveHandler | pending (Commit E) |

## Transport independence

ActionDispatcher is transport-agnostic. The same dispatch(ctx, action)
can be called from HTTP, WebSocket, or background jobs.
