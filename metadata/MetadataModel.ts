// MetadataModel — read-only structural model of the 1C configuration.
//
// Responsibility: load, validate, and provide access to configuration metadata.
// Metadata is declarative — it contains no logic, resolution rules, or computed fields.
//
// Non-responsibility: execution, routine resolution, SymbolIndex, dependency graph.
//
// Invariant: MetadataModel is immutable after loading.
// All collections are exposed as readonly arrays.

import { readFileSync, existsSync } from "fs";
import type { MetadataRoot, CommonModuleInfo, MetadataObjectInfo } from "./metadata-types";

export class MetadataModel implements MetadataRoot {
  readonly configurationName: string;
  readonly configurationUuid: string;
  readonly commonModules: readonly CommonModuleInfo[];
  readonly catalogs: readonly MetadataObjectInfo[];
  readonly documents: readonly MetadataObjectInfo[];
  readonly enumerations: readonly MetadataObjectInfo[];

  private constructor(data: MetadataRoot) {
    this.configurationName = data.configurationName;
    this.configurationUuid = data.configurationUuid;
    this.commonModules = Object.freeze([...data.commonModules]);
    this.catalogs = Object.freeze([...data.catalogs]);
    this.documents = Object.freeze([...data.documents]);
    this.enumerations = Object.freeze([...data.enumerations]);
  }

  static loadFromFile(path: string): MetadataModel {
    if (!existsSync(path)) {
      throw new Error(`Metadata file not found: ${path}`);
    }
    const data: MetadataRoot = JSON.parse(readFileSync(path, "utf8"));

    if (!data.configurationName || !data.configurationUuid) {
      throw new Error("Metadata: missing configurationName or configurationUuid");
    }

    return new MetadataModel(data);
  }

  findCommonModule(name: string): CommonModuleInfo | undefined {
    return this.commonModules.find(m => m.name === name);
  }

  findCatalog(name: string): MetadataObjectInfo | undefined {
    return this.catalogs.find(c => c.name === name);
  }

  findDocument(name: string): MetadataObjectInfo | undefined {
    return this.documents.find(d => d.name === name);
  }

  findEnumeration(name: string): MetadataObjectInfo | undefined {
    return this.enumerations.find(e => e.name === name);
  }

  get moduleCount(): number {
    return this.commonModules.length;
  }

  get objectCount(): number {
    return this.catalogs.length + this.documents.length + this.enumerations.length;
  }
}
