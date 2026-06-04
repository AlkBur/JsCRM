// Layer 2.5 — Performance Regression Harness.
//
// Measures execution time of VM, DependencyGraph, and SymbolIndex operations.
// Compares against pinned baseline.json to detect architectural regression.
//
// Usage:
//   bun run bench/runner.ts              — run and compare with baseline
//   bun run bench/runner.ts --save       — update baseline to current results
//
// Warmup: 10 unmeasured iterations per suite
// Measured: 100 iterations per suite (configurable via WARMUP/ITERATIONS env)

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { bench as benchVM } from "./suites/vm.bench";
import { bench as benchGraph } from "./suites/graph.bench";
import { bench as benchIndex } from "./suites/index.bench";

const exportDir = join(__dirname, "..", "export");
const baselinePath = join(__dirname, "baseline.json");

const WARMUP = parseInt(process.env.WARMUP ?? "10", 10);
const ITERATIONS = parseInt(process.env.ITERATIONS ?? "100", 10);
const SAVE = process.argv.includes("--save");

function pct(a: number, b: number): number {
  if (b === 0) return a === 0 ? 0 : Infinity;
  return ((a - b) / b) * 100;
}

interface FlatMetric {
  path: string;
  current: number;
  count?: number;
}

function flatten(path: string, obj: unknown): FlatMetric[] {
  const result: FlatMetric[] = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v && typeof v === "object" && !Array.isArray(v) && "avg" in (v as Record<string, unknown>)) {
        const entry = v as { avg: number; count?: number };
        result.push({ path: `${path}.${k}`, current: entry.avg, count: entry.count });
      } else {
        result.push(...flatten(`${path}.${k}`, v));
      }
    }
  } else if (typeof obj === "number" && path !== "") {
    result.push({ path, current: obj });
  }
  return result;
}

function isCountMetric(path: string): boolean {
  return path.endsWith(".count");
}

function saveBaseline(data: Record<string, unknown>): void {
  const baseline = { generatedAt: new Date().toISOString(), suites: data };
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  console.error(`Baseline saved: ${baselinePath}`);
}

function loadBaseline(): Record<string, unknown> | null {
  if (!existsSync(baselinePath)) return null;
  return JSON.parse(readFileSync(baselinePath, "utf8"));
}

async function main(): Promise<void> {
  console.log(`Warmup: ${WARMUP}, Iterations: ${ITERATIONS}\n`);

  const vmResult = benchVM(exportDir, WARMUP, ITERATIONS);
  const graphResult = benchGraph(exportDir, WARMUP, ITERATIONS);
  const indexResult = benchIndex(exportDir, WARMUP, ITERATIONS);

  const current: Record<string, unknown> = {
    vm: { totalAvg: vmResult.totalAvg, p95: vmResult.p95, breakdown: vmResult.breakdown },
    graph: graphResult,
    index: indexResult,
  };

  console.log("=== Current Results ===");
  console.log(JSON.stringify(current, null, 2));

  if (SAVE) {
    saveBaseline(current);
    return;
  }

  const baseline = loadBaseline();
  if (!baseline) {
    console.error("\n[WARN] No baseline found. Run with --save to create one.");
    return;
  }

  console.log("\n=== Regression Check ===");

  const baselineFlat = flatten("", baseline.suites as Record<string, unknown>);
  const currentFlat = flatten("", current);
  const baselineMap = new Map(baselineFlat.map(m => [m.path, m]));

  let hasWarning = false;
  let hasCountDrift = false;

  for (const m of currentFlat) {
    const b = baselineMap.get(m.path);

    if (isCountMetric(m.path)) {
      if (!b) {
        console.log(`  [NEW]   ${m.path}: ${m.current}`);
        continue;
      }
      const delta = pct(m.current, b.current);
      console.log(`  ${Math.abs(delta) > 10 ? "[CNT!]" : "[CNT]" }  ${m.path}: ${m.current} (${delta > 0 ? "+" : ""}${delta.toFixed(1)}%)`);
      if (Math.abs(delta) > 10) hasCountDrift = true;
      continue;
    }

    // Time metric
    if (!b) {
      console.log(`  [NEW]   ${m.path}: ${m.current.toFixed(4)} ms`);
      continue;
    }

    const delta = pct(m.current, b.current);
    const isSmall = Math.abs(m.current) < 0.001;
    const threshold = isSmall ? 50 : 20;

    if (Math.abs(delta) > threshold) {
      console.log(`  [WARN]  ${m.path}: ${m.current.toFixed(4)} ms (${delta > 0 ? "+" : ""}${delta.toFixed(1)}%)`);
      hasWarning = true;
    } else {
      console.log(`  [OK]    ${m.path}: ${m.current.toFixed(4)} ms (${delta > 0 ? "+" : ""}${delta.toFixed(1)}%)`);
    }
  }

  if (hasCountDrift) {
    console.error("\n[WARN] Operation count drift detected. Baseline may be invalid.");
  }

  if (hasWarning) {
    console.error("\n[WARN] Regression detected (see above).");
  } else {
    console.log("\n[OK] No significant regression detected.");
  }
}

main().catch(e => {
  console.error(`Fatal: ${e}`);
  process.exit(1);
});
