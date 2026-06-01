import type { Server } from "bun";
import { parse } from "./parser";
import { VM } from "./vm";
import { RuntimeObject } from "./runtime-object";
import { DocRepository } from "./db";

const repo = new DocRepository();
const vm = new VM();

type Session = {
  obj: RuntimeObject;
  id: string;
};

let currentId = 0;
const sessions = new Map<string, Session>();
const handlers = new Map<string, (obj: RuntimeObject) => Promise<void>>();

async function loadHandlers(): Promise<void> {
  const glob = new Bun.Glob("*.1c");
  for await (const file of glob.scan("src/handlers")) {
    const name = file.replace(/\.1c$/, "");
    const code = await Bun.file(`src/handlers/${file}`).text();
    try {
      const ast = parse(code);
      handlers.set(name, async (obj: RuntimeObject) => {
        const vars: Record<string, any> = { Объект: obj };
        await vm.execute(ast, vars);
      });
      console.log(`Загружен обработчик: ${name}`);
    } catch (e) {
      console.error(`Ошибка загрузки ${file}:`, e);
    }
  }
}

function createSession(id?: string): Session {
  const sessionId = id ?? `order-${++currentId}`;
  const obj = new RuntimeObject();
  const existing = repo.load(sessionId);
  if (existing) {
    obj.load(existing);
  } else {
    obj.load({ Сумма: 0, НДС: 0 });
  }
  const session = { obj, id: sessionId };
  sessions.set(sessionId, session);
  return session;
}

const server = Bun.serve({
  port: 3000,
  async fetch(req, server: Server) {
    if (server.upgrade(req)) return;

    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("public/index.html"));
    }

    if (url.pathname === "/api/form") {
      const form = {
        fields: [
          { id: "Сумма", type: "number", dataPath: "Сумма", event: "ПриИзмененииСуммы", label: "Сумма" },
          { id: "НДС", type: "number", dataPath: "НДС", readOnly: true, label: "НДС" },
        ],
      };
      return Response.json(form);
    }

    if (url.pathname === "/api/data") {
      let session = sessions.values().next().value;
      if (!session) {
        session = createSession();
      }
      return Response.json(session.obj.toJSON());
    }

    if (url.pathname === "/api/save" && req.method === "POST") {
      const body: any = await req.json();
      const id = body.id ?? "order-1";
      repo.save(id, body.data);
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/api/load" && req.method === "POST") {
      const body: any = await req.json();
      const data = repo.load(body.id);
      if (!data) return Response.json({ status: "not_found" }, { status: 404 });
      const session = createSession(body.id);
      session.obj.load(data);
      return Response.json(session.obj.toJSON());
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    async message(ws, message) {
      let session = sessions.get(ws.data?.sessionId);
      if (!session) {
        session = createSession();
        sessions.set(ws.data?.sessionId ?? String(++currentId), session);
      }

      let msg: any;
      try {
        msg = JSON.parse(message as string);
      } catch {
        ws.send(JSON.stringify({ error: "Неверный JSON" }));
        return;
      }

      if (msg.type === "change") {
        const { field, value } = msg;
        session.obj.set(field, value);

        if (msg.handler) {
          const handler = handlers.get(msg.handler);
          if (handler) {
            await handler(session.obj);
          }
        }

        const changedFields = [msg.handler ? "НДС" : null, field].filter(Boolean) as string[];
        const uniqueFields = [...new Set(changedFields)];
        for (const f of uniqueFields) {
          ws.send(JSON.stringify({ type: "patch", field: f, value: session.obj.get(f) }));
        }
      }
    },
  },
});

await loadHandlers();
console.log(`Сервер запущен на http://localhost:${server.port}`);
