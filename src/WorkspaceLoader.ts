import { join } from "path";
import { Program } from "./Program";
import { MetadataModel } from "../metadata/MetadataModel";
import { SymbolIndex } from "./SymbolIndex";
import { MetadataIndex } from "../metadata/MetadataIndex";
import { DependencyGraph } from "./DependencyGraph";
import { LocationIndex } from "./LocationIndex";
import { Workspace } from "./Workspace";

export function loadWorkspace(exportDir: string): Workspace {
  const program = Program.loadFromManifest(exportDir);
  const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
  const symbolIndex = SymbolIndex.build(program, metadata);
  const metadataIndex = MetadataIndex.build(metadata);
  const dependencyGraph = DependencyGraph.build(program);
  const locationIndex = LocationIndex.build(program, exportDir);
  return new Workspace(program, metadata, symbolIndex, metadataIndex, dependencyGraph, locationIndex);
}
