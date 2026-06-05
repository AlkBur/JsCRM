/**
 * Responsibility:
 *   LSP stdio JSON-RPC server for navigation queries.
 *
 * Owns:
 *   Transport (Content-Length), request dispatch, workspace loading.
 *
 * Does NOT own:
 *   Semantic analysis, IR traversal, symbol resolution (delegates to indexes).
 *
 * Used by:
 *   LSP clients (IDE editors).
 */
// Usage: bun run lsp/server.ts
//
// No document sync, no hover, no diagnostics — just navigation.

import { join } from "path";
import { loadWorkspace } from "../src/WorkspaceLoader";
import { readMessage, writeMessage, writeLog } from "./transport";
import { handleDefinition } from "./handlers/definition";
import { handleReferences } from "./handlers/references";

const exportDir = join(__dirname, "..", "export");
const workspace = loadWorkspace(exportDir);

writeLog(
  `Layer 8.1 ready: ${workspace.stats.routines} routines, ${workspace.stats.symbols} symbols, ${workspace.stats.graphNodes} graph nodes, ${workspace.stats.locations} locations`,
);

async function main(): Promise<void> {
  while (true) {
    const msg = await readMessage();
    const method = msg.method;
    const id = msg.id ?? null;

    switch (method) {
      case "initialize": {
        writeMessage(id, {
          capabilities: {
            textDocumentSync: undefined,
            definitionProvider: true,
            referencesProvider: true,
          },
          serverInfo: { name: "JSCRM-LS", version: "0.1.0" },
        });
        break;
      }
      case "shutdown": {
        writeMessage(id, null);
        break;
      }
      case "exit": {
        process.exit(0);
      }
      case "textDocument/definition": {
        const result = handleDefinition(msg.params, workspace.locationIndex);
        writeMessage(id, result);
        break;
      }
      case "textDocument/references": {
        const result = handleReferences(msg.params, workspace.dependencyGraph, workspace.locationIndex);
        writeMessage(id, result);
        break;
      }
      case "textDocument/hover":
      case "workspace/symbol":
      case "textDocument/documentSymbol": {
        writeMessage(id, null);
        break;
      }
      default: {
        writeMessage(id, null, {
          code: -32601,
          message: `Method not found: ${method}`,
        });
        break;
      }
    }
  }
}

main().catch((e) => {
  writeLog(`Fatal error: ${e}`);
  process.exit(1);
});
