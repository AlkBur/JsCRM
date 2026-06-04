// LSP server — Layer 8.1 Navigation Core.
//
// Loads the project's export directory, builds all indices,
// and serves textDocument/definition + textDocument/references via stdio.
//
// Usage: bun run lsp/server.ts
//
// No document sync, no hover, no diagnostics — just navigation.

import { join } from "path";
import { Program } from "../src/Program";
import { SymbolIndex } from "../src/SymbolIndex";
import { MetadataModel } from "../metadata/MetadataModel";
import { DependencyGraph } from "../src/DependencyGraph";
import { LocationIndex } from "./LocationIndex";
import { readMessage, writeMessage, writeLog } from "./transport";
import { handleDefinition } from "./handlers/definition";
import { handleReferences } from "./handlers/references";

const exportDir = join(__dirname, "..", "export");

const program = Program.loadFromManifest(exportDir);
const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
const symbolIndex = SymbolIndex.build(program, metadata);
const dependencyGraph = DependencyGraph.build(program);
const locationIndex = LocationIndex.build(program, exportDir);

writeLog(
  `Layer 8.1 ready: ${program.getAllRoutines().length} routines, ${symbolIndex.size} symbols, ${dependencyGraph.getAllNodes().length} graph nodes, ${locationIndex.size} locations`,
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
        const result = handleDefinition(msg.params, locationIndex);
        writeMessage(id, result);
        break;
      }
      case "textDocument/references": {
        const result = handleReferences(msg.params, dependencyGraph, locationIndex);
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
