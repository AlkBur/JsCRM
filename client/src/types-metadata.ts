export type FieldType =
  | { kind: "string"; length?: number; format?: string }
  | { kind: "number"; precision?: number; scale?: number }
  | { kind: "date" }
  | { kind: "boolean" }
  | { kind: "ref"; target: string }
  | { kind: "enum"; target: string }
  | { kind: "union"; options: readonly Exclude<FieldType, { kind: "union" }>[] };

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

export interface CatalogV2 {
  readonly name: string;
  readonly attributes: readonly AttributeV2[];
  readonly tabularSections?: readonly TabularSectionV2[];
}

export interface DocumentV2 {
  readonly name: string;
  readonly attributes: readonly AttributeV2[];
  readonly tabularSections?: readonly TabularSectionV2[];
}

export type MetadataEntity = CatalogV2 | DocumentV2;
