/**
 * Responsibility:
 *   Bun HTTP server providing REST API for Explorer and VM execution.
 *
 * Owns:
 *   HTTP routes, Workspace construction, VM execution endpoint.
 *
 * Does NOT own:
 *   Program, MetadataModel or indexes (delegates to Workspace).
 *
 * Used by:
 *   Explorer UI (React client).
 */

import { join } from "path";
import { VM } from "./vm/index";
import type { Value } from "../runtime/types";
import { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import { registerBuiltins } from "../builtins/index";
import { buildTree } from "./tree-builder";
import { loadWorkspace } from "./WorkspaceLoader";

const exportDir = join(__dirname, "..", "export");
const workspace = loadWorkspace(exportDir);
const registry = new BuiltinRegistry();
registerBuiltins(registry);
const vm = new VM(workspace.program, registry);
const tree = buildTree(workspace.metadata);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function moduleIR(name: string): unknown {
  for (const m of workspace.program.getModules()) {
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
        ...workspace.stats,
        version: workspace.metadata.version,
        catalogs: workspace.metadata.catalogs.length,
        documents: workspace.metadata.documents.length,
        enumerations: workspace.metadata.enumerations.length,
        tabularSections: workspace.metadataIndex.tabularSectionCount,
        forms: workspace.metadataIndex.formCount,
        commands: workspace.metadataIndex.commandCount,
      });
    }

    if (path === "/api/symbols") {
      const q = url.searchParams.get("q");
      if (q) {
        const lower = q.toLowerCase();
        return json(workspace.symbolIndex.getAll().filter(s => s.name.toLowerCase().includes(lower)));
      }
      return json(workspace.symbolIndex.getAll());
    }

    if (path === "/api/modules") {
      return json(workspace.program.getModules().map(m => ({
        name: m.name,
        routineCount: m.routines.length,
      })));
    }

    if (path.startsWith("/api/modules/")) {
      const name = path.slice("/api/modules/".length);
      const mod = workspace.program.getModules().find(m => m.name === name);
      if (!mod) return json({ error: "Module not found" }, 404);
      return json(mod);
    }

    if (path === "/api/metadata") {
      return json({
        catalogs: workspace.metadata.catalogs,
        documents: workspace.metadata.documents,
        enumerations: workspace.metadata.enumerations,
        commonModules: workspace.metadata.commonModules,
      });
    }

    if (path.startsWith("/api/metadataIndex")) {
      const parent = url.searchParams.get("parent") ?? "";
      const kind = url.searchParams.get("kind") ?? "attributes";
      if (kind === "attributes") return json(workspace.metadataIndex.getAttributes(parent || undefined));
      if (kind === "tabularSections") return json(workspace.metadataIndex.getTabularSections(parent || undefined));
      if (kind === "forms") return json(workspace.metadataIndex.getForms(parent || undefined));
      if (kind === "commands") return json(workspace.metadataIndex.getCommands(parent || undefined));
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
          callees: workspace.dependencyGraph.getCallees(name),
          callers: workspace.dependencyGraph.getCallers(name),
        });
      }
      return json({ nodes: workspace.dependencyGraph.getAllNodes().length });
    }

    if (path === "/api/graph/unused") {
      const includeTests = url.searchParams.get("includeTests") === "true";
      const includeEntrypoints = url.searchParams.get("includeEntrypoints") === "true";
      return json({ unused: workspace.dependencyGraph.findUnused({ includeTests, includeEntrypoints }) });
    }

    if (path === "/api/tree") {
      return json(tree);
    }

    if (path.startsWith("/api/node/")) {
      const nodeId = path.slice("/api/node/".length);
      const parts = nodeId.split(".");
      const entityKind = parts[0] ?? "";
      const entityName = parts[1];
      const subKind = parts[2];

      if (!entityName) return json({ error: "Invalid node ID" }, 400);

      if (entityKind === "Enum") {
        const en = workspace.metadata.findEnumerationV2(entityName);
        if (!en) return json({ error: "Enumeration not found" }, 404);
        return json({ kind: "enumeration", name: en.name, uuid: en.uuid, values: en.values });
      }

      const parentKind = entityKind === "Catalog" ? "catalog" : entityKind === "Document" ? "document" : null;
      if (!parentKind) return json({ error: "Unknown entity kind" }, 400);

      const entity = parentKind === "catalog" ? workspace.metadata.findCatalogV2(entityName) : workspace.metadata.findDocumentV2(entityName);
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
        const args = (body.args ?? []) as Value[];
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
console.log(`  Modules: ${workspace.stats.modules}`);
console.log(`  Routines: ${workspace.stats.routines}`);
console.log(`  Symbols: ${workspace.stats.symbols}`);
console.log(`  Graph nodes: ${workspace.stats.graphNodes}`);
console.log(`  Metadata: v${workspace.metadata.version}, ${workspace.stats.attributes} attributes, ${workspace.metadataIndex.tabularSectionCount} tabular sections`);
