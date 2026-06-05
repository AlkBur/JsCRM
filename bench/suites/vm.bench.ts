import { join } from "path";
import { readdirSync, readFileSync } from "fs";
import { VM } from "../../src/vm/index";
import { BuiltinRegistry } from "../../runtime/BuiltinRegistry";
import { registerBuiltins } from "../../builtins/index";
import type { Workspace } from "../../src/Workspace";

export interface VMBenchResult {
  totalAvg: number;
  p95: number;
  breakdown: Record<string, { count: number }>;
}

function walkNode(node: unknown, counts: Record<string, number>): void {
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const kind = obj.kind as string | undefined;
  if (kind) {
    if (kind === "call") {
      const group = obj.object !== undefined ? "methodCall" : "functionCall";
      counts[group] = (counts[group] || 0) + 1;
    } else if (kind === "if") {
      counts["ifExpr"] = (counts["ifExpr"] || 0) + 1;
    } else if (kind === "binary") {
      counts["binaryOp"] = (counts["binaryOp"] || 0) + 1;
    } else if (kind === "new") {
      counts["newObject"] = (counts["newObject"] || 0) + 1;
    } else if (kind === "for" || kind === "while" || kind === "foreach") {
      counts["loop"] = (counts["loop"] || 0) + 1;
    }
  }
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) {
      for (const item of val) walkNode(item, counts);
    } else if (val && typeof val === "object") {
      walkNode(val, counts);
    }
  }
}

export function bench(workspace: Workspace, exportDir: string, warmup: number, iterations: number): VMBenchResult {
  const registry = new BuiltinRegistry();
  registerBuiltins(registry);
  const vm = new VM(workspace.program, registry);

  const testsDir = join(exportDir, "tests");
  const testNames: string[] = [];
  for (const f of readdirSync(testsDir).filter(f => f.endsWith(".results.json"))) {
    const results = JSON.parse(readFileSync(join(testsDir, f), "utf8"));
    for (const t of results.tests) testNames.push(t.name);
  }

  const opCounts: Record<string, number> = {};
  for (const ri of workspace.program.getAllRoutines()) {
    for (const stmt of ri.routine.body) walkNode(stmt, opCounts);
  }

  for (let w = 0; w < warmup; w++) {
    for (const name of testNames) {
      try { vm.call(name); } catch { /* skip errors during warmup */ }
    }
  }

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    for (const name of testNames) {
      try { vm.call(name); } catch { /* skip */ }
    }
    times.push(performance.now() - start);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p95idx = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);

  return {
    totalAvg: avg,
    p95: sorted[p95idx]!,
    breakdown: Object.fromEntries(
      Object.entries(opCounts).map(([k, v]) => [k, { count: v }]),
    ),
  };
}
