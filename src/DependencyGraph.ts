// DependencyGraph — call graph across all routines in Program.
//
// Built from Program only. Tracks which routines call which other routines.
// Used for dead code detection, call hierarchy, and impact analysis.
//
// Rules:
//   - Only explicit function calls are tracked: kind === "call" with a name
//     and no object field. Method calls (object.method) are excluded.
//   - Only calls that resolve to a known routine in Program are added.
//     Builtins and other non-routine names are silently skipped.
//   - Two indices: outgoing (callees) and incoming (callers).
//   - Immutable after build().
//   - No dependency on VM, BuiltinRegistry, Metadata, or Runtime.
//
// Responsibility: provide a traversable, queryable call graph.
// Non-responsibility: type inference, metadata awareness, builtin resolution,
//   cross-module exports beyond Program.

import { Program } from "./Program";

export class DependencyGraph {
  private readonly outgoing: Map<string, readonly string[]>;
  private readonly incoming: Map<string, readonly string[]>;
  private readonly allNodes: readonly string[];
  private readonly exported: ReadonlySet<string>;
  private readonly testRoutines: ReadonlySet<string>;

  private constructor(
    outgoing: Map<string, readonly string[]>,
    incoming: Map<string, readonly string[]>,
    allNodes: string[],
    exported: Set<string>,
    testRoutines: Set<string>,
  ) {
    this.outgoing = outgoing;
    this.incoming = incoming;
    this.allNodes = Object.freeze(allNodes);
    this.exported = exported;
    this.testRoutines = testRoutines;
  }

  static build(program: Program): DependencyGraph {
    const outgoing = new Map<string, Set<string>>();
    const incoming = new Map<string, Set<string>>();
    const allNodes: string[] = [];
    const exported = new Set<string>();
    const testRoutines = new Set<string>();

    for (const ri of program.getAllRoutines()) {
      const name = ri.routine.name;
      allNodes.push(name);
      if (ri.routine.export) exported.add(name);
      if (name.startsWith("Тест_")) testRoutines.add(name);
    }

    for (const ri of program.getAllRoutines()) {
      const caller = ri.routine.name;
      const callees = new Set<string>();
      walkBody(ri.routine.body, program, callees);
      for (const callee of callees) {
        addDirected(outgoing, incoming, caller, callee);
      }
    }

    const outgoingFinal = new Map<string, readonly string[]>();
    const incomingFinal = new Map<string, readonly string[]>();
    for (const [k, v] of outgoing) {
      outgoingFinal.set(k, Object.freeze([...v]));
    }
    for (const [k, v] of incoming) {
      incomingFinal.set(k, Object.freeze([...v]));
    }

    return new DependencyGraph(outgoingFinal, incomingFinal, allNodes, exported, testRoutines);
  }

  getCallees(name: string): readonly string[] {
    return this.outgoing.get(name) ?? Object.freeze([]);
  }

  getCallers(name: string): readonly string[] {
    return this.incoming.get(name) ?? Object.freeze([]);
  }

  has(name: string): boolean {
    for (const n of this.allNodes) {
      if (n === name) return true;
    }
    return false;
  }

  getAllNodes(): readonly string[] {
    return this.allNodes;
  }

  findUnused(options?: {
    includeTests?: boolean;
    includeEntrypoints?: boolean;
  }): readonly string[] {
    const opts = {
      includeTests: false,
      includeEntrypoints: false,
      ...options,
    };

    const result: string[] = [];
    for (const name of this.allNodes) {
      const callers = this.incoming.get(name);
      if (callers && callers.length > 0) continue;

      if (!opts.includeTests && this.testRoutines.has(name)) continue;
      if (!opts.includeEntrypoints && this.exported.has(name)) continue;

      result.push(name);
    }
    return Object.freeze(result);
  }
}

function walkBody(
  body: unknown[],
  program: Program,
  callees: Set<string>,
): void {
  for (const node of body) {
    walkNode(node, program, callees);
  }
}

function walkNode(
  node: unknown,
  program: Program,
  callees: Set<string>,
): void {
  if (!node || typeof node !== "object") return;

  const obj = node as Record<string, unknown>;

  if (obj.kind === "call" && typeof obj.name === "string" && obj.object === undefined) {
    const name = obj.name as string;
    if (program.findRoutine(name)) {
      callees.add(name);
    }
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        walkNode(item, program, callees);
      }
    } else if (val && typeof val === "object") {
      walkNode(val, program, callees);
    }
  }
}

function addDirected(
  outgoing: Map<string, Set<string>>,
  incoming: Map<string, Set<string>>,
  from: string,
  to: string,
): void {
  if (!outgoing.has(from)) outgoing.set(from, new Set());
  outgoing.get(from)!.add(to);

  if (!incoming.has(to)) incoming.set(to, new Set());
  incoming.get(to)!.add(from);
}
