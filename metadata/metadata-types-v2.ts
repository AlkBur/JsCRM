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
  options: readonly Exclude<FieldType, UnionType>[];
}

export interface AttributeV2 {
  readonly uuid?: string;
  readonly name: string;
  readonly synonym?: string;
  readonly type: FieldType;
  readonly required: boolean;
}

export interface TabularSectionV2 {
  readonly uuid?: string;
  readonly name: string;
  readonly attributes: readonly AttributeV2[];
}

export interface FormV2 {
  readonly name: string;
  readonly type: "ordinary" | "managed";
}

export interface CommandV2 {
  readonly uuid?: string;
  readonly name: string;
  readonly handler: string;
}

export interface EnumValueV2 {
  readonly uuid: string;
  readonly name: string;
}

export interface PredefinedItemV2 {
  readonly name: string;
  readonly uuid: string;
}

export interface CatalogV2 {
  readonly name: string;
  readonly uuid: string;
  readonly attributes: readonly AttributeV2[];
  readonly standardAttributes?: readonly AttributeV2[];
  readonly predefinedItems?: readonly PredefinedItemV2[];
  readonly tabularSections: readonly TabularSectionV2[];
  readonly forms: readonly FormV2[];
  readonly commands: readonly CommandV2[];
}

export interface DocumentV2 {
  readonly name: string;
  readonly uuid: string;
  readonly attributes: readonly AttributeV2[];
  readonly standardAttributes?: readonly AttributeV2[];
  readonly tabularSections: readonly TabularSectionV2[];
  readonly forms: readonly FormV2[];
  readonly commands: readonly CommandV2[];
}

export interface EnumerationV2 {
  readonly name: string;
  readonly uuid: string;
  readonly values: readonly EnumValueV2[];
}

export interface MetadataRootV2 {
  readonly version: "2";
  readonly configurationName: string;
  readonly configurationUuid: string;
  readonly commonModules: readonly CommonModuleInfo[];
  readonly catalogs: readonly CatalogV2[];
  readonly documents: readonly DocumentV2[];
  readonly enumerations: readonly EnumerationV2[];
}
