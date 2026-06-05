/**
 * Responsibility:
 *   Immutable index of top-level symbols from Program and MetadataModel.
 *
 * Owns:
 *   Symbol lookup, duplicate detection, SymbolSpace (runtime | metadata).
 *
 * Does NOT own:
 *   Metadata structure, execution, LSP requests.
 *
 * Used by:
 *   Workspace, LSP.
 */
//
// Responsibility: provide fast name→kind resolution.
// Non-responsibility: source locations, dependency graph, type inference.
//
// Invariant: SymbolIndex is immutable after build(). Duplicate names
// across any symbol kind are fatal configuration errors.

import { Program, type RoutineInfo } from "./Program";
import { MetadataModel } from "../metadata/MetadataModel";
import type { SymbolInfo, SymbolKind, SymbolSpace } from "../symbols/symbol-types";

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
      add("module", "runtime", module.name, undefined, symbols, all);
    }

    for (const ri of program.getAllRoutines()) {
      add(ri.routine.kind, "runtime", ri.routine.name, ri.moduleName, symbols, all);
    }

    for (const cm of metadata.commonModules) {
      if (!symbols.has(cm.name)) {
        add("module", "metadata", cm.name, undefined, symbols, all);
      }
    }

    for (const c of metadata.catalogs) {
      add("catalog", "metadata", c.name, undefined, symbols, all);
    }

    for (const d of metadata.documents) {
      add("document", "metadata", d.name, undefined, symbols, all);
    }

    for (const e of metadata.enumerations) {
      add("enumeration", "metadata", e.name, undefined, symbols, all);
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
  space: SymbolSpace,
  name: string,
  moduleName: string | undefined,
  map: Map<string, SymbolInfo>,
  list: SymbolInfo[],
): void {
  if (map.has(name)) {
    const existing = map.get(name)!;
    throw new DuplicateSymbolError(name, existing.kind, kind);
  }
  const info: SymbolInfo = { name, kind, space, ...(moduleName ? { moduleName } : {}) };
  map.set(name, info);
  list.push(info);
}
