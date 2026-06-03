// Program owns loaded modules and the global routine registry.
//
// Responsibility:
//   - load modules from manifest.json
//   - detect duplicate routine names (fatal error)
//   - provide global routine lookup for the VM
//
// Program does not execute code and knows nothing about VM,
// builtins, metadata, or runtime objects.
//
// Invariant: Program is immutable after loadFromManifest completes.
// All function resolution goes through findRoutine().

import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface Routine {
  kind: "procedure" | "function";
  name: string;
  export: boolean;
  params: { name: string; byRef: boolean; defaultValue?: unknown }[];
  body: unknown[];
}

export interface ModuleInfo {
  name: string;
  routines: Routine[];
}

export interface RoutineInfo {
  moduleName: string;
  routine: Routine;
}

export class DuplicateRoutineError extends Error {
  constructor(
    readonly routineName: string,
    readonly firstModule: string,
    readonly secondModule: string,
  ) {
    super(
      `Duplicate routine '${routineName}' in '${firstModule}' and '${secondModule}'`,
    );
    this.name = "DuplicateRoutineError";
  }
}

interface Manifest {
  irVersion: number;
  generatedAt: string;
  modules: string[];
}

interface ModuleIR {
  irVersion: number;
  module: { name: string; body: { routines: Routine[] } };
}

export class Program {
  readonly modules: ModuleInfo[] = [];
  private readonly routines = new Map<string, RoutineInfo>();

  addModule(data: ModuleIR): void {
    const moduleName = data.module.name;
    const routines = data.module.body.routines;
    const info: ModuleInfo = { name: moduleName, routines };

    for (const r of routines) {
      const existing = this.routines.get(r.name);
      if (existing) {
        throw new DuplicateRoutineError(
          r.name,
          existing.moduleName,
          moduleName,
        );
      }
      this.routines.set(r.name, { moduleName, routine: r });
    }

    this.modules.push(info);
  }

  findRoutine(name: string): RoutineInfo | undefined {
    return this.routines.get(name);
  }

  static loadFromManifest(exportDir: string): Program {
    const manifestPath = join(exportDir, "manifest.json");
    if (!existsSync(manifestPath)) {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }

    const manifest: Manifest = JSON.parse(
      readFileSync(manifestPath, "utf8"),
    );
    const program = new Program();

    for (const moduleName of manifest.modules) {
      const irFile = join(exportDir, "ir", `CommonModule.${moduleName}.json`);
      if (!existsSync(irFile)) {
        throw new Error(`IR file not found: ${irFile}`);
      }
      const module: ModuleIR = JSON.parse(readFileSync(irFile, "utf8"));
      program.addModule(module);
    }

    return program;
  }
}
