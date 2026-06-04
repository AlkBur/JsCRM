import { join } from "path";
import { Program } from "./Program";
import { MetadataModel } from "../metadata/MetadataModel";
import { MetadataIndex } from "../metadata/MetadataIndex";
import { SymbolIndex } from "./SymbolIndex";
import { DependencyGraph } from "./DependencyGraph";
import { VM } from "./vm";
import { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import { registerBuiltins } from "../builtins/index";
import { buildTree } from "./tree-builder";

const exportDir = join(__dirname, "..", "export");

const program = Program.loadFromManifest(exportDir);
const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
const index = SymbolIndex.build(program, metadata);
const metaIndex = MetadataIndex.build(metadata);
const graph = DependencyGraph.build(program);
const registry = new BuiltinRegistry();
registerBuiltins(registry);
const vm = new VM(program, registry);
const tree = buildTree(metadata);

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
        version: metadata.version,
        modules: program.getModules().length,
        routines: program.getAllRoutines().length,
        symbols: index.size,
        graphNodes: graph.getAllNodes().length,
        catalogs: metadata.catalogs.length,
        documents: metadata.documents.length,
        enumerations: metadata.enumerations.length,
        attributes: metaIndex.attributeCount,
        tabularSections: metaIndex.tabularSectionCount,
        forms: metaIndex.formCount,
        commands: metaIndex.commandCount,
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

    if (path.startsWith("/api/metadataIndex")) {
      const parent = url.searchParams.get("parent") ?? "";
      const kind = url.searchParams.get("kind") ?? "attributes";
      if (kind === "attributes") return json(metaIndex.getAttributes(parent || undefined));
      if (kind === "tabularSections") return json(metaIndex.getTabularSections(parent || undefined));
      if (kind === "forms") return json(metaIndex.getForms(parent || undefined));
      if (kind === "commands") return json(metaIndex.getCommands(parent || undefined));
      return json({ error: "Unknown kind" }, 400);
    }

    if (path.startsWith("/api/ir/")) {
      const name = path.slice("/api/ir/".length);
      const ir = moduleIR(name);
      if (!ir) return json({ error: "Module not found" }, 404);
      return json(ir);
    }

    if (path === "/api/graph") {
      const name = url.searchParams.get("name");
      if (name) {
        return json({
          callees: graph.getCallees(name),
          callers: graph.getCallers(name),
        });
      }
      return json({ nodes: graph.getAllNodes().length });
    }

    if (path === "/api/graph/unused") {
      const includeTests = url.searchParams.get("includeTests") === "true";
      const includeEntrypoints = url.searchParams.get("includeEntrypoints") === "true";
      return json({ unused: graph.findUnused({ includeTests, includeEntrypoints }) });
    }

    if (path === "/api/tree") {
      return json(tree);
    }

    if (path.startsWith("/api/node/")) {
      const nodeId = path.slice("/api/node/".length);
      // Parse node ID: Catalog.Name, Document.Name, Enum.Name, etc.
      const parts = nodeId.split(".");
      const entityKind = parts[0]; // Catalog, Document, Enum
      const entityName = parts[1];
      const subKind = parts[2]; // Attributes, TabularSections, Forms, Commands — optional

      if (!entityName) return json({ error: "Invalid node ID" }, 400);

      if (entityKind === "Enum") {
        const en = metadata.findEnumerationV2(entityName);
        if (!en) return json({ error: "Enumeration not found" }, 404);
        return json({ kind: "enumeration", name: en.name, uuid: en.uuid, values: en.values });
      }

      const parentKind = entityKind === "Catalog" ? "catalog" : entityKind === "Document" ? "document" : null;
      if (!parentKind) return json({ error: "Unknown entity kind" }, 400);

      const entity = parentKind === "catalog" ? metadata.findCatalogV2(entityName) : metadata.findDocumentV2(entityName);
      if (!entity) return json({ error: "Entity not found" }, 404);

      if (subKind === "Attributes") {
        return json({ kind: "attributes", parentName: entityName, parentKind, items: entity.attributes });
      }
      if (subKind === "TabularSections") {
        return json({ kind: "tabularSections", parentName: entityName, parentKind, items: entity.tabularSections });
      }
      if (subKind === "Forms") {
        return json({ kind: "forms", parentName: entityName, parentKind, items: entity.forms });
      }
      if (subKind === "Commands") {
        return json({ kind: "commands", parentName: entityName, parentKind, items: entity.commands });
      }

      // Return full entity detail
      return json({
        kind: parentKind,
        name: entity.name,
        uuid: entity.uuid,
        attributes: entity.attributes,
        tabularSections: entity.tabularSections,
        forms: entity.forms,
        commands: entity.commands,
      });
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
console.log(`  Graph nodes: ${graph.getAllNodes().length}`);
console.log(`  Metadata: v${metadata.version}, ${metaIndex.attributeCount} attributes, ${metaIndex.tabularSectionCount} tabular sections`);
