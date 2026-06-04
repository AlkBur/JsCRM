import type { Workspace } from "../../src/Workspace";

export interface IndexBenchResult {
  runtimeSymbol: { avg: number; count: number };
  metadataSymbol: { avg: number; count: number };
  missingSymbol: { avg: number; count: number };
}

export function bench(workspace: Workspace, warmup: number, iterations: number): IndexBenchResult {
  const index = workspace.symbolIndex;

  const runtimeSymbols = workspace.program.getAllRoutines().map(r => r.routine.name);
  const metadataSymbols = [
    ...workspace.metadata.catalogs.map(c => c.name),
    ...workspace.metadata.documents.map(d => d.name),
    ...workspace.metadata.enumerations.map(e => e.name),
  ];
  const missingSymbols = ["НесуществующаяФункция", "X", "A", "B", "C"];

  const lookupAll = (names: string[]) => { for (const n of names) index.find(n); };

  for (let w = 0; w < warmup; w++) {
    lookupAll(runtimeSymbols);
    lookupAll(metadataSymbols);
    lookupAll(missingSymbols);
  }

  const measure = (names: string[], reps: number): number => {
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      for (let r = 0; r < reps; r++) lookupAll(names);
      times.push((performance.now() - start) / reps / names.length);
    }
    return times.reduce((a, b) => a + b, 0) / times.length;
  };

  return {
    runtimeSymbol: { avg: measure(runtimeSymbols, 10), count: runtimeSymbols.length },
    metadataSymbol: { avg: measure(metadataSymbols, 10), count: metadataSymbols.length },
    missingSymbol: { avg: measure(missingSymbols, 10), count: missingSymbols.length },
  };
}
