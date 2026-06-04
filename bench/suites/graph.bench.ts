import { Program } from "../../src/Program";
import { DependencyGraph } from "../../src/DependencyGraph";

export interface GraphBenchResult {
  findPath: { avg: number; count: number };
  getReachableFrom: { avg: number; count: number };
  detectCycles: { avg: number; count: number };
}

interface BenchOp {
  name: string;
  fn: () => unknown;
  repeat: number;
}

export function bench(exportDir: string, warmup: number, iterations: number): GraphBenchResult {
  const program = Program.loadFromManifest(exportDir);
  const graph = DependencyGraph.build(program);

  const ops: BenchOp[] = [
    { name: "findPath", fn: () => graph.findPath("Тест_ПередатьСтруктуру", "ПолучитьПоле"), repeat: 10 },
    { name: "findPath", fn: () => graph.findPath("Тест_ПередатьМассив", "ПолучитьКоличество"), repeat: 10 },
    { name: "findPath", fn: () => graph.findPath("Тест_ИВУсловии", "ПолучитьПоле"), repeat: 10 },
    { name: "findPath", fn: () => graph.findPath("Удвоить", "Удвоить"), repeat: 10 },
    { name: "getReachableFrom", fn: () => graph.getReachableFrom("Тест_ПередатьСтруктуру"), repeat: 10 },
    { name: "getReachableFrom", fn: () => graph.getReachableFrom("Тест_ИВУсловии"), repeat: 10 },
    { name: "getReachableFrom", fn: () => graph.getReachableFrom("НесуществующаяФункция"), repeat: 10 },
    { name: "detectCycles", fn: () => graph.detectCycles(), repeat: 10 },
  ];

  for (let w = 0; w < warmup; w++) {
    for (const op of ops) {
      for (let r = 0; r < op.repeat; r++) op.fn();
    }
  }

  const grouped: Record<string, number[]> = { findPath: [], getReachableFrom: [], detectCycles: [] };

  for (let i = 0; i < iterations; i++) {
    for (const op of ops) {
      const start = performance.now();
      for (let r = 0; r < op.repeat; r++) op.fn();
      const elapsed = performance.now() - start;
      (grouped[op.name] ??= []).push(elapsed / op.repeat);
    }
  }

  const result: Record<string, { avg: number; count: number }> = {};

  for (const [name, measurements] of Object.entries(grouped)) {
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    result[name] = { avg, count: ops.filter(o => o.name === name).length };
  }

  return result as GraphBenchResult;
}
