import type { ActionHandler } from "../action-types";

export const objectSaveHandler: ActionHandler = async (action, ctx) => {
  const payload = action.payload as {
    object: string;
    id: string;
    values: Record<string, unknown>;
  } | undefined;

  if (!payload || !payload.object || !payload.id) {
    return { ok: false, error: "Не указан объект или идентификатор" };
  }

  await ctx.snapshotStore.savePatch(
    { object: payload.object, id: payload.id },
    payload.values,
  );

  return { ok: true };
};
