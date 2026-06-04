import { join } from "path";
import { Program } from "../../src/Program";
import { SymbolIndex } from "../../src/SymbolIndex";
import { MetadataModel } from "../../metadata/MetadataModel";

export interface IndexBenchResult {
  runtimeSymbol: { avg: number; count: number };
  metadataSymbol: { avg: number; count: number };
  missingSymbol: { avg: number; count: number };
}

export function bench(exportDir: string, warmup: number, iterations: number): IndexBenchResult {
  const program = Program.loadFromManifest(exportDir);
  const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
  const index = SymbolIndex.build(program, metadata);

  const runtimeSymbols = program.getAllRoutines().map(r => r.routine.name);
  const metadataSymbols = [
    ...metadata.catalogs.map(c => c.name),
    ...metadata.documents.map(d => d.name),
    ...metadata.enumerations.map(e => e.name),
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
