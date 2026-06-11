import type { Session } from "./types";
import type { SessionStore } from "./SessionStore";

export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();
  private nextId = 1;

  create(userId = "admin", mode = "enterprise"): Session {
    const session: Session = {
      id: `session-${this.nextId++}`,
      userId,
      locale: "ru",
      mode,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  touch(sessionId: string): void {
    this.sessions.get(sessionId);
  }
}
