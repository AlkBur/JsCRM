import type { Session } from "./types";

export interface SessionStore {
  create(userId?: string, mode?: Session["mode"]): Session;
  get(sessionId: string): Session | undefined;
  touch(sessionId: string): void;
}
