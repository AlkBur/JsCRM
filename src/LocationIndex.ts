// LocationIndex maps symbol names to their declaration locations in IR files.
//
// Built from Program. Each routine gets a location pointing to its IR module file.
// When IR nodes carry meta.loc, those positions are used; otherwise falls back
// to module-level (line 0, column 0).
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
