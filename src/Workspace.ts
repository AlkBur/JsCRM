import { Program } from "./Program";
import { MetadataModel } from "../metadata/MetadataModel";
import { SymbolIndex } from "./SymbolIndex";
import { MetadataIndex } from "../metadata/MetadataIndex";
import { DependencyGraph } from "./DependencyGraph";
import { LocationIndex } from "./LocationIndex";
import type { WorkspaceStats } from "./workspace-types";

export class Workspace {
  readonly program: Program;
  readonly metadata: MetadataModel;
  readonly symbolIndex: SymbolIndex;
  readonly metadataIndex: MetadataIndex;
  readonly dependencyGraph: DependencyGraph;
  readonly locationIndex: LocationIndex;
  readonly stats: WorkspaceStats;

  constructor(
    program: Program,
    metadata: MetadataModel,
    symbolIndex: SymbolIndex,
    metadataIndex: MetadataIndex,
    dependencyGraph: DependencyGraph,
    locationIndex: LocationIndex,
  ) {
    this.program = program;
    this.metadata = metadata;
    this.symbolIndex = symbolIndex;
    this.metadataIndex = metadataIndex;
    this.dependencyGraph = dependencyGraph;
    this.locationIndex = locationIndex;
    this.stats = {
      modules: program.getModules().length,
      routines: program.getAllRoutines().length,
      symbols: symbolIndex.size,
      runtimeSymbols: symbolIndex.getAll().filter(s => s.space === "runtime").length,
      metadataSymbols: symbolIndex.getAll().filter(s => s.space === "metadata").length,
      metadataObjects: metadata.objectCount,
      attributes: metadataIndex.attributeCount,
      graphNodes: dependencyGraph.getAllNodes().length,
      graphEdges: dependencyGraph.getAllNodes()
        .reduce((sum, n) => sum + dependencyGraph.getCallees(n).length, 0),
      locations: locationIndex.size,
    };
  }
}
