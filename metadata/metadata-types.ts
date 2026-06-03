// Metadata v1 TypeScript types — mirrors metadata-schema-v1.json exactly.
//
// These types describe the static configuration structure of a 1C application.
// They are independent of execution (IR/VM) and must not reference runtime concepts.
//
// Responsibility: provide compile-time type safety for metadata data.
// Non-responsibility: runtime validation (handled by schema).

export interface MetadataRoot {
  configurationName: string;
  configurationUuid: string;
  commonModules: CommonModuleInfo[];
  catalogs: MetadataObjectInfo[];
  documents: MetadataObjectInfo[];
  enumerations: MetadataObjectInfo[];
}

export interface CommonModuleInfo {
  name: string;
  export: boolean;
  server: boolean;
  client: boolean;
}

export interface MetadataObjectInfo {
  name: string;
  uuid?: string;
}
