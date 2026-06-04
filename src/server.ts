import { join } from "path";
import { Program } from "./Program";
import { MetadataModel } from "../metadata/MetadataModel";
import { SymbolIndex } from "./SymbolIndex";
import { VM } from "./vm";
import { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import { registerBuiltins } from "../builtins/index";

const exportDir = join(__dirname, "..", "export");

const program = Program.loadFromManifest(exportDir);
const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
const index = SymbolIndex.build(program, metadata);
const registry = new BuiltinRegistry();
registerBuiltins(registry);
const vm = new VM(program, registry);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function moduleIR(name: string): unknown {
  for (const m of program.getModules()) {
    if (m.name === name) {
      return m;
    }
  }
  return null;
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    if (path === "/" || path === "/index.html") {
      return new Response(Bun.file(join(__dirname, "..", "public", "index.html")));
    }

    if (path === "/api/status") {
      return json({
        modules: program.getModules().length,
        routines: program.getAllRoutines().length,
        symbols: index.size,
        catalogs: metadata.catalogs.length,
        documents: metadata.documents.length,
        enumerations: metadata.enumerations.length,
      });
    }

    if (path === "/api/symbols") {
      const q = url.searchParams.get("q");
      if (q) {
        const lower = q.toLowerCase();
        return json(index.getAll().filter(s => s.name.toLowerCase().includes(lower)));
      }
      return json(index.getAll());
    }

    if (path === "/api/modules") {
      return json(program.getModules().map(m => ({
        name: m.name,
        routineCount: m.routines.length,
      })));
    }

    if (path.startsWith("/api/modules/")) {
      const name = path.slice("/api/modules/".length);
      const mod = program.getModules().find(m => m.name === name);
      if (!mod) return json({ error: "Module not found" }, 404);
      return json(mod);
    }

    if (path === "/api/metadata") {
      return json({
        catalogs: metadata.catalogs,
        documents: metadata.documents,
        enumerations: metadata.enumerations,
        commonModules: metadata.commonModules,
      });
    }

    if (path.startsWith("/api/ir/")) {
      const name = path.slice("/api/ir/".length);
      const ir = moduleIR(name);
      if (!ir) return json({ error: "Module not found" }, 404);
      return json(ir);
    }

    if (path === "/api/run" && method === "POST") {
      try {
        const body: { name?: string; args?: unknown[] } = await req.json();
        if (!body.name) return json({ success: false, error: "Missing name" }, 400);
        const args: unknown[] = body.args ?? [];
        const result = vm.call(body.name, args);
        return json({ success: true, result });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return json({ success: false, error: msg });
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Server: http://localhost:${server.port}`);
console.log(`  Modules: ${program.getModules().length}`);
console.log(`  Routines: ${program.getAllRoutines().length}`);
console.log(`  Symbols: ${index.size}`);
