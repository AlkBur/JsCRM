// Metadata v2 types — extends v1 with attributes, tabular sections, forms, commands.
//
// FieldType is a discriminated union of all possible 1C attribute types:
//   - Scalars: string (with optional length/format), number (precision/scale), date, boolean
//   - References: ref (Catalog/Document), enum (enumeration)
//   - Union: composite types (СоставнойТип)
//
// Responsibility: define the full v2 metadata structure for 1C configuration.
// Non-responsibility: execution logic, runtime validation, SQL mapping.
//   Layers 8+ handle UI formatting and SQL type mapping separately.

import type { CommonModuleInfo } from "./metadata-types";

export type FieldType =
  | StringType
  | NumberType
  | DateType
  | BooleanType
  | RefType
  | EnumType
  | UnionType;

export interface StringType {
  kind: "string";
  length?: number;
  format?: "uuid" | "email" | "phone";
}

export interface NumberType {
  kind: "number";
  precision?: number;
  scale?: number;
}

export interface DateType {
  kind: "date";
}

export interface BooleanType {
  kind: "boolean";
}

export interface RefType {
  kind: "ref";
  target: string;
}

export interface EnumType {
  kind: "enum";
  target: string;
}

export interface UnionType {
  kind: "union";
  options: Exclude<FieldType, UnionType>[];
}

export interface AttributeV2 {
  uuid?: string;
  name: string;
  type: FieldType;
  required: boolean;
}

export interface TabularSectionV2 {
  uuid?: string;
  name: string;
  attributes: AttributeV2[];
}

export interface FormV2 {
  name: string;
  type: "ordinary" | "managed";
}

export interface CommandV2 {
  uuid?: string;
  name: string;
  handler: string;
}

export interface EnumValueV2 {
  uuid: string;
  name: string;
}

export interface CatalogV2 {
  name: string;
  uuid: string;
  attributes: AttributeV2[];
  tabularSections: TabularSectionV2[];
  forms: FormV2[];
  commands: CommandV2[];
}

export interface DocumentV2 {
  name: string;
  uuid: string;
  attributes: AttributeV2[];
  tabularSections: TabularSectionV2[];
  forms: FormV2[];
  commands: CommandV2[];
}

export interface EnumerationV2 {
  name: string;
  uuid: string;
  values: EnumValueV2[];
}

export interface MetadataRootV2 {
  version: "2";
  configurationName: string;
  configurationUuid: string;
  commonModules: CommonModuleInfo[];
  catalogs: CatalogV2[];
  documents: DocumentV2[];
  enumerations: EnumerationV2[];
}
