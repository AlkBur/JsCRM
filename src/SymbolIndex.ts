// SymbolIndex — searchable index of all named entities across modules and metadata.
//
// Built by combining Program (routines + modules) and MetadataModel (catalogs,
// documents, enumerations). Used for lookup, navigation, and as the foundation
// for DependencyGraph and Language Server.
//
// Responsibility: provide fast name→kind resolution.
// Non-responsibility: source locations, dependency graph, type inference.
//
// Invariant: SymbolIndex is immutable after build(). Duplicate names
// across any symbol kind are fatal configuration errors.

import { Program, type RoutineInfo } from "./Program";
import { MetadataModel } from "../metadata/MetadataModel";
import type { SymbolInfo, SymbolKind } from "../symbols/symbol-types";

export class DuplicateSymbolError extends Error {
  constructor(
    readonly symbolName: string,
    readonly firstKind: SymbolKind,
    readonly secondKind: SymbolKind,
  ) {
    super(`Duplicate symbol '${symbolName}' (${firstKind} vs ${secondKind})`);
    this.name = "DuplicateSymbolError";
  }
}

export class SymbolIndex {
  private readonly symbols = new Map<string, SymbolInfo>();
  private readonly allList: readonly SymbolInfo[];

  private constructor(symbols: Map<string, SymbolInfo>, list: SymbolInfo[]) {
    this.symbols = symbols;
    this.allList = Object.freeze(list);
  }

  static build(program: Program, metadata: MetadataModel): SymbolIndex {
    const symbols = new Map<string, SymbolInfo>();
    const all: SymbolInfo[] = [];

    for (const module of program.getModules()) {
      add("module", module.name, undefined, symbols, all);
    }

    for (const ri of program.getAllRoutines()) {
      add(ri.routine.kind, ri.routine.name, ri.moduleName, symbols, all);
    }

    for (const cm of metadata.commonModules) {
      if (!symbols.has(cm.name)) {
        add("module", cm.name, undefined, symbols, all);
      }
    }

    for (const c of metadata.catalogs) {
      add("catalog", c.name, undefined, symbols, all);
    }

    for (const d of metadata.documents) {
      add("document", d.name, undefined, symbols, all);
    }

    for (const e of metadata.enumerations) {
      add("enumeration", e.name, undefined, symbols, all);
    }

    return new SymbolIndex(symbols, all);
  }

  find(name: string): SymbolInfo | undefined {
    return this.symbols.get(name);
  }

  has(name: string): boolean {
    return this.symbols.has(name);
  }

  getAll(): readonly SymbolInfo[] {
    return this.allList;
  }

  get size(): number {
    return this.symbols.size;
  }
}

function add(
  kind: SymbolKind,
  name: string,
  moduleName: string | undefined,
  map: Map<string, SymbolInfo>,
  list: SymbolInfo[],
): void {
  if (map.has(name)) {
    const existing = map.get(name)!;
    throw new DuplicateSymbolError(name, existing.kind, kind);
  }
  const info: SymbolInfo = { name, kind, ...(moduleName ? { moduleName } : {}) };
  map.set(name, info);
  list.push(info);
}
