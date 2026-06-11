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
import { parseObjectName } from "./core/object-name";
import { ActionDispatcher } from "./actions";
import type { Action, ActionContext } from "./actions";
import { objectSaveHandler } from "./actions/handlers/ObjectSaveHandler";
import { MemorySessionStore } from "./session";
import { FilesystemSnapshotStore } from "./snapshots";
import type { SnapshotKey } from "./snapshots";
import type { FormScreenDto } from "./forms/form-screen-types";

const exportDir = join(__dirname, "..", "export");
const workspace = loadWorkspace(exportDir);
const registry = new BuiltinRegistry();
registerBuiltins(registry);
const vm = new VM(workspace.program, registry);
const tree = buildTree(workspace.metadata, workspace.formIndex);
const dispatcher = new ActionDispatcher();
dispatcher.register("object.save", objectSaveHandler);
const sessionStore = new MemorySessionStore();
const session = sessionStore.create();
const snapshotStore = new FilesystemSnapshotStore(join(exportDir, "data"), join(exportDir, "data", ".pending"));

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
      const name = decodeURIComponent(path.slice("/api/modules/".length));
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
      const name = decodeURIComponent(path.slice("/api/ir/".length));
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

    if (path === "/api/forms") {
      const all = workspace.formIndex.getAllForms();
      const grouped: Record<string, string[]> = {};
      for (const f of all) {
        (grouped[f.objectName] ??= []).push(f.formName);
      }
      return json(Object.entries(grouped).map(([object, forms]) => ({ object, forms })));
    }

    if (path.startsWith("/api/forms/")) {
      const rest = path.slice("/api/forms/".length);
      const parts = rest.split("/");
      let objectName: string | undefined;
      let formName: string | undefined;
      try {
        objectName = decodeURIComponent(parts[0] ?? "");
        formName = decodeURIComponent(parts[1] ?? "");
      } catch { return json({ error: "Некорректный идентификатор формы" }, 400); }
      if (!objectName || !formName) return json({ error: "Usage: /api/forms/:object/:form" }, 400);
      const indexed = workspace.formIndex.get(objectName, formName);
      if (!indexed) return json({ error: "Form not found" }, 404);
      return json(indexed.document);
    }

    if (path.startsWith("/api/object-list/")) {
      const object = decodeURIComponent(path.slice("/api/object-list/".length));
      const items = await snapshotStore.list(object);
      return json(items);
    }

    if (path.startsWith("/api/object/")) {
      const parts = path.slice("/api/object/".length).split("/");
      if (parts.length !== 2) return json({ error: "Usage: /api/object/:object/:id" }, 400);
      const key: SnapshotKey = {
        object: decodeURIComponent(parts[0]!),
        id: decodeURIComponent(parts[1]!),
      };
      const snap = await snapshotStore.load(key);
      if (!snap) return json({ error: "Object not found" }, 404);
      return json(snap);
    }

    if (path === "/api/tree") {
      return json(tree);
    }

    if (path.startsWith("/api/node/")) {
      const encodedNodeId = path.slice("/api/node/".length);
      let nodeId: string;
      try { nodeId = decodeURIComponent(encodedNodeId); }
      catch { return json({ error: "Некорректный идентификатор узла" }, 400); }
      const parts = nodeId.split(".");
      const entityKind = parts[0] ?? "";
      const entityName = parts[1];
      const subKind = parts[2];

      if (!entityName) return json({ error: "Invalid node ID" }, 400);

      // Form projection node: Catalog.Организации.Forms.ФормаЭлемента
      if (parts.length === 4 && subKind === "Forms") {
        const objectName = `${entityKind}.${entityName}`;
        const indexed = workspace.formIndex.get(objectName, parts[3]!);
        if (indexed) {
          const dto: FormScreenDto = {
            form: indexed.document,
            metadata: workspace.metadata.findCatalogV2(entityName) ?? workspace.metadata.findDocumentV2(entityName) ?? null,
            object: { name: objectName },
          };
          return json(dto);
        }
        return json({ error: "Form not found" }, 404);
      }

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

    if (path === "/api/action" && method === "POST") {
      const action = (await req.json()) as Action;
      const ctx: ActionContext = { session, workspace, snapshotStore };
      const result = await dispatcher.dispatch(ctx, action);
      return json(result);
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
