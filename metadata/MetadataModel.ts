// MetadataModel — read-only structural model of the 1C configuration.
//
// Supports both v1 (flat) and v2 (with attributes, tabular sections, forms, commands).
// Version detection: checks `version` field in metadata.json.
//   - "2" → v2: stores full detailed structure
//   - missing or any other value → v1 (backward compatible)
//
// Responsibility: load, validate, and provide access to configuration metadata.
// Non-responsibility: execution, routine resolution, SymbolIndex, dependency graph.
//
// Invariant: MetadataModel is immutable after loading.
// All collections are exposed as readonly arrays. Optional arrays are normalized to [].

import { readFileSync, existsSync } from "fs";
import type { MetadataRoot, CommonModuleInfo, MetadataObjectInfo } from "./metadata-types";
import type { MetadataRootV2, CatalogV2, DocumentV2, EnumerationV2 } from "./metadata-types-v2";

export class MetadataModel {
  readonly version: string;
  readonly configurationName: string;
  readonly configurationUuid: string;
  readonly commonModules: readonly CommonModuleInfo[];

  // Top-level info compatible with v1 contract
  readonly catalogs: readonly MetadataObjectInfo[];
  readonly documents: readonly MetadataObjectInfo[];
  readonly enumerations: readonly MetadataObjectInfo[];

  // V2 detailed data (undefined if loaded as v1)
  private readonly _v2?: {
    readonly catalogs: readonly CatalogV2[];
    readonly documents: readonly DocumentV2[];
    readonly enumerations: readonly EnumerationV2[];
  };

  private constructor(
    version: string,
    configurationName: string,
    configurationUuid: string,
    commonModules: CommonModuleInfo[],
    catalogs: MetadataObjectInfo[],
    documents: MetadataObjectInfo[],
    enumerations: MetadataObjectInfo[],
    v2?: { catalogs: CatalogV2[]; documents: DocumentV2[]; enumerations: EnumerationV2[] },
  ) {
    this.version = version;
    this.configurationName = configurationName;
    this.configurationUuid = configurationUuid;
    this.commonModules = Object.freeze([...commonModules]);
    this.catalogs = Object.freeze([...catalogs]);
    this.documents = Object.freeze([...documents]);
    this.enumerations = Object.freeze([...enumerations]);
    if (v2) {
      this._v2 = {
        catalogs: Object.freeze(v2.catalogs.map(freezeCatalog)),
        documents: Object.freeze(v2.documents.map(freezeDocument)),
        enumerations: Object.freeze(v2.enumerations.map(freezeEnumeration)),
      };
    }
  }

  static loadFromFile(path: string): MetadataModel {
    if (!existsSync(path)) {
      throw new Error(`Metadata file not found: ${path}`);
    }
    const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;

    if (!raw.configurationName || !raw.configurationUuid) {
      throw new Error("Metadata: missing configurationName or configurationUuid");
    }

    const version = String(raw.version ?? "1");
    const commonModules = normalizeArray(raw.commonModules) as CommonModuleInfo[];

    if (version === "2") {
      return MetadataModel.loadV2(raw);
    }

    // v1 fallback
    const v1 = raw as unknown as MetadataRoot;
    return new MetadataModel(
      "1",
      v1.configurationName,
      v1.configurationUuid,
      v1.commonModules,
      v1.catalogs ?? [],
      v1.documents ?? [],
      v1.enumerations ?? [],
    );
  }

  private static loadV2(raw: Record<string, unknown>): MetadataModel {
    const v2 = raw as unknown as MetadataRootV2;

    // Normalize all optional arrays
    for (const obj of [...(v2.catalogs ?? []), ...(v2.documents ?? [])]) {
      obj.attributes = normalizeArray(obj.attributes);
      obj.tabularSections = normalizeArray(obj.tabularSections);
      obj.forms = normalizeArray(obj.forms);
      obj.commands = normalizeArray(obj.commands);
      for (const ts of obj.tabularSections ?? []) {
        ts.attributes = normalizeArray(ts.attributes);
      }
    }
    for (const en of v2.enumerations ?? []) {
      en.values = normalizeArray(en.values);
    }

    // Top-level catalog/doc/enum info (compatible with v1)
    const catalogs: MetadataObjectInfo[] = (v2.catalogs ?? []).map(c => ({ name: c.name, uuid: c.uuid }));
    const documents: MetadataObjectInfo[] = (v2.documents ?? []).map(d => ({ name: d.name, uuid: d.uuid }));
    const enumerations: MetadataObjectInfo[] = (v2.enumerations ?? []).map(e => ({ name: e.name, uuid: e.uuid }));

    return new MetadataModel(
      "2",
      v2.configurationName,
      v2.configurationUuid,
      v2.commonModules ?? [],
      catalogs,
      documents,
      enumerations,
      {
        catalogs: v2.catalogs ?? [],
        documents: v2.documents ?? [],
        enumerations: v2.enumerations ?? [],
      },
    );
  }

  get isV2(): boolean {
    return this.version === "2";
  }

  findCatalogV2(name: string): CatalogV2 | undefined {
    return this._v2?.catalogs.find(c => c.name === name);
  }

  findDocumentV2(name: string): DocumentV2 | undefined {
    return this._v2?.documents.find(d => d.name === name);
  }

  findEnumerationV2(name: string): EnumerationV2 | undefined {
    return this._v2?.enumerations.find(e => e.name === name);
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

function freezeCatalog(c: CatalogV2): CatalogV2 {
  return Object.freeze({
    ...c,
    attributes: Object.freeze(c.attributes.map(a => Object.freeze(a))),
    tabularSections: Object.freeze(
      c.tabularSections.map(ts => Object.freeze({
        ...ts,
        attributes: Object.freeze(ts.attributes.map(a => Object.freeze(a))),
      })),
    ),
    forms: Object.freeze(c.forms.map(f => Object.freeze(f))),
    commands: Object.freeze(c.commands.map(cmd => Object.freeze(cmd))),
  });
}

function freezeDocument(d: DocumentV2): DocumentV2 {
  return Object.freeze({
    ...d,
    attributes: Object.freeze(d.attributes.map(a => Object.freeze(a))),
    tabularSections: Object.freeze(
      d.tabularSections.map(ts => Object.freeze({
        ...ts,
        attributes: Object.freeze(ts.attributes.map(a => Object.freeze(a))),
      })),
    ),
    forms: Object.freeze(d.forms.map(f => Object.freeze(f))),
    commands: Object.freeze(d.commands.map(cmd => Object.freeze(cmd))),
  });
}

function freezeEnumeration(e: EnumerationV2): EnumerationV2 {
  return Object.freeze({
    ...e,
    values: Object.freeze(e.values.map(v => Object.freeze(v))),
  });
}

function normalizeArray<T>(arr: unknown): T[] {
  return Array.isArray(arr) ? arr : [];
}
