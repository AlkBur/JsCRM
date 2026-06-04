export type NodeKind = "root" | "folder" | "entity" | "attribute" | "tabular" | "form" | "command" | "enum_value";

export interface TreeNode {
  id: string;
  label: string;
  kind: NodeKind;
  parentKind?: "catalog" | "document" | "enumeration" | "";
  metaRef?: string;
  children?: TreeNode[];
}

export interface AttributeInfo {
  uuid?: string;
  name: string;
  type: FieldType;
  required: boolean;
}

export interface TabularSectionInfo {
  uuid?: string;
  name: string;
  attributes: AttributeInfo[];
}

export interface FormInfo {
  name: string;
  type: "ordinary" | "managed";
}

export interface CommandInfo {
  uuid?: string;
  name: string;
  handler: string;
}

export interface EnumValueInfo {
  uuid: string;
  name: string;
}

export type FieldType =
  | { kind: "string"; length?: number }
  | { kind: "number"; precision?: number; scale?: number }
  | { kind: "date" }
  | { kind: "boolean" }
  | { kind: "ref"; target: string }
  | { kind: "enum"; target: string }
  | { kind: "union"; options: FieldType[] };
