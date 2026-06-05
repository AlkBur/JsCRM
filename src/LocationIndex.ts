/**
 * Responsibility:
 *   Symbol name to URI/range mapping.
 *
 * Owns:
 *   Location data derived from Program and IR meta.loc.
 *
 * Does NOT own:
 *   Navigation semantics, symbol resolution, file I/O.
 *
 * Used by:
 *   Workspace, LSP.
 */
//
// Responsibility: provide URI + range for any named symbol.
// Non-responsibility: source code management, document sync, incremental updates.

import { join, resolve } from "path";
import type { Program } from "./Program";

export interface LSPLocation {
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export class LocationIndex {
  private readonly locations = new Map<string, LSPLocation>();

  private constructor(locations: Map<string, LSPLocation>) {
    this.locations = locations;
  }

  static build(program: Program, exportDir: string): LocationIndex {
    const locations = new Map<string, LSPLocation>();
    const absExport = resolve(exportDir);

    for (const module of program.getModules()) {
      const uri = `file:///${join(absExport, "ir", `CommonModule.${module.name}.json`).replace(/\\/g, "/")}`.replace("file:///", "file:///");

      for (const routine of module.routines) {
        const loc = (routine as unknown as Record<string, unknown>).meta as
          | { loc?: { line: number; column: number } }
          | undefined;
        const line = loc?.loc?.line ?? 0;
        const col = loc?.loc?.column ?? 0;
        locations.set(routine.name, {
          uri,
          range: {
            start: { line, character: col },
            end: { line, character: col },
          },
        });
      }
    }

    return new LocationIndex(locations);
  }

  findSymbol(name: string): LSPLocation | null {
    return this.locations.get(name) ?? null;
  }

  get size(): number {
    return this.locations.size;
  }
}
